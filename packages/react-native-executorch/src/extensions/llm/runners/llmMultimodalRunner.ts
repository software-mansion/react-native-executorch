import { createSynchronizable } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import type { Model } from '../../../core/model';
import { RnExecuTorchError } from '../../../core/error';
import { f32, i64, method, validateSpec, DynamicDim as Dyn } from '../../../core/schema';
import type { Range } from '../../../core/schema';

import type { Tokenizer } from '../../nlp';
import { sample } from '../sampler';
import { combineStats } from '../utils/prefillStats';

import type {
  LLMGenerationConfig,
  LLMGenerationStats,
  LLMKVCacheState,
  LLMPrefillStats,
  LLMRunner,
  MediaInput,
  Modality,
  Prompt,
} from '../llmRunner';

const METADATA_SPEC = {
  ...method('get_max_seq_len', [], [{ kind: 'Int' }]),
  ...method('get_max_context_len', [], [{ kind: 'Int' }]),
  ...method('get_vocab_size', [], [{ kind: 'Int' }]),
  ...method('use_kv_cache', [], [{ kind: 'Bool' }]),
  ...method('enable_dynamic_shape', [], [{ kind: 'Bool' }]),
};

/**
 * Image-input variant (e.g. LFM 3 VL): `vision_encoder` takes a fixed-size
 * image and returns `visualTokens` embeddings.
 */
export const LLM_VISION_SPEC = {
  ...method(
    'text_decoder',
    [f32(1, Dyn('seqLen'), 'hiddenDim'), i64(Dyn('seqLen'))],
    [f32(1, 'vocabSize')]
  ),
  ...method(
    'vision_encoder', // prettier-ignore
    [f32(1, 3, 'imgH', 'imgW')],
    [f32(1, 'visualTokens', 'hiddenDim')]
  ),
  ...method(
    'token_embedding', // prettier-ignore
    [i64(1, Dyn('seqLen'))],
    [f32(1, Dyn('seqLen'), 'hiddenDim')]
  ),
  ...METADATA_SPEC,
};

/**
 * Audio-input variant (e.g. LFM3-Audio): `audio_encoder` takes a mono 16 kHz
 * waveform whose length the schema declares as a range. Its `min` is one
 * analysis window and its `step` the hop, so a clip is right-padded to `min + k * step`
 * samples; every `get_audio_frames_per_token` frames become one token.
 */
export const LLM_AUDIO_SPEC = {
  ...method(
    'text_decoder',
    [f32(1, Dyn('seqLen'), 'hiddenDim'), i64(Dyn('seqLen'))],
    [f32(1, 'vocabSize')]
  ),
  ...method(
    'audio_encoder', // prettier-ignore
    [f32(1, Dyn('audioSamples'))],
    [f32(1, Dyn('audioTokens'), 'hiddenDim')]
  ),
  ...method(
    'token_embedding', // prettier-ignore
    [i64(1, Dyn('seqLen'))],
    [f32(1, Dyn('seqLen'), 'hiddenDim')]
  ),
  ...method('get_audio_frames_per_token', [], [{ kind: 'Int' }]),
  ...METADATA_SPEC,
};

export function createLLMMultimodalRunner(
  model: Model,
  tokenizer: Tokenizer,
  modalities?: readonly Modality[]
): LLMRunner {
  const { variant, dims, dim } = validateSpec(model.schema, {
    vision: LLM_VISION_SPEC,
    audio: LLM_AUDIO_SPEC,
  });
  const specModalities: readonly Modality[] = {
    vision: ['image'] as const,
    audio: ['audio'] as const,
  }[variant];

  if (
    modalities?.length !== specModalities.length ||
    modalities.some((m) => !specModalities.includes(m))
  ) {
    throw RnExecuTorchError(
      'INVALID_ARGUMENT',
      `Multimodal model requires [${specModalities}] modalities.`
    );
  }

  const [vocabSize, hiddenDim] = dims.constant('vocabSize', 'hiddenDim');
  const maxSeqLen = dim('seqLen', 'range').max;

  let imgShape: readonly [1, 3, number, number];
  let numVisualTokens: number;
  if (modalities.includes('image')) {
    imgShape = [1, 3, ...dims.constant('imgH', 'imgW')];
    numVisualTokens = dim('visualTokens', 'constant');
  }

  let audioSamples: Range;
  let framesPerToken: number;
  if (modalities.includes('audio')) {
    [audioSamples] = dims.range('audioSamples');
    [framesPerToken] = model.execute('get_audio_frames_per_token', [], []) as [number];
  }

  const [maxContextLen] = model.execute('get_max_context_len', [], []) as [number];
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
    'worklet';
    const curPos = pos.getBlocking();
    if (targetPos !== undefined && (targetPos < 0 || targetPos > curPos)) {
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
        `targetPos (${targetPos}) must be in range [0, ${curPos}].`
      );
    }
    pos.setBlocking(targetPos ?? 0);
  };

  const getKVCacheState = (): LLMKVCacheState => {
    'worklet';
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

  const prefillText = (prompt: string, prefillLen: number): LLMPrefillStats => {
    'worklet';
    isCancelled.setBlocking(false);

    const startMs = Date.now();
    const startPos = pos.getBlocking();

    const tokens = tokenizer.encode(prompt);

    let offset = 0;
    while (offset < tokens.length && !isCancelled.getBlocking()) {
      const seqLen = Math.min(tokens.length - offset, prefillLen);
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

  // Prefills precomputed [n, hiddenDim] embeddings in chunks of prefillLen.
  const prefillEmbeddings = (
    embedding: Float32Array,
    numTokens: number,
    prefillLen: number
  ): LLMPrefillStats => {
    'worklet';
    const startMs = Date.now();
    const startPos = pos.getBlocking();

    let offset = 0;
    while (offset < numTokens && !isCancelled.getBlocking()) {
      const seqLen = Math.min(numTokens - offset, prefillLen);
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

    const durationMs = Date.now() - startMs;
    const tokensPerSecond = durationMs > 0 ? (numTokens / durationMs) * 1000 : 0;

    return { numTokens, durationMs, tokensPerSecond };
  };

  const prefillImage = (
    prompt: Extract<MediaInput, { kind: 'image' }>,
    prefillLen: number
  ): LLMPrefillStats => {
    'worklet';
    isCancelled.setBlocking(false);

    if (!modalities.includes('image')) {
      throw RnExecuTorchError('INVALID_ARGUMENT', 'prefill: This model has no vision encoder.');
    }
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

    const tVisionEmbed = tensor('float32', [1, numVisualTokens, hiddenDim]);
    try {
      model.execute('vision_encoder', [prompt.image], [tVisionEmbed]);
      const embedding = tVisionEmbed.getData(new Float32Array(tVisionEmbed.numel));
      return prefillEmbeddings(embedding, numVisualTokens, prefillLen);
    } finally {
      tVisionEmbed.dispose();
    }
  };

  const prefillAudio = (
    prompt: Extract<MediaInput, { kind: 'audio' }>,
    prefillLen: number
  ): LLMPrefillStats => {
    'worklet';
    isCancelled.setBlocking(false);

    if (!modalities.includes('audio')) {
      throw RnExecuTorchError('INVALID_ARGUMENT', 'prefill: This model has no audio encoder.');
    }
    if (prompt.audio.dtype !== 'float32') {
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
        `Expected audio tensor of dtype 'float32', received '${prompt.audio.dtype}'.`
      );
    }
    const numSamples = prompt.audio.numel;
    if (numSamples === 0) {
      throw RnExecuTorchError('INVALID_ARGUMENT', 'Audio waveform is empty.');
    }

    const rawData = prompt.audio.getData(new Float32Array(numSamples));
    const { min: window, max: maxSamples, step: hop } = audioSamples;
    // Clips longer than the encoder accepts are encoded in consecutive chunks
    // that each cover a whole number of hops.
    const chunkStride = maxSamples - window + hop;

    let totStats: LLMPrefillStats = { numTokens: 0, durationMs: 0, tokensPerSecond: 0 };
    let offset = 0;
    while (offset < numSamples && !isCancelled.getBlocking()) {
      const chunkSamples = Math.min(numSamples - offset, chunkStride);

      // Right-pad to window + k * hop samples, as the feature extractor does.
      const k = Math.ceil((chunkSamples - window) / hop);
      const padded = chunkSamples <= window ? window : window + k * hop;

      const numFrames = 1 + (padded - window) / hop;
      const numAudioTokens = Math.ceil(numFrames / framesPerToken);

      const wav = new Float32Array(padded);
      wav.set(rawData.subarray(offset, offset + chunkSamples));
      const tWaveform = tensor('float32', [1, padded], wav);
      const tAudioEmbeds = tensor('float32', [1, numAudioTokens, hiddenDim]);
      try {
        model.execute('audio_encoder', [tWaveform], [tAudioEmbeds]);
        const embedding = tAudioEmbeds.getData(new Float32Array(tAudioEmbeds.numel));
        const stats = prefillEmbeddings(embedding, numAudioTokens, prefillLen);
        totStats = combineStats(totStats, stats);
      } finally {
        tWaveform.dispose();
        tAudioEmbeds.dispose();
      }
      offset += chunkSamples;
    }

    return totStats;
  };

  const prefill = (
    prompt: Prompt,
    options?: Pick<LLMGenerationConfig, 'prefillLen'>
  ): LLMPrefillStats => {
    'worklet';
    isCancelled.setBlocking(false);

    const prefillLen = options?.prefillLen ?? maxSeqLen;
    if (!Number.isInteger(prefillLen) || prefillLen < 1 || prefillLen > maxSeqLen) {
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
        `prefill: prefillLen (${prefillLen}) must be an integer in range [1, ${maxSeqLen}].`
      );
    }

    const segments = typeof prompt === 'string' ? [prompt] : prompt;
    if (segments.length === 0) {
      throw RnExecuTorchError('INVALID_ARGUMENT', 'prefill: Empty prompt provided.');
    }

    let totStats: LLMPrefillStats = { numTokens: 0, durationMs: 0, tokensPerSecond: 0 };
    for (const segment of segments) {
      if (typeof segment === 'string') {
        const stats = prefillText(segment, prefillLen);
        totStats = combineStats(totStats, stats);
        continue;
      }

      switch (segment.kind) {
        case 'image': {
          const stats = prefillImage(segment, prefillLen);
          totStats = combineStats(totStats, stats);
          break;
        }
        case 'audio': {
          const stats = prefillAudio(segment, prefillLen);
          totStats = combineStats(totStats, stats);
          break;
        }
        default:
          throw RnExecuTorchError(
            'INVALID_ARGUMENT',
            `prefill: Unsupported media input kind '${(segment as MediaInput).kind}'.`
          );
      }
    }

    return totStats;
  };

  const generate = (
    prompt: Prompt,
    config?: LLMGenerationConfig,
    onToken?: (token: string) => void
  ): LLMGenerationStats => {
    'worklet';
    isCancelled.setBlocking(false);

    const prefillStats = prefill(prompt, config);

    const generateStartMs = Date.now();
    const generatedTokens: number[] = [];
    const maxNewTokens = config?.maxNewTokens ?? Infinity;

    const tensors = [
      tensor('int64', [1]),
      tensor('int64', [1, 1]),
      tensor('float32', [1, 1, hiddenDim]),
    ] as const;

    const [tCurPos, tTokenId, tTokenEmbed] = tensors;

    let numTokens = 0;
    let decodeOffset = 0;
    let curPos = pos.getBlocking();

    try {
      while (numTokens < maxNewTokens && !isCancelled.getBlocking()) {
        if (curPos >= maxContextLen) break;

        const genTokArray = Int32Array.from(generatedTokens);
        const seed = config?.seed === undefined ? undefined : (config.seed + numTokens) % 2 ** 32;
        const samplingConfig = { ...config, seed };
        const nextToken = sample(tLogits, { generatedTokens: genTokArray }, samplingConfig);

        if (!config?.ignoreEos && eosIds.includes(nextToken)) break;

        generatedTokens.push(nextToken);

        if (onToken) {
          const pendingTokens = Int32Array.from(generatedTokens.slice(decodeOffset));
          const text = tokenizer.tryDecode(pendingTokens, /* skipSpecialTokens= */ true);
          if (text !== undefined) {
            decodeOffset = generatedTokens.length;
            onToken(text);
          }
        }

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
      tensors.forEach((t) => t.dispose());
    }

    const durationMs = Date.now() - generateStartMs;
    const tokensPerSecond = durationMs > 0 ? (numTokens / durationMs) * 1000 : 0;

    return { numTokens, durationMs, tokensPerSecond, prefill: prefillStats };
  };

  return {
    // Metadata
    modelPath: model.path,
    tokenizerPath: tokenizer.path,
    modalities: specModalities,

    // Lifecycle & Execution
    dispose,
    stop,

    // KV Cache
    reset,
    getKVCacheState,

    // Generation
    prefill,
    generate,
  };
}
