import { createSynchronizable } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import type { Model } from '../../../core/model';
import { RnExecuTorchError } from '../../../core/error';
import {
  f32,
  i64,
  method,
  DynamicDim as Dyn,
  validateSpec,
  constraint,
} from '../../../core/schema';

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

export const LLM_GEMMA_SPEC = {
  ...method(
    'token_embedding',
    [i64(1, Dyn('seqLen'))],
    [f32(1, Dyn('seqLen'), 'hiddenDim'), f32(1, Dyn('seqLen'), 'numLayers', 'pleDim')],
    [
      constraint.equality(
        { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
        { paramSide: 'output', tensorIdx: 0, dimIdx: 1 },
        { paramSide: 'output', tensorIdx: 1, dimIdx: 1 }
      ),
    ]
  ),
  ...method(
    'text_decoder',
    [
      f32(1, Dyn('seqLen'), 'hiddenDim'),
      f32(1, Dyn('seqLen'), 'numLayers', 'pleDim'),
      i64(Dyn('seqLen')),
    ],
    [f32(1, 1, 'vocabSize')],
    [
      constraint.equality(
        { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
        { paramSide: 'input', tensorIdx: 1, dimIdx: 1 },
        { paramSide: 'input', tensorIdx: 2, dimIdx: 0 }
      ),
    ]
  ),
  ...method(
    'vision_encoder', // prettier-ignore
    [f32(1, 3, 'imgH', 'imgW')],
    [f32(1, 'visualTokens', 'hiddenDim')]
  ),
  ...method(
    'audio_encoder',
    [f32(1, Dyn('audioSamples')), i64(1)],
    [f32(1, Dyn('audioTokens'), 'hiddenDim'), f32(1, Dyn('audioTokens'))],
    [
      constraint.equality(
        { paramSide: 'output', tensorIdx: 0, dimIdx: 1 },
        { paramSide: 'output', tensorIdx: 1, dimIdx: 1 }
      ),
    ]
  ),
  ...METADATA_SPEC,
};

const AUDIO_SAMPLES_PER_BLOCK = 7680;
const TOKENS_PER_AUDIO_BLOCK = 12;
const MAX_AUDIO_BLOCKS = 62;
const MAX_AUDIO_CHUNK_SAMPLES = MAX_AUDIO_BLOCKS * AUDIO_SAMPLES_PER_BLOCK;

export function createLLMGemmaRunner(
  model: Model,
  tokenizer: Tokenizer,
  modalities?: readonly Modality[]
): LLMRunner {
  if (!modalities?.includes('image') || !modalities?.includes('audio')) {
    throw RnExecuTorchError(
      'INVALID_ARGUMENT',
      `Gemma runner requires both 'image' and 'audio' in modalities.`
    );
  }

  const { dims, dim } = validateSpec(model.schema, { default: LLM_GEMMA_SPEC });

  const [imgH, imgW, vocabSize] = dims.constant('imgH', 'imgW', 'vocabSize');
  const [hiddenDim, visualTokens] = dims.constant('hiddenDim', 'visualTokens');
  const [numLayers, pleDim] = dims.constant('numLayers', 'pleDim');
  const maxSeqLen = dim('seqLen', 'range').max;
  const imgShape = [1, 3, imgH, imgW] as const;

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

  // Output buffer for text_decoder logits: shape [1, 1, vocabSize]
  const tLogits = tensor('float32', [1, 1, vocabSize]);

  // Gemma models use the pad token's per-layer token embedding (PLE) for media
  // token positions. Evaluate token_embedding([0]) once at initialization and
  // reuse its PLE output during media prefilling.
  const auxTensors = [
    tensor('int64', [1, 1], BigInt64Array.of(0n)),
    tensor('float32', [1, 1, hiddenDim]),
    tensor('float32', [1, 1, numLayers, pleDim]),
  ] as const;

  const [tPadToken, tPadEmbeds, tPadPle] = auxTensors;
  let padTokenPle: Float32Array;
  try {
    model.execute('token_embedding', [tPadToken], [tPadEmbeds, tPadPle]);
    padTokenPle = tPadPle.getData(new Float32Array(numLayers * pleDim));
  } finally {
    auxTensors.forEach((t) => t.dispose());
  }

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
        tensor('float32', [1, seqLen, numLayers, pleDim]),
      ] as const;

      const [tTokens, tPositions, tTextEmbeds, tPleTok] = tensors;

      try {
        model.execute('token_embedding', [tTokens], [tTextEmbeds, tPleTok]);
        model.execute('text_decoder', [tTextEmbeds, tPleTok, tPositions], [tLogits]);
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

  const prefillEmbeddings = (
    embeddings: Float32Array,
    numEmbedTokens: number,
    prefillLen: number
  ): LLMPrefillStats => {
    'worklet';
    const startMs = Date.now();
    const startPos = pos.getBlocking();

    let offset = 0;
    while (offset < numEmbedTokens && !isCancelled.getBlocking()) {
      const seqLen = Math.min(numEmbedTokens - offset, prefillLen);
      const chunk = embeddings.subarray(offset * hiddenDim, (offset + seqLen) * hiddenDim);

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

      // Media embeddings (vision / audio) use the pad token's per-layer token
      // embeddings (PLE), matching Hugging Face Gemma reference
      // (embed_tokens_per_layer[0]).
      const pleData = new Float32Array(seqLen * numLayers * pleDim);
      const plePerTok = numLayers * pleDim;
      for (let i = 0; i < seqLen; i++) {
        pleData.set(padTokenPle, i * plePerTok);
      }

      const tensors = [
        tensor('float32', [1, seqLen, hiddenDim], chunk),
        tensor('float32', [1, seqLen, numLayers, pleDim], pleData),
        tensor('int64', [seqLen], positions),
      ] as const;

      const [tChunk, tPleTok, tPositions] = tensors;

      try {
        model.execute('text_decoder', [tChunk, tPleTok, tPositions], [tLogits]);
      } finally {
        tensors.forEach((t) => t.dispose());
      }

      pos.setBlocking(startPos + offset + seqLen);
      offset += seqLen;
    }

    const durationMs = Date.now() - startMs;
    const numTokens = numEmbedTokens;
    const tokensPerSecond = durationMs > 0 ? (numTokens / durationMs) * 1000 : 0;

    return { numTokens, durationMs, tokensPerSecond };
  };

  const prefillImage = (
    prompt: Extract<MediaInput, { kind: 'image' }>,
    prefillLen: number
  ): LLMPrefillStats => {
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

    const tVisionEmbed = tensor('float32', [1, visualTokens, hiddenDim]);
    try {
      model.execute('vision_encoder', [prompt.image], [tVisionEmbed]);
      const embedding = tVisionEmbed.getData(new Float32Array(tVisionEmbed.numel));
      return prefillEmbeddings(embedding, visualTokens, prefillLen);
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

    let totStats: LLMPrefillStats = { numTokens: 0, durationMs: 0, tokensPerSecond: 0 };

    let offset = 0;
    while (offset < numSamples && !isCancelled.getBlocking()) {
      const chunkSamples = Math.min(numSamples - offset, MAX_AUDIO_CHUNK_SAMPLES);
      const numBlocks = Math.ceil(chunkSamples / AUDIO_SAMPLES_PER_BLOCK);
      const paddedSamples = numBlocks * AUDIO_SAMPLES_PER_BLOCK;
      const numAudioTokens = numBlocks * TOKENS_PER_AUDIO_BLOCK;

      const chunkData = rawData.subarray(offset, offset + chunkSamples);
      const paddedWav = new Float32Array(paddedSamples);
      paddedWav.set(chunkData);

      const tensors = [
        tensor('float32', [1, paddedSamples], paddedWav),
        tensor('int64', [1], BigInt64Array.of(BigInt(chunkSamples))),
        tensor('float32', [1, numAudioTokens, hiddenDim]),
        tensor('float32', [1, numAudioTokens]),
      ] as const;

      const [tWaveform, tNumValid, tAudioEmbeds, tAudioMask] = tensors;

      try {
        model.execute('audio_encoder', [tWaveform, tNumValid], [tAudioEmbeds, tAudioMask]);
        const maskData = tAudioMask.getData(new Float32Array(tAudioMask.numel));
        let validTokens = 0;
        for (const val of maskData) {
          if (val > 0) validTokens++;
        }
        if (validTokens > 0) {
          const embedding = tAudioEmbeds.getData(new Float32Array(tAudioEmbeds.numel));
          const chunkStats = prefillEmbeddings(embedding, validTokens, prefillLen);
          totStats = combineStats(totStats, chunkStats);
        }
      } finally {
        tensors.forEach((t) => t.dispose());
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
      tensor('float32', [1, 1, numLayers, pleDim]),
    ] as const;

    const [tCurPos, tTokenId, tTokenEmbed, tPleTok] = tensors;

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
          const text = tokenizer.tryDecode(pendingTokens, /* skipSpecialTokens= */ false);
          if (text !== undefined) {
            decodeOffset = generatedTokens.length;
            onToken(text);
          }
        }

        // Embed single token
        tTokenId.setData(BigInt64Array.of(BigInt(nextToken)));
        model.execute('token_embedding', [tTokenId], [tTokenEmbed, tPleTok]);

        // Decode single token embedding
        tCurPos.setData(BigInt64Array.of(BigInt(curPos)));
        model.execute('text_decoder', [tTokenEmbed, tPleTok, tCurPos], [tLogits]);

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
    modalities: modalities ?? ['image', 'audio'],

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
