/**
 * How offline transcription cuts a long recording: at the last VAD gap that
 * fits the model, at the quietest 100 ms when one stretch of speech is too
 * long, and never through silence the VAD found nothing in.
 */
import { splitAtSpeechGaps } from '../../src/extensions/speech/utils/audioSplitting';

const SR = 16000;
const seconds = (s: number) => new Float32Array(s * SR).fill(0.5);
const at = (s: number) => s * SR;

describe('splitAtSpeechGaps', () => {
  it('returns nothing when there is no speech', () => {
    expect(splitAtSpeechGaps(seconds(10), [], at(5))).toEqual([]);
  });

  it('keeps speech that fits in one piece and drops the silence around it', () => {
    const pieces = splitAtSpeechGaps(seconds(10), [{ start: 1, end: 4 }], at(5));
    expect(pieces).toEqual([[at(1), at(4)]]);
  });

  it('cuts at the last gap within the limit', () => {
    const speech = [
      { start: 0, end: 2 },
      { start: 3, end: 6 },
      { start: 7, end: 9 },
      { start: 10, end: 12 },
    ];
    expect(splitAtSpeechGaps(seconds(12), speech, at(8))).toEqual([
      [at(0), at(6)],
      [at(7), at(12)],
    ]);
  });

  it('extends speech that reaches the last VAD frame to the end of the audio', () => {
    // 10 s yields 997 VAD frames, so detected speech ends at 9.97 s.
    const pieces = splitAtSpeechGaps(seconds(10), [{ start: 2, end: 9.97 }], at(10));
    expect(pieces).toEqual([[at(2), at(10)]]);
  });

  it('cuts unbroken speech at its quietest 100 ms', () => {
    const audio = seconds(12);
    audio.fill(0, at(6), at(6) + 1600);
    const pieces = splitAtSpeechGaps(audio, [{ start: 0, end: 12 }], at(8));
    expect(pieces).toEqual([
      [0, at(6) + 800],
      [at(6) + 800, at(12)],
    ]);
  });

  it('falls back to the energy cut only within the segment that is too long', () => {
    const audio = seconds(20);
    audio.fill(0, at(13), at(13) + 1600);
    const speech = [
      { start: 0, end: 3 },
      { start: 4, end: 18 },
    ];
    expect(splitAtSpeechGaps(audio, speech, at(10))).toEqual([
      [0, at(3)],
      [at(4), at(13) + 800],
      [at(13) + 800, at(18)],
    ]);
  });
});
