import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateSpec, DynamicDim as Dyn, method, i64, f32, constr } from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';

import { loadTokenizer } from '../tokenizer';
import {
  buildGrammar,
  extractSpans,
  viterbiDecode,
  type PiiEntity,
  type ViterbiBiases,
} from '../utils/privacyFilterUtils';

const DEFAULT_PAD_TOKEN_ID = 199999;

/**
 * Options describing a privacy filter model's label space and decoding
 * behavior.
 * @category Types
 * @property {readonly string[]} labelNames - BIOES label list matching the
 * model's `id2label` mapping exactly; index 0 must be `'O'`.
 * @property {ViterbiBiases} [viterbiBiases] - Transition biases applied while
 * decoding. Defaults to neutral (validity-only) Viterbi.
 * @property {number} [padTokenId] - Token id used to pad the final window.
 * Defaults to the o200k `<|endoftext|>` id.
 */
export type PrivacyFilterOptions = {
  readonly labelNames: readonly string[];
  readonly viterbiBiases?: ViterbiBiases;
  readonly padTokenId?: number;
};

/**
 * Model configuration required to instantiate a privacy filter task runner.
 * @category Types
 * @property {string} modelPath - Local path or remote URL of the `.pte` model.
 * @property {string} tokenizerPath - Local path or remote URL of the matching
 * `tokenizer.json`.
 * @property {PrivacyFilterOptions} privacyFilterOpts - Label space and decoding
 * options, defined alongside the model in the `models` registry.
 */
export type PrivacyFilterModel = {
  readonly modelPath: string;
  readonly tokenizerPath: string;
  readonly privacyFilterOpts: PrivacyFilterOptions;
};

export type { PiiEntity, ViterbiBiases };

/**
 * Creates a privacy filter runner that detects personally identifiable
 * information (PII) spans in text.
 *
 * It loads the tokenizer and model, validates the `forward` signature against
 * the configured label space, pre-computes the BIOES grammar tables,
 * pre-allocates the static execution tensors, and registers clean disposal
 * hooks to clear all native memory.
 *
 * Works with any privacy-filter-style model exporting
 * `forward(input_ids, attention_mask) -> logits` over a BIOES label space.
 * Inputs longer than the model's exported window are processed in sliding
 * windows with 50% overlap and never truncated; predictions near a window's
 * edges are discarded in favor of the neighboring window's more centered
 * context.
 * @category Typescript API
 * @param config Privacy filter task configuration containing the model and
 * tokenizer paths plus the label space options.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to an object containing detection and disposal
 * controls.
 */
export async function createPrivacyFilter(
  config: PrivacyFilterModel,
  runtime?: WorkletRuntime
): Promise<{
  /**
   * Releases all allocated native resources.
   */
  dispose: () => void;
  /**
   * Asynchronously detects PII entity spans in the given text.
   * @param input The text to scan for PII.
   * @returns A promise resolving to the detected entity spans, in order.
   */
  detect: (input: string) => Promise<PiiEntity[]>;
  /**
   * Synchronous version of {@link detect} to be executed directly on the
   * caller or worklet thread.
   */
  detectWorklet: (input: string) => PiiEntity[];
}> {
  const { modelPath, tokenizerPath, privacyFilterOpts } = config;
  const { labelNames } = privacyFilterOpts;

  if (labelNames.length === 0 || labelNames[0] !== 'O') {
    throw new Error(
      "createPrivacyFilter: labelNames must be non-empty and start with 'O' at index 0."
    );
  }

  const [model, tokenizer] = await Promise.all([
    wrapAsync(loadModel, runtime)(modelPath),
    wrapAsync(loadTokenizer, runtime)(tokenizerPath),
  ]);

  const numLabels = labelNames.length;
  // Token classifiers take the token ids and the attention mask, both
  // [1, sequence_length], and emit one logit row per token over the configured
  // label space. The sequence length is shared by both inputs and the logits,
  // so it must take the same value in every call. Models exported for a single
  // window length bind `S` to that constant; models exported with a dynamic
  // sequence length bind it to the accepted range.
  const seqLenIsShared = [
    constr.eq(
      { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
      { paramSide: 'input', tensorIdx: 1, dimIdx: 1 },
      { paramSide: 'output', tensorIdx: 0, dimIdx: 1 }
    ),
  ];
  const { variant, dim } = validateSpec(model.schema, {
    dynamic: method(
      'forward', // prettier-ignore
      [i64(1, Dyn('S')), i64(1, Dyn('S'))],
      [f32(1, Dyn('S'), numLabels)],
      seqLenIsShared
    ),
    static: method(
      'forward', // prettier-ignore
      [i64(1, 'S'), i64(1, 'S')],
      [f32(1, 'S', numLabels)]
    ),
  });

  // A statically exported model accepts exactly one sequence length; a
  // dynamically exported one accepts a whole range, whose upper bound is the
  // widest window the model can see at once.
  const seqLenRange = variant === 'dynamic' ? dim('S', 'range') : null;
  const windowSize = seqLenRange ? seqLenRange.max : dim('S', 'constant');
  if (windowSize < 2) {
    throw new Error(
      `createPrivacyFilter: expected a forward window of at least 2 tokens, got ${windowSize}.`
    );
  }

  const padTokenId = BigInt(privacyFilterOpts.padTokenId ?? DEFAULT_PAD_TOKEN_ID);
  const grammar = buildGrammar(labelNames, privacyFilterOpts.viterbiBiases);
  // Consecutive windows overlap by half; predictions within `edgeMargin` of a
  // window boundary are re-predicted by the neighboring window with more
  // context on that side, and the more centered prediction wins.
  const stride = Math.floor(windowSize / 2);
  const edgeMargin = Math.floor(windowSize / 4);

  // A statically exported method only accepts the exact shape it was exported
  // with, so every window must be padded to `windowSize`. A dynamic one lets a
  // window instead be sized to the tokens it actually holds, which is the
  // dominant cost: the MoE runs all experts per token, so inference is linear
  // in sequence length and a short input otherwise pays for a full window of
  // padding.
  // Lengths are rounded up to a bucket so a handful of tensor shapes cover any
  // input; tensors have an immutable shape, so each distinct length would
  // otherwise mean another native allocation.
  // The slots are built here, on the JS runtime, and only indexed inside the
  // worklet: calling a host closure from the worklet runtime would be a remote
  // call, which cannot happen synchronously.
  const LENGTH_BUCKET = 32;
  const bucketLengths: number[] = [];
  if (seqLenRange) {
    // Every bucket boundary has to be a length the model actually accepts, so
    // the nominal bucket is rounded up onto the exported range's grid and the
    // boundaries are walked from its lower bound.
    const bucket = Math.ceil(LENGTH_BUCKET / seqLenRange.step) * seqLenRange.step;
    for (let len = seqLenRange.min; len < windowSize; len += bucket) {
      if (len > 0) bucketLengths.push(len);
    }
  }
  bucketLengths.push(windowSize);

  const bucketTensors = bucketLengths.map(
    (len) =>
      [
        tensor('int64', [1, len]),
        tensor('int64', [1, len]),
        tensor('float32', [1, len, numLabels]),
      ] as const
  );

  const dispose = () => {
    bucketTensors.forEach((entry) => entry.forEach((t) => t.dispose()));
    tokenizer.dispose();
    model.dispose();
  };

  const detectWorklet = (input: string): PiiEntity[] => {
    'worklet';
    const ids = tokenizer.encode(input);
    const totalTokens = ids.length;
    if (totalTokens === 0) return [];

    const predictedLabels = new Int32Array(totalTokens);

    for (let windowStart = 0; windowStart < totalTokens; windowStart += stride) {
      const validLen = Math.min(windowSize, totalTokens - windowStart);

      let slot = bucketLengths.length - 1;
      for (let b = 0; b < bucketLengths.length; b++) {
        if (bucketLengths[b]! >= validLen) {
          slot = b;
          break;
        }
      }
      const runLen = bucketLengths[slot]!;
      const [tInputIds, tAttentionMask, tLogits] = bucketTensors[slot]!;

      const idsData = new BigInt64Array(runLen);
      const maskData = new BigInt64Array(runLen);
      const logits = new Float32Array(tLogits.numel);

      idsData.fill(padTokenId);
      maskData.fill(0n);
      for (let i = 0; i < validLen; i++) {
        idsData[i] = BigInt(ids[windowStart + i]!);
        maskData[i] = 1n;
      }
      tInputIds.setData(idsData);
      tAttentionMask.setData(maskData);

      model.execute('forward', [tInputIds, tAttentionMask], [tLogits]);
      tLogits.getData(logits);

      // Only the final window ends where the text ends, so only it should be
      // forced to close on a valid BIOES terminal (O/E/S); a mid-document
      // window may legitimately be cut through an open span, and its boundary
      // predictions are discarded and re-decoded by the next window anyway.
      const isLast = windowStart + windowSize >= totalTokens;
      const path = viterbiDecode(logits, validLen, grammar, isLast);

      const writeFrom = windowStart === 0 ? 0 : edgeMargin;
      const writeTo = Math.min(isLast ? validLen : windowSize - edgeMargin, validLen);
      for (let i = writeFrom; i < writeTo; i++) {
        predictedLabels[windowStart + i] = path[i]!;
      }

      if (isLast) break;
    }

    return extractSpans(predictedLabels, labelNames).map((span) => ({
      label: span.entity,
      text: tokenizer.decode(ids.slice(span.start, span.end), true).trim(),
      startToken: span.start,
      endToken: span.end,
    }));
  };

  const detect = wrapAsync(detectWorklet, runtime);

  return { detect, detectWorklet, dispose };
}
