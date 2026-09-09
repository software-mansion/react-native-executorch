/**
 * Splitting a prompt so no single prefill call exceeds the model's window.
 *
 * A dynamic-shape export bounds the prefill tensor to `get_max_seq_len`, which
 * is the decoder's per-call window and not the conversation's KV budget
 * (`get_max_context_len`). The Vulkan LFM2.5-VL builds ship 256 against a
 * context of 2048, and Gemma4 128, so a conversation well inside its context
 * can still hand one call more tokens than the graph can hold. The runtime
 * reports that as `Error::NotSupported` from a tensor resize.
 *
 * Prefill already appends at the runner's current position, so the fix needs no
 * new native capability: the same prompt, delivered as several calls, builds the
 * identical cache.
 *
 * The split has to happen on token boundaries. Cutting the string and letting
 * the runtime re-encode each piece is not equivalent, because BPE merges across
 * the cut: the pieces need not sum back to the same ids, or even to the same
 * count, so a chunk could still overflow the window it was cut to fit.
 */

import type { Prompt, PromptPart } from '../llmRunner';

/**
 * Splits `prompt` into prefill calls that each stay within `limit` tokens.
 *
 * Text is encoded once and sliced, so the token stream reaching the model is
 * exactly the one a single call would have produced. Media parts are passed
 * through untouched and each take a call of their own: their cost is in soft
 * tokens the tokenizer cannot count, and the exports size their window so one
 * image fits one call.
 *
 * A prompt that already fits is returned as-is, in one piece. That keeps every
 * model whose window covers its context on the exact path it uses today, and
 * confines this splitting to prompts that would otherwise fail outright.
 * @param prompt The prompt to split.
 * @param limit The model's per-call prefill window, in tokens. Values of 0 or
 * less mean the model did not declare one, and the prompt is left alone.
 * @param encode Tokenizer encode, used only when a split is actually needed.
 * @returns The prompts to prefill, in order.
 */
export function chunkPrompt(
  prompt: Prompt,
  limit: number,
  encode: (text: string) => Int32Array
): Prompt[] {
  if (limit <= 0) return [prompt];

  const parts: readonly PromptPart[] = typeof prompt === 'string' ? [prompt] : prompt;

  // Encoding is not free, so establish that a split is needed before paying for
  // it. Only text can be measured; a prompt carrying media is split regardless,
  // since its soft tokens are uncounted and assuming they fit is what fails.
  const hasMedia = parts.some((part) => typeof part !== 'string');
  if (!hasMedia) {
    const total = parts.reduce((sum, part) => sum + encode(part as string).length, 0);
    if (total <= limit) return [prompt];
  }

  const calls: Prompt[] = [];
  for (const part of parts) {
    if (typeof part !== 'string') {
      calls.push([part]);
      continue;
    }
    const ids = encode(part);
    for (let start = 0; start < ids.length; start += limit) {
      // Copied, not a view: a subarray shares its backing buffer, and a worklet
      // runtime that rebuilds the view over the whole buffer would widen the
      // chunk back to the full prompt.
      calls.push([{ kind: 'tokens', tokens: Int32Array.from(ids.subarray(start, start + limit)) }]);
    }
  }
  return calls;
}
