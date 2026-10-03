import { createSynchronizable } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import type { Model } from '../../../core/model';
import { RnExecuTorchError } from '../../../core/error';

import type { Tokenizer } from '../../nlp';
import { createSampler } from '../sampler';
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

  // ==================================
  // Generation methods
  // ==================================
  const isCancelled = createSynchronizable(false);
  const stop = (): void => isCancelled.setBlocking(true);

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
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
        `generate: Expected text prompt string, got ${typeof prompt}.`
      );
    }

    const prefillStats = prefill(prompt);

    const generateStartMs = Date.now();
    const generatedTokens: number[] = [];
    const maxNewTokens = config?.maxNewTokens ?? Infinity;

    const logits = tLogits.getData(new Float32Array(vocabSize));
    const sample = createSampler(config);

    let numTokens = 0;
    // TO-REMOVE: Timing breakdown for benchmarking
    let totalModelExecuteMs = 0;
    let totalSampleMs = 0;
    let totalOnTokenMs = 0;

    const tToken = tensor('int64', [1, 1]);
    const tCurPos = tensor('int64', [1]);

    let curPos = pos.getBlocking();

    try {
      while (numTokens < maxNewTokens && !isCancelled.getBlocking()) {
        if (curPos >= maxContextLen) break;

        // TO-REMOVE: Sample timing
        const tSample0 = Date.now();
        const nextToken = sample(logits, { generatedTokens });
        totalSampleMs += Date.now() - tSample0;

        // TO-REMOVE: onToken timing
        const tOnToken0 = Date.now();
        onToken?.(tokenizer.decode(Int32Array.of(nextToken)));
        totalOnTokenMs += Date.now() - tOnToken0;

        generatedTokens.push(nextToken);

        if (!config?.ignoreEos && eosIds.includes(nextToken)) {
          break;
        }

        tToken.setData(BigInt64Array.of(BigInt(nextToken)));
        tCurPos.setData(BigInt64Array.of(BigInt(curPos)));

        // TO-REMOVE: model.execute timing
        const tExec0 = Date.now();
        model.execute('forward', [tToken, tCurPos], [tLogits]);
        totalModelExecuteMs += Date.now() - tExec0;

        curPos += 1;
        pos.setBlocking(curPos);
        numTokens += 1;
        tLogits.getData(logits);
      }
    } finally {
      tToken.dispose();
      tCurPos.dispose();
    }

    const durationMs = Date.now() - generateStartMs;
    const tokensPerSecond = durationMs > 0 ? (numTokens / durationMs) * 1000 : 0;

    // TO-REMOVE: Console log breakdown
    // eslint-disable-next-line no-console
    console.log(
      `[textRunner] Generated ${numTokens} tokens in ${durationMs}ms (${tokensPerSecond.toFixed(1)} tok/s) | ` +
        `model.execute: ${totalModelExecuteMs}ms (${durationMs > 0 ? ((totalModelExecuteMs / durationMs) * 100).toFixed(1) : 0}%) | ` +
        `sample: ${totalSampleMs}ms (${durationMs > 0 ? ((totalSampleMs / durationMs) * 100).toFixed(1) : 0}%) | ` +
        `onToken: ${totalOnTokenMs}ms (${durationMs > 0 ? ((totalOnTokenMs / durationMs) * 100).toFixed(1) : 0}%)`
    );

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
