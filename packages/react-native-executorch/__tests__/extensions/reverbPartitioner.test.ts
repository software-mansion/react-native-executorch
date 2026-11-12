/**
 * Reverb's partitioner: chunks within a duration limit, cut at the coarsest
 * boundary that allows it. Durations come from the estimate at a pace of one
 * letter per frame.
 */
import { partitionReverbText } from '../../src/extensions/speech/utils/reverbPartitioner';
import { estimateTargetFrames } from '../../src/extensions/speech/utils/reverbUtils';

const seconds = (chunk: string) => estimateTargetFrames(chunk, 'abcdefghij', 10) / 25;

/** `count` words of four letters, then `end`. About 1.7 s per ten words. */
const run = (count: number, end = '.') => `${new Array(count).fill('word').join(' ')}${end}`;

const LONG_TEXT = [
  run(10),
  run(25, ','),
  run(12, '!'),
  run(60),
  run(8, '?'),
  run(15, ';'),
  run(5),
].join(' ');

describe('partitionReverbText', () => {
  it('keeps a text that fits as one chunk', () => {
    expect(partitionReverbText(run(10), seconds)).toEqual([run(10)]);
  });

  it('returns no chunks for an empty text', () => {
    expect(partitionReverbText('', seconds)).toEqual([]);
    expect(partitionReverbText('   ', seconds)).toEqual([]);
  });

  it('keeps every chunk within the duration limit', () => {
    const chunks = partitionReverbText(LONG_TEXT, seconds, { maxDuration: 4 });

    expect(chunks.length).toBeGreaterThan(3);
    for (const chunk of chunks) expect(seconds(chunk)).toBeLessThanOrEqual(4);
  });

  it('gives back the text, its whitespace collapsed, when the chunks are joined', () => {
    const text = `  ${run(30)}\n\n${run(40, ',')}   ${run(50)}\t${run(3)}  `;

    const chunks = partitionReverbText(text, seconds, { maxDuration: 3 });

    expect(chunks.join(' ')).toBe(text.split(/\s+/).filter(Boolean).join(' '));
  });

  it('packs whole sentences into a chunk while they fit', () => {
    const [a, b, c] = [run(10), run(10, '!'), run(10, '?')];

    expect(partitionReverbText(`${a} ${b} ${c}`, seconds, { maxDuration: 4 })).toEqual([
      `${a} ${b}`,
      c,
    ]);
  });

  it('splits a sentence too long on its own at other punctuation', () => {
    const sentence = `${run(10, ',')} ${run(10, ':')} ${run(10)}`;

    const chunks = partitionReverbText(sentence, seconds, { maxDuration: 4 });

    expect(chunks).toEqual([`${run(10, ',')} ${run(10, ':')}`, run(10)]);
  });

  it('splits a piece still too long between words', () => {
    const chunks = partitionReverbText(run(60), seconds, { maxDuration: 4 });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(seconds(chunk)).toBeLessThanOrEqual(4);
    // Packed as far as it goes: one more word would not have fit.
    for (const chunk of chunks.slice(0, -1)) expect(seconds(`${chunk} word`)).toBeGreaterThan(4);
  });

  it('starts a sentence after closing quotes, not before them', () => {
    const text = `He said "${run(8)}" ${run(10)}`;

    expect(partitionReverbText(text, seconds, { maxDuration: 3 })[0]).toBe(`He said "${run(8)}"`);
  });

  it('keeps a single word that does not fit as a chunk of its own', () => {
    expect(partitionReverbText('a extraordinarily b', seconds, { maxDuration: 0.5 })).toEqual([
      'a',
      'extraordinarily',
      'b',
    ]);
  });

  it('fits more text per chunk when chunks are estimated shorter', () => {
    const faster = (chunk: string) => seconds(chunk) / 1.4;

    const normal = partitionReverbText(LONG_TEXT, seconds, { maxDuration: 4 });
    const fast = partitionReverbText(LONG_TEXT, faster, { maxDuration: 4 });

    expect(fast.length).toBeLessThan(normal.length);
    for (const chunk of fast) expect(faster(chunk)).toBeLessThanOrEqual(4);
  });

  it('meets the extra condition on every chunk', () => {
    const fits = (chunk: string) => chunk.length <= 40;

    const chunks = partitionReverbText(LONG_TEXT, seconds, { fits });

    expect(chunks.every(fits)).toBe(true);
    expect(chunks.join(' ')).toBe(LONG_TEXT);
  });

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['NaN', NaN],
  ])('rejects a %s maxDuration', (_label, maxDuration) => {
    expect(() => partitionReverbText('Hello.', seconds, { maxDuration })).toThrow(
      /must be positive/
    );
  });
});
