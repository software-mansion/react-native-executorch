/**
 * Splitting a prompt to fit a model's per-call prefill window.
 *
 * The window is not the context: a dynamic-shape export declares a decoder
 * chunk size well below the conversation budget it advertises, and one prefill
 * call may not exceed it. These suites pin what gets split, what is left alone,
 * and that a split never changes the token stream the model sees.
 */
import { chunkPrompt } from '../../src/extensions/llm/utils/prefillChunking';
import type { Prompt, TokensInput } from '../../src/extensions/llm/llmRunner';

/** One id per whitespace-separated word, so a token count is readable in a test. */
const encode = (text: string) =>
  Int32Array.from(
    text
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.length)
  );

const tokensOf = (prompt: Prompt): number[] => {
  const parts = typeof prompt === 'string' ? [prompt] : prompt;
  return parts.flatMap((part) =>
    typeof part === 'object' && 'kind' in part && part.kind === 'tokens'
      ? [...(part as TokensInput).tokens]
      : []
  );
};

const IMAGE = { kind: 'image', image: {} } as never;

describe('chunkPrompt', () => {
  it('leaves a prompt that fits in one piece', () => {
    // Not merely equivalent: the same value, so a model whose window covers its
    // context stays on the exact path it uses today.
    const prompt = 'four words go here';
    expect(chunkPrompt(prompt, 8, encode)).toEqual([prompt]);
  });

  it('leaves every prompt alone when the model declares no window', () => {
    const prompt = 'a b c d e f g h i j';
    expect(chunkPrompt(prompt, 0, encode)).toEqual([prompt]);
    expect(chunkPrompt(prompt, -1, encode)).toEqual([prompt]);
  });

  it('splits a prompt that overflows into calls that each fit', () => {
    const calls = chunkPrompt('a b c d e f g', 3, encode);

    expect(calls).toHaveLength(3);
    for (const call of calls) {
      expect(tokensOf(call).length).toBeLessThanOrEqual(3);
    }
  });

  it('preserves the token stream exactly across the split', () => {
    // The whole point: the model must see what one call would have given it.
    const prompt = 'alpha be see dee ee eff gee aitch';
    const whole = [...encode(prompt)];

    expect(chunkPrompt(prompt, 3, encode).flatMap(tokensOf)).toEqual(whole);
  });

  it('sends each media part as its own call', () => {
    // Media costs soft tokens the tokenizer cannot count, and the exports size
    // the window so one image fits one call.
    const calls = chunkPrompt(['a b', IMAGE, 'c d'], 1, encode);

    expect(calls.filter((call) => tokensOf(call).length === 0)).toHaveLength(1);
    expect(calls.flatMap(tokensOf)).toEqual([1, 1, 1, 1]);
  });

  it('splits a prompt carrying media even when its text would fit', () => {
    // Assuming the soft tokens fit is exactly what fails on device.
    expect(chunkPrompt(['a', IMAGE], 64, encode).length).toBeGreaterThan(1);
  });

  it('copies each chunk instead of viewing the encoded prompt', () => {
    // A subarray shares its buffer, and a worklet runtime that rebuilds the view
    // over the whole buffer would widen a chunk back to the entire prompt.
    const calls = chunkPrompt('a b c d', 2, encode);
    const first = (calls[0] as readonly TokensInput[])[0]!.tokens;

    expect(first.buffer.byteLength).toBe(first.byteLength);
  });
});
