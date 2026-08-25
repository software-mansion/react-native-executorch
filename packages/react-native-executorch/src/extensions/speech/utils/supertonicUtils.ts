/**
 * Text normalization, chunk formatting, and voice style parsing utilities for
 * Supertonic TTS.
 * @module Speech/Utils/Supertonic
 */

import { RnExecuTorchError } from '../../../core/error';
/**
 * Ported from supertone-inc/supertonic (MIT License)
 * Source: https://github.com/supertone-inc/supertonic
 *
 * Copyright (c) 2024 Supertone Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * List of ISO language codes supported by Supertonic 3 for text synthesis conditioning.
 * @category Speech / Constants
 */
// prettier-ignore
export const SUPERTONIC_SUPPORTED_LANGUAGES = [
  'ar', 'bg', 'cs', 'da', 'de', 'el', 'en', 'es', 'fi', 'fr', 'hi', 'hr',
  'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 'no', 'pl', 'pt', 'ro', 'ru',
  'sk', 'sv', 'sw', 'ta', 'th', 'tl', 'tr', 'na',
] as const;

/**
 * Supported Supertonic 3 ISO language code.
 * @category Speech / Types
 */
export type SupertonicLanguage = (typeof SUPERTONIC_SUPPORTED_LANGUAGES)[number];

// prettier-ignore
const EMOJI_PATTERN = new RegExp(
  '[' +
    '\\u{1f600}-\\u{1f64f}' + // Emoticons
    '\\u{1f300}-\\u{1f5ff}' + // Misc Symbols and Pictographs
    '\\u{1f680}-\\u{1f6ff}' + // Transport and Map Symbols
    '\\u{1f700}-\\u{1f77f}' + // Alchemical Symbols
    '\\u{1f780}-\\u{1f7ff}' + // Geometric Shapes Extended
    '\\u{1f800}-\\u{1f8ff}' + // Supplemental Arrows-C
    '\\u{1f900}-\\u{1f9ff}' + // Supplemental Symbols and Pictographs
    '\\u{1fa00}-\\u{1fa6f}' + // Chess Symbols / Symbols and Pictographs Extended-A
    '\\u{1fa70}-\\u{1faff}' + // Symbols and Pictographs Extended-A (cont.)
    '\\u{2600}-\\u{27ff}'   + // Misc Symbols / Dingbats
    '\\u{1f1e6}-\\u{1f1ff}' + // Flags (Regional Indicator Symbols)
  ']',
  'gu'
);

// prettier-ignore
const STRING_REPLACEMENTS: Record<string, string> = {
  // Symbols
  '–': '-', '‑': '-', '—': '-', '¯': ' ', '_': ' ',
  '“': '"', '”': '"', '‘': "'", '’': "'", '´': "'", '`': "'",
  '[': ' ', ']': ' ', '|': ' ', '/': ' ', '#': ' ',
  '→': ' ', '←': ' ',
  // Special symbols (removed)
  '♥': '', '☆': '', '♡': '', '©': '', '\\': '',
  // Abbreviations
  '@': ' at ',
  'e.g.,': 'for example, ',
  'i.e.,': 'that is, ',
  // Punctuation spacing corrections (run after symbol normalization)
  ' ,': ',',
  ' .': '.',
  ' !': '!',
  ' ?': '?',
  ' ;': ';',
  ' :': ':',
  " '": "'",
};

const WHITESPACE_PATTERN = /\s+/g;
const DUPLICATE_QUOTES_PATTERN = /([`'""])\1+/g;
const ENDING_PUNCTUATION_PATTERN = /[.!?;:,'")\]}…。」』】〉》›»]$/;

/**
 * Normalizes unicode, replaces symbols/abbreviations, strips emojis, and cleans
 * whitespace. Should be run on full input text prior to chunk partitioning.
 * @category Speech / Functions
 * @param text The raw input text.
 * @returns The normalized clean text.
 */
export function cleanText(text: string): string {
  'worklet';

  let processed = text.normalize('NFKD');

  for (const [key, replacement] of Object.entries(STRING_REPLACEMENTS)) {
    processed = processed.split(key).join(replacement);
  }

  return processed
    .replace(EMOJI_PATTERN, '')
    .replace(DUPLICATE_QUOTES_PATTERN, '$1')
    .replace(WHITESPACE_PATTERN, ' ')
    .trim();
}

/**
 * Formats a single text chunk by ensuring ending punctuation and wrapping with
 * language tags. Should be run on individual partitioned text chunks.
 * @category Speech / Functions
 * @param chunk The partitioned text chunk.
 * @param lang The language code.
 * @returns The formatted chunk ready for model input.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if `lang` is
 * unsupported.
 */
export function formatChunk(chunk: string, lang?: string): string {
  'worklet';

  let processed = chunk.trim();

  if (!ENDING_PUNCTUATION_PATTERN.test(processed)) {
    processed += '.';
  }

  if (lang && lang !== 'na') {
    if (!SUPERTONIC_SUPPORTED_LANGUAGES.includes(lang as SupertonicLanguage)) {
      throw RnExecuTorchError('INVALID_ARGUMENT', `formatChunk: Unsupported language: ${lang}`);
    }
    processed = `<${lang}>${processed}</${lang}>`;
  }

  return processed;
}

/**
 * Convenience wrapper combining {@link cleanText} and {@link formatChunk}.
 * @category Speech / Functions
 * @param text The raw input text.
 * @param lang The language code.
 * @returns The preprocessed text.
 */
export function preprocessText(text: string, lang?: string): string {
  'worklet';
  return formatChunk(cleanText(text), lang);
}

/**
 * Encodes preprocessed text to character unicode index ids based on
 * unicode_indexer.json.
 * @category Speech / Functions
 * @param text The preprocessed text.
 * @param indexer The unicode indexer character mapping array.
 * @returns BigInt64Array of character IDs.
 */
export function encodeText(text: string, indexer: readonly number[]): BigInt64Array {
  'worklet';
  const ids = new BigInt64Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const id = code < indexer.length ? indexer[code]! : -1;
    ids[i] = BigInt(id === -1 ? 0 : id);
  }
  return ids;
}

/**
 * Parsed voice style tensors required by Supertonic 3 for style conditioning.
 * @category Speech / Types
 */
export type SupertonicVoiceStyle = {
  /** Text-to-latent style embedding tensor data of shape [1, 50, 256] (12,800 floats). */
  readonly styleTtl: Float32Array;
  /** Duration predictor style embedding tensor data of shape [1, 8, 16] (128 floats). */
  readonly styleDp: Float32Array;
};

/**
 * Parses raw JSON voice style object data into Float32Arrays.
 * @category Speech / Functions
 * @param json The parsed JSON voice style object.
 * @returns Parsed SupertonicVoiceStyle containing styleTtl and styleDp Float32Arrays.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if the voice style JSON
 * format is invalid or missing required tensor data.
 */
export function parseVoiceStyle(json: any): SupertonicVoiceStyle {
  'worklet';
  if (!json?.style_ttl?.data || !json?.style_dp?.data) {
    throw RnExecuTorchError('LOAD_FAILED', 'parseVoiceStyle: Invalid voice style JSON format.');
  }
  return {
    styleDp: new Float32Array((json.style_dp.data as number[][][]).flat(2)),
    styleTtl: new Float32Array((json.style_ttl.data as number[][][]).flat(2)),
  };
}
