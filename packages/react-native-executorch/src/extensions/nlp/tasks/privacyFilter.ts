/**
 * Privacy Filter task pipeline for detecting personally identifiable
 * information (PII).
 * @module NLP/Tasks/PrivacyFilter
 */

import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateSpec, DynamicDim as Dyn, method, i64, f32, constr } from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';
import { RnExecuTorchError } from '../../../core/error';

import { loadTokenizer } from '../tokenizer';
import {
  buildGrammar,
  computeCharOffsets,
  extractSpans,
  viterbiDecode,
  type PiiEntity,
  type PiiEntityType,
  type ViterbiBiases,
} from '../utils/privacyFilterUtils';

/**
 * Options describing a privacy filter model's label space and decoding
 * behavior.
 * @category NLP / Types
 * @typeParam Label The model's BIOES label space, defined alongside the model
 * in the `models` registry.
 */
export type PrivacyFilterOptions<Label extends string = string> = {
  /**
   * BIOES label list matching the model's `id2label` mapping exactly; index 0
   * must be `'O'`.
   */
  readonly labelNames: readonly Label[];
  /**
   * Transition biases applied while decoding. Defaults to neutral
   * (validity-only) Viterbi.
   */
  readonly viterbiBiases?: ViterbiBiases;
  /**
   * Token id used to pad the final window of a static (fixed-length) model,
   * masked out via the attention mask. For the o200k tokenizer this is the
   * `<|endoftext|>` id.
   */
  readonly padTokenId: number;
};

/**
 * Model configuration required to instantiate a privacy filter task runner.
 * @category NLP / Types
 * @typeParam Label The model's BIOES label space.
 */
export type PrivacyFilterModel<Label extends string = string> = {
  /** Local path or remote URL of the `.pte` model. */
  readonly modelPath: string;
  /** Local path or remote URL of the matching `tokenizer.json`. */
  readonly tokenizerPath: string;
  /**
   * Label space and decoding options, defined alongside the model in the
   * `models` registry.
   */
  readonly modelOpts: PrivacyFilterOptions<Label>;
};

/**
 * Privacy filter task runner for detecting PII entities in text.
 * @category NLP / Types
 * @typeParam Label The model's BIOES label space.
 */
export type PrivacyFilter<Label extends string = string> = {
  /**
   * Releases all allocated native resources.
   */
  readonly dispose: () => void;

  /**
   * Asynchronously detects PII entity spans in the given text.
   * @param input The text string to scan for PII.
   * @returns A promise resolving to the detected entity spans, in order.
   * @throws {RnExecuTorchError} With code `RESOURCE_BUSY` if the model is in
   * use, or `RESOURCE_DISPOSED` if disposed.
   */
  readonly detectPii: (input: string) => Promise<PiiEntity<PiiEntityType<Label>>[]>;

  /**
   * Synchronous version of {@link detectPii} to be executed directly on the
   * caller or worklet thread.
   */
  readonly detectPiiWorklet: (input: string) => PiiEntity<PiiEntityType<Label>>[];
};

/**
 * Creates a privacy filter runner that detects personally identifiable
 * information (PII) spans in text.
 *
 * It loads the tokenizer and model, validates the `forward` signature against
 * the configured label space, pre-computes the BIOES grammar tables, and
 * registers clean disposal hooks to clear all native memory.
 *
 * Works with any privacy-filter-style model exporting
 * `forward(input_ids, attention_mask) -> logits` over a BIOES label space.
 * Inputs longer than the model's exported window are processed in sliding
 * windows with 50% overlap and never truncated; predictions near a window's
 * edges are discarded in favor of the neighboring window's more centered
 * context.
 * @category NLP / Tasks
 * @typeParam Label The model's BIOES label space.
 * @param config Privacy filter task configuration containing the model and
 * tokenizer paths plus the label space options. See {@link PrivacyFilterModel}.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to the instantiated {@link PrivacyFilter} runner.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if `labelNames` is
 * empty or does not start with `'O'`, `LOAD_FAILED` if the model or tokenizer
 * fails to load, or `SCHEMA_MISMATCH` if the loaded model schema does not match
 * the privacy filter specification.
 */
export async function createPrivacyFilter<Label extends string>(
  config: PrivacyFilterModel<Label>,
  runtime?: WorkletRuntime
): Promise<PrivacyFilter<Label>> {
  const { modelPath, tokenizerPath, modelOpts } = config;
  const { labelNames } = modelOpts;

  if (labelNames.length === 0 || labelNames[0] !== 'O') {
    throw RnExecuTorchError(
      'INVALID_ARGUMENT',
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
  // so it must take the same value in every call. The XNNPACK exports declare
  // it dynamic, binding `S` to the accepted range; the MLX ones are exported
  // for a single window length, binding `S` to that constant.
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
    throw RnExecuTorchError(
      'SCHEMA_MISMATCH',
      `createPrivacyFilter: expected a forward window of at least 2 tokens, got ${windowSize}.`
    );
  }

  const padTokenId = BigInt(modelOpts.padTokenId);
  const grammar = buildGrammar(labelNames, modelOpts.viterbiBiases);
  // Consecutive windows overlap by half; predictions within `edgeMargin` of a
  // window boundary are re-predicted by the neighboring window with more
  // context on that side, and the more centered prediction wins.
  const stride = Math.floor(windowSize / 2);
  const edgeMargin = Math.floor(windowSize / 4);

  // The XNNPACK exports carry a dynamic sequence dim, so a window there is
  // sized to the tokens it actually holds. That is the dominant cost: the MoE
  // runs every expert on every token, so inference is linear in sequence length
  // and a short input would otherwise pay for a full window of padding. The MLX
  // exports are static and only accept the one shape they were exported with,
  // so every window is padded up to `windowSize`. A dynamic window still has to
  // land on a length the model accepts, i.e. the exported range's `min + k*step`
  // grid; these primitives let the worklet round onto it without a host call.
  const isDynamic = seqLenRange !== null;
  const rangeMin = seqLenRange ? seqLenRange.min : windowSize;
  const rangeStep = seqLenRange ? seqLenRange.step : 1;

  const dispose = () => {
    tokenizer.dispose();
    model.dispose();
  };

  const detectPiiWorklet = (input: string): PiiEntity<PiiEntityType<Label>>[] => {
    'worklet';
    const ids = tokenizer.encode(input);
    const totalTokens = ids.length;
    if (totalTokens === 0) return [];

    const predictedLabels = new Int32Array(totalTokens);

    for (let windowStart = 0; windowStart < totalTokens; windowStart += stride) {
      const validLen = Math.min(windowSize, totalTokens - windowStart);
      // A static model only accepts the full window, so it is padded to it; a
      // dynamic one runs the exact token count, rounded up onto its accepted
      // `min + k*step` grid. Tensors are allocated per window rather than
      // pooled: allocation is orders of magnitude cheaper than the inference it
      // feeds, and it avoids holding a tensor per bucket for the model's life.
      const wanted = Math.max(validLen, rangeMin);
      const runLen = isDynamic
        ? Math.min(windowSize, rangeMin + Math.ceil((wanted - rangeMin) / rangeStep) * rangeStep)
        : windowSize;

      const idsData = new BigInt64Array(runLen);
      const maskData = new BigInt64Array(runLen);
      idsData.fill(padTokenId);
      for (let i = 0; i < validLen; i++) {
        idsData[i] = BigInt(ids[windowStart + i]!);
        maskData[i] = 1n;
      }
      const tInputIds = tensor('int64', [1, runLen], idsData);
      const tAttentionMask = tensor('int64', [1, runLen], maskData);
      const tLogits = tensor('float32', [1, runLen, numLabels]);

      let logits: Float32Array;
      try {
        model.execute('forward', [tInputIds, tAttentionMask], [tLogits]);
        logits = tLogits.getData(new Float32Array(tLogits.numel));
      } finally {
        tInputIds.dispose();
        tAttentionMask.dispose();
        tLogits.dispose();
      }

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

    // Char offsets are computed once per input so consumers can slice spans
    // straight out of `input` (or feed the result to `piiSegments`) without
    // having to re-find each entity in the source themselves.
    const offsets = computeCharOffsets(tokenizer, ids);

    return extractSpans(predictedLabels, labelNames).map((span) => ({
      // `extractSpans` derives the entity string from `labelNames` at runtime,
      // so it is one of this model's entity types by construction.
      label: span.entity as PiiEntityType<Label>,
      text: tokenizer.decode(ids.slice(span.start, span.end), true).trim(),
      startToken: span.start,
      endToken: span.end,
      charStart: offsets[span.start * 2]!,
      charEnd: offsets[(span.end - 1) * 2 + 1]!,
    }));
  };

  const detectPii = wrapAsync(detectPiiWorklet, runtime);

  return { detectPii, detectPiiWorklet, dispose };
}
