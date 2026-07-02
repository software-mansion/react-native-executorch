import type { WorkletRuntime } from 'react-native-worklets';

import { tensor, type Tensor } from '../../../../core/tensor';
import { loadModel } from '../../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../../core/modelSchema';
import { wrapAsync } from '../../../../core/runtime';

import type { ImageBuffer, ImageFormat } from '../../image';
import { IMAGENET_NORM } from '../../../../constants';
import { FORMAT_CHANNELS } from '../../ops/image';
import { warpByGrid } from '../../ops/image';
import type { BoundingBox } from '../../ops/boxes';
import { boundsOfPoints } from '../../ops/quad';
import { createImagePreprocessor } from '../preprocessing';
import type { OcrDetection } from './ocr';

/**
 * A detected page orientation: the clockwise rotation (rotate by its negation to
 * correct) and the classifier confidence in `[0, 1]`.
 * @category Types
 */
export type Orientation = {
  readonly rotationCW: 0 | 90 | 180 | 270;
  readonly confidence: number;
};

/**
 * A recognized table structure: the `<tr>/<td>` HTML skeleton (empty cells) and
 * the raw structure token ids it was built from (start/end tokens stripped).
 * @category Types
 */
export type TableStructure = {
  readonly html: string;
  readonly tokens: number[];
};

/**
 * Configuration for the fused document models — page orientation, geometric
 * dewarp, and table-structure recognition, all exposed by one model file.
 * `structureVocab` maps a table token id (array index) to its HTML fragment;
 * `eosTokenId` ends table decoding and `maxSteps` caps it.
 * @category Types
 */
export type DocumentModelsConfig = {
  readonly modelPath: string;
  readonly structureVocab: readonly string[];
  readonly eosTokenId: number;
  readonly maxSteps: number;
};

// A dewarp grid estimated on a page without clear boundaries (e.g. text floating
// on white) can map most of the output off the source, collapsing the page to
// near-blank and OCR to zero detections. The dewarp guard compares content before
// and after: if the warp keeps less than this fraction of the source's activity,
// it is declined and the original page is kept.
const DEWARP_MIN_ACTIVITY_RATIO = 0.5;
const DEWARP_ACTIVITY_STRIDE = 31;

// The variance of one channel, sampled every DEWARP_ACTIVITY_STRIDE pixels — a
// cheap, polarity-independent proxy for how much content (ink/edges) an image
// carries; a blank page is ~0. Used by the dewarp degeneracy guard.
function dewarpActivity(data: Uint8Array, channels: number): number {
  'worklet';
  let n = 0;
  let sum = 0;
  let sumSq = 0;
  const step = channels * DEWARP_ACTIVITY_STRIDE;
  for (let i = 0; i < data.length; i += step) {
    const v = data[i]!;
    sum += v;
    sumSq += v * v;
    n++;
  }
  if (n === 0) {
    return 0;
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

// Index of the maximum value in `arr[offset, offset+len)` (single pass, no allocation).
function argmaxRange(arr: ArrayLike<number>, offset: number, len: number): number {
  'worklet';
  let index = 0;
  let best = arr[offset]!;
  for (let i = 1; i < len; i++) {
    const value = arr[offset + i]!;
    if (value > best) {
      best = value;
      index = i;
    }
  }
  return index;
}

// Assembles the table-structure content tokens into an HTML skeleton, dropping the
// reserved start/end range.
function tokensToHtml(
  tokens: number[],
  structureVocab: readonly string[],
  eosTokenId: number
): string {
  'worklet';
  let html = '';
  for (const t of tokens) {
    if (t > 0 && t < eosTokenId && t < structureVocab.length) {
      html += structureVocab[t]!;
    }
  }
  return html;
}

/**
 * Creates the document-models runner: page orientation, geometric dewarp (applied
 * via the predicted sampling grid), and table-structure recognition (autoregressive
 * decode). One model file, loaded once. Internal to the document pipeline.
 * @category Typescript API
 * @param config Model path, table-structure vocabulary, and decode limits.
 * @param runtime Optional worklet runtime thread.
 * @returns A promise resolving to the three capabilities plus disposal controls.
 */
export async function createDocumentModels(
  config: DocumentModelsConfig,
  runtime?: WorkletRuntime
): Promise<{
  dispose: () => void;
  detectOrientation: (page: Tensor, format: ImageFormat) => Promise<Orientation>;
  detectOrientationWorklet: (page: Tensor, format: ImageFormat) => Orientation;
  dewarp: (page: Tensor, format: ImageFormat) => Promise<Tensor>;
  dewarpWorklet: (page: Tensor, format: ImageFormat) => Tensor;
  recognizeTable: (input: ImageBuffer) => Promise<TableStructure>;
  recognizeTableWorklet: (input: ImageBuffer) => TableStructure;
}> {
  const { modelPath, structureVocab, eosTokenId, maxSteps } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  // Everything built is pushed into `created` as it is created — one by one, so
  // a mid-sequence failure can't strand its predecessors — and the catch
  // disposes it all: a bad config must not leak native memory (mirrors createOcr).
  const created: { dispose: () => void }[] = [];
  try {
    // orientation: image -> class logits
    const oriMeta = validateModelSchema(
      model,
      'orientation',
      [SymbolicTensor('float32', [1, 3, 'H', 'W'])],
      [SymbolicTensor('float32', [1, 'K'])]
    );
    // dewarp: image -> sampling grid
    const dewMeta = validateModelSchema(
      model,
      'dewarp',
      [SymbolicTensor('float32', [1, 3, 'H', 'W'])],
      [SymbolicTensor('float32', [1, 2, 'gH', 'gW'])]
    );
    // table: image encoder + autoregressive decode step
    const encMeta = validateModelSchema(
      model,
      'table_encode',
      [SymbolicTensor('float32', [1, 3, 'H', 'W'])],
      [SymbolicTensor('float32', [1, 'C', 'F'])]
    );
    const decMeta = validateModelSchema(
      model,
      'table_decode_step',
      [
        SymbolicTensor('float32', [1, 'C', 'F']),
        SymbolicTensor('float32', [1, 'H']),
        SymbolicTensor('float32', [1, 'V']),
      ],
      [SymbolicTensor('float32', [1, 'V']), SymbolicTensor('float32', [1, 'H'])]
    );

    const oriShape = oriMeta.inputTensorMeta[0]!.shape;
    const oriOutLen = oriMeta.outputTensorMeta[0]!.shape[1]!;
    const dewShape = dewMeta.inputTensorMeta[0]!.shape;
    const gridShape = dewMeta.outputTensorMeta[0]!.shape; // [1,2,gH,gW]
    const tabShape = encMeta.inputTensorMeta[0]!.shape;
    const featShape = encMeta.outputTensorMeta[0]!.shape;
    const hidShape = decMeta.outputTensorMeta[1]!.shape;
    const probShape = decMeta.outputTensorMeta[0]!.shape;
    const hidLen = hidShape[1]!;
    const vocabLen = probShape[1]!;

    if (vocabLen !== structureVocab.length) {
      throw new Error(
        `DocumentModels: structure vocab length (${structureVocab.length}) must match the model's token dim (${vocabLen}).`
      );
    }

    const orientationPreprocessor = createImagePreprocessor(
      {
        resizeMode: 'stretch',
        interpolation: 'linear',
        alpha: IMAGENET_NORM.alpha,
        beta: IMAGENET_NORM.beta,
      },
      oriShape
    );
    created.push(orientationPreprocessor);
    const dewarpPreprocessor = createImagePreprocessor(
      { resizeMode: 'stretch', interpolation: 'linear', alpha: 1 / 255, beta: 0 },
      dewShape
    );
    created.push(dewarpPreprocessor);
    const tablePreprocessor = createImagePreprocessor(
      {
        resizeMode: 'stretch',
        interpolation: 'linear',
        alpha: IMAGENET_NORM.alpha,
        beta: IMAGENET_NORM.beta,
      },
      tabShape
    );
    created.push(tablePreprocessor);

    const tOri = tensor('float32', oriMeta.outputTensorMeta[0]!.shape);
    created.push(tOri);
    const tGrid = tensor('float32', gridShape);
    created.push(tGrid);
    const tFeatures = tensor('float32', featShape);
    created.push(tFeatures);
    const tHidden = tensor('float32', hidShape);
    created.push(tHidden);
    const tOnehot = tensor('float32', probShape);
    created.push(tOnehot);
    const tProbs = tensor('float32', probShape);
    created.push(tProbs);
    const tNewHidden = tensor('float32', hidShape);
    created.push(tNewHidden);

    const oriBuf = new Float32Array(oriOutLen);
    const zeroHidden = new Float32Array(hidLen);
    const zeroVocab = new Float32Array(vocabLen);
    const onehotBuf = new Float32Array(vocabLen);
    const probsBuf = new Float32Array(vocabLen);

    const dispose = () => {
      created.forEach((c) => c.dispose());
      model.dispose();
    };

    const detectOrientationWorklet = (page: Tensor, format: ImageFormat): Orientation => {
      'worklet';
      const tInput = orientationPreprocessor.processTensor(page, format);
      model.execute('orientation', [tInput], [tOri]);
      tOri.getData(oriBuf);
      const cls = argmaxRange(oriBuf, 0, oriOutLen);
      const best = oriBuf[cls]!;
      let sumExp = 0;
      for (let i = 0; i < oriOutLen; i++) {
        sumExp += Math.exp(oriBuf[i]! - best);
      }
      const rotationCW = ((cls % 4) * 90) as 0 | 90 | 180 | 270;
      const confidence = 1 / sumExp;
      return { rotationCW, confidence };
    };

    // Dewarps the full-res page tensor in place: estimate the sampling field, apply
    // it natively (cv::remap). Returns the dewarped tensor, or the input `page`
    // unchanged when the warp is declined (caller owns whichever is returned).
    const dewarpWorklet = (page: Tensor, format: ImageFormat): Tensor => {
      'worklet';
      const tInput = dewarpPreprocessor.processTensor(page, format);
      model.execute('dewarp', [tInput], [tGrid]);
      const h = page.shape[0]!;
      const w = page.shape[1]!;
      const ch = FORMAT_CHANNELS[format];
      const tDst = tensor('uint8', [h, w, ch]);
      try {
        warpByGrid(page, tGrid, tDst);
        const out = new Uint8Array(w * h * ch);
        const src = new Uint8Array(w * h * ch);
        tDst.getData(out);
        page.getData(src);
        // Degenerate-warp guard: a grid lacking page boundaries can push content
        // off-canvas, leaving a near-blank page. If the dewarp collapsed the image's
        // activity, decline it and keep the original (better an un-dewarped read than
        // zero detections).
        if (dewarpActivity(out, ch) < DEWARP_MIN_ACTIVITY_RATIO * dewarpActivity(src, ch)) {
          tDst.dispose();
          return page;
        }
        return tDst;
      } catch (e) {
        // On failure the caller can't see tDst to free it (success path returns it),
        // so release it here before propagating.
        tDst.dispose();
        throw e;
      }
    };

    const recognizeTableWorklet = (input: ImageBuffer): TableStructure => {
      'worklet';
      const tInput = tablePreprocessor.process(input);
      model.execute('table_encode', [tInput], [tFeatures]);
      tHidden.setData(zeroHidden);
      tOnehot.setData(zeroVocab);
      const tokens: number[] = [];
      for (let step = 0; step < maxSteps; step++) {
        model.execute('table_decode_step', [tFeatures, tHidden, tOnehot], [tProbs, tNewHidden]);
        tProbs.getData(probsBuf);
        const tok = argmaxRange(probsBuf, 0, vocabLen);
        tokens.push(tok);
        if (tok === eosTokenId) {
          break;
        }
        tNewHidden.copyTo(tHidden);
        onehotBuf.fill(0);
        onehotBuf[tok] = 1;
        tOnehot.setData(onehotBuf);
      }
      return { html: tokensToHtml(tokens, structureVocab, eosTokenId), tokens };
    };

    return {
      dispose,
      detectOrientation: wrapAsync(detectOrientationWorklet, runtime),
      detectOrientationWorklet,
      dewarp: wrapAsync(dewarpWorklet, runtime),
      dewarpWorklet,
      recognizeTable: wrapAsync(recognizeTableWorklet, runtime),
      recognizeTableWorklet,
    };
  } catch (e) {
    created.forEach((c) => c.dispose());
    model.dispose();
    throw e;
  }
}

/**
 * Crops an axis-aligned region out of an image as a plain pixel slice (same format
 * and layout). Used to feed a layout region to another model.
 * @category Typescript API
 * @param input The source image.
 * @param bbox The crop region, in `xyxy` pixels.
 * @returns The cropped image.
 */
export function cropImageBuffer(input: ImageBuffer, bbox: BoundingBox<'xyxy'>): ImageBuffer {
  'worklet';
  const { data, width, height, format } = input;
  const channels = FORMAT_CHANNELS[format];
  const x0 = Math.max(0, Math.min(Math.round(bbox.xmin), width));
  const y0 = Math.max(0, Math.min(Math.round(bbox.ymin), height));
  const x1 = Math.max(0, Math.min(Math.round(bbox.xmax), width));
  const y1 = Math.max(0, Math.min(Math.round(bbox.ymax), height));
  const cropWidth = Math.max(1, x1 - x0);
  const cropHeight = Math.max(1, y1 - y0);
  const out = new Uint8Array(cropWidth * cropHeight * channels);
  for (let y = 0; y < cropHeight; y++) {
    const rowStart = ((y0 + y) * width + x0) * channels;
    out.set(data.subarray(rowStart, rowStart + cropWidth * channels), y * cropWidth * channels);
  }
  return { data: out, width: cropWidth, height: cropHeight, format, layout: input.layout };
}

// 1-D clustering of cell-center coordinates into `k` table rows (or columns).
// The sorted values are split at their k-1 widest gaps — each resulting run of
// values is one row/column, represented by its mean coordinate. Splitting at the
// widest gaps (instead of at fixed intervals) matches how table cells actually
// distribute: values within a row are tightly packed while rows are separated by
// clear gaps, so uneven row heights / column widths still cluster correctly.
// Fewer than `k` values means every value is its own cluster.
function clusterCentersByGaps(values: readonly number[], k: number): number[] {
  'worklet';
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length <= k) {
    return sorted;
  }
  // Rank the interior gaps (gap i sits between sorted[i-1] and sorted[i]) and take
  // the k-1 widest as cut points, restored to ascending order.
  const gaps = sorted.slice(1).map((value, i) => ({ at: i + 1, size: value - sorted[i]! }));
  gaps.sort((a, b) => b.size - a.size);
  const cuts = gaps
    .slice(0, k - 1)
    .map((gap) => gap.at)
    .sort((a, b) => a - b);
  // Average each [prev, cut) span into its center.
  const centers: number[] = [];
  let prev = 0;
  for (const cut of [...cuts, sorted.length]) {
    const group = sorted.slice(prev, cut);
    centers.push(group.reduce((sum, value) => sum + value, 0) / group.length);
    prev = cut;
  }
  return centers;
}

/**
 * Fills a table-structure HTML skeleton with a region's OCR lines. The grid size
 * comes from the skeleton (row count, and the widest row's cell count); each
 * line's box center is assigned to its nearest row and column cluster, so shared
 * column centers keep columns aligned. Falls back to a document-order fill when the
 * skeleton has no grid.
 *
 * Alignment is geometric only — dense rows can misplace a value, since the
 * skeleton carries no per-cell coordinates.
 * @category Typescript API
 * @param html The structure HTML skeleton (empty cells).
 * @param lines The region's OCR lines, with page-space quads.
 * @returns A `<table>` with each cell filled by its nearest-assigned text.
 */
export function fillTableCells(html: string, lines: readonly OcrDetection[]): string {
  'worklet';
  const rowCount = (html.match(/<tr>/g) ?? []).length;
  let colCount = 0;
  const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
  let row: RegExpExecArray | null;
  while ((row = rowRegex.exec(html)) !== null) {
    colCount = Math.max(colCount, (row[1]!.match(/<td/g) ?? []).length);
  }
  // No grid, or nothing to place: fill the skeleton cells in document order.
  if (rowCount === 0 || colCount === 0 || lines.length === 0) {
    let i = 0;
    return html.replace(/<td([^>]*)><\/td>/g, (_match, attrs) => {
      const text = i < lines.length ? lines[i]!.text : '';
      i++;
      return `<td${attrs}>${text}</td>`;
    });
  }

  const centersX: number[] = [];
  const centersY: number[] = [];
  for (const line of lines) {
    const box = boundsOfPoints(line.quad, 'xyxy');
    centersX.push((box.xmin + box.xmax) / 2);
    centersY.push((box.ymin + box.ymax) / 2);
  }
  const rowCenters = clusterCentersByGaps(centersY, rowCount);
  const colCenters = clusterCentersByGaps(centersX, colCount);
  const grid: string[][] = Array.from({ length: rowCenters.length }, () =>
    new Array<string>(colCenters.length).fill('')
  );
  // Assign each line to the row/column whose cluster center is nearest.
  for (let i = 0; i < lines.length; i++) {
    const r = rowCenters.reduce(
      (best, center, j) =>
        Math.abs(centersY[i]! - center) < Math.abs(centersY[i]! - rowCenters[best]!) ? j : best,
      0
    );
    const c = colCenters.reduce(
      (best, center, j) =>
        Math.abs(centersX[i]! - center) < Math.abs(centersX[i]! - colCenters[best]!) ? j : best,
      0
    );
    grid[r]![c] = `${grid[r]![c]!} ${lines[i]!.text}`.trim();
  }
  return `<table>${grid
    .map((cells) => `<tr>${cells.map((text) => `<td>${text}</td>`).join('')}</tr>`)
    .join('')}</table>`;
}
