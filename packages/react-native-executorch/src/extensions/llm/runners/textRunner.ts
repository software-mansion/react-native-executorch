import { createSynchronizable } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import type { Model } from '../../../core/model';
import type { Tokenizer } from '../../nlp';
import { RnExecuTorchError } from '../../../core/error';

import type {
  LLMGenerationConfig,
  LLMGenerationStats,
  LLMKVCacheState,
  LLMPrefillStats,
  LLMRunner,
  Prompt,
} from '../llmRunner';

export function createTextRunner(
  model: Model,
  tokenizer: Tokenizer,
  meta: {
    readonly maxSeqLen: number;
    readonly maxContextLen: number;
    readonly vocabSize: number;
    readonly eosIds: readonly number[];
  }
): LLMRunner {
  const { maxSeqLen, maxContextLen, vocabSize, eosIds } = meta;
  const tLogits = tensor('float32', [1, vocabSize]);

  const dispose = () => {
    model.dispose();
    tLogits.dispose();
    tokenizer.dispose();
  };

  // ==================================
  // KV Cache management
  // ==================================
  let pos = 0;

  const reset = (targetPos?: number): void => {
    if (targetPos !== undefined && (targetPos < 0 || targetPos >= maxContextLen)) {
      throw RnExecuTorchError('INVALID_ARGUMENT', '');
    }
    pos = targetPos ?? 0;
  };

  const getKVCacheState = (): LLMKVCacheState => ({
    pos,
    maxContextLen,
    remainingTokens: maxContextLen - pos,
    usageRatio: pos / maxContextLen,
  });

  // ==================================
  // Generation methods
  // ==================================
  const isCancelled = createSynchronizable(false);
  const stop = (): void => isCancelled.setBlocking(true);

  const prefill = (prompt: Prompt): LLMPrefillStats => {
    'worklet';
    isCancelled.setBlocking(false);

    if (typeof prompt !== 'string') {
      throw RnExecuTorchError('INVALID_ARGUMENT', '');
    }

    const startMs = Date.now();
    const startPos = pos;
    const tokens = tokenizer.encode(prompt);

    let offset = 0;
    while (offset < tokens.length && !isCancelled.getBlocking()) {
      const seqLen = Math.min(tokens.length - offset, maxSeqLen);
      const chunk = tokens.subarray(offset, offset + seqLen);

      if (pos + seqLen > maxContextLen) {
        throw RnExecuTorchError('EXECUTION_FAILED', '');
      }

      // prettier-ignore
      const tTokens = tensor('int64', [1, seqLen], BigInt64Array.from(chunk, (v) => BigInt(v)));
      const tCurPos = tensor('int64', [1], BigInt64Array.of(BigInt(pos)));
      try {
        model.execute('forward', [tTokens, tCurPos], [tLogits]);
      } finally {
        tTokens.dispose();
        tCurPos.dispose();
      }

      pos += seqLen;
      offset += seqLen;
    }

    const durationMs = Date.now() - startMs;
    const numTokens = pos - startPos;
    const tokensPerSecond = durationMs > 0 ? (numTokens / durationMs) * 1000 : 0;

    return {
      numTokens,
      durationMs,
      tokensPerSecond,
    };
  };

  const generate = (
    prompt: Prompt,
    config?: LLMGenerationConfig,
    onToken?: (token: string) => void
  ): LLMGenerationStats => {
    'worklet';
    isCancelled.setBlocking(false);

    if (typeof prompt !== 'string') {
      throw RnExecuTorchError('INVALID_ARGUMENT', '');
    }

    const prefillStats = prefill(prompt);

    const generateStartMs = Date.now();
    const maxNewTokens = config?.maxNewTokens ?? Infinity;
    const logits = tLogits.getData(new Float32Array(vocabSize));

    let numTokens = 0;

    const tToken = tensor('int64', [1, 1]);
    const tCurPos = tensor('int64', [1]);

    try {
      while (numTokens < maxNewTokens && !isCancelled.getBlocking()) {
        if (pos >= maxContextLen) break;

        // TODO: Implement sampling (e.g. temperature, top-k, top-p, penalties)
        let nextToken = 0;

        if (!config?.ignoreEos && eosIds.includes(nextToken)) {
          break;
        }

        onToken?.(tokenizer.decode(Int32Array.of(nextToken)));

        tToken.setData(BigInt64Array.of(BigInt(nextToken)));
        tCurPos.setData(BigInt64Array.of(BigInt(pos)));

        model.execute('forward', [tToken, tCurPos], [tLogits]);

        pos += 1;
        numTokens += 1;
        tLogits.getData(logits);
      }
    } finally {
      tToken.dispose();
      tCurPos.dispose();
    }

    const durationMs = Date.now() - generateStartMs;
    const tokensPerSecond = durationMs > 0 ? (numTokens / durationMs) * 1000 : 0;

    return {
      numTokens,
      durationMs,
      tokensPerSecond,
      prefill: prefillStats,
    };
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
