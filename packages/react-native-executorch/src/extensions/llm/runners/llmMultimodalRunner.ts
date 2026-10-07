import { createSynchronizable } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import type { Model } from '../../../core/model';
import { RnExecuTorchError } from '../../../core/error';

import type { Tokenizer } from '../../nlp';
import { sample } from '../sampler';
import type {
  LLMGenerationConfig,
  LLMGenerationStats,
  LLMKVCacheState,
  LLMPrefillStats,
  LLMRunner,
  MediaInput,
  Prompt,
} from '../llmRunner';

export type LLMMultimodalMeta = {
  readonly maxSeqLen: number;
  readonly maxContextLen: number;
  readonly vocabSize: number;
  readonly hiddenDim: number;
  readonly eosIds: readonly number[];
  readonly imgShape: readonly [number, number, number, number];
  readonly numVisualTokens: number;
};

export function createLLMMultimodalRunner(
  model: Model,
  tokenizer: Tokenizer,
  meta: LLMMultimodalMeta
): LLMRunner {
  const { maxSeqLen, maxContextLen, vocabSize, hiddenDim, numVisualTokens, eosIds, imgShape } =
    meta;

  // Output buffer for text_decoder logits: shape [1, vocabSize]
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
  // Generation & Prefill methods
  // ======================================================
  const isCancelled = createSynchronizable(false);

  const stop = (): void => {
    'worklet';
    isCancelled.setBlocking(true);
  };

  const prefillText = (prompt: string): LLMPrefillStats => {
    'worklet';
    isCancelled.setBlocking(false);

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

      const positions = BigInt64Array.from(
        { length: seqLen }, // prettier-ignore
        (_, i) => BigInt(startPos + offset + i)
      );
      const tensors = [
        // prettier-ignore
        tensor('int64', [1, seqLen], BigInt64Array.from(chunk, (v) => BigInt(v))),
        tensor('int64', [seqLen], positions),
        tensor('float32', [1, seqLen, hiddenDim]),
      ] as const;

      const [tTokens, tPositions, tTextEmbeds] = tensors;

      try {
        model.execute('token_embedding', [tTokens], [tTextEmbeds]);
        model.execute('text_decoder', [tTextEmbeds, tPositions], [tLogits]);
      } finally {
        tensors.forEach((t) => t.dispose());
      }

      pos.setBlocking(startPos + offset + seqLen);
      offset += seqLen;
    }

    const durationMs = Date.now() - startMs;
    const numTokens = offset;
    const tokensPerSecond = durationMs > 0 ? (numTokens / durationMs) * 1000 : 0;

    return { numTokens, durationMs, tokensPerSecond };
  };

  const prefillImage = (prompt: Extract<MediaInput, { kind: 'image' }>): LLMPrefillStats => {
    'worklet';
    isCancelled.setBlocking(false);

    if (prompt.image.dtype !== 'float32') {
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
        `Expected image tensor of dtype 'float32', received '${prompt.image.dtype}'.`
      );
    }
    if (imgShape.some((d, i) => d !== prompt.image.shape[i])) {
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
        `Image tensor shape [${prompt.image.shape.join(', ')}] != [${imgShape.join(', ')}].`
      );
    }

    const startMs = Date.now();
    const startPos = pos.getBlocking();

    const tVisionEmbed = tensor('float32', [1, numVisualTokens, hiddenDim]);
    try {
      model.execute('vision_encoder', [prompt.image], [tVisionEmbed]);

      const embedding = tVisionEmbed.getData(new Float32Array(tVisionEmbed.numel));
      let offset = 0;
      while (offset < numVisualTokens && !isCancelled.getBlocking()) {
        const seqLen = Math.min(numVisualTokens - offset, maxSeqLen);
        const chunk = embedding.subarray(offset * hiddenDim, (offset + seqLen) * hiddenDim);

        if (startPos + offset + seqLen > maxContextLen) {
          throw RnExecuTorchError(
            'EXECUTION_FAILED',
            `prefill: Context length exceeded (${startPos + offset + seqLen} > ${maxContextLen}).`
          );
        }

        const positions = BigInt64Array.from(
          { length: seqLen }, // prettier-ignore
          (_, i) => BigInt(startPos + offset + i)
        );
        const tPositions = tensor('int64', [seqLen], positions);
        const tChunk = tensor('float32', [1, seqLen, hiddenDim], chunk);

        try {
          model.execute('text_decoder', [tChunk, tPositions], [tLogits]);
        } finally {
          tPositions.dispose();
          tChunk.dispose();
        }

        pos.setBlocking(startPos + offset + seqLen);
        offset += seqLen;
      }
    } finally {
      tVisionEmbed.dispose();
    }

    const durationMs = Date.now() - startMs;
    const numTokens = numVisualTokens;
    const tokensPerSecond = durationMs > 0 ? (numTokens / durationMs) * 1000 : 0;

    return { numTokens, durationMs, tokensPerSecond };
  };

  const prefill = (prompt: Prompt): LLMPrefillStats => {
    'worklet';
    isCancelled.setBlocking(false);

    const segments = typeof prompt === 'string' ? [prompt] : prompt;
    if (segments.length === 0) {
      throw RnExecuTorchError('INVALID_ARGUMENT', 'prefill: Empty prompt provided.');
    }

    let totStats: LLMPrefillStats | undefined;
    const combine = (st1: LLMPrefillStats, st2?: LLMPrefillStats): LLMPrefillStats => {
      if (st2 === undefined) return st1;
      const numTokens = st1.numTokens + st2.numTokens;
      const durationMs = st1.durationMs + st2.durationMs;
      const tokensPerSecond = durationMs > 0 ? (numTokens / durationMs) * 1000 : 0;
      return { numTokens, durationMs, tokensPerSecond };
    };

    for (const segment of segments) {
      if (typeof segment === 'string') {
        const stats = prefillText(segment);
        totStats = combine(stats, totStats);
        continue;
      }

      switch (segment.kind) {
        case 'image': {
          const stats = prefillImage(segment);
          totStats = combine(stats, totStats);
          break;
        }
        default:
          throw RnExecuTorchError('INVALID_ARGUMENT', '');
      }
    }

    return totStats!;
  };

  const generate = (
    prompt: Prompt,
    config?: LLMGenerationConfig,
    onToken?: (token: string) => void
  ): LLMGenerationStats => {
    'worklet';
    isCancelled.setBlocking(false);

    const prefillStats = prefill(prompt);

    const generateStartMs = Date.now();
    const generatedTokens: number[] = [];
    const maxNewTokens = config?.maxNewTokens ?? Infinity;

    const tCurPos = tensor('int64', [1]);
    const tTokenId = tensor('int64', [1, 1]);
    const tTokenEmbed = tensor('float32', [1, 1, hiddenDim]);

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

        // Embed single token
        tTokenId.setData(BigInt64Array.of(BigInt(nextToken)));
        model.execute('token_embedding', [tTokenId], [tTokenEmbed]);

        // Decode single token embedding
        tCurPos.setData(BigInt64Array.of(BigInt(curPos)));
        model.execute('text_decoder', [tTokenEmbed, tCurPos], [tLogits]);

        numTokens += 1;
        curPos += 1;
        pos.setBlocking(curPos);
      }
    } finally {
      tTokenId.dispose();
      tTokenEmbed.dispose();
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
    modalities: ['image'],

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
