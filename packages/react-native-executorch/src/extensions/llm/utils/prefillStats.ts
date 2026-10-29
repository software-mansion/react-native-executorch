import type { LLMPrefillStats } from '../llmRunner';

export function combineStats(st1: LLMPrefillStats, st2: LLMPrefillStats): LLMPrefillStats {
  'worklet';
  const numTokens = st1.numTokens + st2.numTokens;
  const durationMs = st1.durationMs + st2.durationMs;
  const tokensPerSecond = durationMs > 0 ? (numTokens / durationMs) * 1000 : 0;
  return { numTokens, durationMs, tokensPerSecond };
}
