/**
 * The benchmark case list.
 *
 * A case pairs a model from the registry with the task pipeline that drives it
 * and a deterministic input. Cases are split into two tiers because the whole
 * suite is gated on download size far more than on runtime: `quick` stays under
 * roughly 150 MB of model files and finishes in a couple of minutes, which is
 * what you want when bisecting. `full` adds the larger models and the pipelines
 * whose downloads run to several hundred megabytes.
 *
 * Adding a case means adding an entry here and nothing else — the runner
 * discovers what to measure from the task instance and the model schema.
 */

import {
  createClassifier,
  createFsmnVoiceActivityDetector,
  createImageEmbedder,
  createInstanceSegmenter,
  createKokoroTextToSpeech,
  createKeypointDetector,
  createObjectDetector,
  createPaddleOcr,
  createPrivacyFilter,
  createSemanticSegmenter,
  createStyleTransfer,
  createSupertonicTextToSpeech,
  createTextEmbedder,
  createWhisperSpeechToText,
  SUPERTONIC_DEFAULT_VOICE_NAMES,
  models,
  FSMN_VAD_SAMPLE_RATE_HZ,
  WHISPER_SAMPLE_RATE_HZ,
} from 'react-native-executorch';
import { Platform } from 'react-native';

import { SAMPLE_PII_TEXT, SAMPLE_TEXT, syntheticImage, syntheticWaveform } from './inputs';
import type { SuiteName } from './config';

interface CaseCommon<TInstance extends { dispose: () => void }> {
  /** Stable identifier. Used by `EXPO_PUBLIC_BENCH_ONLY` and by the comparator. */
  readonly id: string;
  /** Registry category, e.g. `classification`. */
  readonly task: string;
  /** Registry path of the model variant, e.g. `EFFICIENTNET_V2_S.XNNPACK_INT8`. */
  readonly model: string;
  readonly tier: SuiteName;
  /** Platforms the case can run on. Omit for both. */
  readonly platforms?: readonly ('ios' | 'android')[];
  /**
   * Task config with the registry's remote URLs still in place. The runner
   * resolves them to local paths with `download` before calling `create`.
   */
  readonly config: any;
  /**
   * Key within `config` holding the main `.pte`, for the raw-execute pass. Omit
   * on pipelines built from several sub-models, which have no single program to
   * benchmark in isolation.
   */
  readonly modelPathKey?: string;
  readonly create: (config: any) => Promise<TInstance>;
  /** Free-text caveat recorded with the result. */
  readonly note?: string;
}

/**
 * A case timed on the worklet runtime through the pipeline's synchronous entry
 * point. This is the accurate path and the default.
 */
interface WorkletCase<TInstance extends { dispose: () => void }> extends CaseCommon<TInstance> {
  readonly mode?: 'worklet';
  /**
   * Builds the worklet to time. It returns the iteration's workload size, so a
   * pipeline whose cost depends on its own output (tokens decoded, boxes kept)
   * can report it; constant-work pipelines return 1. The comparator refuses to
   * diff two runs whose workload sizes differ.
   */
  readonly run: (instance: TInstance) => () => number;
}

/**
 * A case timed from the React Native thread, for pipelines with no synchronous
 * entry point to call.
 */
interface AsyncCase<TInstance extends { dispose: () => void }> extends CaseCommon<TInstance> {
  readonly mode: 'async';
  readonly runAsync: (instance: TInstance) => () => Promise<number>;
}

export type BenchCase<TInstance extends { dispose: () => void } = any> =
  | WorkletCase<TInstance>
  | AsyncCase<TInstance>;

/**
 * Type-checks one case against the pipeline it drives.
 *
 * The case list is heterogeneous, so the array itself can only be typed as
 * `BenchCase<any>` — and `any` would let `instance.classifyWorklet` keep
 * compiling after the pipeline renamed that method, which is exactly the rot a
 * benchmark suite is prone to. Naming the pipeline's `create` as a separate
 * leading parameter makes it its own inference site, resolved before the object
 * literal is checked, so `run` sees the real instance type. Passing `create`
 * inside the literal instead does not work: it is then inferred alongside `run`,
 * and `TInstance` collapses to its constraint.
 * @typeParam TInstance The task runner type, inferred from `create`.
 * @param create The pipeline's factory.
 * @param body The rest of the case.
 * @returns The assembled case, widened for the array.
 */
const defineCase = <TInstance extends { dispose: () => void }>(
  create: (config: any) => Promise<TInstance>,
  body: Omit<WorkletCase<TInstance>, 'create'> | Omit<AsyncCase<TInstance>, 'create'>
): BenchCase => ({ ...body, create }) as BenchCase;

// Vision inputs are generated once and shared: they are pure data, and building
// a 640x640 scene costs more than the inference being measured.
const IMAGE_512 = syntheticImage(512, 512);
const IMAGE_640 = syntheticImage(640, 640);
const VAD_WAVEFORM = syntheticWaveform(10, FSMN_VAD_SAMPLE_RATE_HZ);
const WHISPER_WAVEFORM = syntheticWaveform(10, WHISPER_SAMPLE_RATE_HZ);
const SUPERTONIC_VOICE = SUPERTONIC_DEFAULT_VOICE_NAMES[0]!;
const KOKORO_VOICE = Object.keys(
  models.textToSpeech.KOKORO.EN_US.XNNPACK_FP32.voices
)[0]! as keyof typeof models.textToSpeech.KOKORO.EN_US.XNNPACK_FP32.voices;

export const CASES: readonly BenchCase[] = [
  defineCase(createClassifier, {
    id: 'classification/efficientnet-v2-s-xnnpack-int8',
    task: 'classification',
    model: 'EFFICIENTNET_V2_S.XNNPACK_INT8',
    tier: 'quick',
    config: models.classification.EFFICIENTNET_V2_S.XNNPACK_INT8,
    modelPathKey: 'modelPath',
    run: (instance) => () => {
      'worklet';
      return instance.classifyWorklet(IMAGE_512, { topk: 5 }).length;
    },
  }),
  defineCase(createClassifier, {
    id: 'classification/efficientnet-v2-s-coreml-fp16',
    task: 'classification',
    model: 'EFFICIENTNET_V2_S.COREML_FP16',
    tier: 'quick',
    platforms: ['ios'],
    config: models.classification.EFFICIENTNET_V2_S.COREML_FP16,
    modelPathKey: 'modelPath',
    run: (instance) => () => {
      'worklet';
      return instance.classifyWorklet(IMAGE_512, { topk: 5 }).length;
    },
    // CoreML programs fail to encode on the iOS Simulator, so this case only
    // produces numbers on real hardware.
    note: 'physical device only',
  }),
  defineCase(createSemanticSegmenter, {
    id: 'semantic-segmentation/selfie-xnnpack-fp32',
    task: 'semanticSegmentation',
    model: 'SELFIE_SEGMENTATION.XNNPACK_FP32',
    tier: 'quick',
    config: models.semanticSegmentation.SELFIE_SEGMENTATION.XNNPACK_FP32,
    modelPathKey: 'modelPath',
    run: (instance) => () => {
      'worklet';
      return instance.segmentWorklet(IMAGE_512).buffer.width;
    },
  }),
  defineCase(createStyleTransfer, {
    id: 'style-transfer/candy-xnnpack-int8',
    task: 'styleTransfer',
    model: 'CANDY.XNNPACK_INT8',
    tier: 'quick',
    config: models.styleTransfer.CANDY.XNNPACK_INT8,
    modelPathKey: 'modelPath',
    run: (instance) => () => {
      'worklet';
      return instance.transferStyleWorklet(IMAGE_512).width;
    },
  }),
  defineCase(createKeypointDetector, {
    id: 'keypoint-detection/blazeface-xnnpack-fp32',
    task: 'keypointDetection',
    model: 'BLAZEFACE.XNNPACK_FP32',
    tier: 'quick',
    config: models.keypointDetection.BLAZEFACE.XNNPACK_FP32,
    modelPathKey: 'modelPath',
    run: (instance) => () => {
      'worklet';
      return instance.detectKeypointsWorklet(IMAGE_512).length;
    },
  }),
  defineCase(createTextEmbedder, {
    id: 'text-embeddings/all-minilm-l6-v2-xnnpack-fp32',
    task: 'textEmbeddings',
    model: 'ALL_MINILM_L6_V2.XNNPACK_FP32',
    tier: 'quick',
    config: models.textEmbeddings.ALL_MINILM_L6_V2.XNNPACK_FP32,
    modelPathKey: 'modelPath',
    run: (instance) => () => {
      'worklet';
      return instance.embedWorklet(SAMPLE_TEXT).length;
    },
  }),
  defineCase(createFsmnVoiceActivityDetector, {
    id: 'vad/fsmn-xnnpack-fp32',
    task: 'voiceActivityDetection',
    model: 'FSMN_VAD.XNNPACK_FP32',
    tier: 'quick',
    config: models.voiceActivityDetection.FSMN_VAD.XNNPACK_FP32,
    modelPathKey: 'modelPath',
    run: (instance) => () => {
      'worklet';
      return instance.detectVoiceWorklet(VAD_WAVEFORM).length;
    },
  }),

  defineCase(createObjectDetector, {
    id: 'object-detection/ssdlite320-xnnpack-fp32',
    task: 'objectDetection',
    model: 'SSDLITE320_MOBILENET_V3_LARGE.XNNPACK_FP32',
    tier: 'full',
    config: models.objectDetection.SSDLITE320_MOBILENET_V3_LARGE.XNNPACK_FP32,
    modelPathKey: 'modelPath',
    run: (instance) => () => {
      'worklet';
      return instance.detectObjectsWorklet(IMAGE_640).length;
    },
  }),
  defineCase(createObjectDetector, {
    id: 'object-detection/yolo26-nano-384-xnnpack-fp32',
    task: 'objectDetection',
    model: 'YOLO26.NANO.SIZE_384.XNNPACK_FP32',
    tier: 'full',
    config: models.objectDetection.YOLO26.NANO.SIZE_384.XNNPACK_FP32,
    modelPathKey: 'modelPath',
    run: (instance) => () => {
      'worklet';
      return instance.detectObjectsWorklet(IMAGE_640).length;
    },
  }),
  defineCase(createImageEmbedder, {
    id: 'image-embeddings/clip-vit-base-patch32-xnnpack-fp32',
    task: 'imageEmbeddings',
    model: 'CLIP_VIT_BASE_PATCH32.XNNPACK_FP32',
    tier: 'full',
    config: models.imageEmbeddings.CLIP_VIT_BASE_PATCH32.XNNPACK_FP32,
    modelPathKey: 'modelPath',
    run: (instance) => () => {
      'worklet';
      return instance.embedWorklet(IMAGE_512).length;
    },
  }),
  defineCase(createPrivacyFilter, {
    id: 'privacy-filter/openai-xnnpack-8da4w',
    task: 'privacyFilter',
    model: 'OPENAI.XNNPACK_8DA4W',
    tier: 'full',
    config: models.privacyFilter.OPENAI.XNNPACK_8DA4W,
    modelPathKey: 'modelPath',
    run: (instance) => () => {
      'worklet';
      return instance.detectPiiWorklet(SAMPLE_PII_TEXT).length;
    },
  }),
  defineCase(createWhisperSpeechToText, {
    id: 'speech-to-text/whisper-tiny-en-xnnpack-fp32',
    task: 'speechToText',
    model: 'WHISPER.EN.TINY.XNNPACK_FP32',
    tier: 'full',
    config: models.speechToText.WHISPER.EN.TINY.XNNPACK_FP32,
    modelPathKey: 'modelPath',
    run: (instance) => () => {
      'worklet';
      return instance.transcribeWorklet(WHISPER_WAVEFORM, { language: 'en' }).length;
    },
    // The synthetic waveform is voice-shaped but is not speech, so the decoder
    // emits far fewer tokens than a real clip would and the pipeline figure is
    // dominated by the encoder. The per-method numbers from the raw-execute pass
    // are the ones to trust here; the comparator invalidates the pipeline figure
    // outright if the transcript length moves between runs.
    note: 'decode length is input-dependent; compare the raw-execute methods',
  }),
  defineCase(createSupertonicTextToSpeech, {
    id: 'text-to-speech/supertonic-xnnpack-fp32',
    task: 'textToSpeech',
    model: 'SUPERTONIC.XNNPACK_FP32',
    tier: 'full',
    config: models.textToSpeech.SUPERTONIC.XNNPACK_FP32,
    mode: 'async',
    runAsync: (instance) => async () => {
      let samples = 0;
      for await (const chunk of instance.synthesize(SAMPLE_TEXT, {
        voiceStyle: SUPERTONIC_VOICE,
      })) {
        samples += chunk.audio.length;
      }
      return samples;
    },
    // Supertonic streams through four sub-models with JS-thread orchestration
    // between chunks, so there is no synchronous entry point to time, and no
    // single `.pte` for the raw-execute pass. These numbers include one thread
    // hop per chunk.
    note: 'timed on the RN thread; includes per-chunk thread hops',
  }),
  defineCase(createInstanceSegmenter, {
    id: 'instance-segmentation/rfdetr-nano-xnnpack-fp32',
    task: 'instanceSegmentation',
    model: 'RFDETR_NANO.XNNPACK_FP32',
    tier: 'full',
    config: models.instanceSegmentation.RFDETR_NANO.XNNPACK_FP32,
    modelPathKey: 'modelPath',
    run: (instance) => () => {
      'worklet';
      return instance.segmentInstancesWorklet(IMAGE_640).length;
    },
    // RF-DETR rather than FastSAM on purpose. FastSAM pairs a 0.5 confidence
    // threshold with an IoU of 0.9, which suppresses almost nothing, so on a
    // textured synthetic image nearly every candidate survives and each one
    // materialises a full 640x640 mask in JS. That wedged a run. RF-DETR emits
    // a fixed set of queries and runs NMS at 0.55, so its post-processing is
    // bounded whatever the input happens to look like.
    note: 'bounded query set; FastSAM is unsuitable for synthetic input',
  }),
  defineCase(createPaddleOcr, {
    id: 'ocr/ppocrv6-small-xnnpack-int8',
    task: 'ocr',
    model: 'PADDLE.PPOCRV6_SMALL.XNNPACK',
    tier: 'full',
    config: models.ocr.PADDLE.PPOCRV6_SMALL.XNNPACK,
    run: (instance) => () => {
      'worklet';
      return instance.recognizeCharactersWorklet(IMAGE_640).length;
    },
    // Detector plus recognizer: the recognizer runs once per detected box, so
    // the timing depends on how many regions the synthetic scene produces.
    note: 'two models; recognizer cost scales with detected regions',
  }),
  defineCase(createKokoroTextToSpeech, {
    id: 'text-to-speech/kokoro-en-us-xnnpack-fp32',
    task: 'textToSpeech',
    model: 'KOKORO.EN_US.XNNPACK_FP32',
    tier: 'full',
    config: models.textToSpeech.KOKORO.EN_US.XNNPACK_FP32,
    mode: 'async',
    runAsync: (instance) => async () => {
      let samples = 0;
      for await (const chunk of instance.synthesize(SAMPLE_TEXT, {
        voice: KOKORO_VOICE,
      })) {
        samples += chunk.audio.length;
      }
      return samples;
    },
    // Same shape as Supertonic: a chunked generator driven from the RN thread,
    // so there is no single synchronous call to time.
    note: 'timed on the RN thread; includes per-chunk thread hops',
  }),
];

/**
 * Selects the cases to run.
 * @param suite The tier to run when `only` is empty.
 * @param only Explicit case ids. Non-empty overrides `suite`.
 * @returns The runnable cases for the current platform, in declaration order.
 */
export function selectCases(suite: SuiteName, only: readonly string[]): BenchCase[] {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  return CASES.filter((benchCase) => {
    if (benchCase.platforms && !benchCase.platforms.includes(platform)) return false;
    if (only.length > 0) return only.includes(benchCase.id);
    return suite === 'full' || benchCase.tier === 'quick';
  });
}
