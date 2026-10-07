import { createSynchronizable } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import type { Model } from '../../../core/model';
import type { SpecMatch } from '../../../core/schema';
import { RnExecuTorchError } from '../../../core/error';
import { f32, i64, method, DynamicDim as Dyn } from '../../../core/schema';

import type { Tokenizer } from '../../nlp';
import { sample } from '../sampler';

import type {
  LLMGenerationConfig,
  LLMGenerationStats,
  LLMKVCacheState,
  LLMPrefillStats,
  LLMRunner,
  Modality,
  Prompt,
} from '../llmRunner';

export const LLM_TEXT_RUNNER_SPEC = {
  ...method(
    'forward', // prettier-ignore
    [i64(1, Dyn('seqLen')), i64(1)],
    [f32(1, 'vocabSize')]
  ),
  ...method('get_max_seq_len', [], [{ kind: 'Int' }]),
  ...method('get_max_context_len', [], [{ kind: 'Int' }]),
  ...method('get_vocab_size', [], [{ kind: 'Int' }]),
  ...method('use_kv_cache', [], [{ kind: 'Bool' }]),
  ...method('enable_dynamic_shape', [], [{ kind: 'Bool' }]),
} as const;

export function createLLMTextRunner(
  model: Model,
  tokenizer: Tokenizer,
  dims: SpecMatch['dims'],
  modalities?: readonly Modality[]
): LLMRunner {
  if (modalities && modalities.length > 0) {
    throw RnExecuTorchError(
      'INVALID_ARGUMENT',
      `Text-only model does not support modalities: ${modalities.join(', ')}.`
    );
  }

  const [vocabSize] = dims.constant('vocabSize');
  const [seqLenRange] = dims.range('seqLen');
  const [maxContextLen] = model.execute('get_max_context_len', [], []) as [number];

  const maxSeqLen = seqLenRange.max;
  const eosIds = model.execute('get_eos_ids', [], []) as number[];

  if (maxContextLen < maxSeqLen || !Number.isInteger(maxContextLen)) {
    throw RnExecuTorchError(
      'SCHEMA_MISMATCH',
      `maxContextLen (${maxContextLen}) must be an integer >= maxSeqLen (${maxSeqLen}).`
    );
  }

  if (model.execute('use_kv_cache', [], [])[0] !== true) {
    throw RnExecuTorchError('SCHEMA_MISMATCH', 'Model must enable use_kv_cache.');
  }

  // Output buffer for `forward` logits: shape [1, vocabSize]
  const tLogits = tensor('float32', [1, vocabSize]);

  const dispose = () => {
    model.dispose();
    tLogits.dispose();
    tokenizer.dispose();
  };

  // ======================================================
  // KV Cache management
  // ======================================================
  const pos = createSynchronizable(0);

  const reset = (targetPos?: number): void => {
    if (targetPos !== undefined && (targetPos < 0 || targetPos >= maxContextLen)) {
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
        `targetPos (${targetPos}) must be in range [0, ${maxContextLen}).`
      );
    }
    pos.setBlocking(targetPos ?? 0);
  };

  const getKVCacheState = (): LLMKVCacheState => {
    const curPos = pos.getBlocking();
    return {
      pos: curPos,
      maxContextLen,
      remainingTokens: maxContextLen - curPos,
      usageRatio: curPos / maxContextLen,
    };
  };

  // ======================================================
  // Generation methods
  // ======================================================
  const isCancelled = createSynchronizable(false);

  const stop = (): void => {
    'worklet';
    isCancelled.setBlocking(true);
  };

  const prefill = (prompt: Prompt): LLMPrefillStats => {
    'worklet';
    isCancelled.setBlocking(false);

    if (typeof prompt !== 'string') {
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
        `prefill: Expected text prompt string, got ${typeof prompt}.`
      );
    }

    const startMs = Date.now();
    const startPos = pos.getBlocking();

    const tokens = tokenizer.encode(prompt);

    let offset = 0;
    while (offset < tokens.length && !isCancelled.getBlocking()) {
      const seqLen = Math.min(tokens.length - offset, maxSeqLen);
      const chunk = tokens.subarray(offset, offset + seqLen);

      if (startPos + offset + seqLen > maxContextLen) {
        throw RnExecuTorchError(
          'EXECUTION_FAILED',
          `prefill: Context length exceeded (${startPos + offset + seqLen} > ${maxContextLen}).`
        );
      }

      // prettier-ignore
      const tTokens = tensor('int64', [1, seqLen], BigInt64Array.from(chunk, (v) => BigInt(v)));
      const tCurPos = tensor('int64', [1], BigInt64Array.of(BigInt(startPos + offset)));
      try {
        model.execute('forward', [tTokens, tCurPos], [tLogits]);
      } finally {
        tTokens.dispose();
        tCurPos.dispose();
      }

      pos.setBlocking(startPos + offset + seqLen);
      offset += seqLen;
    }

    const durationMs = Date.now() - startMs;
    const numTokens = offset;
    const tokensPerSecond = durationMs > 0 ? (numTokens / durationMs) * 1000 : 0;

    return { numTokens, durationMs, tokensPerSecond };
  };

  const generate = (
    prompt: Prompt,
    config?: LLMGenerationConfig,
    onToken?: (token: string) => void
  ): LLMGenerationStats => {
    'worklet';
    isCancelled.setBlocking(false);

    if (typeof prompt !== 'string') {
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
        `generate: Expected text prompt string, got ${typeof prompt}.`
      );
    }

    const prefillStats = prefill(prompt);

    const generateStartMs = Date.now();
    const generatedTokens: number[] = [];
    const maxNewTokens = config?.maxNewTokens ?? Infinity;

    const tToken = tensor('int64', [1, 1]);
    const tCurPos = tensor('int64', [1]);

    let numTokens = 0;
    let curPos = pos.getBlocking();

    try {
      while (numTokens < maxNewTokens && !isCancelled.getBlocking()) {
        if (curPos >= maxContextLen) break;

        const genTokArray = Int32Array.from(generatedTokens);
        const nextToken = sample(tLogits, { generatedTokens: genTokArray }, config);

        onToken?.(tokenizer.decode(Int32Array.of(nextToken)));
        generatedTokens.push(nextToken);

        if (!config?.ignoreEos && eosIds.includes(nextToken)) break;

        tToken.setData(BigInt64Array.of(BigInt(nextToken)));
        tCurPos.setData(BigInt64Array.of(BigInt(curPos)));

        model.execute('forward', [tToken, tCurPos], [tLogits]);

        numTokens += 1;
        curPos += 1;
        pos.setBlocking(curPos);
      }
    } finally {
      tToken.dispose();
      tCurPos.dispose();
    }

    const durationMs = Date.now() - generateStartMs;
    const tokensPerSecond = durationMs > 0 ? (numTokens / durationMs) * 1000 : 0;

    return { numTokens, durationMs, tokensPerSecond, prefill: prefillStats };
  };

  return {
    // Metadata
    modelPath: model.path,
    tokenizerPath: tokenizer.path,
    modalities: [],

    // Lifecycle & Execution
    dispose,
    stop,

    // KV Cache
    reset,
    getKVCacheState,

    // Generation
    prefill,
    generate,
  } as unknown as LLMRunner;
}
