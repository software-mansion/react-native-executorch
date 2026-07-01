import type { WorkletRuntime } from 'react-native-worklets';

import { tensor, type Tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { wrapAsync } from '../../../core/runtime';

import type { ImageBuffer } from '../image';
import type { Point } from '../ops/points';
import { FORMAT_CHANNELS, FORMAT_CONVERSION, cvtColor } from '../ops/image';
import { orderQuad, quadSize, boundingQuadOf } from '../ops/quad';
import type { TextBoxExtractor } from './ocr/detectors';
import {
  buildCharset,
  orderByReadingOrder,
  groupVerticalColumns,
  type Buckets,
} from './ocr/ocrUtils';
import {
  detectQuads,
  recognizeQuad,
  recognizeGlyphStrip,
  readStackedColumn,
  resolveDetectorContract,
  resolveRecognizerContract,
  disposeDetSets,
  disposeRecSets,
  type DetSet,
  type RecSet,
  type DetectContext,
  type RecContext,
  type VerticalContext,
} from './ocr/pipeline';

export type { Buckets } from './ocr/ocrUtils';
export type { Quad } from '../ops/quad';
export type { TextBoxExtractor } from './ocr/detectors';

/**
 * Configuration for the OCR pipeline: a model declares its input-size buckets, its
 * charset, and its detector box-extraction strategy. The pipeline is
 * architecture-agnostic — it validates the detect/recognize contract at load and
 * takes everything model-specific here. The built-in {@link craftExtractBoxes} /
 * {@link dbnetExtractBoxes} cover EasyOCR / PaddleOCR; other models supply their own
 * {@link TextBoxExtractor} and override the recognizer normalization/padding/decode.
 * @category Types
 */
export type OcrOptions = {
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
  /**
   * Detector box-extraction strategy: maps the raw `detect_<S>` outputs to oriented
   * quads. Use the built-in {@link craftExtractBoxes} / {@link dbnetExtractBoxes}, or
   * supply your own {@link TextBoxExtractor} to plug in a new detector.
   */
  readonly extractBoxes: TextBoxExtractor;
  /** Drop detections scoring below this. Defaults to 0. */
  readonly dropScore?: number;
  /**
   * Recognizer input normalization, applied after the warp as `x·alpha + beta`
   * (scalar, or per-RGB-channel `[r,g,b]`). Defaults to `(x/255 − 0.5)/0.5` →
   * `[−1,1]` (`alpha = 1/127.5`, `beta = −1`). Override for a recognizer trained
   * with different normalization (e.g. ImageNet). The detector input norm is
   * fixed by contract: RGB ÷ 255, with mean/std baked into the PTE.
   */
  readonly recognizerNorm?: {
    readonly alpha: number | readonly number[];
    readonly beta: number | readonly number[];
  };
  /** Recognizer canvas padding fill value. Defaults to 128 (neutral gray). */
  readonly recognizerPadValue?: number;
  /**
   * Custom recognizer decode, replacing the built-in greedy CTC. Receives the raw
   * `recognize_<W>` output tensor (shape `[1, T, V]`) and the charset, and returns the
   * recognized text plus a confidence in `[0,1]`. Use for non-CTC heads (attention/AR
   * decoders) or custom scoring. MUST be a worklet.
   */
  readonly decode?: (
    logits: Tensor,
    charset: readonly string[]
  ) => { readonly text: string; readonly confidence: number };
};

/**
 * Per-run OCR options (passed to `runOcr`, not baked into the model — toggling
 * them needs no reload).
 * @category Types
 */
export type RunOcrOptions = {
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
   * frees once per page via `releaseMethodsWorklet` instead, so it keeps the run's
   * working set cached while still bounding memory.
   */
  readonly release?: boolean;
};

/**
 * Model configuration required to instantiate an OCR task runner. One fused PTE
 * exposing `detect` + `recognize`.
 * @category Types
 */
export type OcrModel = {
  readonly modelPath: string;
  readonly ocrOpts: OcrOptions;
};

/**
 * A single recognized text region.
 * @category Types
 */
export type OcrDetection = {
  readonly text: string;
  readonly confidence: number;
  /**
   * The oriented quad (TL,TR,BR,BL) in original image pixels. Derive the
   * axis-aligned box with `boundingBoxOf(quad)` from `cv.ops.boxes` if needed.
   */
  readonly quad: readonly Point[];
};

/**
 * The result of one OCR run: the recognized text regions.
 * @category Types
 */
export type OcrResult = {
  readonly detections: OcrDetection[];
};

const RECOGNIZER_ALPHA = 1 / 127.5; // (x/255 - 0.5)/0.5 -> [-1, 1]
const RECOGNIZER_BETA = -1;
const RECOGNIZER_PAD_VALUE = 128; // neutral gray
const TALL_CROP_RATIO = 1.5;
const MAX_VERTICAL_REDETECTIONS = 8;
// Vertical reads are lower-confidence and opt-in, so they skip the drop-score gate.
const VERTICAL_DROP_SCORE = 0;

function pushDetection(
  out: OcrDetection[],
  threshold: number,
  text: string,
  conf: number,
  quad: readonly Point[]
): void {
  'worklet';
  if (text.length > 0 && conf >= threshold) {
    out.push({ text, confidence: conf, quad });
  }
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
export async function createOcr(
  config: OcrModel,
  runtime?: WorkletRuntime
): Promise<{
  dispose: () => void;
  runOcr: (input: ImageBuffer, options?: RunOcrOptions) => Promise<OcrResult>;
  runOcrWorklet: (input: ImageBuffer, options?: RunOcrOptions) => OcrResult;
  /** Free all bucket-method arenas without disposing the model (see `RunOcrOptions.release`). */
  releaseMethodsWorklet: () => void;
}> {
  const { modelPath, ocrOpts } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  const dropScore = ocrOpts.dropScore ?? 0;
  const recNormAlpha = ocrOpts.recognizerNorm?.alpha ?? RECOGNIZER_ALPHA;
  const recNormBeta = ocrOpts.recognizerNorm?.beta ?? RECOGNIZER_BETA;
  const recPadValue = ocrOpts.recognizerPadValue ?? RECOGNIZER_PAD_VALUE;
  const recDecode = ocrOpts.decode;

  const detBuckets = ocrOpts.buckets.detect;
  const recBuckets = ocrOpts.buckets.recognize;
  // Validation + scratch allocation can throw; each tensor is pushed into
  // `allocated` the moment it exists (one call per statement) so the catch can
  // dispose every native allocation — a bad config must not leak.
  const allocated: Tensor[] = [];
  const recSets: RecSet[] = [];
  let recC = 3;
  let recH = 0;
  let charset: string[] = [];
  let recSetByWidth: ReadonlyMap<number, RecSet> = new Map();
  const detSets: DetSet[] = [];
  let detSetByS: ReadonlyMap<number, DetSet> = new Map();
  try {
    if (detBuckets.length === 0 || recBuckets.length === 0) {
      throw new Error(
        'OCR: buckets.detect and buckets.recognize must each list at least one size.'
      );
    }
    const detContract = resolveDetectorContract(model, detBuckets);
    const rec = resolveRecognizerContract(model, recBuckets);
    recC = rec.recC;
    recH = rec.recH;
    for (const bucket of rec.buckets) {
      const tCanvas = tensor('uint8', [rec.recH, bucket.width, rec.recC]);
      allocated.push(tCanvas);
      const tCF = tensor('uint8', [rec.recC, rec.recH, bucket.width]);
      allocated.push(tCF);
      const tNorm = tensor('float32', [rec.recC, rec.recH, bucket.width]);
      allocated.push(tNorm);
      const tInput = tensor('float32', bucket.inShape);
      allocated.push(tInput);
      const tLogits = tensor('float32', bucket.outShape);
      allocated.push(tLogits);
      recSets.push({ width: bucket.width, tCanvas, tCF, tNorm, tInput, tLogits });
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
    for (const { s, outputs } of detContract) {
      const tColor = tensor('uint8', [s, s, 3]);
      allocated.push(tColor);
      const tCF = tensor('uint8', [3, s, s]);
      allocated.push(tCF);
      const tNorm = tensor('float32', [3, s, s]);
      allocated.push(tNorm);
      const tInput = tensor('float32', [1, 3, s, s]);
      allocated.push(tInput);
      const tOutputs: Tensor[] = [];
      for (const spec of outputs) {
        const tOut = tensor(spec.dtype, spec.shape);
        allocated.push(tOut);
        tOutputs.push(tOut);
      }
      detSets.push({ s, tColor, tCF, tNorm, tInput, tOutputs });
    }
    detSetByS = new Map(detSets.map((detSet) => [detSet.s, detSet]));
  } catch (e) {
    for (const t of allocated) {
      t.dispose();
    }
    model.dispose();
    throw e;
  }

  const dispose = () => {
    disposeRecSets(recSets);
    disposeDetSets(detSets);
    model.dispose();
  };

  // Frees each bucket method's activation arena without disposing the model; a
  // freed method transparently reloads on its next execute. Must precede
  // runOcrWorklet: the worklet plugin resolves referenced worklets by source order.
  const releaseMethodsWorklet = () => {
    'worklet';
    for (const s of detBuckets) {
      model.unloadMethod(`detect_${s}`);
    }
    for (const w of recBuckets) {
      model.unloadMethod(`recognize_${w}`);
    }
  };

  const runOcrWorklet = (input: ImageBuffer, options?: RunOcrOptions): OcrResult => {
    'worklet';
    const vertical = options?.vertical ?? false;
    const tallCropRatio = options?.tallCropRatio ?? TALL_CROP_RATIO;
    const maxRedetections = options?.maxRedetections ?? MAX_VERTICAL_REDETECTIONS;
    const release = options?.release ?? true;
    const { data, width, height, format } = input;
    const numChannels = FORMAT_CHANNELS[format];
    const rgbCode = FORMAT_CONVERSION[format].rgb;

    const detCtx: DetectContext = {
      model,
      detBuckets,
      numChannels,
      detCode: rgbCode,
      extractBoxes: ocrOpts.extractBoxes,
      detSets: detSetByS,
    };

    const tInputRaw = tensor('uint8', [height, width, numChannels]);
    let tRecImage: Tensor | null = null;
    try {
      tInputRaw.setData(data);

      const quads = detectQuads(detCtx, tInputRaw, width, height);
      if (quads.length === 0) {
        return { detections: [] };
      }

      let recSrc = tInputRaw;
      if (rgbCode !== null) {
        tRecImage = tensor('uint8', [height, width, recC]);
        recSrc = cvtColor(tInputRaw, tRecImage, rgbCode);
      }
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
      const vctx: VerticalContext = {
        detCtx,
        rawPage: tInputRaw,
        recC,
        tallCropRatio,
        redetectBudget: { remaining: maxRedetections },
      };

      const detections: OcrDetection[] = [];

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
          const { text, conf } = recognizeQuad(recCtx, recSrc, orderedQuad);
          pushDetection(detections, dropScore, text, conf, orderedQuad);
        }
        return { detections: orderByReadingOrder(detections) };
      }

      const { columns, singles } = groupVerticalColumns(ordered);
      for (const col of columns) {
        const strip = recognizeGlyphStrip(recCtx, recSrc, col);
        if (strip) {
          pushDetection(
            detections,
            VERTICAL_DROP_SCORE,
            strip.text,
            strip.conf,
            boundingQuadOf(col)
          );
        }
      }
      for (const orderedQuad of singles) {
        const size = quadSize(orderedQuad);
        if (size.height >= size.width * vctx.tallCropRatio) {
          const stacked = readStackedColumn(recCtx, vctx, orderedQuad, size);
          if (stacked) {
            pushDetection(detections, VERTICAL_DROP_SCORE, stacked.text, stacked.conf, orderedQuad);
            continue;
          }
        }
        const { text, conf } = recognizeQuad(recCtx, recSrc, orderedQuad);
        pushDetection(detections, dropScore, text, conf, orderedQuad);
      }
      return { detections: orderByReadingOrder(detections) };
    } finally {
      tInputRaw.dispose();
      tRecImage?.dispose();
      if (release) {
        releaseMethodsWorklet();
      }
    }
  };

  const runOcr = wrapAsync(runOcrWorklet, runtime);

  return { runOcr, runOcrWorklet, dispose, releaseMethodsWorklet };
}
