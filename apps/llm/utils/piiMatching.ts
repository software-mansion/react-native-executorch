import { PiiEntity } from 'react-native-executorch';

/**
 * A detected entity span pinned to a character range in the source text.
 */
export interface EntityMatch {
  start: number;
  end: number;
  label: string;
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Word-boundary-anchored search so e.g. "John" doesn't match the "John"
// inside "Johnson".
function findWordBounded(source: string, needle: string, from: number): number {
  const re = new RegExp(`\\b${escapeRegex(needle)}\\b`);
  const match = re.exec(source.slice(from));
  return match ? from + match.index : -1;
}

/**
 * Map detected entities (which carry decoded text only) onto character
 * ranges in the source text by scanning forward.
 *
 * The native runner's `text` field is the BPE-detokenized form of the
 * entity, which often differs from the source by whitespace, punctuation
 * spacing, or stripped specials. Strategy:
 *   1) Try a word-bounded match for the whole entity from the cursor onward.
 *   2) On miss, fall back to each non-trivial word from the entity text
 *      individually so we still highlight most of the span.
 *
 * Order-preserving: cursor advances after each successful match so
 * duplicate strings resolve left-to-right.
 * @param source - The full text the model was run against.
 * @param entities - Entities returned by the native runner.
 * @returns Sorted, non-overlapping char-range matches.
 */
export function matchEntities(
  source: string,
  entities: PiiEntity[]
): EntityMatch[] {
  const matches: EntityMatch[] = [];
  let cursor = 0;
  for (const e of entities) {
    if (!e.text) continue;
    const exact = findWordBounded(source, e.text, cursor);
    if (exact !== -1) {
      matches.push({
        start: exact,
        end: exact + e.text.length,
        label: e.label,
      });
      cursor = exact + e.text.length;
      continue;
    }
    const words = e.text.split(/\s+/).filter((w) => w.length > 1);
    let localCursor = cursor;
    for (const w of words) {
      const idx = findWordBounded(source, w, localCursor);
      if (idx === -1) continue;
      matches.push({ start: idx, end: idx + w.length, label: e.label });
      localCursor = idx + w.length;
    }
    if (localCursor > cursor) cursor = localCursor;
  }
  matches.sort((a, b) => a.start - b.start);
  return matches;
}

export interface Segment {
  text: string;
  label: string | null;
}

/**
 * Slice the source text into alternating plain / labeled runs based on the
 * matched entity ranges. Overlaps are dropped (the earlier match wins).
 * @param source - The full text to slice.
 * @param matches - Char-range matches from {@link matchEntities}.
 * @returns An ordered array of segments covering the entire source.
 */
export function buildSegments(
  source: string,
  matches: EntityMatch[]
): Segment[] {
  const segments: Segment[] = [];
  let pos = 0;
  for (const m of matches) {
    if (m.start < pos) continue;
    if (m.start > pos) {
      segments.push({ text: source.slice(pos, m.start), label: null });
    }
    segments.push({ text: source.slice(m.start, m.end), label: m.label });
    pos = m.end;
  }
  if (pos < source.length) {
    segments.push({ text: source.slice(pos), label: null });
  }
  return segments;
}

/**
 * Pastel color palette + stable label-to-color mapping. Same label always
 * gets the same color across renders / runs.
 */
const PALETTE = [
  '#ffd4a8',
  '#b8e1ff',
  '#d4c5f9',
  '#c3e8c3',
  '#ffe8b8',
  '#f8c6c6',
  '#e3c8a8',
  '#ff9aa2',
  '#b6e3d4',
  '#ffd6e0',
  '#cdb4db',
  '#ffc8a2',
  '#a2d2ff',
  '#bde0fe',
  '#fcd5ce',
];

export function colorForLabel(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    // eslint-disable-next-line no-bitwise
    hash = (hash * 31 + label.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length] as string;
}
