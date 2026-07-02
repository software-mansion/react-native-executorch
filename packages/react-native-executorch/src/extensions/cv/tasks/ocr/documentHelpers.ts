import type { ImageBuffer } from '../../image';
import { FORMAT_CHANNELS } from '../../ops/image';
import type { BoundingBox } from '../../ops/boxes';
import { boundsOfPoints } from '../../ops/quad';
import type { OcrDetection } from '../ocr';

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

// Groups values into `k` ordered clusters by cutting the sorted values at their
// (k-1) widest gaps, then returns each cluster's mean. Cutting at the widest gaps
// (rather than at fixed intervals) keeps dense rows/columns together.
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

// Index of the center in `centers` nearest to `value`.
function nearestIndex(value: number, centers: readonly number[]): number {
  'worklet';
  let best = 0;
  for (let i = 1; i < centers.length; i++) {
    if (Math.abs(value - centers[i]!) < Math.abs(value - centers[best]!)) {
      best = i;
    }
  }
  return best;
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
    const box = boundsOfPoints(line.quad);
    centersX.push((box.xmin + box.xmax) / 2);
    centersY.push((box.ymin + box.ymax) / 2);
  }
  const rowCenters = clusterCentersByGaps(centersY, rowCount);
  const colCenters = clusterCentersByGaps(centersX, colCount);
  const grid: string[][] = Array.from({ length: rowCenters.length }, () =>
    new Array<string>(colCenters.length).fill('')
  );
  for (let i = 0; i < lines.length; i++) {
    const r = nearestIndex(centersY[i]!, rowCenters);
    const c = nearestIndex(centersX[i]!, colCenters);
    grid[r]![c] = `${grid[r]![c]!} ${lines[i]!.text}`.trim();
  }
  return `<table>${grid
    .map((cells) => `<tr>${cells.map((text) => `<td>${text}</td>`).join('')}</tr>`)
    .join('')}</table>`;
}
