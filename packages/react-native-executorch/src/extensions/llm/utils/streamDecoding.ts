/**
 * Incremental detokenization for streamed LLM generation.
 */

import type { Tokenizer } from '../../nlp';

/**
 * Decodes newly generated tokens for streaming, in the context of the tokens
 * streamed just before them.
 *
 * Decoding the new tokens on their own runs the tokenizer's whole decoder
 * chain on them, so a chain that strips a leading space (SentencePiece-style
 * `Strip(start=1)`, e.g. EuroLLM) would drop every word break. Decoding them
 * after the previous group and keeping only what they add matches decoding the
 * whole sequence at once.
 * @param tokenizer The model's tokenizer.
 * @param previous The token group streamed last, or `undefined` at the start.
 * @param pending The new tokens to decode.
 * @param skipSpecialTokens Whether to omit special tokens.
 * @returns The text the pending tokens add, or `undefined` if they end in an
 * incomplete UTF-8 sequence and more tokens are needed.
 */
export function decodeStreamed(
  tokenizer: Tokenizer,
  previous: Int32Array | undefined,
  pending: Int32Array,
  skipSpecialTokens: boolean
): string | undefined {
  'worklet';
  if (previous === undefined || previous.length === 0) {
    return tokenizer.tryDecode(pending, skipSpecialTokens);
  }
  const prefix = tokenizer.tryDecode(previous, skipSpecialTokens);
  const joined = new Int32Array(previous.length + pending.length);
  joined.set(previous);
  joined.set(pending, previous.length);
  const text = tokenizer.tryDecode(joined, skipSpecialTokens);
  if (text === undefined) return undefined;
  // The previous group decoded on its own before, so a mismatch means the
  // decoder rewrote its tail; fall back to the pending tokens alone.
  if (prefix === undefined || !text.startsWith(prefix)) {
    return tokenizer.tryDecode(pending, skipSpecialTokens);
  }
  return text.slice(prefix.length);
}
