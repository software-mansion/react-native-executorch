/**
 * Text segmentation shared by the translation pipelines.
 */

/**
 * A sentence and the whitespace that followed it in the source text.
 * @category NLP / Types
 */
export type SentenceSegment = {
  /** The sentence, including its closing punctuation. */
  readonly sentence: string;
  /** The line breaks that followed it, or a single space if there were none. */
  readonly separator: string;
};

/**
 * Splits text into sentences for sentence-level translation models. Line
 * breaks are kept as separators so the translation keeps the source layout.
 * @category NLP / Functions
 * @param text The text to split.
 * @returns The sentences in order, each with the separator that followed it.
 * The last separator is empty.
 */
export function splitSentences(text: string): SentenceSegment[] {
  'worklet';
  const segments: SentenceSegment[] = [];
  // Closing punctuation (optionally followed by closing quotes or brackets) and
  // the whitespace after it, or a run of line breaks. Built per call: a regex
  // literal at module scope cannot be captured by a worklet.
  const boundary = /([.!?…。！？]+["'”’»)\]]*)(\s+)|(\n+)/g;
  let start = 0;
  let match: RegExpExecArray | null;
  while ((match = boundary.exec(text)) !== null) {
    const end = match.index + (match[1]?.length ?? 0);
    const whitespace = match[2] ?? match[3]!;
    const breaks = whitespace.replace(/[^\n]/g, '');
    segments.push({ sentence: text.slice(start, end), separator: breaks || ' ' });
    start = match.index + match[0].length;
  }
  segments.push({ sentence: text.slice(start), separator: '' });
  return segments;
}
