import type { WorkletRuntime } from 'react-native-worklets';

import { loadModel } from '../../../../core/model';
import { wrapAsync } from '../../../../core/runtime';
import { IMAGENET_NORM } from '../../../../constants';

import type { ImageBuffer } from '../../image';
import type { NormalizeOptions } from '../../ops/image';
import type { Tensor } from '../../../../core/tensor';
import type { TextBoxExtractor } from './detectors';
import { runOcrPass, resolveOcrContract, type OcrEngine, type OcrDetection } from './engine';

export type { OcrDetection } from './engine';

/**
 * Model-specific OCR options. The pipeline validates the detect/recognize
 * contract and resolves legal input sizes from the model metadata itself; these
 * cover everything it can't infer.
 * @category Types
 */
export type OcrModelOptions = {
  /** Recognizer charset (string = one codepoint per index; array = taken verbatim). */
  readonly charset: string | readonly string[];
  /** Maps raw `detect` outputs to quads: {@link craftExtractBoxes} / {@link dbnetExtractBoxes}. */
  readonly extractBoxes: TextBoxExtractor;
  /**
   * Drop detections below this recognition confidence. Default 0. Confidence is
   * the mean per-timestep max probability, so this requires the recognizer to
   * export a softmaxed head (values in `[0,1]`); on raw logits it is meaningless.
   */
  readonly minConfidence?: number;
  /** Detector norm on uint8 RGB. Default ImageNet; must match the model's training norm. */
  readonly detectorNorm?: NormalizeOptions;
  /** Recognizer norm applied after the warp. Default `(x/255−0.5)/0.5` → `[−1,1]`. */
  readonly recognizerNorm?: NormalizeOptions;
  /** Recognizer canvas padding fill. Default 128 (neutral gray). */
  readonly recognizerPadValue?: number;
  /** Strip padding fill: `'constant'` (default) or `'cornerMean'` (background-matched). */
  readonly recognizerPadMode?: 'constant' | 'cornerMean';
  /**
   * Custom decode replacing greedy CTC; receives softmaxed `[1,T,V]` probs. Must
   * be a worklet. The probs tensor is pre-allocated from the recognizer's
   * width-to-timestep relation, so `T` always matches the run's input width.
   */
  readonly decode?: (
    probs: Tensor,
    charset: readonly string[]
  ) => { readonly text: string; readonly confidence: number };
};

/**
 * Model configuration for the OCR pipeline: one fused detect/recognize PTE plus
 * its options.
 * @category Types
 */
export type OcrModel = {
  readonly modelPath: string;
  readonly modelOpts: OcrModelOptions;
};

const RECOGNIZER_NORM: NormalizeOptions = { alpha: 1 / 127.5, beta: -1 }; // (x/255 - 0.5)/0.5 -> [-1, 1]
const RECOGNIZER_PAD_VALUE = 128; // neutral gray

/**
 * Creates the OCR runner for detect → recognize models (EasyOCR / PaddleOCR):
 * one pass detects text quads on the whole page, warps each to the recognizer
 * canvas and reads it, returning the lines in reading order.
 * @category Typescript API
 * @param config Model path + OCR options.
 * @param runtime Optional worklet runtime thread.
 * @returns A promise resolving to recognition and disposal controls.
 * @throws {RnExecuTorchError} With code `SCHEMA_MISMATCH` if the loaded model's
 * `detect`/`recognize` methods match none of the pipeline's spec variants.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if the model declares
 * a recognizer width-to-timestep relation the pipeline cannot satisfy, or if the
 * charset is shorter than the recognizer's vocabulary.
 */
export async function createOcr(
  config: OcrModel,
  runtime?: WorkletRuntime
): Promise<{
  dispose: () => void;
  runOcr: (input: ImageBuffer) => Promise<OcrDetection[]>;
  runOcrWorklet: (input: ImageBuffer) => OcrDetection[];
}> {
  const { modelPath, modelOpts } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  // Contract validation can throw; a bad config must not leak the model.
  let engine!: OcrEngine;
  try {
    const contract = resolveOcrContract(model, modelOpts.charset, modelOpts.extractBoxes);
    engine = {
      model,
      extractBoxes: modelOpts.extractBoxes,
      det: { ...contract.det, norm: modelOpts.detectorNorm ?? IMAGENET_NORM },
      rec: {
        ...contract.rec,
        norm: modelOpts.recognizerNorm ?? RECOGNIZER_NORM,
        padValue: modelOpts.recognizerPadValue ?? RECOGNIZER_PAD_VALUE,
        padMode: modelOpts.recognizerPadMode ?? 'constant',
      },
      charset: contract.charset,
      minConfidence: modelOpts.minConfidence ?? 0,
      decode: modelOpts.decode,
    };
  } catch (e) {
    model.dispose();
    throw e;
  }

  const dispose = () => {
    model.dispose();
  };

  const runOcrWorklet = (input: ImageBuffer): OcrDetection[] => {
    'worklet';
    return runOcrPass(engine, input);
  };

  const runOcr = wrapAsync(runOcrWorklet, runtime);

  return { runOcr, runOcrWorklet, dispose };
}
