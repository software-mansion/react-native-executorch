import type { ImageBuffer } from '../../image';
import { FORMAT_CHANNELS } from '../../ops/image';
import { boundingBoxOf, type BoundingBox } from '../../ops/boxes';
import type { OCRDetection } from '../ocr';

// Crops an axis-aligned region out of an ImageBuffer (pure pixel slice, same
// format). Used to feed a layout region (e.g. a table) to another model.
export function cropImageBuffer(input: ImageBuffer, bbox: BoundingBox<'xyxy'>): ImageBuffer {
  'worklet';
  const { data, width, height, format } = input;
  const ch = FORMAT_CHANNELS[format];
  const x0 = Math.max(0, Math.min(Math.round(bbox.xmin), width));
  const y0 = Math.max(0, Math.min(Math.round(bbox.ymin), height));
  const x1 = Math.max(0, Math.min(Math.round(bbox.xmax), width));
  const y1 = Math.max(0, Math.min(Math.round(bbox.ymax), height));
  const cw = Math.max(1, x1 - x0);
  const chh = Math.max(1, y1 - y0);
  const out = new Uint8Array(cw * chh * ch);
  for (let y = 0; y < chh; y++) {
    const srcStart = ((y0 + y) * width + x0) * ch;
    out.set(data.subarray(srcStart, srcStart + cw * ch), y * cw * ch);
  }
  return { data: out, width: cw, height: chh, format, layout: input.layout };
}

/**
 * Index of the maximum value in `arr[offset, offset+len)` (single pass, no
 * allocation). Shared by the layout / orientation / table decoders.
 * @category Typescript API
 * @param arr The array to scan.
 * @param offset The start index of the window.
 * @param len The window length.
 * @returns The index (relative to `offset`) of the maximum value.
 */
export function argmaxRange(arr: ArrayLike<number>, offset: number, len: number): number {
  'worklet';
  let idx = 0;
  let best = arr[offset]!;
  for (let i = 1; i < len; i++) {
    const v = arr[offset + i]!;
    if (v > best) {
      best = v;
      idx = i;
    }
  }
  return idx;
}

// Assigns each value to one of `k` ordered groups by cutting the sorted values at
// the (k-1) largest gaps, then returns the MEAN of each group (its center). Never
// a fixed gap, which would merge dense rows.
function splitIntoK(values: readonly number[], k: number): number[] {
  'worklet';
  const v = [...values].sort((a, b) => a - b);
  if (v.length <= k) {
    return v;
  }
  const cuts = v
    .map((x, i) => ({ i, g: i ? x - v[i - 1]! : -1 }))
    .slice(1)
    .sort((a, b) => b.g - a.g)
    .slice(0, k - 1)
    .map((o) => o.i)
    .sort((a, b) => a - b);
  const centers: number[] = [];
  let prev = 0;
  for (const cut of [...cuts, v.length]) {
    const grp = v.slice(prev, cut);
    centers.push(grp.reduce((s, x) => s + x, 0) / grp.length);
    prev = cut;
  }
  return centers;
}

// Index of the center in `cs` closest to `x`.
function nearest(x: number, cs: readonly number[]): number {
  'worklet';
  let b = 0;
  for (let j = 1; j < cs.length; j++) {
    if (Math.abs(x - cs[j]!) < Math.abs(x - cs[b]!)) {
      b = j;
    }
  }
  return b;
}

/**
 * Reconstructs a table as filled HTML from the SLANet structure skeleton and the
 * region's OCR lines. Grid size comes from the structure (`<tr>` count, max `<td>`
 * per row); box centers are split into that many rows/cols at the largest gaps and
 * each box placed in its nearest cell (global column centers keep columns aligned).
 * Falls back to a document-order fill when there is no grid.
 *
 * Geometric alignment only — dense bottom rows can misplace a value, since the
 * structure export has no cell boxes.
 * @category Typescript API
 * @param html The SLANet structure HTML skeleton (gives the grid size).
 * @param lines The table region's OCR lines (with page-space quads).
 * @returns A `<table>` with each cell filled by its nearest-assigned text.
 */
export function fillTableCells(html: string, lines: readonly OCRDetection[]): string {
  'worklet';
  // Grid size straight from the structure: rows = <tr> count, cols = widest row.
  const nRows = (html.match(/<tr>/g) ?? []).length;
  let nCols = 0;
  const trRe = /<tr>([\s\S]*?)<\/tr>/g;
  let tr: RegExpExecArray | null;
  while ((tr = trRe.exec(html)) !== null) {
    nCols = Math.max(nCols, (tr[1]!.match(/<td/g) ?? []).length);
  }
  // No grid or nothing to place: plain document-order fill of the skeleton.
  if (nRows === 0 || nCols === 0 || lines.length === 0) {
    let i = 0;
    return html.replace(/<td([^>]*)><\/td>/g, (_m, attrs) => {
      const text = i < lines.length ? lines[i]!.text : '';
      i++;
      return `<td${attrs}>${text}</td>`;
    });
  }

  const cx: number[] = [];
  const cy: number[] = [];
  for (const l of lines) {
    const b = boundingBoxOf(l.quad);
    cx.push((b.xmin + b.xmax) / 2);
    cy.push((b.ymin + b.ymax) / 2);
  }
  const rowC = splitIntoK(cy, nRows);
  const colC = splitIntoK(cx, nCols);
  const grid: string[][] = Array.from({ length: rowC.length }, () =>
    new Array<string>(colC.length).fill('')
  );
  for (let i = 0; i < lines.length; i++) {
    const r = nearest(cy[i]!, rowC);
    const c = nearest(cx[i]!, colC);
    grid[r]![c] = `${grid[r]![c]!} ${lines[i]!.text}`.trim();
  }
  return `<table>${grid
    .map((row) => `<tr>${row.map((t) => `<td>${t}</td>`).join('')}</tr>`)
    .join('')}</table>`;
}
