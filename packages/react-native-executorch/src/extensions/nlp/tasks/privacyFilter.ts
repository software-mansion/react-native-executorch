import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';
import { wrapAsync } from '../../../core/runtime';

import { loadTokenizer } from '../tokenizer';
import {
  buildGrammar,
  extractSpans,
  viterbiDecode,
  type PiiEntity,
  type ViterbiBiases,
} from '../utils/privacyFilterUtils';

// Both shipped presets tokenize with o200k, where <|endoftext|> (199999)
// doubles as the pad and eos token. It is a property of the tokenizer rather
// than a per-variant knob, so it lives here as the default; custom fine-tunes
// built on a different tokenizer override it via `privacyFilterOpts`.
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

  // Token classification models take the token ids and the attention mask, both
  // int64 of shape [1, window], and emit per-token logits over the label space,
  // batched or not. The window is fixed by the export, hence a symbol shared
  // across the shapes rather than a hardcoded size; asserting `numLabels` here
  // is what catches a label list that doesn't match the model's head.
  const numLabels = labelNames.length;
  const meta = validateModelSchema(
    model,
    'forward',
    [SymbolicTensor('int64', [1, 'S']), SymbolicTensor('int64', [1, 'S'])],
    [SymbolicTensor('float32', [1, 'S', numLabels], ['S', numLabels])]
  );
  const windowSize = meta.inputTensorMeta[0]!.shape[1]!;
  const outShape = meta.outputTensorMeta[0]!.shape;
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

  // prettier-ignore
  const tensors = [
    tensor('int64', [1, windowSize]),
    tensor('int64', [1, windowSize]),
    tensor('float32', outShape),
  ] as const;

  const [tInputIds, tAttentionMask, tLogits] = tensors;

  const dispose = () => {
    tensors.forEach((t) => t.dispose());
    tokenizer.dispose();
    model.dispose();
  };

  const detectWorklet = (input: string): PiiEntity[] => {
    'worklet';
    const ids = tokenizer.encode(input);
    const totalTokens = ids.length;
    if (totalTokens === 0) return [];

    const predictedLabels = new Int32Array(totalTokens);
    const idsData = new BigInt64Array(windowSize);
    const maskData = new BigInt64Array(windowSize);
    const logits = new Float32Array(tLogits.numel);

    for (let windowStart = 0; windowStart < totalTokens; windowStart += stride) {
      const validLen = Math.min(windowSize, totalTokens - windowStart);

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

      const path = viterbiDecode(logits, validLen, grammar);

      const isLast = windowStart + windowSize >= totalTokens;
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
