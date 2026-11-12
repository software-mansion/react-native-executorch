/**
 * Text preparation, length estimate, and post-processing utilities for Reverb.
 */

import { Verbalizer, type LanguageHandle } from 'verbalis/core';
import { language as de } from 'verbalis/de';
import { language as en } from 'verbalis/en';
import { language as es } from 'verbalis/es';
import { language as fr } from 'verbalis/fr';
import { language as it } from 'verbalis/it';
import { language as pl } from 'verbalis/pl';
import { language as pt } from 'verbalis/pt';

import { RnExecuTorchError } from '../../../core/error';
import type { ReverbLanguage, ReverbVoice } from '../tasks/reverbTextToSpeech';

const BLIP_WINDOWS = 12; // an edge sound of at most 120 ms is a codec burst
const SOUND_GAP_WINDOWS = 20; // loud windows over 200 ms apart are separate sounds

const VERBALIS_LANGUAGES: Record<ReverbLanguage, () => LanguageHandle> = {
  de,
  en,
  es,
  fr,
  it,
  pl,
  pt,
};
const verbalizers: Partial<Record<ReverbLanguage, Verbalizer>> = {};

/**
 * Parses a voice file's JSON: `{ codes, transcript, language }`, the codes as
 * `8 × frames` integers, row-major.
 * @param json The parsed JSON.
 * @returns The voice.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` on a missing or
 * mistyped field.
 */
export function parseVoice(json: any): ReverbVoice {
  const { codes, transcript, language } = json ?? {};
  const valid =
    Array.isArray(codes) &&
    codes.every((code) => Number.isInteger(code)) &&
    typeof transcript === 'string' &&
    typeof language === 'string';
  if (!valid) {
    throw RnExecuTorchError('LOAD_FAILED', 'parseVoice: Invalid voice JSON format.');
  }
  return {
    codes: BigInt64Array.from(codes as number[], BigInt),
    transcript,
    language: language as ReverbLanguage,
  };
}

/**
 * Writes text the way it is read aloud with Verbalis: numbers, symbols, and
 * abbreviations as words, and quotes, dashes, ellipses, and spaces in the forms
 * Reverb was trained on. JS thread only.
 * @param text The text.
 * @param language The text's language.
 * @returns The prepared text.
 */
export function prepareText(text: string, language: ReverbLanguage): string {
  const verbalizer = (verbalizers[language] ??= new Verbalizer(VERBALIS_LANGUAGES[language]()));
  return verbalizer.process(text);
}

/**
 * The backbone's prompt: the text's language, then the voice's transcript and
 * the text.
 * @param language The text's language.
 * @param transcript The voice's transcript.
 * @param text The text to speak.
 * @returns The prompt.
 */
export function buildPrompt(language: ReverbLanguage, transcript: string, text: string): string {
  return (
    `<|denoise|><|lang_start|>${language}<|lang_end|><|instruct_start|>None<|instruct_end|>` +
    `<|text_start|>${transcript} ${text}<|text_end|>`
  );
}

// Spoken weight by Unicode class: spaces, marks, punctuation and symbols, digits, the rest.
function spokenWeight(text: string): number {
  'worklet';
  let weight = 0;
  for (const char of text) {
    if (/\p{Z}/u.test(char)) weight += 0.2;
    else if (/\p{M}/u.test(char)) weight += 0;
    else if (/[\p{P}\p{S}]/u.test(char)) weight += 0.5;
    else if (/\p{N}/u.test(char)) weight += 3.5;
    else weight += 1;
  }
  return weight;
}

/**
 * Estimates the codec frames (25 per second) it takes to speak `text` at a
 * reference clip's pace, as Echo's `estimate_frames` does.
 * @category Speech / Functions
 * @param text The text to speak.
 * @param referenceText The reference clip's transcript.
 * @param referenceFrames The reference clip's length in frames.
 * @returns The estimate, at least 1.
 */
export function estimateTargetFrames(
  text: string,
  referenceText: string,
  referenceFrames: number
): number {
  'worklet';
  let frames = (spokenWeight(text) / Math.max(spokenWeight(referenceText), 1)) * referenceFrames;
  if (frames < 50) frames = 50 * Math.pow(frames / 50, 1 / 3); // short texts get relatively more time
  return Math.max(1, Math.floor(frames));
}

/**
 * Rounds half to even, like Python's `round`.
 * @param value The value.
 * @returns The rounded value.
 */
export function roundHalfEven(value: number): number {
  'worklet';
  const rounded = Math.round(value);
  return rounded - value === 0.5 && rounded % 2 !== 0 ? rounded - 1 : rounded;
}

/**
 * Trims silent edges like Voice Studio: in 10 ms windows, dropping an isolated
 * edge sound of at most 120 ms.
 * @param audio The audio.
 * @param sampleRate Its sampling rate in Hz.
 * @param threshold Level in dBFS below which a window is silent.
 * @param keep Seconds of silence kept at each edge.
 * @returns A view of `audio` without the silent edges, or `audio` if all silent.
 */
export function trimSilence(
  audio: Float32Array,
  sampleRate: number,
  threshold: number,
  keep: number
): Float32Array {
  'worklet';
  const window = Math.floor(sampleRate / 100);
  const windows = Math.floor(audio.length / window);
  const sounds: { first: number; last: number; loud: number }[] = [];
  for (let w = 0; w < windows; w++) {
    let energy = 0;
    for (let i = w * window; i < (w + 1) * window; i++) {
      const sample = audio[i]!;
      energy += sample * sample; // `** 2` makes this loop 2.5x slower in Hermes
    }
    if (20 * Math.log10(Math.sqrt(energy / window) + 1e-10) < threshold) continue;
    const sound = sounds[sounds.length - 1];
    if (sound && w - sound.last <= SOUND_GAP_WINDOWS) {
      sound.last = w;
      sound.loud++;
    } else {
      sounds.push({ first: w, last: w, loud: 1 });
    }
  }
  if (sounds.length === 0) return audio;

  if (sounds.length > 1 && sounds[0]!.loud <= BLIP_WINDOWS) sounds.shift();
  if (sounds.length > 1 && sounds[sounds.length - 1]!.loud <= BLIP_WINDOWS) sounds.pop();
  const margin = roundHalfEven(keep * 100);
  const start = Math.max(sounds[0]!.first - margin, 0);
  const end = Math.min(sounds[sounds.length - 1]!.last + 1 + margin, windows);
  return audio.subarray(start * window, end * window);
}

/**
 * Pause after a chunk by its final punctuation, in milliseconds: Kokoro's
 * values, `...` taking the ellipsis's.
 */
// prettier-ignore
export const REVERB_PAUSE_MS: Record<string, number> = {
  '.': 375, '?': 500, '!': 250, ';': 400, '...': 1000, ',': 130, ':': 250, '-': 200,
};

/**
 * The pause after a chunk, by its final punctuation past closing quotes.
 * @param chunk The chunk.
 * @returns The pause in seconds.
 */
export function pauseAfter(chunk: string): number {
  'worklet';
  const end = chunk.replace(/[\s"'”’»)\]}]+$/u, '');
  const mark = end.endsWith('...') ? '...' : end.slice(-1);
  return (REVERB_PAUSE_MS[mark] ?? 0) / 1000;
}
