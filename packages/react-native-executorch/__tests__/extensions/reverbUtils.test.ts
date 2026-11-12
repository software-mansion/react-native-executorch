/**
 * Reverb's utilities. The expected normalization, estimates, and trims come
 * from the Python they port (Echo's and Voice Studio's), run on the same inputs.
 */
import {
  buildPrompt,
  estimateTargetFrames,
  parseVoice,
  pauseAfter,
  prepareText,
  roundHalfEven,
  trimSilence,
} from '../../src/extensions/speech/utils/reverbUtils';

describe('prepareText', () => {
  it.each([
    ['Wait… what?', 'Wait... what?'],
    ['«Bonjour», dit-il.', '"Bonjour", dit-il.'],
    ['It’s ‘fine’', "It's 'fine'"],
    ['Szczurek–Żelazko', 'Szczurek-Żelazko'],
    ['yes — no', 'yes - no'],
    ['one -- two', 'one - two'],
    ['a – — b', 'a - b'],
    ['non breaking thin', 'non breaking thin'],
    ['zero​width', 'zerowidth'],
    ['too   many  spaces', 'too many spaces'],
    ['Hello , world !', 'Hello, world!'],
    ['Hmm ... ok .', 'Hmm ... ok.'],
    ['  edges  ', 'edges'],
    ['end—', 'end -'],
    ['--start', '- start'],
    ['x--y--z', 'x-y-z'],
    ['tab\there', 'tab here'],
    ['quote„test“', 'quote"test"'],
    ['´acute` and ʼmodifier', "'acute' and 'modifier"],
  ])('normalizes %j as Echo did', (input, expected) => {
    expect(prepareText(input, 'en')).toBe(expected);
  });

  it('writes numbers and symbols out as words in the given language', () => {
    expect(prepareText('I have 3 cats & 2 dogs.', 'en')).toBe('I have three cats and two dogs.');
    expect(prepareText('Mam 2 koty.', 'pl')).toBe('Mam dwa koty.');
  });
});

describe('estimateTargetFrames', () => {
  it.each([
    ['Hello world.', 'This is a reference transcript.', 250, 97],
    ['Mam 2 koty i psa.', 'To jest nagranie referencyjne mojego głosu.', 300, 123],
    ['Hi', 'A long transcript of the reference clip that sets the speaking rate.', 400, 32],
    ['Café naïve - ok!', 'Reference.', 100, 132],
    ['Zażółć gęślą jaźń. To jest test, który ma sprawdzić długość.', 'Krótki tekst.', 150, 657],
    ['Some text', '', 100, 819],
  ])('estimates %j against %j over %i frames as Voice Studio does', (...args) => {
    const [text, referenceText, referenceFrames, expected] = args;
    expect(estimateTargetFrames(text, referenceText, referenceFrames)).toBe(expected);
  });
});

describe('roundHalfEven', () => {
  it.each([
    [0.5, 0],
    [1.5, 2],
    [2.5, 2],
    [2.4, 2],
    [2.6, 3],
    [7, 7],
  ])('rounds %d to %d like Python', (value, expected) => {
    expect(roundHalfEven(value)).toBe(expected);
  });
});

describe('trimSilence', () => {
  /** Concatenated constant segments: [seconds, amplitude] each. */
  const segments = (...parts: [number, number][]): Float32Array => {
    const lengths = parts.map(([seconds]) => Math.round(seconds * 24000));
    const audio = new Float32Array(lengths.reduce((a, b) => a + b, 0));
    let offset = 0;
    parts.forEach(([, amplitude], i) => {
      audio.fill(amplitude, offset, offset + lengths[i]!);
      offset += lengths[i]!;
    });
    return audio;
  };

  it.each<[string, [number, number][], number, number]>([
    [
      'speech',
      [
        [0.5, 0],
        [1.0, 0.1],
        [0.5, 0],
      ],
      9600,
      38400,
    ],
    [
      'a leading blip',
      [
        [0.2, 0],
        [0.1, 0.1],
        [0.3, 0],
        [1.0, 0.1],
        [0.4, 0],
      ],
      12000,
      40800,
    ],
    [
      'a trailing blip',
      [
        [0.3, 0],
        [1.0, 0.1],
        [0.25, 0],
        [0.12, 0.1],
        [0.3, 0],
      ],
      4800,
      33600,
    ],
    [
      'a leading sound',
      [
        [0.2, 0],
        [0.2, 0.1],
        [0.3, 0],
        [1.0, 0.1],
        [0.4, 0],
      ],
      2400,
      43200,
    ],
    [
      'a blip close to the speech',
      [
        [0.2, 0],
        [0.1, 0.1],
        [0.15, 0],
        [1.0, 0.1],
        [0.4, 0],
      ],
      2400,
      37200,
    ],
    [
      'quiet speech',
      [
        [0.3, 0],
        [0.5, 0.004],
        [0.3, 0.003],
      ],
      4800,
      21600,
    ],
    ['silence', [[0.5, 0]], 0, 12000],
    ['less than a window', [[0.005, 0.5]], 0, 120],
    [
      'no room for the margin',
      [
        [0.05, 0],
        [1.0, 0.1],
        [0.02, 0],
      ],
      0,
      25680,
    ],
  ])('trims %s as Voice Studio does', (_label, parts, start, end) => {
    const trimmed = trimSilence(segments(...parts), 24000, -50, 0.1);

    expect(trimmed.byteOffset / 4).toBe(start);
    expect(trimmed.byteOffset / 4 + trimmed.length).toBe(end);
  });
});

describe('pauseAfter', () => {
  it.each([
    ['A sentence.', 0.375],
    ['A question?', 0.5],
    ['A clause,', 0.13],
    ['He said "yes."', 0.375],
    ['Wait...', 1],
    ['No mark', 0],
  ])('pauses after %j for %d s', (chunk, seconds) => {
    expect(pauseAfter(chunk)).toBeCloseTo(seconds);
  });
});

describe('buildPrompt', () => {
  it('puts the language, the transcript and the text in the template', () => {
    expect(buildPrompt('pl', 'Dzień dobry.', 'Cześć!')).toBe(
      '<|denoise|><|lang_start|>pl<|lang_end|><|instruct_start|>None<|instruct_end|>' +
        '<|text_start|>Dzień dobry. Cześć!<|text_end|>'
    );
  });
});

describe('parseVoice', () => {
  it('parses codes, transcript and language', () => {
    const codes = Array.from({ length: 16 }, (_, i) => i * 10);

    expect(parseVoice({ codes, transcript: 'Hello.', language: 'en' })).toEqual({
      codes: BigInt64Array.from(codes, BigInt),
      transcript: 'Hello.',
      language: 'en',
    });
  });

  it.each([
    ['no codes', { transcript: 'Hi.', language: 'en' }],
    ['a fractional code', { codes: [0.5], transcript: 'Hi.', language: 'en' }],
    ['no transcript', { codes: [0], language: 'en' }],
    ['no language', { codes: [0], transcript: 'Hi.' }],
  ])('rejects a voice with %s', (_label, json) => {
    expect(() => parseVoice(json)).toThrow(/Invalid voice JSON/);
  });
});
