// OCR box geometry: reading order for detected quads. Pure functions — no
// tensors, no model. Worklet source order matters (callee above caller).

import { boundsOfPoints, type Quad } from '../../ops/quad';

// A gutter must be at least this fraction of the content width to split columns;
// two boxes share a line when their vertical extents overlap by at least this
// fraction of the shorter box's height.
const COLUMN_GAP_FRACTION = 0.06;
const LINE_OVERLAP_FRACTION = 0.3;

// Reorders `{quad}` items the way a human reads the page: leftmost column
// first (top to bottom), then the next column. Detectors emit boxes in
// arbitrary order, so detections and assembled blocks are ordered through this.
export function orderByReadingOrder<T extends { quad: Quad }>(items: T[]): T[] {
  'worklet';
  const count = items.length;
  if (count <= 1) {
    return items;
  }

  const boxes = items.map((it) => boundsOfPoints(it.quad, 'xyxy'));

  // A vertical gap between boxes only counts as a column gutter when it is
  // reasonably wide relative to the page content (else word spacing would
  // split columns everywhere).
  let minX = Infinity;
  let maxX = -Infinity;
  for (const box of boxes) {
    if (box.xmin < minX) minX = box.xmin;
    if (box.xmax > maxX) maxX = box.xmax;
  }
  const minGap = COLUMN_GAP_FRACTION * Math.max(1, maxX - minX);

  // Find the gutters: walk every box's left/right edge in x order, keeping a
  // running count of how many boxes overlap the current x. Count 0 means no
  // box occupies this x — when such an empty stretch is wider than minGap,
  // cut a column boundary at its midpoint.
  const edges: { x: number; delta: number }[] = [];
  for (const box of boxes) {
    edges.push({ x: box.xmin, delta: 1 });
    edges.push({ x: box.xmax, delta: -1 });
  }
  // At the same x, process a box's left edge before another's right edge —
  // two boxes that exactly touch must not look like an empty stretch.
  edges.sort((a, b) => a.x - b.x || b.delta - a.delta);
  const cuts: number[] = [];
  let coverage = 0;
  // Seed to the first (leftmost) edge, not 0, so a page whose leftmost box starts
  // well inside a left margin doesn't read that margin as an empty column gutter.
  let gutterStart = edges.length > 0 ? edges[0]!.x : 0;
  for (const edge of edges) {
    const before = coverage;
    coverage += edge.delta;
    if (before > 0 && coverage === 0) {
      gutterStart = edge.x;
    } else if (before === 0 && coverage > 0 && edge.x - gutterStart >= minGap) {
      cuts.push((gutterStart + edge.x) / 2);
    }
  }

  // A box belongs to column k when exactly k cuts lie left of its center.
  const columns: number[][] = Array.from({ length: cuts.length + 1 }, () => []);
  for (let i = 0; i < count; i++) {
    const centerX = (boxes[i]!.xmin + boxes[i]!.xmax) / 2;
    let column = 0;
    for (const cut of cuts) {
      if (centerX > cut) column++;
    }
    columns[column]!.push(i);
  }

  // Inside each column: boxes whose vertical extents overlap enough sit on the
  // same text line. Read lines top to bottom, and boxes within a line left to
  // right.
  const order: number[] = [];
  for (const column of columns) {
    column.sort((a, b) => boxes[a]!.ymin - boxes[b]!.ymin);
    const lines: { items: number[]; ymin: number; ymax: number }[] = [];
    for (const i of column) {
      const box = boxes[i]!;
      let placed = false;
      for (const line of lines) {
        // Overlap is measured against the SHORTER of the two heights, so a
        // small box beside a tall one still joins its line.
        const overlap = Math.min(line.ymax, box.ymax) - Math.max(line.ymin, box.ymin);
        const minHeight = Math.min(line.ymax - line.ymin, box.ymax - box.ymin);
        if (overlap >= LINE_OVERLAP_FRACTION * Math.max(1, minHeight)) {
          line.items.push(i);
          line.ymin = Math.min(line.ymin, box.ymin);
          line.ymax = Math.max(line.ymax, box.ymax);
          placed = true;
          break;
        }
      }
      if (!placed) {
        lines.push({ items: [i], ymin: box.ymin, ymax: box.ymax });
      }
    }
    lines.sort((a, b) => a.ymin - b.ymin);
    for (const line of lines) {
      line.items.sort(
        (a, b) => boxes[a]!.xmin + boxes[a]!.xmax - (boxes[b]!.xmin + boxes[b]!.xmax)
      );
      order.push(...line.items);
    }
  }
  return order.map((i) => items[i]!);
}
