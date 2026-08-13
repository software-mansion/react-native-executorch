// Built-in detector box-extraction strategies (DBNet, CRAFT): each turns one
// architecture's native detect output into quads. The pipeline is
// model-agnostic — it just calls OcrModelOptions.extractBoxes.

import type { Tensor } from '../../../../core/tensor';
import { RnExecuTorchError } from '../../../../core/error';
import { f32, type ParamSpec, type SymbolicDim } from '../../../../core/schema';
import { quadsFromFlat, type Quad } from '../../ops/quad';
import { extractCraftTextBoxes, extractDbnetTextBoxes } from '../../utils/ocrUtils';
import { boxesFromFlat, groupBoxes, boxToQuad } from './geometry';

/**
 * A detector's box-extraction strategy. Plug a new detector architecture into the
 * OCR pipeline by supplying an object of this type (a built-in below, or your
 * own).
 * @category Types
 */
export type TextBoxExtractor = {
  /**
   * The detector input dims (W and H) must be a multiple of this — the pipeline
   * snaps the letterbox size up to it before allocating, so `outputShapes` never
   * receives a size it must reject. Default 1 (no alignment). CRAFT needs 2 (its
   * heatmap is half-resolution).
   */
  readonly inputAlignment?: number;
  /**
   * The allowed spec of the `detect` outputs this strategy decodes, used to
   * validate the model at load. Dimensions that track the detector input size
   * must be built with the supplied `dim` factory — the pipeline passes
   * `DynamicDim` when validating a size-varying detector and `StaticDim` when
   * validating a fixed-size one, so one declaration covers both.
   * @param dim Symbol factory for every input-size-dependent dimension.
   * @returns One param spec per `detect` output, in order.
   */
  readonly detectOutputSpec: (dim: (symbol: string) => SymbolicDim) => ParamSpec<SymbolicDim>[];
  /**
   * The `float32` output tensor shapes the `detect` method produces for a given
   * detector input size, so the caller can pre-allocate them. One shape per
   * `detect` output, in order. Runs per pass, so it MUST be a worklet.
   * @param inputSize The detector input size the image was letterboxed to.
   * @returns One shape per `detect` output tensor.
   */
  readonly outputShapes: (inputSize: {
    readonly width: number;
    readonly height: number;
  }) => number[][];
  /**
   * Turns the model's `detect` output tensors into oriented {@link Quad}s in
   * detector-input pixel space. Runs per pass, so it MUST be a worklet.
   * @param outputs The model's `detect` output tensors, in order.
   * @param inputSize The detector input size the image was letterboxed to.
   * @returns Oriented quads (TL, TR, BR, BL) in detector-input pixel space.
   */
  readonly extract: (
    outputs: readonly Tensor[],
    inputSize: { readonly width: number; readonly height: number }
  ) => Quad[];
};

/**
 * CRAFT decode thresholds — tuning knobs for {@link makeCraftExtractBoxes}. All
 * optional; the defaults suit the built-in CRAFT models.
 * @category Types
 */
export type CraftExtractOptions = {
  /** Region-score threshold for a pixel to count as text. Default 0.4. */
  readonly textThreshold?: number;
  /** Affinity-score threshold for linking adjacent glyphs into a line. Default 0.4. */
  readonly linkThreshold?: number;
  /** Minimum peak region score for a component to survive. Default 0.7. */
  readonly lowTextThreshold?: number;
};

/**
 * Builds a CRAFT box-extraction strategy: native region+affinity heatmap decode
 * (`outputs[0]` = `[1, Hd, Wd, 2]`), then line grouping + de-skew in TS.
 * Detector input dims must be even (half-res heatmap). {@link craftExtractBoxes} is this with default thresholds.
 * @param options Threshold overrides; omit for the built-in defaults.
 * @returns A {@link TextBoxExtractor} bound to those thresholds.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if a caller asks for
 * odd detector input dimensions.
 * @category Typescript API
 */
export function makeCraftExtractBoxes(options: CraftExtractOptions = {}): TextBoxExtractor {
  const textThreshold = options.textThreshold ?? 0.4;
  const linkThreshold = options.linkThreshold ?? 0.4;
  const lowTextThreshold = options.lowTextThreshold ?? 0.7;
  return {
    // Half-resolution heatmap: input dims must be even. The pipeline snaps to
    // this, so the guard below only ever fires on a hand-rolled caller.
    inputAlignment: 2,
    // Half-resolution NHWC heatmap: [1, H/2, W/2, 2] (region + affinity).
    detectOutputSpec: (dim) => [f32(1, dim('detOutH'), dim('detOutW'), 2)],
    outputShapes: ({ width, height }) => {
      'worklet';
      if (width % 2 !== 0 || height % 2 !== 0) {
        throw RnExecuTorchError(
          'INVALID_ARGUMENT',
          'craftExtractBoxes: detect input dimensions must be even ' +
            `(half-resolution heatmap), got ${width}x${height}.`
        );
      }
      return [[1, height / 2, width / 2, 2]];
    },
    extract: (outputs, inputSize) => {
      'worklet';
      const flat = extractCraftTextBoxes(outputs[0]!, {
        textThreshold,
        linkThreshold,
        lowTextThreshold,
        targetHeight: inputSize.height,
      });
      return groupBoxes(boxesFromFlat(flat)).map(boxToQuad);
    },
  };
}

/**
 * CRAFT box-extraction strategy with default thresholds.
 * @category Typescript API
 */
export const craftExtractBoxes: TextBoxExtractor = makeCraftExtractBoxes();

/**
 * DBNet decode thresholds — tuning knobs for {@link makeDbnetExtractBoxes}. All
 * optional; the defaults suit the built-in DBNet models.
 * @category Types
 */
export type DbnetExtractOptions = {
  /** Binarization threshold on the probability map. Default 0.3. */
  readonly binThreshold?: number;
  /** Minimum mean box score to keep a candidate. Default 0.6. */
  readonly boxThreshold?: number;
  /** How far to expand (unclip) each shrunk box. Default 1.5. */
  readonly unclipRatio?: number;
  /** Discard boxes with a side smaller than this (px). Default 3. */
  readonly minBoxSide?: number;
  /** Cap on contour candidates scored per map. Default 1000. */
  readonly maxCandidates?: number;
};

/**
 * Builds a DBNet box-extraction strategy: thresholds and unclips the full-res
 * post-sigmoid probability map (`outputs[0]` = `[1, 1, H, W]`) into oriented
 * quads. No char-level mode. {@link dbnetExtractBoxes} is this with defaults.
 * @param options Threshold overrides; omit for the built-in defaults.
 * @returns A {@link TextBoxExtractor} bound to those thresholds.
 * @category Typescript API
 */
export function makeDbnetExtractBoxes(options: DbnetExtractOptions = {}): TextBoxExtractor {
  const binThreshold = options.binThreshold ?? 0.3;
  const boxThreshold = options.boxThreshold ?? 0.6;
  const unclipRatio = options.unclipRatio ?? 1.5;
  const minBoxSide = options.minBoxSide ?? 3;
  const maxCandidates = options.maxCandidates ?? 1000;
  return {
    // Full-resolution NCHW probability map: [1, 1, H, W].
    detectOutputSpec: (dim) => [f32(1, 1, dim('detOutH'), dim('detOutW'))],
    outputShapes: ({ width, height }) => {
      'worklet';
      return [[1, 1, height, width]];
    },
    extract: (outputs) => {
      'worklet';
      const flat = extractDbnetTextBoxes(outputs[0]!, {
        binThreshold,
        boxThreshold,
        unclipRatio,
        minBoxSide,
        maxCandidates,
      });
      return quadsFromFlat(flat);
    },
  };
}

/**
 * DBNet box-extraction strategy with default thresholds.
 * @category Typescript API
 */
export const dbnetExtractBoxes: TextBoxExtractor = makeDbnetExtractBoxes();
