// Built-in detector box-extraction strategies for the OCR pipeline. Each is a
// TextBoxExtractor for one detector architecture: it calls that architecture's
// native decoder and reshapes the flat output into quads. The pipeline stays
// model-agnostic — it just invokes OcrOptions.extractBoxes; the presets in
// models.ts wire the zero-config built-ins, a model with non-standard
// thresholds uses the make* factories, and a new architecture plugs in by
// supplying its own conforming function.

import { rnexecutorchJsi } from '../../../../native/bridge';
import type { Tensor } from '../../../../core/tensor';
import { quadsFromFlat, type Quad } from '../../ops/quad';

/**
 * A detector's box-extraction strategy: turns a model's raw `detect_<S>` output
 * tensors into oriented {@link Quad}s in detector-input pixel space. A model plugs a
 * new detector into the OCR pipeline by supplying a function of this type (the
 * built-ins below, or its own). MUST be a worklet.
 * @category Types
 * @param outputs The model's `detect_<S>` output tensors, in order (owned by the
 * pipeline — do not dispose).
 * @param side The snapped square detector side `S` (input is `S × S` letterboxed).
 * @param charLevel Emit one box per glyph instead of grouped lines; strategies
 * without a char-level mode ignore it.
 * @returns Oriented quads (TL, TR, BR, BL) in detector-input pixel space.
 */
export type TextBoxExtractor = (
  outputs: readonly Tensor[],
  side: number,
  charLevel: boolean
) => Quad[];

/**
 * Threshold overrides for {@link makeCraftExtractBoxes}. Any omitted field keeps
 * the CRAFT default.
 * @category Types
 */
export type CraftExtractorOptions = {
  /** Region-heatmap binarization threshold. Defaults to 0.4. */
  readonly textThreshold?: number;
  /** Affinity-heatmap (glyph linking) threshold. Defaults to 0.4. */
  readonly linkThreshold?: number;
  /** Minimum component peak score to keep a box. Defaults to 0.7. */
  readonly lowTextThreshold?: number;
};

/**
 * Threshold overrides for {@link makeDbnetExtractBoxes}. Any omitted field keeps
 * the DBNet default.
 * @category Types
 */
export type DbnetExtractorOptions = {
  /** Probability-map binarization threshold. Defaults to 0.3. */
  readonly binThreshold?: number;
  /** Minimum mean in-contour probability to keep a box. Defaults to 0.6. */
  readonly boxThreshold?: number;
  /** Box expansion (unclip) ratio. Defaults to 1.5. */
  readonly unclipRatio?: number;
  /** Minimum box side in pixels. Defaults to 3. */
  readonly minBoxSide?: number;
  /** Maximum contour candidates considered. Defaults to 1000. */
  readonly maxCandidates?: number;
};

// CRAFT region+affinity heatmap thresholds — stable across models, the defaults.
const CRAFT_TEXT_THRESHOLD = 0.4;
const CRAFT_LINK_THRESHOLD = 0.4;
const CRAFT_LOW_TEXT_THRESHOLD = 0.7;

// DBNet probability-map thresholds — stable across models, the defaults.
const DBNET_BIN_THRESHOLD = 0.3;
const DBNET_BOX_THRESHOLD = 0.6;
const DBNET_UNCLIP_RATIO = 1.5;
const DBNET_MIN_BOX_SIDE = 3;
const DBNET_MAX_CANDIDATES = 1000;

/**
 * Builds a CRAFT {@link TextBoxExtractor} with custom thresholds: groups the
 * half-resolution region+affinity heatmap (`outputs[0]` is the `[1,Hd,Wd,2]`
 * heatmap) into oriented text-line quads, or per-glyph boxes when `charLevel`.
 * For the standard thresholds use the ready-made {@link craftExtractBoxes}.
 * @category Typescript API
 * @param overrides Threshold overrides; omitted fields keep the CRAFT defaults.
 * @returns A {@link TextBoxExtractor} to assign to `OcrOptions.extractBoxes`.
 */
export function makeCraftExtractBoxes(overrides?: CraftExtractorOptions): TextBoxExtractor {
  const textThreshold = overrides?.textThreshold ?? CRAFT_TEXT_THRESHOLD;
  const linkThreshold = overrides?.linkThreshold ?? CRAFT_LINK_THRESHOLD;
  const lowTextThreshold = overrides?.lowTextThreshold ?? CRAFT_LOW_TEXT_THRESHOLD;
  return (outputs, side, charLevel) => {
    'worklet';
    // The half-resolution heatmap requires an even detector side; the pipeline is
    // architecture-agnostic and can't check this, so the strategy does.
    if (side % 2 !== 0) {
      throw new Error(
        'OCR: every CRAFT detect bucket side must be even (half-resolution heatmap).'
      );
    }
    const flat = rnexecutorchJsi.cv.extractCraftTextBoxes(outputs[0]!, {
      textThreshold,
      linkThreshold,
      lowTextThreshold,
      targetHeight: side,
      charLevel,
    }) as number[];
    return quadsFromFlat(flat);
  };
}

/**
 * Builds a DBNet {@link TextBoxExtractor} with custom thresholds: thresholds and
 * unclips the probability map (`outputs[0]` is the `[1,1,H,W]` post-sigmoid prob
 * map) into oriented text quads. It decodes at full resolution with no char-level
 * mode, so the extractor uses neither `side` nor `charLevel`. For the standard
 * thresholds use the ready-made {@link dbnetExtractBoxes}.
 * @category Typescript API
 * @param overrides Threshold overrides; omitted fields keep the DBNet defaults.
 * @returns A {@link TextBoxExtractor} to assign to `OcrOptions.extractBoxes`.
 */
export function makeDbnetExtractBoxes(overrides?: DbnetExtractorOptions): TextBoxExtractor {
  const binThreshold = overrides?.binThreshold ?? DBNET_BIN_THRESHOLD;
  const boxThreshold = overrides?.boxThreshold ?? DBNET_BOX_THRESHOLD;
  const unclipRatio = overrides?.unclipRatio ?? DBNET_UNCLIP_RATIO;
  const minBoxSide = overrides?.minBoxSide ?? DBNET_MIN_BOX_SIDE;
  const maxCandidates = overrides?.maxCandidates ?? DBNET_MAX_CANDIDATES;
  return (outputs) => {
    'worklet';
    const flat = rnexecutorchJsi.cv.extractDbnetTextBoxes(outputs[0]!, {
      binThreshold,
      boxThreshold,
      unclipRatio,
      minBoxSide,
      maxCandidates,
    }) as number[];
    return quadsFromFlat(flat);
  };
}

/**
 * Built-in CRAFT {@link TextBoxExtractor} with the standard thresholds. Assign to
 * `OcrOptions.extractBoxes` for a CRAFT-family model (the detector side must be
 * even), or build a custom-threshold variant with {@link makeCraftExtractBoxes}.
 * @category Typescript API
 */
export const craftExtractBoxes: TextBoxExtractor = makeCraftExtractBoxes();

/**
 * Built-in DBNet {@link TextBoxExtractor} with the standard thresholds. Assign to
 * `OcrOptions.extractBoxes` for a DBNet-family model, or build a
 * custom-threshold variant with {@link makeDbnetExtractBoxes}.
 * @category Typescript API
 */
export const dbnetExtractBoxes: TextBoxExtractor = makeDbnetExtractBoxes();
