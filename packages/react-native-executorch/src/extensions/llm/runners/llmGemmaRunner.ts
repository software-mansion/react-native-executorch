import { createSynchronizable } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import type { Model } from '../../../core/model';
import { RnExecuTorchError } from '../../../core/error';
import { f32, i64, method, DynamicDim as Dyn, validateSpec } from '../../../core/schema';

import type { Tokenizer } from '../../nlp';
import { sample } from '../sampler';

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
  // TODO: add `has_ple` metadata
};

export const LLM_GEMMA_SPEC = {
  ...method(
    'token_embedding',
    [i64(1, Dyn('seqLen'))],
    [f32(1, Dyn('seqLen'), 'hiddenDim'), f32(1, Dyn('seqLen'), 'numLayers', 'pleDim')]
  ),
  ...method(
    'text_decoder',
    [
      f32(1, Dyn('seqLen'), 'hiddenDim'),
      f32(1, Dyn('seqLen'), 'numLayers', 'pleDim'),
      i64(Dyn('seqLen')),
    ],
    [f32(1, 1, 'vocabSize')]
  ),
  ...method(
    'vision_encoder', // prettier-ignore
    [f32(1, 3, 'imgH', 'imgW')],
    [f32(1, 'visualTokens', 'hiddenDim')]
  ),
  ...method(
    'audio_encoder',
    [f32(1, Dyn('audioSamples')), i64()],
    [f32(1, Dyn('audioTokens'), 'hiddenDim'), f32(1, Dyn('audioTokens'))]
  ),
  ...METADATA_SPEC,
};

const AUDIO_SAMPLES_PER_BLOCK = 7680;

export function createLLMGemmaRunner(
  model: Model,
  tokenizer: Tokenizer,
  modalities?: readonly Modality[]
): LLMRunner {
  const { dims, dim } = validateSpec(model.schema, { default: LLM_GEMMA_SPEC });

  const [imgH, imgW, vocabSize] = dims.constant('imgH', 'imgW', 'vocabSize');
  const [hiddenDim, visualTokens] = dims.constant('hiddenDim', 'visualTokens');
  const [numLayers, pleDim] = dims.constant('numLayers', 'pleDim');
  const maxSeqLen = dim('seqLen', 'range').max;
  const imgShape = [1, 3, imgH, imgW] as const;

  const [maxContextLen] = model.execute('get_max_context_len', [], []) as [number];
  const eosIds = model.execute('get_eos_ids', [], []) as number[];

  // TODO(bh): validate modalities

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
    // TODO(bh): should be curPos not max ctx len
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

      // TODO(bh): this pattern always when >= 3 tensors
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

  const prefillEmbeddings = (embeddings: Float32Array, numEmbedTokens: number): LLMPrefillStats => {
    'worklet';
    const startMs = Date.now();
    const startPos = pos.getBlocking();

    let offset = 0;
    while (offset < numEmbedTokens && !isCancelled.getBlocking()) {
      const seqLen = Math.min(numEmbedTokens - offset, maxSeqLen);
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

      // Media embeddings (vision / audio) do not carry per-layer token embeddings;
      // zero tensor is passed for ple_tok.
      const zeroPle = new Float32Array(1 * seqLen * numLayers * pleDim);

      const tensors = [
        tensor('float32', [1, seqLen, hiddenDim], chunk),
        tensor('float32', [1, seqLen, numLayers, pleDim], zeroPle),
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

    const tVisionEmbed = tensor('float32', [1, visualTokens, hiddenDim]);
    try {
      model.execute('vision_encoder', [prompt.image], [tVisionEmbed]);
      const embedding = tVisionEmbed.getData(new Float32Array(tVisionEmbed.numel));
      return prefillEmbeddings(embedding, visualTokens);
    } finally {
      tVisionEmbed.dispose();
    }
  };

  const prefillAudio = (prompt: Extract<MediaInput, { kind: 'audio' }>): LLMPrefillStats => {
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

    // Pad waveform to multiple of AUDIO_SAMPLES_PER_BLOCK
    const numBlocks = Math.ceil(numSamples / AUDIO_SAMPLES_PER_BLOCK);
    const paddedSamples = numBlocks * AUDIO_SAMPLES_PER_BLOCK;
    const numAudioTokens = numBlocks * 12; // TODO: magic number

    const rawData = prompt.audio.getData(new Float32Array(numSamples));
    const paddedWav = new Float32Array(paddedSamples);
    paddedWav.set(rawData);

    const tWaveform = tensor('float32', [1, paddedSamples], paddedWav);
    const tNumValid = tensor('int64', [], BigInt64Array.of(BigInt(numSamples))); // TODO: empty shape!!!
    const tAudioEmbeds = tensor('float32', [1, numAudioTokens, hiddenDim]);
    const tAudioMask = tensor('float32', [1, numAudioTokens]);

    try {
      model.execute('audio_encoder', [tWaveform, tNumValid], [tAudioEmbeds, tAudioMask]);
      const embedding = tAudioEmbeds.getData(new Float32Array(tAudioEmbeds.numel));
      return prefillEmbeddings(embedding, numAudioTokens);
    } finally {
      tWaveform.dispose();
      tNumValid.dispose();
      tAudioEmbeds.dispose();
      tAudioMask.dispose();
    }
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
        case 'audio': {
          const stats = prefillAudio(segment);
          totStats = combine(stats, totStats);
          break;
        }
        default:
          throw RnExecuTorchError(
            'INVALID_ARGUMENT',
            `prefill: Unsupported media input kind '${(segment as { kind: string }).kind}'.` // TODO: no need for as
          );
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
    const tPleTok = tensor('float32', [1, 1, numLayers, pleDim]);

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
        model.execute('token_embedding', [tTokenId], [tTokenEmbed, tPleTok]);

        // Decode single token embedding
        tCurPos.setData(BigInt64Array.of(BigInt(curPos)));
        model.execute('text_decoder', [tTokenEmbed, tPleTok, tCurPos], [tLogits]);

        numTokens += 1;
        curPos += 1;
        pos.setBlocking(curPos);
      }
    } finally {
      tTokenId.dispose();
      tTokenEmbed.dispose();
      tPleTok.dispose();
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
  } as unknown as LLMRunner;
}
