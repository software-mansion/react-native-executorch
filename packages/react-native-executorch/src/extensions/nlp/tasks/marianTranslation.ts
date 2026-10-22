/**
 * Marian (Opus-MT) machine translation task pipeline.
 */

import type { WorkletRuntime } from 'react-native-worklets';
import { scheduleOnRN, createSynchronizable } from 'react-native-worklets';

import { tensor, type Tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { wrapAsync } from '../../../core/runtime';
import {
  constraint,
  f32,
  i64,
  method,
  validateSpec,
  DynamicDim as Dyn,
} from '../../../core/schema';
import { createResourceScope } from '../../../core/lifetime';

import { argmax } from '../../math';
import { loadTokenizer } from '../tokenizer';
import { splitSentences } from '../utils/translationUtils';

// Positions in the decoder's self-attention KV cache, i.e. the most tokens one
// sentence can translate to.
const MAX_TARGET_LEN = 256;
// One cross-attention key and value per decoder layer (Opus-MT has 6).
const NUM_CROSS_KV = 12;

/**
 * Paths and metadata required to instantiate a Marian (Opus-MT) translator.
 * Each model translates one fixed language pair.
 * @category NLP / Types
 */
export type MarianTranslatorModel = {
  /** Identifies the pipeline this config belongs to. */
  readonly name: 'marian';
  /** Local path or remote URL of the `.pte` model file. */
  readonly modelPath: string;
  /** Local path or remote URL of the tokenizer file. */
  readonly tokenizerPath: string;
  /** ISO 639-1 code of the language the model translates from. */
  readonly sourceLanguage: string;
  /** ISO 639-1 code of the language the model translates to. */
  readonly targetLanguage: string;
};

/**
 * Marian (Opus-MT) translation task runner.
 * @category NLP / Types
 */
export type MarianTranslator = {
  /**
   * Releases all allocated native resources.
   */
  readonly dispose: () => void;

  /**
   * Asynchronously translates text from the model's source language to its
   * target language. The text is split into sentences, which are translated
   * one at a time; line breaks are kept.
   * @param text The text to translate.
   * @param onToken Optional callback fired on the RN thread with each newly
   * decoded piece of the translation.
   * @returns A promise resolving to the translated text.
   * @throws {RnExecuTorchError} With code `RESOURCE_BUSY` if the model is in
   * use, or `RESOURCE_DISPOSED` if disposed.
   */
  readonly translate: (text: string, onToken?: (token: string) => void) => Promise<string>;

  /**
   * Synchronous version of {@link translate} to be executed directly on the
   * caller or worklet thread.
   */
  readonly translateWorklet: (text: string, onToken?: (token: string) => void) => string;

  /**
   * Interrupts an active translation call, which returns the text translated
   * so far.
   */
  readonly translateStop: () => void;
};

/**
 * Creates a translator for Marian encoder-decoder models such as Opus-MT.
 *
 * The source sentence is encoded once into per-layer cross-attention keys and
 * values, then decoded greedily one token at a time, starting from the pad
 * token, until the end-of-sentence token. Sentences longer than the model's
 * maximum source length are truncated.
 * @category NLP / Tasks
 * @param config Model and tokenizer paths. See {@link MarianTranslatorModel}.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to the instantiated {@link MarianTranslator}.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if the model or
 * tokenizer fails to load, or `SCHEMA_MISMATCH` if the model schema does not
 * match the Marian specification.
 */
export async function createMarianTranslator(
  config: MarianTranslatorModel,
  runtime?: WorkletRuntime
): Promise<MarianTranslator> {
  const scope = createResourceScope();
  const dispose = scope.dispose;

  try {
    const { modelPath, tokenizerPath } = config;
    const model = scope.track(await wrapAsync(loadModel, runtime)(modelPath));
    const tokenizer = scope.track(await wrapAsync(loadTokenizer, runtime)(tokenizerPath));

    // The source length S must agree across the ids, the mask and every
    // cross-attention key and value.
    const crossKv = Array(NUM_CROSS_KV).fill(f32('H', Dyn('S'), 'Dh'));
    const kvIndices = [...Array(NUM_CROSS_KV).keys()];
    const sourceDim = (paramSide: 'input' | 'output', tensorIdx: number) =>
      ({ paramSide, tensorIdx, dimIdx: 1 }) as const;
    const { dims } = validateSpec(model.schema, {
      default: {
        ...method('encode', [i64(1, Dyn('S')), i64(1, Dyn('S'))], crossKv, [
          constraint.equality(sourceDim('input', 0), sourceDim('input', 1)),
          ...kvIndices.map((i) =>
            constraint.equality(sourceDim('input', 0), sourceDim('output', i))
          ),
        ]),
        ...method(
          'decode',
          [i64(1, 1), i64(1), i64(1, Dyn('S')), ...crossKv],
          [f32(1, 1, 'V')],
          kvIndices.map((i) =>
            constraint.equality(sourceDim('input', 2), sourceDim('input', 3 + i))
          )
        ),
      },
    });

    const [sourceLen] = dims.range('S');
    const [numHeads, headDim, vocabSize] = dims.constant('H', 'Dh', 'V');
    // Core ML exports a fixed source length; shorter inputs are padded and
    // masked.
    const isPadded = sourceLen.min === sourceLen.max;

    const padToken = tokenizer.tokenToId('<pad>');
    const eosToken = tokenizer.tokenToId('</s>');

    const tensors = [
      tensor('int64', [1, 1]), // tToken
      tensor('int64', [1]), // tPosition
      tensor('float32', [1, 1, vocabSize]), // tLogits
      tensor('int32', [1, 1, 1]), // tArgmax
    ] as const;
    tensors.forEach(scope.track);
    const [tToken, tPosition, tLogits, tArgmax] = tensors;

    // Encoder inputs and outputs depend on the source length, so they are
    // allocated per sentence unless that length is fixed.
    const allocateSource = (len: number): Tensor[] => {
      'worklet';
      return [
        tensor('int64', [1, len]), // tSourceIds
        tensor('int64', [1, len]), // tSourceMask
        ...Array.from({ length: NUM_CROSS_KV }, () => tensor('float32', [numHeads, len, headDim])),
      ];
    };
    const paddedSource = isPadded ? allocateSource(sourceLen.max) : [];
    paddedSource.forEach(scope.track);

    const isCancelled = createSynchronizable(false);

    const translateSentence = (text: string, onText: (text: string) => void): string => {
      'worklet';
      const ids = Array.from(tokenizer.encode(text));
      if (ids[ids.length - 1] !== eosToken) ids.push(eosToken);
      if (ids.length > sourceLen.max) {
        ids.length = sourceLen.max;
        ids[ids.length - 1] = eosToken;
      }

      const len = isPadded ? sourceLen.max : ids.length;
      const idsData = new BigInt64Array(len).fill(BigInt(padToken));
      const maskData = new BigInt64Array(len);
      ids.forEach((id, i) => {
        idsData[i] = BigInt(id);
        maskData[i] = 1n;
      });

      const source = isPadded ? paddedSource : allocateSource(len);
      try {
        const [tSourceIds, tSourceMask, ...tCrossKv] = source as [Tensor, Tensor, ...Tensor[]];
        tSourceIds.setData(idsData);
        tSourceMask.setData(maskData);
        model.execute('encode', [tSourceIds, tSourceMask], tCrossKv);

        const generated: number[] = [];
        let decoded = '';
        let token = padToken;
        for (let position = 0; position < MAX_TARGET_LEN; position++) {
          if (isCancelled.getBlocking()) break;

          tToken.setData(BigInt64Array.of(BigInt(token)));
          tPosition.setData(BigInt64Array.of(BigInt(position)));
          model.execute('decode', [tToken, tPosition, tSourceMask, ...tCrossKv], [tLogits]);
          token = tLogits.through(argmax, tArgmax).getData(new Int32Array(1))[0]!;
          if (token === eosToken) break;

          generated.push(token);
          // SentencePiece spacing depends on the following piece, so stream
          // the growth of the whole decoded text instead of single pieces.
          const next = tokenizer.decode(Int32Array.from(generated));
          if (next.startsWith(decoded) && next.length > decoded.length) {
            onText(next.slice(decoded.length));
          }
          decoded = next;
        }
        return decoded;
      } finally {
        if (!isPadded) source.forEach((t) => t.dispose());
      }
    };

    const translateWorklet = (text: string, onToken?: (token: string) => void): string => {
      'worklet';
      isCancelled.setBlocking(false);

      const emit = (piece: string) => {
        'worklet';
        if (onToken && piece !== '') scheduleOnRN(onToken, piece);
      };

      let result = '';
      for (const { sentence, separator } of splitSentences(text)) {
        if (isCancelled.getBlocking()) break;
        if (sentence.trim() !== '') result += translateSentence(sentence, emit);
        emit(separator);
        result += separator;
      }
      return result.trim();
    };

    const translate = wrapAsync(translateWorklet, runtime);
    const translateStop = () => isCancelled.setBlocking(true);

    return { dispose, translate, translateWorklet, translateStop };
  } catch (error) {
    dispose();
    throw error;
  }
}
