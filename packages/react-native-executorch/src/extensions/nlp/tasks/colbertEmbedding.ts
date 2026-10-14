/**
 * Late-interaction (ColBERT) text embedding task pipeline.
 */

import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import {
  validateSpec,
  DynamicDim as Dyn,
  method,
  i64,
  f32,
  constraint,
} from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';
import { RnExecuTorchError } from '../../../core/error';
import { createResourceScope } from '../../../core/lifetime';

import { loadTokenizer, type Tokenizer } from '../tokenizer';

/**
 * Tokenization settings of a ColBERT model, matching its PyLate configuration
 * (`config_sentence_transformers.json`).
 * @category NLP / Types
 */
export type ColbertEmbedderOptions = {
  /**
   * Token inserted right after the BOS token of every query (PyLate's
   * `query_prefix`, e.g. `'[Q] '`). Must be a single vocabulary token.
   */
  readonly queryPrefixToken: string;
  /**
   * Token inserted right after the BOS token of every document (PyLate's
   * `document_prefix`, e.g. `'[D] '`). Must be a single vocabulary token.
   */
  readonly documentPrefixToken: string;
  /**
   * Length of every query in tokens, special tokens included (PyLate's
   * `query_length`). Shorter queries are padded to it with
   * {@link ColbertEmbedderOptions.queryExpansionToken}; longer ones are
   * truncated.
   */
  readonly queryLength: number;
  /**
   * Token that pads queries up to {@link ColbertEmbedderOptions.queryLength}
   * (query augmentation). Padding is masked out of attention, but its output
   * vectors are kept and take part in scoring.
   */
  readonly queryExpansionToken: string;
  /** Token prepended to every input, e.g. `'<|startoftext|>'`. Omit when the model has none. */
  readonly bosToken?: string;
  /**
   * Tokens whose vectors are dropped from document embeddings (PyLate's
   * `skiplist_words`, usually punctuation). Tokens missing from the
   * vocabulary are ignored.
   */
  readonly skiplistTokens: readonly string[];
};

/**
 * Model configuration required to instantiate a ColBERT embedder.
 * @category NLP / Types
 */
export type ColbertEmbedderModel = {
  /** Local path or remote URL of the `.pte` model file. */
  readonly modelPath: string;
  /** Local path or remote URL of the tokenizer file. */
  readonly tokenizerPath: string;
  /** Tokenization settings of the model. See {@link ColbertEmbedderOptions}. */
  readonly modelOpts: ColbertEmbedderOptions;
};

/**
 * Which side of a retrieval pair a text is embedded as.
 * @category NLP / Types
 */
export type ColbertInputKind = 'query' | 'document';

/**
 * A multi-vector embedding: one vector per token.
 * @category NLP / Types
 */
export type TokenEmbeddings = {
  /** Row-major `[numTokens, dimension]` matrix of L2-normalized token vectors. */
  readonly data: Float32Array;
  /** The number of token vectors (rows). */
  readonly numTokens: number;
  /** The length of each token vector (columns). */
  readonly dimension: number;
};

/**
 * ColBERT embedding task runner.
 * @category NLP / Types
 */
export type ColbertEmbedder = {
  /**
   * Releases all allocated native resources.
   */
  readonly dispose: () => void;

  /**
   * Asynchronously computes the per-token embeddings of the given text.
   *
   * A query yields exactly {@link ColbertEmbedderOptions.queryLength} vectors.
   * A document yields one vector per token, minus the skiplisted ones, and is
   * truncated to the model's maximum sequence length. Score a query against a
   * document with {@link maxSim}.
   * @param input The text to embed.
   * @param kind Whether `input` is a search query or a document to search.
   * @returns A promise resolving to the token embeddings.
   * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if the text
   * tokenizes to zero tokens or `kind` is unknown, `RESOURCE_BUSY` if the model
   * is in use, or `RESOURCE_DISPOSED` if disposed.
   */
  readonly embed: (input: string, kind: ColbertInputKind) => Promise<TokenEmbeddings>;

  /**
   * Synchronous version of {@link embed} to be executed directly on the
   * caller or worklet thread.
   */
  readonly embedWorklet: (input: string, kind: ColbertInputKind) => TokenEmbeddings;
};

/**
 * Computes the late-interaction (MaxSim) relevance of a document to a query:
 * for every query vector, the highest dot product with any document vector,
 * summed over the query. With L2-normalized vectors each term is a cosine
 * similarity, so the score lies in `[-numTokens, numTokens]` of the query.
 * @category NLP / Functions
 * @param query The query token embeddings.
 * @param document The document token embeddings.
 * @returns The MaxSim score; higher is more relevant. A document with no
 * vectors scores 0.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if the two
 * embeddings have different vector dimensions.
 */
export function maxSim(query: TokenEmbeddings, document: TokenEmbeddings): number {
  'worklet';
  if (query.dimension !== document.dimension) {
    throw RnExecuTorchError(
      'INVALID_ARGUMENT',
      `maxSim: query and document dimensions differ (${query.dimension} vs ${document.dimension}).`
    );
  }
  if (document.numTokens === 0) return 0;

  const dim = query.dimension;
  const q = query.data;
  const d = document.data;
  let total = 0;
  for (let i = 0; i < query.numTokens; i++) {
    const qOffset = i * dim;
    let best = -Infinity;
    for (let j = 0; j < document.numTokens; j++) {
      const dOffset = j * dim;
      let dot = 0;
      for (let k = 0; k < dim; k++) dot += q[qOffset + k]! * d[dOffset + k]!;
      if (dot > best) best = dot;
    }
    total += best;
  }
  return total;
}

/**
 * Looks up a configured token, naming the option it came from on failure.
 * @param tokenizer The tokenizer to look the token up in.
 * @param token The token string.
 * @param option The option the token was configured as, for the error.
 * @returns The token id.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if the token is not
 * in the vocabulary.
 */
function resolveToken(tokenizer: Tokenizer, token: string, option: string): number {
  'worklet';
  try {
    return tokenizer.tokenToId(token);
  } catch {
    throw RnExecuTorchError(
      'INVALID_ARGUMENT',
      `createColbertEmbedder: ${option} '${token}' is not a token of the tokenizer.`
    );
  }
}

/**
 * The sequence length to run `wanted` tokens at: the smallest length the model
 * accepts that fits them, i.e. on the exported `min + k*step` grid.
 * @param wanted The number of positions needed.
 * @param min The shortest accepted sequence length.
 * @param max The longest accepted sequence length.
 * @param step The spacing of accepted lengths above `min`.
 * @returns The sequence length to run at.
 */
function runLength(wanted: number, min: number, max: number, step: number): number {
  'worklet';
  const length = Math.max(wanted, min);
  return Math.min(max, min + Math.ceil((length - min) / step) * step);
}

/**
 * Creates a ColBERT (late-interaction) embedder, which maps a text to one
 * vector per token rather than a single pooled vector. Relevance is then scored
 * with {@link maxSim} instead of a cosine.
 *
 * Inputs are built the way PyLate builds them: `[BOS, prefix, ...tokens]`,
 * with queries padded to a fixed length by expansion tokens and documents fed
 * at their exact length. The per-token projection and L2 normalization are
 * baked into the exported `.pte`.
 * @category NLP / Tasks
 * @param config ColBERT embedder configuration containing the model and
 * tokenizer paths and the tokenization settings. See {@link ColbertEmbedderModel}.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to the instantiated {@link ColbertEmbedder}.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if the model or tokenizer
 * fails to load, `SCHEMA_MISMATCH` if the model schema does not match the
 * ColBERT specification, or `INVALID_ARGUMENT` if a configured token is not in
 * the vocabulary or `queryLength` does not fit the model.
 */
export async function createColbertEmbedder(
  config: ColbertEmbedderModel,
  runtime?: WorkletRuntime
): Promise<ColbertEmbedder> {
  const scope = createResourceScope();
  const dispose = scope.dispose;

  try {
    const { modelPath, tokenizerPath, modelOpts } = config;
    const model = scope.track(await wrapAsync(loadModel, runtime)(modelPath));
    const tokenizer = scope.track(await wrapAsync(loadTokenizer, runtime)(tokenizerPath));

    // Token ids and attention mask in, one vector per token out, all sharing
    // the sequence length. Dynamic exports bind `S` to the accepted range;
    // static ones accept a single length, so shorter inputs are padded to it.
    const { variant, dim } = validateSpec(model.schema, {
      dynamic: method(
        'forward', // prettier-ignore
        [i64(1, Dyn('S')), i64(1, Dyn('S'))],
        [f32(1, Dyn('S'), 'D')],
        [
          constraint.equality(
            { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
            { paramSide: 'input', tensorIdx: 1, dimIdx: 1 },
            { paramSide: 'output', tensorIdx: 0, dimIdx: 1 }
          ),
        ]
      ),
      static: method(
        'forward', // prettier-ignore
        [i64(1, 'S'), i64(1, 'S')],
        [f32(1, 'S', 'D')]
      ),
    });

    const D = dim('D', 'constant');
    const range =
      variant === 'dynamic'
        ? dim('S', 'range')
        : { min: dim('S', 'constant'), max: dim('S', 'constant'), step: 1 };

    const bosIds = modelOpts.bosToken
      ? [resolveToken(tokenizer, modelOpts.bosToken, 'bosToken')]
      : [];
    const queryPrefixId = resolveToken(tokenizer, modelOpts.queryPrefixToken, 'queryPrefixToken');
    const documentPrefixId = resolveToken(
      tokenizer,
      modelOpts.documentPrefixToken,
      'documentPrefixToken'
    );
    const expansionId = BigInt(
      resolveToken(tokenizer, modelOpts.queryExpansionToken, 'queryExpansionToken')
    );
    const skiplist = new Set<number>();
    for (const token of modelOpts.skiplistTokens) {
      try {
        skiplist.add(tokenizer.tokenToId(token));
      } catch {
        // PyLate maps an unknown skiplist word to the unknown token, which
        // never matches a real one; skipping it is equivalent.
      }
    }

    const numSpecial = bosIds.length + 1;
    const { queryLength } = modelOpts;
    if (!Number.isInteger(queryLength) || queryLength <= numSpecial || queryLength > range.max) {
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
        `createColbertEmbedder: queryLength must be an integer in (${numSpecial}, ${range.max}], got ${queryLength}.`
      );
    }

    const embedWorklet = (input: string, kind: ColbertInputKind): TokenEmbeddings => {
      'worklet';
      if (kind !== 'query' && kind !== 'document') {
        throw RnExecuTorchError(
          'INVALID_ARGUMENT',
          `createColbertEmbedder: kind must be 'query' or 'document', got '${kind}'.`
        );
      }
      const isQuery = kind === 'query';
      const ids = tokenizer.encode(input);
      if (ids.length === 0) {
        throw RnExecuTorchError(
          'INVALID_ARGUMENT',
          'createColbertEmbedder: input tokenized to zero tokens'
        );
      }

      // `[BOS, prefix, ...tokens]`, truncated to the query length or to the
      // longest sequence the model accepts.
      const maxLength = isQuery ? queryLength : range.max;
      const numText = Math.min(ids.length, maxLength - numSpecial);
      const numReal = numSpecial + numText;
      // Queries keep every position up to `queryLength`, expansion included.
      const numOut = isQuery ? queryLength : numReal;
      const seqLen = runLength(numOut, range.min, range.max, range.step);

      const idsData = new BigInt64Array(seqLen);
      const maskData = new BigInt64Array(seqLen);
      idsData.fill(expansionId);
      let pos = 0;
      for (const id of bosIds) idsData[pos++] = BigInt(id);
      idsData[pos++] = BigInt(isQuery ? queryPrefixId : documentPrefixId);
      for (let i = 0; i < numText; i++) idsData[pos++] = BigInt(ids[i]!);
      for (let i = 0; i < numReal; i++) maskData[i] = 1n;

      const tTokenIds = tensor('int64', [1, seqLen], idsData);
      const tAttentionMask = tensor('int64', [1, seqLen], maskData);
      const tEmbeddings = tensor('float32', [1, seqLen, D]);
      let all: Float32Array;
      try {
        model.execute('forward', [tTokenIds, tAttentionMask], [tEmbeddings]);
        all = tEmbeddings.getData(new Float32Array(tEmbeddings.numel));
      } finally {
        tTokenIds.dispose();
        tAttentionMask.dispose();
        tEmbeddings.dispose();
      }

      if (isQuery) {
        return { data: all.slice(0, numOut * D), numTokens: numOut, dimension: D };
      }

      // Documents drop skiplisted tokens (punctuation) and any padding.
      const keep: number[] = [];
      for (let i = 0; i < numReal; i++) {
        if (!skiplist.has(Number(idsData[i]))) keep.push(i);
      }
      const data = new Float32Array(keep.length * D);
      for (let r = 0; r < keep.length; r++) {
        data.set(all.subarray(keep[r]! * D, (keep[r]! + 1) * D), r * D);
      }
      return { data, numTokens: keep.length, dimension: D };
    };

    const embed = wrapAsync(embedWorklet, runtime);

    return { embed, embedWorklet, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
