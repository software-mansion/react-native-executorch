/**
 * One driver per task pipeline.
 *
 * A driver is everything the runner needs that a registry entry cannot tell it:
 * which factory builds the pipeline, which synchronous call to time, and which
 * key holds the `.pte` for the raw-execute pass. It is written once per task
 * rather than once per variant, because every variant of a task is driven
 * identically — only the weights differ. `src/suite.ts` joins these against the
 * generated variant list, which is what lets 261 published variants be covered
 * without 261 hand-written cases going stale.
 *
 * Every driver feeds an input from `src/inputs.ts`, never a device photo or a
 * recorded clip, so a run on a Pixel and a run on an iPhone measure the same
 * work. See `BENCHMARK_SPEC.md`.
 */

import {
  createClassifier,
  createFsmnVoiceActivityDetector,
  createImageEmbedder,
  createInstanceSegmenter,
  createKeypointDetector,
  createKokoroTextToSpeech,
  createLLMChatSession,
  createObjectDetector,
  createPaddleOcr,
  createPrivacyFilter,
  createSdxsTextToImage,
  createSemanticSegmenter,
  createStyleTransfer,
  createSupertonicTextToSpeech,
  createTextEmbedder,
  createWhisperSpeechToText,
  FSMN_VAD_SAMPLE_RATE_HZ,
  WHISPER_SAMPLE_RATE_HZ,
} from 'react-native-executorch';

import {
  IMAGE_512,
  IMAGE_640,
  LLM_MAX_NEW_TOKENS,
  LLM_PROMPT,
  SAMPLE_PII_TEXT,
  SAMPLE_TEXT,
  SDXS_PROMPT,
  SDXS_SEED,
  syntheticWaveform,
  TTS_TEXT,
} from './inputs';
import type { RegistryVariant } from './variants.generated';

const VAD_WAVEFORM = syntheticWaveform(10, FSMN_VAD_SAMPLE_RATE_HZ);
const WHISPER_WAVEFORM = syntheticWaveform(10, WHISPER_SAMPLE_RATE_HZ);

/** Anything a pipeline factory returns: the runner only needs to release it. */
export interface Disposable {
  dispose: () => void;
}

export interface Driver<TInstance extends Disposable = any> {
  /** Builds the pipeline from a config whose URLs are already local paths. */
  readonly create: (config: any) => Promise<TInstance>;
  /**
   * Key within the config holding the single `.pte` to benchmark in isolation.
   * Omitted for pipelines built from several sub-models, which have no one
   * program to time.
   */
  readonly modelPathKey?: string;
  /** Where the timing is taken. `async` pipelines pay a thread hop per call. */
  readonly mode?: 'worklet' | 'async';
  /** Builds the worklet to time. Returns the iteration's workload size. */
  readonly run?: (instance: TInstance) => () => number;
  /** Builds the RN-thread call to time, for pipelines with no worklet entry. */
  readonly runAsync?: (instance: TInstance) => () => Promise<number>;
  /**
   * Extra per-task numbers, read once after the timed pass. Used by the LLM
   * driver for time-to-first-token and tokens per second, which a single
   * wall-clock figure cannot express.
   */
  readonly detail?: (instance: TInstance) => Record<string, number> | undefined;
  /** Free-text caveat recorded with every result this driver produces. */
  readonly note?: string;
}

const classification: Driver = {
  create: createClassifier,
  modelPathKey: 'modelPath',
  run: (instance) => () => {
    'worklet';
    return instance.classifyWorklet(IMAGE_512, { topk: 5 }).length;
  },
};

const styleTransfer: Driver = {
  create: createStyleTransfer,
  modelPathKey: 'modelPath',
  run: (instance) => () => {
    'worklet';
    return instance.transferStyleWorklet(IMAGE_512).width;
  },
};

const semanticSegmentation: Driver = {
  create: createSemanticSegmenter,
  modelPathKey: 'modelPath',
  run: (instance) => () => {
    'worklet';
    return instance.segmentWorklet(IMAGE_512).buffer.width;
  },
};

const objectDetection: Driver = {
  create: createObjectDetector,
  modelPathKey: 'modelPath',
  run: (instance) => () => {
    'worklet';
    return instance.detectObjectsWorklet(IMAGE_640).length;
  },
};

const keypointDetection: Driver = {
  create: createKeypointDetector,
  modelPathKey: 'modelPath',
  run: (instance) => () => {
    'worklet';
    return instance.detectKeypointsWorklet(IMAGE_512).length;
  },
};

const instanceSegmentation: Driver = {
  create: createInstanceSegmenter,
  modelPathKey: 'modelPath',
  run: (instance) => () => {
    'worklet';
    return instance.segmentInstancesWorklet(IMAGE_640).length;
  },
  // FastSAM pairs a 0.5 confidence threshold with an IoU of 0.9, which
  // suppresses almost nothing: on a textured synthetic image nearly every
  // candidate survives and each materialises a full 640x640 mask in JS. Its
  // pipeline figure is dominated by that post-processing, not by inference, so
  // read its `execute.*` rows instead.
  note: 'post-processing is mask-bound; compare the raw-execute methods',
};

const imageEmbeddings: Driver = {
  create: createImageEmbedder,
  modelPathKey: 'modelPath',
  run: (instance) => () => {
    'worklet';
    return instance.embedWorklet(IMAGE_512).length;
  },
};

const textEmbeddings: Driver = {
  create: createTextEmbedder,
  modelPathKey: 'modelPath',
  run: (instance) => () => {
    'worklet';
    return instance.embedWorklet(SAMPLE_TEXT).length;
  },
};

const privacyFilter: Driver = {
  create: createPrivacyFilter,
  modelPathKey: 'modelPath',
  run: (instance) => () => {
    'worklet';
    return instance.detectPiiWorklet(SAMPLE_PII_TEXT).length;
  },
};

const voiceActivityDetection: Driver = {
  create: createFsmnVoiceActivityDetector,
  modelPathKey: 'modelPath',
  run: (instance) => () => {
    'worklet';
    return instance.detectVoiceWorklet(VAD_WAVEFORM).length;
  },
};

const speechToText: Driver = {
  create: createWhisperSpeechToText,
  modelPathKey: 'modelPath',
  run: (instance) => () => {
    'worklet';
    return instance.transcribeWorklet(WHISPER_WAVEFORM, { language: 'en' }).length;
  },
  // The synthetic waveform is voice-shaped but is not speech, so the decoder
  // emits far fewer tokens than a real clip would and the pipeline figure is
  // dominated by the encoder. The comparator invalidates the pipeline number
  // outright if the transcript length moves between runs.
  note: 'decode length is input-dependent; compare the raw-execute methods',
};

const ocr: Driver = {
  create: createPaddleOcr,
  modelPathKey: 'modelPath',
  run: (instance) => () => {
    'worklet';
    return instance.recognizeCharactersWorklet(IMAGE_640).length;
  },
  note: 'recognizer cost scales with the regions the detector finds',
};

const textToImage: Driver = {
  create: createSdxsTextToImage,
  modelPathKey: 'modelPath',
  run: (instance) => () => {
    'worklet';
    return instance.generateWorklet(SDXS_PROMPT, SDXS_SEED).width;
  },
};

/**
 * Picks the voice a text-to-speech case synthesises with.
 *
 * Sorted rather than taken in declaration order: the voice changes how much
 * audio comes out, so two devices picking different voices would be timing
 * different amounts of vocoder work. Sorting makes the choice a property of the
 * voice set, not of the order the registry happens to list it in.
 * @param voices The config's voice map.
 * @returns The chosen voice key.
 * @throws {Error} When the config publishes no voices at all.
 */
function firstVoice(voices: Record<string, string> | undefined): string {
  const names = Object.keys(voices ?? {}).sort();
  if (names.length === 0) throw new Error('text-to-speech config publishes no voices');
  return names[0]!;
}

const supertonicTts: Driver = {
  create: async (config) => {
    const tts = await createSupertonicTextToSpeech(config);
    const voiceStyle = firstVoice(config.voiceStyles);
    return {
      dispose: tts.dispose,
      synthesize: () => tts.synthesize(TTS_TEXT, { voiceStyle }),
      voice: voiceStyle,
    };
  },
  mode: 'async',
  runAsync: (instance) => async () => {
    let samples = 0;
    for await (const chunk of instance.synthesize()) samples += chunk.audio.length;
    return samples;
  },
  // Four sub-models with JS-thread orchestration between chunks: no synchronous
  // entry point to time, and no single `.pte` for the raw-execute pass.
  note: 'timed on the RN thread; includes per-chunk thread hops',
};

const kokoroTts: Driver = {
  create: async (config) => {
    const tts = await createKokoroTextToSpeech(config);
    const voice = firstVoice(config.voices);
    return {
      dispose: tts.dispose,
      synthesize: () => tts.synthesize(TTS_TEXT, { voice }),
      voice,
    };
  },
  mode: 'async',
  runAsync: (instance) => async () => {
    let samples = 0;
    for await (const chunk of instance.synthesize()) samples += chunk.audio.length;
    return samples;
  },
  note: 'timed on the RN thread; includes per-chunk thread hops',
};

/**
 * The LLM driver.
 *
 * Generation is pinned to a fixed token count with EOS ignored and temperature
 * zero, so every iteration on every device does exactly the same amount of
 * decode work. Without that pin the measurement would depend on how long an
 * answer the model felt like giving, which differs per model, per quantisation,
 * and between two runs of the same model — and a wall-clock figure over a
 * varying token count measures nothing.
 *
 * `resetOnTurn` keeps each iteration a cold prompt rather than an append onto a
 * KV cache the previous iteration grew, which would make iteration N cheaper
 * than iteration 1 for reasons unrelated to the build under test.
 * @returns The driver, holding the last turn's stats for `detail` to read.
 */
function llmDriver(): Driver {
  // Written by each timed call, read once by `detail` after the timed pass.
  let lastTtftMs = 0;
  let lastPrefillMs = 0;
  let lastPromptTokens = 0;

  return {
    create: (config) =>
      createLLMChatSession(config, {
        generationConfig: {
          maxNewTokens: LLM_MAX_NEW_TOKENS,
          temperature: 0,
          ignoreEos: true,
        },
        resetOnTurn: true,
      }),
    modelPathKey: 'modelPath',
    mode: 'async',
    runAsync: (session) => async () => {
      const turn = await session.sendMessage(LLM_PROMPT);
      const stats = turn.stats[turn.stats.length - 1];
      if (stats) {
        lastTtftMs = Math.max(0, stats.firstTokenMs - stats.inferenceStartMs);
        lastPrefillMs = stats.prefillDurationMs ?? 0;
        lastPromptTokens = stats.numPromptTokens;
        return stats.numGeneratedTokens;
      }
      return 0;
    },
    detail: () => ({
      timeToFirstTokenMs: Math.round(lastTtftMs * 1000) / 1000,
      prefillMs: Math.round(lastPrefillMs * 1000) / 1000,
      promptTokens: lastPromptTokens,
    }),
    note: `decode pinned to ${LLM_MAX_NEW_TOKENS} tokens with EOS ignored; multimodal models are driven text-only`,
  };
}

const llm = llmDriver();

/** Drivers that serve a whole task. */
const BY_TASK: Readonly<Record<string, Driver>> = {
  classification,
  styleTransfer,
  semanticSegmentation,
  objectDetection,
  keypointDetection,
  instanceSegmentation,
  imageEmbeddings,
  textEmbeddings,
  privacyFilter,
  voiceActivityDetection,
  speechToText,
  ocr,
  textToImage,
  llm,
};

/**
 * Tasks whose models are driven by different factories, keyed by the first
 * segment of the model path. Text-to-speech is the only one: Kokoro and
 * Supertonic share a registry category but not an API.
 */
const BY_TASK_AND_MODEL: Readonly<Record<string, Readonly<Record<string, Driver>>>> = {
  textToSpeech: { SUPERTONIC: supertonicTts, KOKORO: kokoroTts },
};

/**
 * Resolves the driver for a variant.
 * @param variant The registry variant to benchmark.
 * @returns Its driver, or null when the task has none — `tokenizer` is a
 * registry entry but not a model, and a task added to the registry without a
 * driver here is reported as skipped rather than silently dropped.
 */
export function driverFor(variant: RegistryVariant): Driver | null {
  const byModel = BY_TASK_AND_MODEL[variant.task];
  if (byModel) {
    const family = variant.model.split('.')[0]!;
    return byModel[family] ?? null;
  }
  return BY_TASK[variant.task] ?? null;
}
