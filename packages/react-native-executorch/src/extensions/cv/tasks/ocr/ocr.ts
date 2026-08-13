import type { WorkletRuntime } from 'react-native-worklets';
import RNBlobUtil from 'react-native-blob-util';

import { loadModel } from '../../../../core/model';
import { RnExecuTorchError } from '../../../../core/error';
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
  /**
   * Recognizer charset (string = one codepoint per index; array = taken
   * verbatim), overriding {@link OcrModel.charsetPath}. Every built-in preset
   * ships its charset beside the model instead, so this is only needed for a
   * custom export whose charset is not published as a file.
   */
  readonly charset?: string | readonly string[];
  /** Maps raw `detect` outputs to quads: {@link craftExtractBoxes} / {@link dbnetExtractBoxes}. */
  readonly extractBoxes: TextBoxExtractor;
  /**
   * Drop detections below this recognition confidence. Default 0. Confidence is
   * the max probability averaged over the non-blank timesteps only (blanks
   * dominate a padded strip, so averaging over all of them would read much
   * lower). This requires the recognizer to export a softmaxed head (values in
   * `[0,1]`); on raw logits it is meaningless.
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
   * Custom decode replacing greedy CTC. Must be a worklet.
   * @param probs Softmaxed recognizer output `[1, T, V]`, pre-allocated from the
   * recognizer's width-to-timestep relation, so `T` always matches the run's
   * input width. Owned by the pipeline — read it, do not dispose it.
   * @param charset The resolved charset, index-aligned with the `V` axis.
   * @returns The decoded line and its confidence in `[0, 1]`.
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
  /**
   * The recognizer charset published beside the model: a JSON array of strings,
   * one per class, where `charset[i]` labels logit `i + 1` (logit 0 is the CTC
   * blank). Resolved to a local path by the resource fetcher like `modelPath`.
   * Ignored when `modelOpts.charset` is given; one of the two is required.
   */
  readonly charsetPath?: string;
  readonly modelOpts: OcrModelOptions;
};

const RECOGNIZER_NORM: NormalizeOptions = { alpha: 1 / 127.5, beta: -1 }; // (x/255 - 0.5)/0.5 -> [-1, 1]
const RECOGNIZER_PAD_VALUE = 128; // neutral gray

// Loads the charset published beside the model. Kept off the JS bundle on
// purpose: the multilingual sets are tens of kilobytes each, and an app that
// never runs OCR should not carry them.
async function readCharsetFile(charsetPath: string | undefined): Promise<readonly string[]> {
  if (charsetPath === undefined) {
    throw RnExecuTorchError(
      'INVALID_ARGUMENT',
      'createOcr: the model config must supply either `charsetPath` or `modelOpts.charset`.'
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(await RNBlobUtil.fs.readFile(charsetPath, 'utf8'));
  } catch (e) {
    throw RnExecuTorchError(
      'INVALID_ARGUMENT',
      `createOcr: could not read the charset at '${charsetPath}': ${e instanceof Error ? e.message : String(e)}`
    );
  }
  if (!Array.isArray(parsed) || parsed.some((entry) => typeof entry !== 'string')) {
    throw RnExecuTorchError(
      'INVALID_ARGUMENT',
      `createOcr: the charset at '${charsetPath}' must be a JSON array of strings.`
    );
  }
  return parsed as readonly string[];
}

/**
 * Creates the OCR runner for detect → recognize models (EasyOCR / PaddleOCR):
 * one pass detects text quads on the whole page, warps each to the recognizer
 * canvas and reads it, returning the lines in reading order.
 * @category Typescript API
 * @param config Model path + OCR options.
 * @param runtime Optional worklet runtime thread.
 * @returns A promise resolving to an object containing recognition and disposal
 * controls.
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
  /**
   * Releases all allocated native resources.
   */
  dispose: () => void;

  /**
   * Detects and recognizes every text line in the given image.
   * @param input The input image buffer.
   * @returns A promise resolving to the recognized lines in reading order
   * (leftmost column top to bottom, then the next column).
   */
  runOcr: (input: ImageBuffer) => Promise<OcrDetection[]>;

  /**
   * Synchronous version of {@link runOcr} to be executed directly on the
   * caller or worklet thread.
   */
  runOcrWorklet: (input: ImageBuffer) => OcrDetection[];
}> {
  const { modelPath, charsetPath, modelOpts } = config;
  // Read the charset before loading the model: it is the cheaper failure, and
  // nothing needs disposing if the config is wrong.
  const charset = modelOpts.charset ?? (await readCharsetFile(charsetPath));
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  // Contract validation can throw; a bad config must not leak the model.
  let engine!: OcrEngine;
  try {
    const contract = resolveOcrContract(model, charset, modelOpts.extractBoxes);
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
