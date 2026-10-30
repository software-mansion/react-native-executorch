/**
 * Types and text segmentation shared by the translation pipelines.
 */

/**
 * Source and target language of one translation, as ISO 639-1 codes.
 * @category NLP / Types
 */
export type TranslationLanguages = {
  /** ISO 639-1 code of the language to translate from. */
  readonly sourceLanguage: string;
  /** ISO 639-1 code of the language to translate to. */
  readonly targetLanguage: string;
};

/**
 * Translation task runner, shared by every translation pipeline.
 * @category NLP / Types
 */
export type Translator = {
  /**
   * Releases all allocated native resources.
   */
  readonly dispose: () => void;

  /**
   * Asynchronously translates text. Line breaks are kept.
   * @param text The text to translate.
   * @param languages The source and target language. A model built for one
   * language pair accepts only that pair.
   * @param onToken Optional callback fired on the RN thread with each newly
   * decoded piece of the translation.
   * @returns A promise resolving to the translated text.
   * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if the model does
   * not translate between `languages`, `RESOURCE_BUSY` if the model is in use,
   * or `RESOURCE_DISPOSED` if disposed.
   */
  readonly translate: (
    text: string,
    languages: TranslationLanguages,
    onToken?: (token: string) => void
  ) => Promise<string>;

  /**
   * Interrupts an active translation call, which returns the text translated
   * so far.
   */
  readonly translateStop: () => void;
};

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
