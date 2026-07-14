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

// prettier-ignore
export const SUPPORTED_LANGUAGES = [
  'ar', 'bg', 'cs', 'da', 'de', 'el', 'en', 'es', 'fi', 'fr', 'hi', 'hr',
  'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 'no', 'pl', 'pt', 'ro', 'ru',
  'sk', 'sv', 'sw', 'ta', 'th', 'tl', 'tr', 'na',
];

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
 * Normalizes and cleans raw input text using character mappings.
 * @category Utils
 * @param text The raw input text.
 * @param lang The language code.
 * @returns The preprocessed text.
 */
export function preprocessText(text: string, lang?: string): string {
  'worklet';

  let processed = text.normalize('NFKD');

  for (const [key, replacement] of Object.entries(STRING_REPLACEMENTS)) {
    processed = processed.split(key).join(replacement);
  }

  processed = processed.replace(EMOJI_PATTERN, '');
  processed = processed.replace(DUPLICATE_QUOTES_PATTERN, '$1');
  processed = processed.replace(WHITESPACE_PATTERN, ' ');
  processed = processed.trim();

  if (!ENDING_PUNCTUATION_PATTERN.test(processed)) {
    processed += '.';
  }

  if (lang && lang !== 'na') {
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      throw new Error(`preprocessText: Unsupported language: ${lang}`);
    }
    processed = `<${lang}>${processed}</${lang}>`;
  }

  return processed;
}

/**
 * Encodes preprocessed text to character unicode index ids based on
 * unicode_indexer.json.
 * @category Utils
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
 * Generates Gaussian (normal) random noise of the specified size on the worklet
 * thread using a standard Box-Muller transform.
 * @category Utils
 * @param size The number of random normal values to generate.
 * @returns The generated Float32Array.
 */
export function generateGaussianNoise(size: number): Float32Array {
  'worklet';
  const noise = new Float32Array(size);
  for (let i = 0; i < size; i += 2) {
    let u1 = 0;
    let u2 = 0;
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();

    const r = Math.sqrt(-2.0 * Math.log(u1));
    const theta = 2.0 * Math.PI * u2;

    noise[i] = r * Math.cos(theta);
    if (i + 1 < size) {
      noise[i + 1] = r * Math.sin(theta);
    }
  }
  return noise;
}
