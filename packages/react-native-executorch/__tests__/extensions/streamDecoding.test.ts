/**
 * Streamed detokenization of LLM output.
 */
import { loadTokenizer } from '../../src/extensions/nlp';
import { decodeStreamed } from '../../src/extensions/llm/utils/streamDecoding';
import { fakeJsi } from '../support/fakeJsi';

const TOKENIZER_PATH = '/models/tokenizer.json';

/** Streams `ids` one at a time, as the runners do. */
const stream = (tokenizer: Awaited<ReturnType<typeof loadTokenizer>>, ids: number[]) => {
  const pieces: string[] = [];
  let previous: Int32Array | undefined;
  for (const id of ids) {
    const pending = Int32Array.of(id);
    const piece = decodeStreamed(tokenizer, previous, pending, false);
    if (piece === undefined) continue;
    pieces.push(piece);
    previous = pending;
  }
  return pieces;
};

describe('decodeStreamed', () => {
  it('keeps word breaks when the decoder strips a leading space', async () => {
    // SentencePiece pieces carry their word break in front, and a decoder chain
    // ending in Strip(start=1) (EuroLLM) removes it from any decoded string.
    fakeJsi.registerTokenizer(TOKENIZER_PATH, {
      tokens: [' Hallo', ' Welt', '.'],
      concat: true,
      stripStart: true,
    });
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);

    const pieces = stream(tokenizer, [0, 1, 2]);

    expect(pieces).toEqual(['Hallo', ' Welt', '.']);
    expect(pieces.join('')).toBe(tokenizer.decode(Int32Array.of(0, 1, 2), false));
    tokenizer.dispose();
  });

  it('decodes the first tokens on their own', async () => {
    fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: ['Hallo'], concat: true });
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);

    expect(decodeStreamed(tokenizer, undefined, Int32Array.of(0), false)).toBe('Hallo');
    tokenizer.dispose();
  });
});
