import type { WorkletRuntime } from 'react-native-worklets';

import { tensor, type Tensor } from '../../../../core/tensor';
import { loadModel, type Model } from '../../../../core/model';
import { validateSpec, method, f32 } from '../../../../core/schema';
import { wrapAsync } from '../../../../core/runtime';

import { IMAGENET_NORM } from '../../../../constants';
import type { ImageFormat } from '../../image';
import { FORMAT_CHANNELS, warpByGrid } from '../../ops/image';
import { boundsOfPoints } from '../../ops/quad';
import { createImagePreprocessor } from '../preprocessing';
import type { OcrDetection } from './engine';

/** A detected page orientation: clockwise rotation and classifier confidence `[0,1]`. */
export type Orientation = {
  readonly rotationCW: 0 | 90 | 180 | 270;
  readonly confidence: number;
};

/**
 * Table-structure recognition parameters: `structureVocab` maps a token id to its
 * HTML fragment, `eosTokenId` ends decoding, `maxSteps` caps it.
 * @category Types
 */
export type TableConfig = {
  readonly structureVocab: readonly string[];
  readonly eosTokenId: number;
  readonly maxSteps: number;
};

/**
 * Config for the fused document-helpers model (orientation + dewarp + table
 * structure in one file). Every capability is opt-in; `orientation`/`dewarp` are
 * defaults for the per-run flags of the same name.
 * @category Types
 */
export type DocumentModelsConfig = {
  readonly modelPath: string;
  readonly orientation?: boolean;
  readonly dewarp?: boolean;
  readonly orientationMinConfidence?: number;
  /**
   * Decline the dewarp when it keeps less than this fraction of the source
   * image variance (a bad grid can collapse a page without clear borders to near-blank).
   * Default 0.5; lower = more permissive.
   */
  readonly dewarpMinVarianceRatio?: number;
  readonly table?: TableConfig;
};

type ImagePreprocessor = ReturnType<typeof createImagePreprocessor>;

// Index of the max value in `arr`. Shared by orientation + table.
function argmax(arr: ArrayLike<number>): number {
  'worklet';
  let index = 0;
  let best = arr[0]!;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i]! > best) {
      best = arr[i]!;
      index = i;
    }
  }
  return index;
}

// ===== Orientation ===========================================================

function detectPageOrientation(
  model: Model,
  preprocessor: ImagePreprocessor,
  tOri: Tensor,
  oriBuf: Float32Array,
  page: Tensor,
  format: ImageFormat
): Orientation {
  'worklet';
  const tInput = preprocessor.processTensor(page, format);
  model.execute('orientation', [tInput], [tOri]);
  tOri.getData(oriBuf);
  const cls = argmax(oriBuf);
  const best = oriBuf[cls]!;
  let sumExp = 0;
  for (let i = 0; i < oriBuf.length; i++) {
    sumExp += Math.exp(oriBuf[i]! - best);
  }
  return { rotationCW: (cls * 90) as 0 | 90 | 180 | 270, confidence: 1 / sumExp };
}

// ===== Dewarp ================================================================

// Default for DocumentModelsConfig.dewarpMinVarianceRatio: a grid estimated on a
// page without clear borders can collapse the output to near-blank, so decline the warp
// when it keeps less than this fraction of the source variance.
const DEFAULT_DEWARP_MIN_VARIANCE_RATIO = 0.5;
const VARIANCE_SAMPLE_STRIDE = 31;

// Variance of one channel, sampled sparsely — a cheap proxy for image content.
function pixelVariance(data: Uint8Array, channels: number): number {
  'worklet';
  let n = 0;
  let sum = 0;
  let sumSq = 0;
  const step = channels * VARIANCE_SAMPLE_STRIDE;
  for (let i = 0; i < data.length; i += step) {
    sum += data[i]!;
    sumSq += data[i]! * data[i]!;
    n++;
  }
  if (n === 0) {
    return 0;
  }
  return sumSq / n - (sum / n) * (sum / n);
}

// Estimates the sampling field and applies it (cv::remap). Returns the input
// `page` unchanged when the warp is declined; caller owns whichever is returned.
function dewarpPage(
  model: Model,
  preprocessor: ImagePreprocessor,
  tGrid: Tensor,
  page: Tensor,
  format: ImageFormat,
  minVarianceRatio: number
): Tensor {
  'worklet';
  const tInput = preprocessor.processTensor(page, format);
  model.execute('dewarp', [tInput], [tGrid]);
  const h = page.shape[0]!;
  const w = page.shape[1]!;
  const ch = FORMAT_CHANNELS[format];
  const tDst = tensor('uint8', [h, w, ch]);
  try {
    warpByGrid(page, tGrid, tDst);
    // Known cost: materializes both full frames to JS just to sample ~3% of one
    // channel for the variance ratio — ~70MB of copies on a 12MP page. Fine while
    // dewarp is opt-in and rare; move the variance into a native op if it gets hot.
    const out = new Uint8Array(w * h * ch);
    const src = new Uint8Array(w * h * ch);
    tDst.getData(out);
    page.getData(src);
    if (pixelVariance(out, ch) < minVarianceRatio * pixelVariance(src, ch)) {
      tDst.dispose();
      return page;
    }
    return tDst;
  } catch (e) {
    tDst.dispose(); // caller can't free it on the throw path
    throw e;
  }
}

// ===== Table structure =======================================================

/** The table decoder's pre-allocated tensors and staging buffers. */
type TableDecodeState = {
  readonly tFeatures: Tensor;
  readonly tHidden: Tensor;
  readonly tOnehot: Tensor;
  readonly tProbs: Tensor;
  readonly tNewHidden: Tensor;
  readonly zeroHidden: Float32Array;
  readonly zeroVocab: Float32Array;
  readonly onehotBuf: Float32Array;
  readonly probsBuf: Float32Array;
};

// Decodes the table's `<tr>/<td>` HTML skeleton token-by-token; cell text is
// filled in later from the region's OCR lines (fillTableCells).
function recognizeTableStructure(
  model: Model,
  preprocessor: ImagePreprocessor,
  state: TableDecodeState,
  tableConfig: TableConfig,
  page: Tensor,
  format: ImageFormat
): string {
  'worklet';
  const { structureVocab, eosTokenId, maxSteps } = tableConfig;
  const { tFeatures, tHidden, tOnehot, tProbs, tNewHidden } = state;
  const tInput = preprocessor.processTensor(page, format);
  model.execute('table_encode', [tInput], [tFeatures]);
  tHidden.setData(state.zeroHidden);
  // First step feeds an all-zero one-hot, not a 'sos' (index-0) one-hot: the
  // exported decoder embeds its own start token, so the first real input is the
  // zero vector. (Validated on-device — a 'sos' one-hot here would offset every
  // decoded token by one. Revisit if a re-export changes the decoder's start.)
  tOnehot.setData(state.zeroVocab);
  let html = '';
  for (let step = 0; step < maxSteps; step++) {
    model.execute('table_decode_step', [tFeatures, tHidden, tOnehot], [tProbs, tNewHidden]);
    tProbs.getData(state.probsBuf);
    const tok = argmax(state.probsBuf);
    if (tok === eosTokenId) {
      break;
    }
    // Drop the reserved start/end token range from the assembled skeleton.
    if (tok > 0 && tok < eosTokenId && tok < structureVocab.length) {
      html += structureVocab[tok]!;
    }
    tNewHidden.copyTo(tHidden);
    state.onehotBuf.fill(0);
    state.onehotBuf[tok] = 1;
    tOnehot.setData(state.onehotBuf);
  }
  return html;
}

// Clusters 1-D values into `k` groups at the k-1 widest gaps, each reduced to its
// mean — matches how table cells distribute (tight within a row/col, gaps between).
function clusterByGaps(values: readonly number[], k: number): number[] {
  'worklet';
  if (k < 1) {
    return [];
  }
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length <= k) {
    return sorted;
  }
  const gaps = sorted.slice(1).map((value, i) => ({ at: i + 1, size: value - sorted[i]! }));
  gaps.sort((a, b) => b.size - a.size);
  const cuts = gaps
    .slice(0, k - 1)
    .map((gap) => gap.at)
    .sort((a, b) => a - b);
  const centers: number[] = [];
  let prev = 0;
  for (const cut of [...cuts, sorted.length]) {
    const group = sorted.slice(prev, cut);
    centers.push(group.reduce((sum, value) => sum + value, 0) / group.length);
    prev = cut;
  }
  return centers;
}

// Fills a table skeleton's cells with a region's OCR lines, assigning each line's
// box center to its nearest row/column cluster (document-order fallback if no grid).
// Known limit: a line whose center falls inside a rowspan's vertical extent lands
// on a row where that column has no <td> (the span occupies it), so its text is
// dropped — occupancy is tracked, content routing into spanned cells is not.
export function fillTableCells(html: string, lines: readonly OcrDetection[]): string {
  'worklet';
  const rowCount = (html.match(/<tr>/g) ?? []).length;
  let colCount = 0;
  const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
  let row: RegExpExecArray | null;
  while ((row = rowRegex.exec(html)) !== null) {
    let cols = 0;
    for (const td of row[1]!.match(/<td[^>]*>/g) ?? []) {
      cols += Number((td.match(/colspan="(\d+)"/) ?? [])[1] ?? 1);
    }
    colCount = Math.max(colCount, cols);
  }
  if (rowCount === 0 || colCount === 0 || lines.length === 0) {
    let cell = 0;
    const texts = lines.map((l) => l.text);
    // Matches empty `<td…></td>` cells only — assumes the decoder emits the fused
    // empty-cell token, which the current SLANet vocab does. A vocab that emitted
    // pre-filled cells would need this widened.
    return html.replace(/<td([^>]*)><\/td>/g, (_match, attrs) => {
      const text = cell < texts.length ? texts[cell]! : '';
      cell++;
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
  const rowCenters = clusterByGaps(centersY, rowCount);
  const colCenters = clusterByGaps(centersX, colCount);
  const grid: string[][] = Array.from({ length: rowCenters.length }, () =>
    new Array<string>(colCenters.length).fill('')
  );
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

  const occupied: boolean[][] = [];
  let rowIdx = -1;
  return html.replace(/<tr>|<td([^>]*)><\/td>/g, (match, attrs) => {
    if (attrs === undefined) {
      rowIdx++;
      return match;
    }
    let c = 0;
    while (occupied[rowIdx]?.[c]) {
      c++;
    }
    const colspan = Number((attrs.match(/colspan="(\d+)"/) ?? [])[1] ?? 1);
    const rowspan = Number((attrs.match(/rowspan="(\d+)"/) ?? [])[1] ?? 1);
    for (let dr = 0; dr < rowspan; dr++) {
      const rr = rowIdx + dr;
      occupied[rr] ??= [];
      for (let dc = 0; dc < colspan; dc++) {
        occupied[rr]![c + dc] = true;
      }
    }
    return `<td${attrs}>${grid[rowIdx]?.[c] ?? ''}</td>`;
  });
}

// ===== Contract + factory ====================================================

// The orientation head's class count: [0°, 90°, 180°, 270°] clockwise.
const ORIENTATION_CLASSES = 4;

// The tensor shapes the constructor pre-allocates from, grouped per model.
type DocumentModelsShapes = {
  readonly orientation: { readonly input: number[]; readonly output: number[] };
  readonly dewarp: { readonly input: number[]; readonly grid: number[] };
  readonly table?: {
    readonly input: number[];
    readonly features: number[];
    readonly hidden: number[];
    readonly probs: number[];
  };
};

// Validates orientation + dewarp always, and the table methods only when a table
// vocab size is given. Every method of this model is exported at a fixed size, so
// each dimension binds to a static symbol; reusing a symbol across methods is what
// enforces the model's internal agreements (the decoder's one-hot input vocab
// equals its output vocab, its hidden state round-trips, and it consumes exactly
// the features the encoder produces). Returns the shapes to pre-allocate from.
function resolveDocumentModelsShapes(model: Model, tableVocabSize?: number): DocumentModelsShapes {
  const imageMethods = {
    // 4 orientation classes, in [0°, 90°, 180°, 270°] order.
    ...method('orientation', [f32(1, 3, 'oriH', 'oriW')], [f32(1, 4)]),
    ...method('dewarp', [f32(1, 3, 'dewH', 'dewW')], [f32(1, 2, 'gridH', 'gridW')]),
  };
  if (tableVocabSize === undefined) {
    const { dims } = validateSpec(model.schema, { default: imageMethods });
    const [oriH, oriW, dewH, dewW, gridH, gridW] = dims.constant(
      'oriH',
      'oriW',
      'dewH',
      'dewW',
      'gridH',
      'gridW'
    );
    return {
      orientation: { input: [1, 3, oriH, oriW], output: [1, ORIENTATION_CLASSES] },
      dewarp: { input: [1, 3, dewH, dewW], grid: [1, 2, gridH, gridW] },
    };
  }

  const { dims } = validateSpec(model.schema, {
    default: {
      ...imageMethods,
      ...method('table_encode', [f32(1, 3, 'tabH', 'tabW')], [f32(1, 'feat', 'featDim')]),
      ...method(
        'table_decode_step',
        [f32(1, 'feat', 'featDim'), f32(1, 'hidden'), f32(1, tableVocabSize)],
        [f32(1, tableVocabSize), f32(1, 'hidden')]
      ),
    },
  });
  const [oriH, oriW, dewH, dewW, gridH, gridW, tabH, tabW, feat, featDim, hidden] = dims.constant(
    'oriH',
    'oriW',
    'dewH',
    'dewW',
    'gridH',
    'gridW',
    'tabH',
    'tabW',
    'feat',
    'featDim',
    'hidden'
  );
  return {
    orientation: { input: [1, 3, oriH, oriW], output: [1, ORIENTATION_CLASSES] },
    dewarp: { input: [1, 3, dewH, dewW], grid: [1, 2, gridH, gridW] },
    table: {
      input: [1, 3, tabH, tabW],
      features: [1, feat, featDim],
      hidden: [1, hidden],
      probs: [1, tableVocabSize],
    },
  };
}

// Creates the document-helpers runner from one model file, loaded once. Each
// capability is wired only when enabled in `config`. Internal to the OCR task.
export async function createDocumentModels(
  config: DocumentModelsConfig,
  runtime?: WorkletRuntime
): Promise<{
  dispose: () => void;
  detectOrientationWorklet: (page: Tensor, format: ImageFormat) => Orientation;
  dewarpWorklet: (page: Tensor, format: ImageFormat) => Tensor;
  recognizeTableWorklet: (page: Tensor, format: ImageFormat) => string;
}> {
  const { modelPath, table } = config;
  const dewarpMinVarianceRatio = config.dewarpMinVarianceRatio ?? DEFAULT_DEWARP_MIN_VARIANCE_RATIO;
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  // Track each artifact as it's built so the catch can dispose them all on a
  // mid-sequence failure (no native leak on a bad config).
  const created: { dispose: () => void }[] = [];
  try {
    const s = resolveDocumentModelsShapes(model, table?.structureVocab.length);

    // Orientation + dewarp are always available (their methods are always present).
    const orientationPreprocessor = createImagePreprocessor(
      { resizeMode: 'stretch', interpolation: 'linear', normalizeOpts: IMAGENET_NORM },
      s.orientation.input
    );
    created.push(orientationPreprocessor);
    const dewarpPreprocessor = createImagePreprocessor(
      { resizeMode: 'stretch', interpolation: 'linear', normalizeOpts: { alpha: 1 / 255, beta: 0 } },
      s.dewarp.input
    );
    created.push(dewarpPreprocessor);
    const tOri = tensor('float32', s.orientation.output);
    created.push(tOri);
    const tGrid = tensor('float32', s.dewarp.grid);
    created.push(tGrid);
    const oriBuf = new Float32Array(s.orientation.output[1]!);

    let tablePreprocessor: ImagePreprocessor | null = null;
    let decodeState: TableDecodeState | null = null;
    if (table && s.table) {
      tablePreprocessor = createImagePreprocessor(
        { resizeMode: 'stretch', interpolation: 'linear', normalizeOpts: IMAGENET_NORM },
        s.table.input
      );
      created.push(tablePreprocessor);
      const tensors = [
        tensor('float32', s.table.features),
        tensor('float32', s.table.hidden),
        tensor('float32', s.table.probs),
        tensor('float32', s.table.probs),
        tensor('float32', s.table.hidden),
      ] as const;
      tensors.forEach((t) => created.push(t));
      const [tFeatures, tHidden, tOnehot, tProbs, tNewHidden] = tensors;
      const hidLen = s.table.hidden[1]!;
      const vocabLen = s.table.probs[1]!;
      decodeState = {
        tFeatures,
        tHidden,
        tOnehot,
        tProbs,
        tNewHidden,
        zeroHidden: new Float32Array(hidLen),
        zeroVocab: new Float32Array(vocabLen),
        onehotBuf: new Float32Array(vocabLen),
        probsBuf: new Float32Array(vocabLen),
      };
    }

    const dispose = () => {
      created.forEach((c) => c.dispose());
      model.dispose();
    };

    // Thin executor bindings — logic lives in the top-level worklets above.
    const detectOrientationWorklet = (page: Tensor, format: ImageFormat): Orientation => {
      'worklet';
      return detectPageOrientation(model, orientationPreprocessor, tOri, oriBuf, page, format);
    };
    const dewarpWorklet = (page: Tensor, format: ImageFormat): Tensor => {
      'worklet';
      return dewarpPage(model, dewarpPreprocessor, tGrid, page, format, dewarpMinVarianceRatio);
    };
    const recognizeTableWorklet = (page: Tensor, format: ImageFormat): string => {
      'worklet';
      if (!tablePreprocessor || !decodeState || !table) {
        throw new Error('DocumentModels: table recognition was not configured.');
      }
      return recognizeTableStructure(model, tablePreprocessor, decodeState, table, page, format);
    };

    return { dispose, detectOrientationWorklet, dewarpWorklet, recognizeTableWorklet };
  } catch (e) {
    created.forEach((c) => c.dispose());
    model.dispose();
    throw e;
  }
}
