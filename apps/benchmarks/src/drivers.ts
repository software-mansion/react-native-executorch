/**
 * One driver per task pipeline.
 *
 * A driver is everything the runner needs that a registry entry cannot tell it:
 * which factory builds the pipeline and which call to time. It is written once
 * per task rather than once per variant, because every variant of a task is
 * driven identically — only the weights differ. `src/suite.ts` joins these
 * against the registry's variant list, which is what lets hundreds of published
 * variants be covered without hand-written cases going stale.
 *
 * Every driver feeds an input from `src/inputs.ts`, never a device photo or a
 * recorded clip, so a run on a Pixel and a run on an iPhone measure the same
 * work. See `BENCHMARK_SPEC.md`.
 */

import {
  createClassifier,
  createColbertEmbedder,
  createDepthEstimator,
  createFsmnVoiceActivityDetector,
  createImageEmbedder,
  createInstanceSegmenter,
  createKeypointDetector,
  createKokoroTextToSpeech,
  createObjectDetector,
  createPaddleOcr,
  createPrivacyFilter,
  createSdxsTextToImage,
  createSemanticSegmenter,
  createStyleTransfer,
  createSupertonicTextToSpeech,
  createTextEmbedder,
  createWhisperSpeechToText,
  createResourceScope,
  defaultWorkletRuntime,
  llm as llmApi,
  wrapAsync,
  type LLMModel,
  FSMN_VAD_SAMPLE_RATE_HZ,
  WHISPER_SAMPLE_RATE_HZ,
} from 'react-native-executorch';

import RNBlobUtil from 'react-native-blob-util';

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
import type { RegistryVariant } from './registry';

const VAD_WAVEFORM = syntheticWaveform(10, FSMN_VAD_SAMPLE_RATE_HZ);
const WHISPER_WAVEFORM = syntheticWaveform(10, WHISPER_SAMPLE_RATE_HZ);

/** Anything a pipeline factory returns: the runner only needs to release it. */
export interface Disposable {
  dispose: () => void;
}

export interface Driver<TInstance extends Disposable = any> {
  /** Builds the pipeline from a config whose URLs are already local paths. */
  readonly create: (config: any) => Promise<TInstance>;
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
  run: (instance) => () => {
    'worklet';
    return instance.classifyWorklet(IMAGE_512, { topk: 5 }).length;
  },
};

const styleTransfer: Driver = {
  create: createStyleTransfer,
  run: (instance) => () => {
    'worklet';
    return instance.transferStyleWorklet(IMAGE_512).width;
  },
};

const semanticSegmentation: Driver = {
  create: createSemanticSegmenter,
  run: (instance) => () => {
    'worklet';
    return instance.segmentWorklet(IMAGE_512).buffer.width;
  },
};

const objectDetection: Driver = {
  create: createObjectDetector,
  run: (instance) => () => {
    'worklet';
    return instance.detectObjectsWorklet(IMAGE_640).length;
  },
};

const keypointDetection: Driver = {
  create: createKeypointDetector,
  run: (instance) => () => {
    'worklet';
    return instance.detectKeypointsWorklet(IMAGE_512).length;
  },
};

const instanceSegmentation: Driver = {
  create: createInstanceSegmenter,
  run: (instance) => () => {
    'worklet';
    return instance.segmentInstancesWorklet(IMAGE_640).length;
  },
  // FastSAM pairs a 0.5 confidence threshold with an IoU of 0.9, which
  // suppresses almost nothing: on a textured synthetic image nearly every
  // candidate survives and each materialises a full 640x640 mask in JS. Its
  // pipeline figure is dominated by that post-processing, not by inference, so
  // read its `execute.*` rows instead.
  note: 'post-processing is mask-bound; read Execute %',
};

const imageEmbeddings: Driver = {
  create: createImageEmbedder,
  run: (instance) => () => {
    'worklet';
    return instance.embedWorklet(IMAGE_512).length;
  },
};

const textEmbeddings: Driver = {
  create: createTextEmbedder,
  run: (instance) => () => {
    'worklet';
    return instance.embedWorklet(SAMPLE_TEXT).length;
  },
};

const depthEstimation: Driver = {
  create: createDepthEstimator,
  run: (instance) => () => {
    'worklet';
    return instance.estimateDepthWorklet(IMAGE_512).data.length;
  },
};

const colbertEmbeddings: Driver = {
  create: createColbertEmbedder,
  run: (instance) => () => {
    'worklet';
    return instance.embedWorklet(SAMPLE_TEXT, 'document').numTokens;
  },
};

const privacyFilter: Driver = {
  create: createPrivacyFilter,
  run: (instance) => () => {
    'worklet';
    return instance.detectPiiWorklet(SAMPLE_PII_TEXT).length;
  },
};

const voiceActivityDetection: Driver = {
  create: createFsmnVoiceActivityDetector,
  run: (instance) => () => {
    'worklet';
    return instance.detectVoiceWorklet(VAD_WAVEFORM).length;
  },
};

const speechToText: Driver = {
  create: createWhisperSpeechToText,
  run: (instance) => () => {
    'worklet';
    return instance.transcribeWorklet(WHISPER_WAVEFORM, { language: 'en' }).length;
  },
  // The synthetic waveform is voice-shaped but is not speech, so the decoder
  // emits far fewer tokens than a real clip would and the pipeline figure is
  // dominated by the encoder. The comparator invalidates the pipeline number
  // outright if the transcript length moves between runs.
  note: 'decode length is input-dependent; read Execute %',
};

const ocr: Driver = {
  create: createPaddleOcr,
  run: (instance) => () => {
    'worklet';
    return instance.recognizeCharactersWorklet(IMAGE_640).length;
  },
  note: 'recognizer cost scales with the regions the detector finds',
};

const textToImage: Driver = {
  create: createSdxsTextToImage,
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
  // entry point to time.
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

type LLMBenchmarkInstance = Disposable & {
  readonly runner: llmApi.LLMRunner;
  readonly preprocessor: llmApi.ChatPreprocessor;
};

/**
 * Benchmarks independent, fixed-length generations from the same chat prompt.
 *
 * A chat session retains conversation history even with `resetOnTurn`, which
 * resets only its KV cache. Use the runner directly so every iteration starts
 * with an empty cache and exactly one user message.
 * @returns The driver with the latest generation's prefill and decode stats.
 */
function llmDriver(): Driver<LLMBenchmarkInstance> {
  let lastTtftMs = 0;
  let lastPrefillMs = 0;
  let lastPromptTokens = 0;

  return {
    create: async (config: LLMModel) => {
      const scope = createResourceScope();
      try {
        const text = await RNBlobUtil.fs.readFile(config.tokenizerConfigPath, 'utf8');
        const { chatTemplate, bosToken, eosToken } = llmApi.parseTokenizerConfig(JSON.parse(text));
        const preprocessor = scope.track(
          llmApi.createChatPreprocessor({
            chatTemplate,
            bosToken,
            eosToken,
            modalities: config.modalities,
            preprocessorConfig: config.preprocessorConfig,
          })
        );
        const runner = scope.track(
          await llmApi.createLLMRunner(config.modelPath, config.tokenizerPath, config.modalities)
        );
        return { runner, preprocessor, dispose: scope.dispose };
      } catch (error) {
        scope.dispose();
        throw error;
      }
    },
    mode: 'async',
    runAsync: ({ runner, preprocessor }) => {
      let expectedPromptTokens: number | undefined;
      return async () => {
        const prompt = preprocessor.process([{ role: 'user', content: LLM_PROMPT }], 1);
        try {
          const stats = await wrapAsync((input: llmApi.Prompt) => {
            'worklet';
            runner.reset();
            const started = performance.now();
            let timeToFirstTokenMs = -1;
            const generation = runner.generate(
              input,
              {
                maxNewTokens: LLM_MAX_NEW_TOKENS,
                temperature: 0,
                ignoreEos: true,
              },
              () => {
                if (timeToFirstTokenMs < 0) timeToFirstTokenMs = performance.now() - started;
              }
            );
            return { ...generation, timeToFirstTokenMs };
          }, defaultWorkletRuntime)(prompt);
          if (
            stats.numTokens !== LLM_MAX_NEW_TOKENS ||
            (expectedPromptTokens !== undefined && stats.prefill.numTokens !== expectedPromptTokens)
          ) {
            throw new Error(
              'LLM benchmark workload changed: expected a fixed prompt and 64 generated tokens'
            );
          }
          expectedPromptTokens = stats.prefill.numTokens;
          lastTtftMs = stats.timeToFirstTokenMs;
          lastPrefillMs = stats.prefill.durationMs;
          lastPromptTokens = stats.prefill.numTokens;
          return stats.numTokens;
        } finally {
          preprocessor.clear();
        }
      };
    },
    detail: () => ({
      timeToFirstTokenMs: Math.round(lastTtftMs * 1000) / 1000,
      prefillMs: lastPrefillMs,
      promptTokens: lastPromptTokens,
    }),
    note: `independent single-user chat prompt; KV cache reset each iteration; ${LLM_MAX_NEW_TOKENS} generated tokens with EOS ignored; multimodal models are driven text-only`,
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
  depthEstimation,
  colbertEmbeddings,
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
