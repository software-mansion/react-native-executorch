/**
 * Text Embedding task pipeline for sentence transformers.
 */

import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateSpec, DynamicDim as Dyn, method, i64, f32, constr } from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';

import { loadTokenizer } from '../tokenizer';
import { RnExecuTorchError } from '../../../core/error';

/**
 * Model configuration required to instantiate a text embedder task runner.
 * @category NLP / Types
 */
export type TextEmbedderModel = {
  /** Local path or remote URL of the `.pte` model file. */
  readonly modelPath: string;
  /** Local path or remote URL of the tokenizer file. */
  readonly tokenizerPath: string;
  /** Optional default prompt prefix added to input text before embedding. */
  readonly defaultPrompt?: string;
};

/**
 * Text embedding task runner.
 * @category NLP / Types
 */
export type TextEmbedder = {
  /**
   * Releases all allocated native resources.
   */
  readonly dispose: () => void;

  /**
   * Asynchronously computes the embedding vector for the given input text.
   * Inputs longer than the model's maximum sequence length are truncated.
   * @param input The input text to embed.
   * @param prompt Optional prompt prefix overriding the model's configured
   * `defaultPrompt` for this call.
   * @returns A promise resolving to the embedding vector.
   * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if the input text
   * tokenizes to zero tokens, `RESOURCE_BUSY` if the model is in use, or
   * `RESOURCE_DISPOSED` if disposed.
   */
  readonly embed: (input: string, prompt?: string) => Promise<Float32Array>;

  /**
   * Synchronous version of {@link embed} to be executed directly on the
   * caller or worklet thread.
   */
  readonly embedWorklet: (input: string, prompt?: string) => Float32Array;
};

/**
 * Creates a text embedder for executing local Text Embedding models
 * (e.g. sentence-transformers like all-MiniLM-L6-v2).
 *
 * It loads the tokenizer and model, validates the model input and output
 * requirements, pre-allocates the static execution tensors, and registers clean
 * disposal hooks to clear all native memory. The input text is tokenized and fed
 * at its exact token length (no padding), truncated only when it exceeds the
 * model's maximum sequence length; the attention mask is all ones. Pooling and
 * normalization are baked into the exported `.pte`; this runner runs the forward
 * pass and returns the raw embedding vector.
 * @category NLP / Tasks
 * @param config Text embedder task configuration containing the model and
 * tokenizer paths. See {@link TextEmbedderModel}.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to the instantiated {@link TextEmbedder} runner.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if the model or tokenizer
 * fails to load, or `SCHEMA_MISMATCH` if the model schema does not match the
 * text embedding specification.
 */
export async function createTextEmbedder(
  config: TextEmbedderModel,
  runtime?: WorkletRuntime
): Promise<TextEmbedder> {
  const { modelPath, tokenizerPath, defaultPrompt } = config;
  const [model, tokenizer] = await Promise.all([
    wrapAsync(loadModel, runtime)(modelPath),
    wrapAsync(loadTokenizer, runtime)(tokenizerPath),
  ]);

  // Text embedding models take two int64 inputs: the token ids and the
  // attention mask, both of shape [1, sequence_length].
  const { variant, dims } = validateSpec(model.schema, {
    batched: method(
      'forward', // prettier-ignore
      [i64(1, Dyn('L')), i64(1, Dyn('L'))],
      [f32(1, 'D')],
      [
        constr.eq(
          { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
          { paramSide: 'input', tensorIdx: 1, dimIdx: 1 }
        ),
      ]
    ),
    unbatched: method(
      'forward', // prettier-ignore
      [i64(1, Dyn('L')), i64(1, Dyn('L'))],
      [f32('D')],
      [
        constr.eq(
          { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
          { paramSide: 'input', tensorIdx: 1, dimIdx: 1 }
        ),
      ]
    ),
  });

  const [seqLen] = dims.range('L');
  const [D] = dims.constant('D');
  const outShape = { batched: [1, D], unbatched: [D] }[variant];

  const tensors = [tensor('float32', outShape)] as const;
  const [tEmbedding] = tensors;

  const dispose = () => {
    tensors.forEach((t) => t.dispose());
    tokenizer.dispose();
    model.dispose();
  };

  const embedWorklet = (input: string, prompt?: string): Float32Array => {
    'worklet';
    const text = (prompt ?? defaultPrompt ?? '') + input;
    const ids = tokenizer.encode(text);
    if (ids.length === 0) {
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
        'createTextEmbedder: input tokenized to zero tokens'
      );
    }
    const len = Math.min(ids.length, seqLen.max);

    const idsData = new BigInt64Array(len);
    const maskData = new BigInt64Array(len);
    for (let i = 0; i < len; i++) {
      idsData[i] = BigInt(ids[i]!);
      maskData[i] = 1n;
    }

    const tTokenIds = tensor('int64', [1, len], idsData);
    const tAttentionMask = tensor('int64', [1, len], maskData);
    try {
      model.execute('forward', [tTokenIds, tAttentionMask], [tEmbedding]);
      return tEmbedding.getData(new Float32Array(tEmbedding.numel));
    } finally {
      tTokenIds.dispose();
      tAttentionMask.dispose();
    }
  };

  const embed = wrapAsync(embedWorklet, runtime);

  return { embed, embedWorklet, dispose };
}
