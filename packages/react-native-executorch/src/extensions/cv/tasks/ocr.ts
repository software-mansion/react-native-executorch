import type { WorkletRuntime } from 'react-native-worklets';

import { tensor, type Tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { wrapAsync } from '../../../core/runtime';

import type { ImageBuffer } from '../image';
import type { Point } from '../ops/points';
import { FORMAT_CHANNELS, cvtColor } from '../ops/image';
import type { Quad } from '../ops/textBoxes';
import {
  buildCharset,
  orderQuad,
  quadSize,
  nowMs,
  readingOrderIndices,
  boundingQuadOf,
  groupVerticalColumns,
  type Buckets,
} from './ocr/ocrHelpers';
import {
  toRgbCode,
  detectQuads,
  recognizeQuad,
  recognizeGlyphStrip,
  readBoxVertical,
  validateDetectorSchema,
  buildExtractOpts,
  deriveDetectorOutputs,
  deriveRecognizerContract,
  disposeDetSets,
  disposeRecSets,
  type DetSet,
  type RecSet,
  type DetectContext,
  type RecContext,
  type VerticalContext,
  type DetectorExtractConfig,
} from './ocr/ocrPipeline';

export type { Buckets } from './ocr/ocrHelpers';

/**
 * Configuration for the unified OCR pipeline. A model declares its detector
 * architecture, its input-size buckets, and its charset; the detector/recognizer
 * share one baked contract whose defaults match CRAFT (EasyOCR) and DBNet
 * (PaddleOCR). Models that diverge can override the recognizer normalization,
 * padding, and decode, or supply a `'custom'` detector with its own box
 * extraction — see the per-field options below.
 * @category Types
 */
export type OCROptions = {
  /**
   * Detector architecture — selects the box decoder (CRAFT heatmap grouping vs
   * DBNet prob-map) and the default drop score. Use `'custom'` for any other
   * architecture and supply {@link OCROptions.extractBoxes} to turn the raw
   * detector output into quads in TypeScript.
   */
  readonly detectorKind: 'craft' | 'dbnet' | 'custom';
  /**
   * The model's static input-size buckets. The pipeline snaps each image to the
   * closest `detect`/`recognize` bucket and calls the matching per-size method
   * (`detect_<S>` / `recognize_<W>`). See {@link Buckets}.
   */
  readonly buckets: Buckets;
  /**
   * Recognizer charset (a string = one codepoint per index; an array is taken
   * verbatim, for multi-codepoint entries like ligatures).
   */
  readonly charset: string | readonly string[];
  /** Drop detections below this confidence. Defaults per detector architecture. */
  readonly dropScore?: number;
  /**
   * Custom detector post-processing, required when `detectorKind === 'custom'`.
   * Receives the raw `detect_<S>` output tensors (the model's declared outputs,
   * in order — shapes read from the PTE, allocated for you) and the snapped
   * square side `s`, and returns oriented quads in DETECTOR space (the `s × s`
   * letterboxed input); the pipeline maps them to image pixels and applies
   * dropScore. Ignored for the built-in kinds. MUST be a worklet — it runs on
   * the pipeline's worklet thread.
   */
  readonly extractBoxes?: (outputs: readonly Tensor[], s: number) => Quad[];
  /**
   * Recognizer input normalization, applied after the warp as `x·alpha + beta`
   * (scalar, or per-RGB-channel `[r,g,b]`). Defaults to `(x/255 − 0.5)/0.5` →
   * `[−1,1]` (`alpha = 1/127.5`, `beta = −1`), the SVTR/CRNN convention. Override
   * for a recognizer trained with different normalization (e.g. ImageNet).
   */
  readonly recognizerNorm?: {
    readonly alpha: number | readonly number[];
    readonly beta: number | readonly number[];
  };
  /** Fill value for the recognizer canvas padding. Defaults to 128 (neutral gray). */
  readonly recognizerPadValue?: number;
  /**
   * Custom recognizer decode, replacing the built-in greedy CTC. Receives the
   * raw `recognize_<W>` output tensor (shape `[1, T, V]`, softmaxed per the
   * contract) and the charset, and returns the recognized text plus a confidence
   * in `[0,1]`. Use for non-CTC heads (attention/AR decoders) or custom scoring.
   * MUST be a worklet — it runs on the pipeline's worklet thread.
   */
  readonly decode?: (
    logits: Tensor,
    charset: readonly string[]
  ) => { readonly text: string; readonly confidence: number };
};

/**
 * Per-run OCR options (passed to `runOCR`, not baked into the model — toggling
 * them needs no reload).
 * @category Types
 */
export type RunOCROptions = {
  /**
   * Add handling for upright stacked columns (e.g. vertical signage, shipping-
   * container codes — letters stacked top-to-bottom) on top of the normal
   * horizontal read. X-aligned stacked glyph boxes are joined into one column
   * word; a single tall box is cropped and its glyphs re-detected. Horizontal
   * lines still read normally, so this only ADDS capability (at extra compute).
   */
  readonly vertical?: boolean;
  /** Height/width ratio above which a box is treated as a stacked column. Default 1.5. */
  readonly tallCropRatio?: number;
  /** Max stacked-column re-detection passes per page (each is detector-scale). Default 8. */
  readonly maxRedetections?: number;
  /**
   * Free the model's bucket-method activation arenas (`detect_<S>`/`recognize_<W>`)
   * after this run, so memory doesn't accumulate as image/box sizes vary across
   * runs (worse on CoreML, which compiles a graph per method). Default `true`.
   * The document orchestrator passes `false` for its per-region OCR calls and
   * frees once per page via `releaseMethods` instead, so it keeps the run's
   * working set cached while still bounding memory.
   */
  readonly release?: boolean;
};

// Defaults for the shared baked contract — the detector input is raw RGB /255
// (mean/std baked into the PTE), the recognizer is RGB with (x/255−0.5)/0.5 norm
// and constant-128 left padding, both heads emit softmaxed probabilities, and
// confidence is the mean of per-character max-probs. CRAFT/DBNet decode the
// heatmap natively; everything else can be overridden per model via OCROptions
// (recognizerNorm/recognizerPadValue/decode, and 'custom' detectorKind+extractBoxes).
// Per-architecture default drop score:
const DEFAULT_DROP_SCORE: Record<'craft' | 'dbnet' | 'custom', number> = {
  craft: 0,
  dbnet: 0.5,
  custom: 0,
};

/**
 * Model configuration required to instantiate an OCR task runner. One fused PTE
 * exposing `detect` + `recognize`.
 * @category Types
 */
export type OCRModel = {
  readonly modelPath: string;
  readonly ocrOpts: OCROptions;
};

/**
 * A single recognized text region.
 * @category Types
 */
export type OCRDetection = {
  readonly text: string;
  readonly confidence: number;
  /**
   * The oriented quad (TL,TR,BR,BL) in original image pixels. Derive the
   * axis-aligned box with `boundingBoxOf(quad)` from `cv.ops.boxes` if needed.
   */
  readonly quad: readonly Point[];
  /** Wall-clock time spent recognizing this box (ms), incl. any retries. */
  readonly recognizeMs: number;
};

/**
 * The result of one OCR run: the recognized text regions.
 * @category Types
 */
export type OCRResult = {
  readonly detections: OCRDetection[];
};

// Default recognizer normalization / pad (SVTR/CRNN); overridable per model via
// OCROptions.recognizerNorm / recognizerPadValue. Detector-side norm and the
// box-extraction tuning live with the engine in ocrPipeline.ts.
const RECOGNIZER_ALPHA = 1 / 127.5; // (x/255 - 0.5)/0.5 -> [-1, 1]
const RECOGNIZER_BETA = -1;
const RECOGNIZER_PAD_VALUE = 128; // neutral gray
// A box taller than this ratio is read as an upright stacked column.
const TALL_CROP_RATIO = 1.5;
// Per-page cap on stacked-column re-detection passes (each is detector-scale).
const MAX_VERTICAL_REDETECTIONS = 8;
// Vertical reads are lower-confidence and opt-in, so they skip the drop-score gate.
const VERTICAL_DROP_SCORE = 0;

// Appends a detection when it has text and clears the drop-score threshold. A
// module-level worklet (not a closure) so the run loop stays flat.
function pushDetection(
  out: OCRDetection[],
  threshold: number,
  text: string,
  conf: number,
  quad: readonly Point[],
  ms: number
): void {
  'worklet';
  if (text.length > 0 && conf >= threshold) {
    out.push({ text, confidence: conf, quad, recognizeMs: ms });
  }
}

// Reorders recognized detections into human reading order (the detector emits
// boxes in an arbitrary order). Column-aware: genuine multi-column pages read
// column-by-column, single-column pages line-by-line, words within a line
// left-to-right. Defined before its caller so the worklet plugin captures it.
function orderDetections(dets: OCRDetection[]): OCRDetection[] {
  'worklet';
  if (dets.length <= 1) {
    return dets;
  }
  const order = readingOrderIndices(dets.map((d) => d.quad));
  return order.map((i) => dets[i]!);
}

/**
 * Creates a unified OCR runner for two-stage detect -> recognize models
 * (EasyOCR / PaddleOCR). It loads one fused PTE, validates the `detect` and
 * `recognize` methods, pre-allocates static scratch tensors sized from the
 * model's compiled shapes, and returns recognition + disposal controls.
 * @category Typescript API
 * @param config OCR task configuration containing the model path and flat
 * options.
 * @param runtime Optional worklet runtime thread on which to run the pipeline.
 * @returns A promise resolving to an object with recognition and disposal
 * controls.
 */
export async function createOCR(
  config: OCRModel,
  runtime?: WorkletRuntime
): Promise<{
  dispose: () => void;
  runOCR: (input: ImageBuffer, options?: RunOCROptions) => Promise<OCRResult>;
  runOCRWorklet: (input: ImageBuffer, options?: RunOCROptions) => OCRResult;
  /** Free all bucket-method arenas without disposing the model (see `RunOCROptions.release`). */
  releaseMethods: () => Promise<void>;
  /** Worklet-thread variant of {@link releaseMethods}. */
  releaseMethodsWorklet: () => void;
}> {
  const { modelPath, ocrOpts } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  const dropScore = ocrOpts.dropScore ?? DEFAULT_DROP_SCORE[ocrOpts.detectorKind];
  // Recognizer normalization / pad / decode — defaults preserve the SVTR/CRNN
  // contract; OCROptions can override per model (see RecContext).
  const recNormAlpha = ocrOpts.recognizerNorm?.alpha ?? RECOGNIZER_ALPHA;
  const recNormBeta = ocrOpts.recognizerNorm?.beta ?? RECOGNIZER_BETA;
  const recPadValue = ocrOpts.recognizerPadValue ?? RECOGNIZER_PAD_VALUE;
  const recDecode = ocrOpts.decode;

  const detBuckets = ocrOpts.buckets.detect;
  const recBuckets = ocrOpts.buckets.recognize;
  // Validation + scratch allocation can throw (bad buckets, missing methods,
  // shape/charset mismatch); on any failure dispose the model and any tensors
  // already built, so a bad config doesn't leak native memory.
  let recSets: RecSet[] = [];
  let recC = 3;
  let recH = 0;
  let charset: string[] = [];
  let recSetByWidth: ReadonlyMap<number, RecSet> = new Map();
  let detSets: DetSet[] = [];
  let detSetByS: ReadonlyMap<number, DetSet> = new Map();
  try {
    if (detBuckets.length === 0 || recBuckets.length === 0) {
      throw new Error(
        'OCR: buckets.detect and buckets.recognize must each list at least one size.'
      );
    }
    const detExtraChannels = validateDetectorSchema(
      model,
      detBuckets,
      ocrOpts.detectorKind,
      ocrOpts.extractBoxes
    );

    // Derive shapes/contract, then allocate + own the scratch tensors here so
    // ownership never crosses a function boundary (the derive* helpers return no
    // tensors).
    const rec = deriveRecognizerContract(model, recBuckets);
    recC = rec.recC;
    recH = rec.recH;
    // Push into the pre-declared arrays as we allocate, so a mid-loop tensor()
    // failure leaves the partial set visible to the catch's dispose* below.
    for (const bucket of rec.buckets) {
      recSets.push({
        width: bucket.width,
        tCanvas: tensor('uint8', [rec.recH, bucket.width, rec.recC]),
        tCF: tensor('uint8', [rec.recC, rec.recH, bucket.width]),
        tNorm: tensor('float32', [rec.recC, rec.recH, bucket.width]),
        tInput: tensor('float32', bucket.inShape),
        tLogits: tensor('float32', bucket.outShape),
      });
    }
    recSetByWidth = new Map(recSets.map((recSet) => [recSet.width, recSet]));

    if (recC !== 3) {
      throw new Error(`OCR: recognizer must take RGB (3 channels), but the model expects ${recC}.`);
    }
    charset = buildCharset(ocrOpts.charset);
    if (charset.length !== rec.vocabSize) {
      throw new Error(
        `OCR: charset size (${charset.length}, incl. blank) must match recognizer output vocab (${rec.vocabSize}).`
      );
    }
    for (const { s, outputs } of deriveDetectorOutputs(
      model,
      detBuckets,
      ocrOpts.detectorKind,
      detExtraChannels
    )) {
      detSets.push({
        s,
        tColor: tensor('uint8', [s, s, 3]),
        tCF: tensor('uint8', [3, s, s]),
        tNorm: tensor('float32', [3, s, s]),
        tInput: tensor('float32', [1, 3, s, s]),
        tOutputs: outputs.map((o) => tensor(o.dtype, o.shape)),
      });
    }
    detSetByS = new Map(detSets.map((detSet) => [detSet.s, detSet]));
  } catch (e) {
    disposeRecSets(recSets);
    disposeDetSets(detSets);
    model.dispose();
    throw e;
  }

  // Built-in box-decode config (custom archs decode in TS via extractBoxes).
  const extractOpts: DetectorExtractConfig | undefined = buildExtractOpts(ocrOpts.detectorKind);

  const dispose = () => {
    disposeRecSets(recSets);
    disposeDetSets(detSets);
    model.dispose();
  };

  // Free every per-size method's activation arena (detect_<S>/recognize_<W>)
  // without disposing the model — they transparently reload on next execute.
  // Defined before runOCRWorklet so the worklet plugin captures it (referenced
  // worklets must precede their callers in source order).
  const releaseMethodsWorklet = () => {
    'worklet';
    for (const s of detBuckets) {
      model.unloadMethod(`detect_${s}`);
    }
    for (const w of recBuckets) {
      model.unloadMethod(`recognize_${w}`);
    }
  };

  const runOCRWorklet = (input: ImageBuffer, options?: RunOCROptions): OCRResult => {
    'worklet';
    const vertical = options?.vertical ?? false;
    const tallCropRatio = options?.tallCropRatio ?? TALL_CROP_RATIO;
    const maxRedetections = options?.maxRedetections ?? MAX_VERTICAL_REDETECTIONS;
    const release = options?.release ?? true;
    const { data, width, height, format } = input;
    const numChannels = FORMAT_CHANNELS[format];
    // Both detector and recognizer read RGB, so one conversion code serves both.
    const rgbCode = toRgbCode(format);

    // Detector state, reused for the page pass and the per-box character pass.
    const detCtx: DetectContext = {
      model,
      detBuckets,
      numChannels,
      detCode: rgbCode,
      extractOpts,
      extractBoxes: ocrOpts.extractBoxes,
      detSets: detSetByS,
    };

    const tInputRaw = tensor('uint8', [height, width, numChannels]);
    const tRecImage = tensor('uint8', [height, width, recC]);
    try {
      tInputRaw.setData(data);

      // ---- detector pass: letterbox -> detect_<S> -> text-box quads (image space) ----
      const quads = detectQuads(detCtx, tInputRaw, width, height);
      if (quads.length === 0) {
        return { detections: [] };
      }

      // ---- recognizer source: full-res image in RGB ----
      const recSrc = rgbCode !== null ? cvtColor(tInputRaw, tRecImage, rgbCode) : tInputRaw;
      const recCtx: RecContext = {
        model,
        recSetByWidth,
        recBuckets,
        recH,
        charset,
        normAlpha: recNormAlpha,
        normBeta: recNormBeta,
        padValue: recPadValue,
        decode: recDecode,
      };
      // The vertical path crops each box from the raw page and re-detects its
      // characters; `recCode`/`recC` convert a box crop to RGB.
      const vctx: VerticalContext = {
        detCtx,
        rawPage: tInputRaw,
        recCode: rgbCode,
        recC,
        tallCropRatio,
        redetectBudget: { remaining: maxRedetections },
      };

      const detections: OCRDetection[] = [];

      // Valid (non-tiny) boxes, ordered TL,TR,BR,BL.
      const ordered: Point[][] = [];
      for (const quad of quads) {
        const orderedQuad = orderQuad(quad);
        const size = quadSize(orderedQuad);
        if (size.width >= 3 && size.height >= 3) {
          ordered.push(orderedQuad);
        }
      }

      if (!vertical) {
        for (const orderedQuad of ordered) {
          const boxStart = nowMs();
          const { text, conf } = recognizeQuad(recCtx, recSrc, orderedQuad);
          pushDetection(detections, dropScore, text, conf, orderedQuad, nowMs() - boxStart);
        }
        return { detections: orderDetections(detections) };
      }

      // Additive vertical pass: read x-aligned stacked glyph boxes as one joined
      // column word; everything else (lines, isolated boxes) reads normally.
      const { columns, singles } = groupVerticalColumns(ordered);
      for (const col of columns) {
        const boxStart = nowMs();
        // `recognizeGlyphStrip` splits any multi-letter box into single-glyph
        // cells (DBNet merges stacked letters and won't split them), so the
        // column's boxes can be passed straight through, top -> bottom.
        const strip = recognizeGlyphStrip(recCtx, recSrc, col);
        if (strip) {
          pushDetection(
            detections,
            VERTICAL_DROP_SCORE,
            strip.text,
            strip.conf,
            boundingQuadOf(col),
            nowMs() - boxStart
          );
        }
      }
      for (const orderedQuad of singles) {
        const boxStart = nowMs();
        const { text, conf, stacked } = readBoxVertical(
          recCtx,
          vctx,
          recSrc,
          orderedQuad,
          quadSize(orderedQuad)
        );
        pushDetection(
          detections,
          stacked ? VERTICAL_DROP_SCORE : dropScore,
          text,
          conf,
          orderedQuad,
          nowMs() - boxStart
        );
      }
      return { detections: orderDetections(detections) };
    } finally {
      tInputRaw.dispose();
      tRecImage.dispose();
      // Standalone runs free their bucket arenas so memory stays bounded as
      // sizes vary; the document orchestrator opts out (release: false) and
      // frees once per page.
      if (release) {
        releaseMethodsWorklet();
      }
    }
  };

  const runOCR = wrapAsync(runOCRWorklet, runtime);
  const releaseMethods = wrapAsync(releaseMethodsWorklet, runtime);

  return { runOCR, runOCRWorklet, dispose, releaseMethods, releaseMethodsWorklet };
}
