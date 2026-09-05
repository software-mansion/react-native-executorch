/**
 * Pre-configured registry of hosted on-device AI models.
 *
 * Provides ready-to-use configurations for popular models across computer
 * vision, speech synthesis/recognition, natural language processing, and large
 * language models (LLMs). Each entry includes verified remote `.pte` download
 * URLs, tokenizer/phonemizer files, preprocessing parameters, and label maps.
 *
 * A model that ships several exports lists them under backend-tagged keys and
 * wraps the group in `variants`, which adds the `DEFAULT` alias resolving to
 * the fastest export the current platform can run. Within one backend the
 * first variant declared wins, so keep the group ordered best-first.
 */

import { Platform } from 'react-native';

import { rnexecutorchJsi } from './native/bridge';
import { getRegisteredBackends } from './utils';
import type { ClassifierModel } from './extensions/cv/tasks/classification';
import type { ObjectDetectorModel } from './extensions/cv/tasks/objectDetection';
import type { StyleTransferModel } from './extensions/cv/tasks/styleTransfer';
import type { SemanticSegmenterModel } from './extensions/cv/tasks/semanticSegmentation';
import type { KeypointDetectorModel } from './extensions/cv/tasks/keypointDetection';
import type { InstanceSegmenterModel } from './extensions/cv/tasks/instanceSegmentation';
import type { ImageEmbedderModel } from './extensions/cv/tasks/imageEmbedding';
import type { SdxsTextToImageModel } from './extensions/cv/tasks/sdxsTextToImage';
import type { TextEmbedderModel } from './extensions/nlp/tasks/textEmbedding';
import type { PrivacyFilterModel } from './extensions/nlp/tasks/privacyFilter';
import type { FsmnVadModel } from './extensions/speech/tasks/fsmnVoiceActivityDetection';
import type { SupertonicTtsModel } from './extensions/speech/tasks/supertonicTextToSpeech';
import type { KokoroTtsModel } from './extensions/speech/tasks/kokoroTextToSpeech';
import type { PhonemizerLanguage } from './extensions/speech/utils/phonemizer';
import {
  type WhisperSttModel,
  WHISPER_LANGUAGES,
} from './extensions/speech/tasks/whisperSpeechToText';
import type { PaddleOcrModel } from './extensions/cv/tasks/paddleOcr';
import type { LLMModel } from './extensions/llm/tasks/llmChatSession';
import {
  IMAGENET_NORM,
  IMAGENET1K_LABELS,
  PASCAL_VOC_LABELS,
  COCO_CLASSES,
  COCO_CLASSES_YOLO,
  BLAZEFACE_LANDMARKS,
  COCO_LANDMARKS,
  SUPERTONIC_DEFAULT_VOICE_NAMES,
  PRIVACY_FILTER_OPENAI_LABELS,
  PRIVACY_FILTER_NEMOTRON_LABELS,
  type PrivacyFilterOpenaiLabel,
  type PrivacyFilterNemotronLabel,
  type ImageNet1KLabel,
  type PascalVocLabel,
  type CocoClass,
  type CocoClassYolo,
  type BlazeFaceLandmark,
  type CocoLandmark,
  type SupertonicDefaultVoiceName,
} from './constants';

// =============================================================================
// DEFAULT variant resolution
// =============================================================================
// `DEFAULT` is resolved once, when this module is first imported, from the
// platform, the backends the binary was linked with, and the order the
// variants are declared in. A group whose best export does not follow from
// that order pins one per platform — see the second argument of `variants`.

/** Every backend the registry publishes for, spelled as the variant keys spell it. */
const ALL_BACKENDS = ['xnnpack', 'coreml', 'mlx', 'vulkan'] as const;

/** The backend prefix a variant key starts with. */
type BackendTag = (typeof ALL_BACKENDS)[number];

/** The platforms the registry resolves defaults for. */
type TargetPlatform = 'ios' | 'android';

const PLATFORM: TargetPlatform = Platform.OS === 'ios' ? 'ios' : 'android';

// Accelerators lead and XNNPACK trails: a model is only exported to Core ML,
// MLX or Vulkan once it has been shown to run better there, and XNNPACK is the
// one backend every model exports to. Core ML sits above MLX only to make the
// order deterministic; every group publishing both pins its winner explicitly.
//
// The iOS simulator links the Core ML backend but cannot run it: no Neural
// Engine, and MPSGraph refuses the compiled models. MLX only ever ships a
// device slice, so it has nothing to run there either.
const BACKEND_ORDER: Record<TargetPlatform, readonly BackendTag[]> = {
  ios: rnexecutorchJsi.isEmulator === true ? ['xnnpack'] : ['coreml', 'mlx', 'xnnpack'],
  android: ['vulkan', 'xnnpack'],
};

/**
 * The backends this platform may default to, best first.
 * @returns This platform's order, less every backend the binary was not linked
 * with — or the order untouched when the native runtime cannot be asked, so
 * that a missing answer widens the choice rather than emptying it.
 */
function getCandidateBackends(): readonly BackendTag[] {
  let registered: readonly string[] = [];
  try {
    registered = getRegisteredBackends();
  } catch {
    registered = [];
  }
  if (registered.length === 0) return BACKEND_ORDER[PLATFORM];

  const names = registered.map((name) => name.toLowerCase());
  return BACKEND_ORDER[PLATFORM].filter((tag) => names.some((name) => name.startsWith(tag)));
}

const CANDIDATE_BACKENDS = getCandidateBackends();

/**
 * Picks the variant key this platform should default to.
 * @param keys The group's variant keys, in declaration order.
 * @param pin The key pinned for this platform, if any.
 * @returns The chosen key.
 */
function pickVariant(keys: readonly string[], pin?: string): string {
  const backendOf = (key: string) => key.toLowerCase().split('_')[0] as BackendTag;

  if (pin !== undefined && keys.includes(pin) && CANDIDATE_BACKENDS.includes(backendOf(pin))) {
    return pin;
  }

  for (const tag of CANDIDATE_BACKENDS) {
    const match = keys.find((key) => backendOf(key) === tag);
    if (match !== undefined) return match;
  }

  // No preferred backend is both published for this model and linked into the
  // build — an app that opted out of the backends its models need. Hand back
  // the first variant so the registry still names a model and the failure
  // surfaces at load, where the error says which backend is missing.
  return keys[0]!;
}

/**
 * Adds a platform-resolved `DEFAULT` to a group of backend variants.
 *
 * Declare the variants best-first within each backend: with several exports
 * from the same backend, the earliest one wins.
 * @typeParam V The variant map.
 * @param map The group's variants, keyed by backend and precision.
 * @param pinned Variant keys to prefer on a given platform, for groups whose
 * best export does not follow from the declaration order. Ignored when the
 * pinned variant's backend is not linked into the build.
 * @returns The variants, plus the `DEFAULT` alias for this platform.
 */
function variants<V extends Record<string, object>>(
  map: V,
  pinned?: Partial<Record<TargetPlatform, Extract<keyof V, string>>>
): V & { readonly DEFAULT: V[keyof V] } {
  const key = pickVariant(Object.keys(map), pinned?.[PLATFORM]);
  return { ...map, DEFAULT: map[key] as V[keyof V] };
}

/**
 * Adds a `DEFAULT` to a group of sub-groups — a model family split by scale or
 * input size — mirroring the `DEFAULT` of the first sub-group declared, which
 * resolved itself per platform.
 * @typeParam V The sub-group map.
 * @param map The family's sub-groups, most representative first.
 * @returns The sub-groups, plus the inherited `DEFAULT`.
 */
function family<V extends Record<string, { readonly DEFAULT: unknown }>>(
  map: V
): V & { readonly DEFAULT: V[keyof V]['DEFAULT'] } {
  const first = Object.keys(map)[0]!;
  return { ...map, DEFAULT: map[first]!.DEFAULT as V[keyof V]['DEFAULT'] };
}

const BASE_URL = 'https://huggingface.co/software-mansion/react-native-executorch';
const VERSION_TAG = 'resolve/v0.9.0';
const NEXT_VERSION_TAG = 'resolve/v0.10.0';

// =============================================================================
// Classification
// =============================================================================
const EFFICIENTNET_V2_S_OPTS = {
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
  labels: IMAGENET1K_LABELS,
};
const EFFICIENTNET_V2_S_XNNPACK_INT8: ClassifierModel<ImageNet1KLabel> = {
  modelPath: `${BASE_URL}-efficientnet-v2-s/${NEXT_VERSION_TAG}/xnnpack/efficientnet_v2_s_xnnpack_int8.pte`,
  modelOpts: EFFICIENTNET_V2_S_OPTS,
};
const EFFICIENTNET_V2_S_XNNPACK_FP32: ClassifierModel<ImageNet1KLabel> = {
  modelPath: `${BASE_URL}-efficientnet-v2-s/${NEXT_VERSION_TAG}/xnnpack/efficientnet_v2_s_xnnpack_fp32.pte`,
  modelOpts: EFFICIENTNET_V2_S_OPTS,
};
const EFFICIENTNET_V2_S_COREML_FP16: ClassifierModel<ImageNet1KLabel> = {
  modelPath: `${BASE_URL}-efficientnet-v2-s/${NEXT_VERSION_TAG}/coreml/efficientnet_v2_s_coreml_fp16.pte`,
  modelOpts: EFFICIENTNET_V2_S_OPTS,
};

// =============================================================================
// Style Transfer
// =============================================================================
const STYLE_TRANSFER_OPTS = {
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
  outNormalizeOpts: { alpha: 255.0, beta: 0.0 },
  outInterpolation: 'lanczos' as const,
};
const STYLE_TRANSFER_CANDY_XNNPACK_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-candy/${NEXT_VERSION_TAG}/xnnpack/style_transfer_candy_xnnpack_fp32.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_CANDY_XNNPACK_INT8: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-candy/${NEXT_VERSION_TAG}/xnnpack/style_transfer_candy_xnnpack_int8.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_CANDY_COREML_FP16: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-candy/${NEXT_VERSION_TAG}/coreml/style_transfer_candy_coreml_fp16.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_MOSAIC_XNNPACK_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-mosaic/${NEXT_VERSION_TAG}/xnnpack/style_transfer_mosaic_xnnpack_fp32.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_MOSAIC_XNNPACK_INT8: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-mosaic/${NEXT_VERSION_TAG}/xnnpack/style_transfer_mosaic_xnnpack_int8.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_MOSAIC_COREML_FP16: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-mosaic/${NEXT_VERSION_TAG}/coreml/style_transfer_mosaic_coreml_fp16.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_RAIN_PRINCESS_XNNPACK_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-rain-princess/${NEXT_VERSION_TAG}/xnnpack/style_transfer_rain_princess_xnnpack_fp32.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_RAIN_PRINCESS_XNNPACK_INT8: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-rain-princess/${NEXT_VERSION_TAG}/xnnpack/style_transfer_rain_princess_xnnpack_int8.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_RAIN_PRINCESS_COREML_FP16: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-rain-princess/${NEXT_VERSION_TAG}/coreml/style_transfer_rain_princess_coreml_fp16.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_UDNIE_XNNPACK_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-udnie/${NEXT_VERSION_TAG}/xnnpack/style_transfer_udnie_xnnpack_fp32.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_UDNIE_XNNPACK_INT8: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-udnie/${NEXT_VERSION_TAG}/xnnpack/style_transfer_udnie_xnnpack_int8.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_UDNIE_COREML_FP16: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-udnie/${NEXT_VERSION_TAG}/coreml/style_transfer_udnie_coreml_fp16.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};

// =============================================================================
// Semantic Segmentation
// =============================================================================
const SELFIE_SEGMENTATION_XNNPACK_FP32: SemanticSegmenterModel<'background' | 'person'> = {
  modelPath: `${BASE_URL}-selfie-segmentation/${NEXT_VERSION_TAG}/xnnpack/selfie_segmentation_xnnpack_fp32.pte`,
  modelOpts: {
    labels: ['background', 'person'] as const,
    resizeMode: 'stretch',
    interpolation: 'linear',
    normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
    outInterpolation: 'lanczos',
  },
};
const SELFIE_SEGMENTATION_COREML_FP16: SemanticSegmenterModel<'background' | 'person'> = {
  modelPath: `${BASE_URL}-selfie-segmentation/${NEXT_VERSION_TAG}/coreml/selfie_segmentation_coreml_fp16.pte`,
  modelOpts: SELFIE_SEGMENTATION_XNNPACK_FP32.modelOpts,
};
const SELFIE_SEGMENTATION_LANDSCAPE_XNNPACK_FP32: SemanticSegmenterModel<'background' | 'person'> =
  {
    modelPath: `${BASE_URL}-selfie-segmentation/${NEXT_VERSION_TAG}/xnnpack/selfie_segmentation_landscape_xnnpack_fp32.pte`,
    modelOpts: SELFIE_SEGMENTATION_XNNPACK_FP32.modelOpts,
  };
const SELFIE_SEGMENTATION_LANDSCAPE_COREML_FP16: SemanticSegmenterModel<'background' | 'person'> = {
  modelPath: `${BASE_URL}-selfie-segmentation/${NEXT_VERSION_TAG}/coreml/selfie_segmentation_landscape_coreml_fp16.pte`,
  modelOpts: SELFIE_SEGMENTATION_XNNPACK_FP32.modelOpts,
};

const LRASPP_MOBILENET_V3_LARGE_OPTS = {
  labels: PASCAL_VOC_LABELS,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  outInterpolation: 'lanczos' as const,
  normalizeOpts: IMAGENET_NORM,
};
const LRASPP_MOBILENET_V3_LARGE_XNNPACK_FP32: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-lraspp/${NEXT_VERSION_TAG}/xnnpack/lraspp_mobilenet_v3_large_xnnpack_fp32.pte`,
  modelOpts: LRASPP_MOBILENET_V3_LARGE_OPTS,
};
const LRASPP_MOBILENET_V3_LARGE_XNNPACK_INT8: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-lraspp/${NEXT_VERSION_TAG}/xnnpack/lraspp_mobilenet_v3_large_xnnpack_int8.pte`,
  modelOpts: LRASPP_MOBILENET_V3_LARGE_OPTS,
};
const LRASPP_MOBILENET_V3_LARGE_COREML_FP16: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-lraspp/${NEXT_VERSION_TAG}/coreml/lraspp_mobilenet_v3_large_coreml_fp16.pte`,
  modelOpts: LRASPP_MOBILENET_V3_LARGE_OPTS,
};

const DEEPLAB_V3_OPTS = {
  labels: PASCAL_VOC_LABELS,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  outInterpolation: 'lanczos' as const,
  normalizeOpts: IMAGENET_NORM,
};
const DEEPLAB_V3_RESNET50_XNNPACK_FP32: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-deeplab-v3/${NEXT_VERSION_TAG}/xnnpack/deeplab_v3_resnet50_xnnpack_fp32.pte`,
  modelOpts: DEEPLAB_V3_OPTS,
};
const DEEPLAB_V3_RESNET50_XNNPACK_INT8: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-deeplab-v3/${NEXT_VERSION_TAG}/xnnpack/deeplab_v3_resnet50_xnnpack_int8.pte`,
  modelOpts: DEEPLAB_V3_OPTS,
};
const DEEPLAB_V3_RESNET50_COREML_FP16: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-deeplab-v3/${NEXT_VERSION_TAG}/coreml/deeplab_v3_resnet50_coreml_fp16.pte`,
  modelOpts: DEEPLAB_V3_OPTS,
};
const DEEPLAB_V3_RESNET101_XNNPACK_FP32: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-deeplab-v3/${NEXT_VERSION_TAG}/xnnpack/deeplab_v3_resnet101_xnnpack_fp32.pte`,
  modelOpts: DEEPLAB_V3_OPTS,
};
const DEEPLAB_V3_RESNET101_XNNPACK_INT8: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-deeplab-v3/${NEXT_VERSION_TAG}/xnnpack/deeplab_v3_resnet101_xnnpack_int8.pte`,
  modelOpts: DEEPLAB_V3_OPTS,
};
const DEEPLAB_V3_RESNET101_COREML_FP16: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-deeplab-v3/${NEXT_VERSION_TAG}/coreml/deeplab_v3_resnet101_coreml_fp16.pte`,
  modelOpts: DEEPLAB_V3_OPTS,
};
const DEEPLAB_V3_MOBILENET_V3_LARGE_XNNPACK_FP32: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-deeplab-v3/${NEXT_VERSION_TAG}/xnnpack/deeplab_v3_mobilenet_v3_large_xnnpack_fp32.pte`,
  modelOpts: DEEPLAB_V3_OPTS,
};
const DEEPLAB_V3_MOBILENET_V3_LARGE_XNNPACK_INT8: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-deeplab-v3/${NEXT_VERSION_TAG}/xnnpack/deeplab_v3_mobilenet_v3_large_xnnpack_int8.pte`,
  modelOpts: DEEPLAB_V3_OPTS,
};
const DEEPLAB_V3_MOBILENET_V3_LARGE_COREML_FP16: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-deeplab-v3/${NEXT_VERSION_TAG}/coreml/deeplab_v3_mobilenet_v3_large_coreml_fp16.pte`,
  modelOpts: DEEPLAB_V3_OPTS,
};

const FCN_OPTS = {
  labels: PASCAL_VOC_LABELS,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  outInterpolation: 'lanczos' as const,
  normalizeOpts: IMAGENET_NORM,
};
const FCN_RESNET50_XNNPACK_FP32: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-fcn/${NEXT_VERSION_TAG}/xnnpack/fcn_resnet50_xnnpack_fp32.pte`,
  modelOpts: FCN_OPTS,
};
const FCN_RESNET50_XNNPACK_INT8: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-fcn/${NEXT_VERSION_TAG}/xnnpack/fcn_resnet50_xnnpack_int8.pte`,
  modelOpts: FCN_OPTS,
};
const FCN_RESNET50_COREML_FP16: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-fcn/${NEXT_VERSION_TAG}/coreml/fcn_resnet50_coreml_fp16.pte`,
  modelOpts: FCN_OPTS,
};
const FCN_RESNET101_XNNPACK_FP32: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-fcn/${NEXT_VERSION_TAG}/xnnpack/fcn_resnet101_xnnpack_fp32.pte`,
  modelOpts: FCN_OPTS,
};
const FCN_RESNET101_XNNPACK_INT8: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-fcn/${NEXT_VERSION_TAG}/xnnpack/fcn_resnet101_xnnpack_int8.pte`,
  modelOpts: FCN_OPTS,
};
const FCN_RESNET101_COREML_FP16: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-fcn/${NEXT_VERSION_TAG}/coreml/fcn_resnet101_coreml_fp16.pte`,
  modelOpts: FCN_OPTS,
};

// =============================================================================
// Object Detection
// =============================================================================
const SSDLITE320_MOBILENET_V3_LARGE_OPTS = {
  labels: COCO_CLASSES,
  boxFormat: 'xyxy' as const,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
  defaultConfidenceThreshold: 0.5,
  defaultIouThreshold: 0.55,
};
const SSDLITE320_MOBILENET_V3_LARGE_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClass> = {
  modelPath: `${BASE_URL}-ssdlite320-mobilenet-v3-large/${NEXT_VERSION_TAG}/xnnpack/ssdlite320_mobilenet_v3_large_xnnpack_fp32.pte`,
  modelOpts: SSDLITE320_MOBILENET_V3_LARGE_OPTS,
};
const SSDLITE320_MOBILENET_V3_LARGE_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClass> = {
  modelPath: `${BASE_URL}-ssdlite320-mobilenet-v3-large/${NEXT_VERSION_TAG}/coreml/ssdlite320_mobilenet_v3_large_coreml_fp16.pte`,
  modelOpts: SSDLITE320_MOBILENET_V3_LARGE_OPTS,
};

const RFDETR_NANO_DETECTOR_OPTS = {
  labels: COCO_CLASSES,
  boxFormat: 'xyxy' as const,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  normalizeOpts: IMAGENET_NORM,
  defaultConfidenceThreshold: 0.5,
  defaultIouThreshold: 0.55,
};
const RFDETR_NANO_DETECTOR_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClass> = {
  modelPath: `${BASE_URL}-rfdetr-nano-detector/${NEXT_VERSION_TAG}/xnnpack/rfdetr_nano_xnnpack_fp32.pte`,
  modelOpts: RFDETR_NANO_DETECTOR_OPTS,
};
const RFDETR_NANO_DETECTOR_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClass> = {
  modelPath: `${BASE_URL}-rfdetr-nano-detector/${NEXT_VERSION_TAG}/coreml/rfdetr_nano_coreml_fp16.pte`,
  modelOpts: RFDETR_NANO_DETECTOR_OPTS,
};

const YOLO26_DETECTOR_OPTS = {
  labels: COCO_CLASSES_YOLO,
  boxFormat: 'xyxy' as const,
  resizeMode: 'letterbox' as const,
  interpolation: 'linear' as const,
  normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
  defaultConfidenceThreshold: 0.25,
  defaultIouThreshold: 0.7,
};

const YOLO26_NANO_384_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/n/xnnpack/yolo26n_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_NANO_384_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/n/coreml/yolo26n_384_coreml_fp16.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_NANO_512_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/n/xnnpack/yolo26n_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_NANO_512_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/n/coreml/yolo26n_512_coreml_fp16.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_NANO_640_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/n/xnnpack/yolo26n_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_NANO_640_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/n/coreml/yolo26n_640_coreml_fp16.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};

const YOLO26_SMALL_384_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/s/xnnpack/yolo26s_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_SMALL_384_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/s/coreml/yolo26s_384_coreml_fp16.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_SMALL_512_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/s/xnnpack/yolo26s_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_SMALL_512_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/s/coreml/yolo26s_512_coreml_fp16.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_SMALL_640_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/s/xnnpack/yolo26s_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_SMALL_640_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/s/coreml/yolo26s_640_coreml_fp16.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};

const YOLO26_MEDIUM_384_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/m/xnnpack/yolo26m_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_MEDIUM_384_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/m/coreml/yolo26m_384_coreml_fp16.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_MEDIUM_512_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/m/xnnpack/yolo26m_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_MEDIUM_512_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/m/coreml/yolo26m_512_coreml_fp16.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_MEDIUM_640_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/m/xnnpack/yolo26m_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_MEDIUM_640_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/m/coreml/yolo26m_640_coreml_fp16.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};

const YOLO26_LARGE_384_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/l/xnnpack/yolo26l_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_LARGE_384_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/l/coreml/yolo26l_384_coreml_fp16.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_LARGE_512_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/l/xnnpack/yolo26l_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_LARGE_512_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/l/coreml/yolo26l_512_coreml_fp16.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_LARGE_640_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/l/xnnpack/yolo26l_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_LARGE_640_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/l/coreml/yolo26l_640_coreml_fp16.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};

const YOLO26_XLARGE_384_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/x/xnnpack/yolo26x_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_XLARGE_384_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/x/coreml/yolo26x_384_coreml_fp16.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_XLARGE_512_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/x/xnnpack/yolo26x_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_XLARGE_512_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/x/coreml/yolo26x_512_coreml_fp16.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_XLARGE_640_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/x/xnnpack/yolo26x_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_XLARGE_640_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/x/coreml/yolo26x_640_coreml_fp16.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};

// =============================================================================
// Keypoint Detection
// =============================================================================
const BLAZEFACE_XNNPACK_FP32: KeypointDetectorModel<'xyxy', BlazeFaceLandmark> = {
  modelPath: `${BASE_URL}-blazeface/${NEXT_VERSION_TAG}/xnnpack/blazeface_xnnpack_fp32.pte`,
  modelOpts: {
    boxFormat: 'xyxy',
    resizeMode: 'letterbox',
    interpolation: 'linear',
    normalizeOpts: { alpha: 1 / 127.5, beta: -1.0 },
    defaultIouThreshold: 0.3,
    defaultConfidenceThreshold: 0.75,
    landmarks: BLAZEFACE_LANDMARKS,
  },
};

const YOLO26_POSE_OPTS = {
  boxFormat: 'xyxy' as const,
  resizeMode: 'letterbox' as const,
  interpolation: 'linear' as const,
  normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
  defaultIouThreshold: 0.7,
  defaultConfidenceThreshold: 0.25,
  landmarks: COCO_LANDMARKS,
};
const YOLO26_POSE_384_XNNPACK_FP32: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-yolo26-pose/${NEXT_VERSION_TAG}/xnnpack/yolo26n_pose_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_POSE_OPTS,
};
const YOLO26_POSE_384_COREML_FP16: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-yolo26-pose/${NEXT_VERSION_TAG}/coreml/yolo26n_pose_384_coreml_fp16.pte`,
  modelOpts: YOLO26_POSE_OPTS,
};
const YOLO26_POSE_512_XNNPACK_FP32: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-yolo26-pose/${NEXT_VERSION_TAG}/xnnpack/yolo26n_pose_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_POSE_OPTS,
};
const YOLO26_POSE_512_COREML_FP16: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-yolo26-pose/${NEXT_VERSION_TAG}/coreml/yolo26n_pose_512_coreml_fp16.pte`,
  modelOpts: YOLO26_POSE_OPTS,
};
const YOLO26_POSE_640_XNNPACK_FP32: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-yolo26-pose/${NEXT_VERSION_TAG}/xnnpack/yolo26n_pose_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_POSE_OPTS,
};
const YOLO26_POSE_640_COREML_FP16: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-yolo26-pose/${NEXT_VERSION_TAG}/coreml/yolo26n_pose_640_coreml_fp16.pte`,
  modelOpts: YOLO26_POSE_OPTS,
};

const RFDETR_KEYPOINT_OPTS = {
  boxFormat: 'xyxy' as const,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  normalizeOpts: IMAGENET_NORM,
  defaultIouThreshold: 0.55,
  defaultConfidenceThreshold: 0.5,
  landmarks: COCO_LANDMARKS,
};
const RFDETR_KEYPOINT_XNNPACK_FP32: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-rfdetr-keypoint/${NEXT_VERSION_TAG}/xnnpack/rfdetr_keypoint_preview_xnnpack_fp32.pte`,
  modelOpts: RFDETR_KEYPOINT_OPTS,
};
const RFDETR_KEYPOINT_COREML_FP16: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-rfdetr-keypoint/${NEXT_VERSION_TAG}/coreml/rfdetr_keypoint_preview_coreml_fp16.pte`,
  modelOpts: RFDETR_KEYPOINT_OPTS,
};
const RFDETR_KEYPOINT_MLX_FP32: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-rfdetr-keypoint/${NEXT_VERSION_TAG}/mlx/rfdetr_keypoint_preview_mlx_fp32.pte`,
  modelOpts: RFDETR_KEYPOINT_OPTS,
};

// =============================================================================
// Instance Segmentation
// =============================================================================
const FASTSAM_OPTS = {
  labels: ['object'] as const,
  boxFormat: 'xyxy' as const,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
  defaultConfidenceThreshold: 0.5,
  defaultIouThreshold: 0.9,
  defaultMaskThreshold: 0.5,
};
const FASTSAM_S_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', 'object'> = {
  modelPath: `${BASE_URL}-fast-sam/${NEXT_VERSION_TAG}/s/xnnpack/fast_sam_s_xnnpack_fp32.pte`,
  modelOpts: FASTSAM_OPTS,
};
const FASTSAM_S_COREML_FP16: InstanceSegmenterModel<'xyxy', 'object'> = {
  modelPath: `${BASE_URL}-fast-sam/${NEXT_VERSION_TAG}/s/coreml/fast_sam_s_coreml_fp16.pte`,
  modelOpts: FASTSAM_OPTS,
};
const FASTSAM_X_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', 'object'> = {
  modelPath: `${BASE_URL}-fast-sam/${NEXT_VERSION_TAG}/x/xnnpack/fast_sam_x_xnnpack_fp32.pte`,
  modelOpts: FASTSAM_OPTS,
};
const FASTSAM_X_COREML_FP16: InstanceSegmenterModel<'xyxy', 'object'> = {
  modelPath: `${BASE_URL}-fast-sam/${NEXT_VERSION_TAG}/x/coreml/fast_sam_x_coreml_fp16.pte`,
  modelOpts: FASTSAM_OPTS,
};

const RFDETR_NANO_SEG_OPTS = {
  labels: COCO_CLASSES,
  boxFormat: 'xyxy' as const,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  normalizeOpts: IMAGENET_NORM,
  defaultConfidenceThreshold: 0.5,
  defaultIouThreshold: 0.55,
  defaultMaskThreshold: 0.5,
};
const RFDETR_NANO_SEG_COREML_FP16: InstanceSegmenterModel<'xyxy', CocoClass> = {
  modelPath: `${BASE_URL}-rfdetr-nano-segmentation/${NEXT_VERSION_TAG}/coreml/rfdetr_nano_coreml_fp16.pte`,
  modelOpts: RFDETR_NANO_SEG_OPTS,
};
const RFDETR_NANO_SEG_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClass> = {
  modelPath: `${BASE_URL}-rfdetr-nano-segmentation/${NEXT_VERSION_TAG}/xnnpack/rfdetr_nano_xnnpack_fp32.pte`,
  modelOpts: RFDETR_NANO_SEG_OPTS,
};

const YOLO26_SEG_OPTS = {
  labels: COCO_CLASSES_YOLO,
  boxFormat: 'xyxy' as const,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
  defaultConfidenceThreshold: 0.25,
  defaultIouThreshold: 0.7,
  defaultMaskThreshold: 0.5,
};

const YOLO26_NANO_SEG_384_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/n/xnnpack/yolo26_seg_n_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_NANO_SEG_384_COREML_FP16: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/n/coreml/yolo26_seg_n_384_coreml_fp16.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_NANO_SEG_512_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/n/xnnpack/yolo26_seg_n_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_NANO_SEG_512_COREML_FP16: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/n/coreml/yolo26_seg_n_512_coreml_fp16.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_NANO_SEG_640_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/n/xnnpack/yolo26_seg_n_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_NANO_SEG_640_COREML_FP16: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/n/coreml/yolo26_seg_n_640_coreml_fp16.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};

const YOLO26_SMALL_SEG_384_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/s/xnnpack/yolo26_seg_s_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_SMALL_SEG_384_COREML_FP16: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/s/coreml/yolo26_seg_s_384_coreml_fp16.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_SMALL_SEG_512_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/s/xnnpack/yolo26_seg_s_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_SMALL_SEG_512_COREML_FP16: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/s/coreml/yolo26_seg_s_512_coreml_fp16.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_SMALL_SEG_640_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/s/xnnpack/yolo26_seg_s_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_SMALL_SEG_640_COREML_FP16: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/s/coreml/yolo26_seg_s_640_coreml_fp16.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};

const YOLO26_MEDIUM_SEG_384_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/m/xnnpack/yolo26_seg_m_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_MEDIUM_SEG_384_COREML_FP16: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/m/coreml/yolo26_seg_m_384_coreml_fp16.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_MEDIUM_SEG_512_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/m/xnnpack/yolo26_seg_m_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_MEDIUM_SEG_512_COREML_FP16: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/m/coreml/yolo26_seg_m_512_coreml_fp16.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_MEDIUM_SEG_640_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/m/xnnpack/yolo26_seg_m_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_MEDIUM_SEG_640_COREML_FP16: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/m/coreml/yolo26_seg_m_640_coreml_fp16.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};

const YOLO26_LARGE_SEG_384_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/l/xnnpack/yolo26_seg_l_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_LARGE_SEG_384_COREML_FP16: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/l/coreml/yolo26_seg_l_384_coreml_fp16.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_LARGE_SEG_512_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/l/xnnpack/yolo26_seg_l_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_LARGE_SEG_512_COREML_FP16: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/l/coreml/yolo26_seg_l_512_coreml_fp16.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_LARGE_SEG_640_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/l/xnnpack/yolo26_seg_l_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_LARGE_SEG_640_COREML_FP16: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/l/coreml/yolo26_seg_l_640_coreml_fp16.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};

const YOLO26_XLARGE_SEG_384_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/x/xnnpack/yolo26_seg_x_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_XLARGE_SEG_384_COREML_FP16: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/x/coreml/yolo26_seg_x_384_coreml_fp16.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_XLARGE_SEG_512_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/x/xnnpack/yolo26_seg_x_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_XLARGE_SEG_512_COREML_FP16: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/x/coreml/yolo26_seg_x_512_coreml_fp16.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_XLARGE_SEG_640_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/x/xnnpack/yolo26_seg_x_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_XLARGE_SEG_640_COREML_FP16: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/x/coreml/yolo26_seg_x_640_coreml_fp16.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};

// =============================================================================
// Text Embeddings
// =============================================================================
const ALL_MINILM_L6_V2_EMBEDDINGS: TextEmbedderModel = {
  modelPath: `${BASE_URL}-all-MiniLM-L6-v2/${NEXT_VERSION_TAG}/xnnpack/all_minilm_l6_v2_xnnpack_fp32.pte`,
  tokenizerPath: `${BASE_URL}-all-MiniLM-L6-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const ALL_MINILM_L6_V2_COREML_FP16: TextEmbedderModel = {
  modelPath: `${BASE_URL}-all-MiniLM-L6-v2/${NEXT_VERSION_TAG}/coreml/all_minilm_l6_v2_coreml_fp16.pte`,
  tokenizerPath: `${BASE_URL}-all-MiniLM-L6-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const ALL_MINILM_L6_V2_VULKAN_FP16: TextEmbedderModel = {
  modelPath: `${BASE_URL}-all-MiniLM-L6-v2/${NEXT_VERSION_TAG}/vulkan/all_minilm_l6_v2_vulkan_fp16.pte`,
  tokenizerPath: `${BASE_URL}-all-MiniLM-L6-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const ALL_MPNET_BASE_V2_EMBEDDINGS: TextEmbedderModel = {
  modelPath: `${BASE_URL}-all-mpnet-base-v2/${NEXT_VERSION_TAG}/xnnpack/all_mpnet_base_v2_xnnpack_fp32.pte`,
  tokenizerPath: `${BASE_URL}-all-mpnet-base-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const ALL_MPNET_BASE_V2_VULKAN_INT8: TextEmbedderModel = {
  modelPath: `${BASE_URL}-all-mpnet-base-v2/${NEXT_VERSION_TAG}/vulkan/all_mpnet_base_v2_vulkan_int8.pte`,
  tokenizerPath: `${BASE_URL}-all-mpnet-base-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const ALL_MPNET_BASE_V2_VULKAN_FP16: TextEmbedderModel = {
  modelPath: `${BASE_URL}-all-mpnet-base-v2/${NEXT_VERSION_TAG}/vulkan/all_mpnet_base_v2_vulkan_fp16.pte`,
  tokenizerPath: `${BASE_URL}-all-mpnet-base-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const MULTI_QA_MINILM_L6_COS_V1_EMBEDDINGS: TextEmbedderModel = {
  modelPath: `${BASE_URL}-multi-qa-MiniLM-L6-cos-v1/${NEXT_VERSION_TAG}/xnnpack/multi_qa_minilm_l6_cos_v1_xnnpack_fp32.pte`,
  tokenizerPath: `${BASE_URL}-multi-qa-MiniLM-L6-cos-v1/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const MULTI_QA_MINILM_L6_COS_V1_COREML_FP16: TextEmbedderModel = {
  modelPath: `${BASE_URL}-multi-qa-MiniLM-L6-cos-v1/${NEXT_VERSION_TAG}/coreml/multi_qa_minilm_l6_cos_v1_coreml_fp16.pte`,
  tokenizerPath: `${BASE_URL}-multi-qa-MiniLM-L6-cos-v1/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const MULTI_QA_MINILM_L6_COS_V1_VULKAN_FP16: TextEmbedderModel = {
  modelPath: `${BASE_URL}-multi-qa-MiniLM-L6-cos-v1/${NEXT_VERSION_TAG}/vulkan/multi_qa_minilm_l6_cos_v1_vulkan_fp16.pte`,
  tokenizerPath: `${BASE_URL}-multi-qa-MiniLM-L6-cos-v1/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const MULTI_QA_MPNET_BASE_DOT_V1_EMBEDDINGS: TextEmbedderModel = {
  modelPath: `${BASE_URL}-multi-qa-mpnet-base-dot-v1/${NEXT_VERSION_TAG}/xnnpack/multi_qa_mpnet_base_dot_v1_xnnpack_fp32.pte`,
  tokenizerPath: `${BASE_URL}-multi-qa-mpnet-base-dot-v1/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const MULTI_QA_MPNET_BASE_DOT_V1_VULKAN_INT8: TextEmbedderModel = {
  modelPath: `${BASE_URL}-multi-qa-mpnet-base-dot-v1/${NEXT_VERSION_TAG}/vulkan/multi_qa_mpnet_base_dot_v1_vulkan_int8.pte`,
  tokenizerPath: `${BASE_URL}-multi-qa-mpnet-base-dot-v1/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const MULTI_QA_MPNET_BASE_DOT_V1_VULKAN_FP16: TextEmbedderModel = {
  modelPath: `${BASE_URL}-multi-qa-mpnet-base-dot-v1/${NEXT_VERSION_TAG}/vulkan/multi_qa_mpnet_base_dot_v1_vulkan_fp16.pte`,
  tokenizerPath: `${BASE_URL}-multi-qa-mpnet-base-dot-v1/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_EMBEDDINGS: TextEmbedderModel = {
  modelPath: `${BASE_URL}-paraphrase-multilingual-MiniLM-L12-v2/${NEXT_VERSION_TAG}/xnnpack/paraphrase_multilingual_minilm_l12_v2_xnnpack_8da4w.pte`,
  tokenizerPath: `${BASE_URL}-paraphrase-multilingual-MiniLM-L12-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_XNNPACK_FP32: TextEmbedderModel = {
  modelPath: `${BASE_URL}-paraphrase-multilingual-MiniLM-L12-v2/${NEXT_VERSION_TAG}/xnnpack/paraphrase_multilingual_minilm_l12_v2_xnnpack_fp32.pte`,
  tokenizerPath: `${BASE_URL}-paraphrase-multilingual-MiniLM-L12-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_COREML_FP16: TextEmbedderModel = {
  modelPath: `${BASE_URL}-paraphrase-multilingual-MiniLM-L12-v2/${NEXT_VERSION_TAG}/coreml/paraphrase_multilingual_minilm_l12_v2_coreml_fp16.pte`,
  tokenizerPath: `${BASE_URL}-paraphrase-multilingual-MiniLM-L12-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_VULKAN_FP16: TextEmbedderModel = {
  modelPath: `${BASE_URL}-paraphrase-multilingual-MiniLM-L12-v2/${NEXT_VERSION_TAG}/vulkan/paraphrase_multilingual_minilm_l12_v2_vulkan_fp16.pte`,
  tokenizerPath: `${BASE_URL}-paraphrase-multilingual-MiniLM-L12-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const DISTILUSE_BASE_MULTILINGUAL_CASED_V2_EMBEDDINGS: TextEmbedderModel = {
  modelPath: `${BASE_URL}-distiluse-base-multilingual-cased-v2/${NEXT_VERSION_TAG}/xnnpack/distiluse_base_multilingual_cased_v2_xnnpack_8da4w.pte`,
  tokenizerPath: `${BASE_URL}-distiluse-base-multilingual-cased-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const DISTILUSE_BASE_MULTILINGUAL_CASED_V2_XNNPACK_FP32: TextEmbedderModel = {
  modelPath: `${BASE_URL}-distiluse-base-multilingual-cased-v2/${NEXT_VERSION_TAG}/xnnpack/distiluse_base_multilingual_cased_v2_xnnpack_fp32.pte`,
  tokenizerPath: `${BASE_URL}-distiluse-base-multilingual-cased-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const DISTILUSE_BASE_MULTILINGUAL_CASED_V2_COREML_FP16: TextEmbedderModel = {
  modelPath: `${BASE_URL}-distiluse-base-multilingual-cased-v2/${NEXT_VERSION_TAG}/coreml/distiluse_base_multilingual_cased_v2_coreml_fp16.pte`,
  tokenizerPath: `${BASE_URL}-distiluse-base-multilingual-cased-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const DISTILUSE_BASE_MULTILINGUAL_CASED_V2_MLX_INT8: TextEmbedderModel = {
  modelPath: `${BASE_URL}-distiluse-base-multilingual-cased-v2/${NEXT_VERSION_TAG}/mlx/distiluse_base_multilingual_cased_v2_mlx_int8.pte`,
  tokenizerPath: `${BASE_URL}-distiluse-base-multilingual-cased-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const DISTILUSE_BASE_MULTILINGUAL_CASED_V2_VULKAN_FP16: TextEmbedderModel = {
  modelPath: `${BASE_URL}-distiluse-base-multilingual-cased-v2/${NEXT_VERSION_TAG}/vulkan/distiluse_base_multilingual_cased_v2_vulkan_fp16.pte`,
  tokenizerPath: `${BASE_URL}-distiluse-base-multilingual-cased-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const CLIP_VIT_BASE_PATCH32_TEXT_EMBEDDINGS: TextEmbedderModel = {
  modelPath: `${BASE_URL}-clip-vit-base-patch32/${NEXT_VERSION_TAG}/xnnpack/clip_vit_base_patch32_text_xnnpack_fp32.pte`,
  tokenizerPath: `${BASE_URL}-clip-vit-base-patch32/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const CLIP_VIT_BASE_PATCH32_TEXT_COREML_FP16: TextEmbedderModel = {
  modelPath: `${BASE_URL}-clip-vit-base-patch32/${NEXT_VERSION_TAG}/coreml/clip_vit_base_patch32_text_coreml_fp16.pte`,
  tokenizerPath: `${BASE_URL}-clip-vit-base-patch32/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const CLIP_VIT_BASE_PATCH32_TEXT_VULKAN_FP16: TextEmbedderModel = {
  modelPath: `${BASE_URL}-clip-vit-base-patch32/${NEXT_VERSION_TAG}/vulkan/clip_vit_base_patch32_text_vulkan_fp16.pte`,
  tokenizerPath: `${BASE_URL}-clip-vit-base-patch32/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const LFM2_5_EMBEDDING_350M_EMBEDDINGS: TextEmbedderModel = {
  modelPath: `${BASE_URL}-lfm2.5-embedding-350m/${NEXT_VERSION_TAG}/xnnpack/lfm_2_5_embedding_350m_xnnpack_8da4w.pte`,
  tokenizerPath: `${BASE_URL}-lfm2.5-embedding-350m/${NEXT_VERSION_TAG}/tokenizer.json`,
  defaultPrompt: 'query: ',
};
const LFM2_5_EMBEDDING_350M_MLX_INT4: TextEmbedderModel = {
  modelPath: `${BASE_URL}-lfm2.5-embedding-350m/${NEXT_VERSION_TAG}/mlx/lfm_2_5_embedding_350m_mlx_int4.pte`,
  tokenizerPath: `${BASE_URL}-lfm2.5-embedding-350m/${NEXT_VERSION_TAG}/tokenizer.json`,
  defaultPrompt: 'query: ',
};

// =============================================================================
// Image Embeddings
// =============================================================================
const CLIP_IMAGE_EMBEDDINGS_OPTS = {
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
};
const CLIP_VIT_BASE_PATCH32_IMAGE_XNNPACK_FP32: ImageEmbedderModel = {
  modelPath: `${BASE_URL}-clip-vit-base-patch32/${NEXT_VERSION_TAG}/xnnpack/clip_vit_base_patch32_image_xnnpack_fp32.pte`,
  modelOpts: CLIP_IMAGE_EMBEDDINGS_OPTS,
};
const CLIP_VIT_BASE_PATCH32_IMAGE_COREML_FP16: ImageEmbedderModel = {
  modelPath: `${BASE_URL}-clip-vit-base-patch32/${NEXT_VERSION_TAG}/coreml/clip_vit_base_patch32_image_coreml_fp16.pte`,
  modelOpts: CLIP_IMAGE_EMBEDDINGS_OPTS,
};
const CLIP_VIT_BASE_PATCH32_IMAGE_MLX_INT8: ImageEmbedderModel = {
  modelPath: `${BASE_URL}-clip-vit-base-patch32/${NEXT_VERSION_TAG}/mlx/clip_vit_base_patch32_image_mlx_int8.pte`,
  modelOpts: CLIP_IMAGE_EMBEDDINGS_OPTS,
};
const CLIP_VIT_BASE_PATCH32_IMAGE_VULKAN_FP16: ImageEmbedderModel = {
  modelPath: `${BASE_URL}-clip-vit-base-patch32/${NEXT_VERSION_TAG}/vulkan/clip_vit_base_patch32_image_vulkan_fp16.pte`,
  modelOpts: CLIP_IMAGE_EMBEDDINGS_OPTS,
};

// =============================================================================
// Voice Activity Detection
// =============================================================================
const FSMN_VAD_XNNPACK_FP32: FsmnVadModel = {
  modelPath: `${BASE_URL}-fsmn-vad/${NEXT_VERSION_TAG}/xnnpack/fsmn_vad_xnnpack_fp32.pte`,
  defaultOptions: {
    speechThreshold: 0.6,
    minSpeechDurationMs: 250,
    minSilenceDurationMs: 100,
    speechPadMs: 30,
    mergeGapMs: 0,
  },
};

// =============================================================================
// Speech-To-Text
// =============================================================================
const WHISPER_TINY_EN_XNNPACK_FP32: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-tiny.en/${NEXT_VERSION_TAG}/xnnpack/whisper_tiny_en_xnnpack_fp32.pte`,
  tokenizerPath: `${BASE_URL}-whisper-tiny.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_TINY_EN_XNNPACK_INT8: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-tiny.en/${NEXT_VERSION_TAG}/xnnpack/whisper_tiny_en_xnnpack_int8.pte`,
  tokenizerPath: `${BASE_URL}-whisper-tiny.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_TINY_EN_COREML_FP16: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-tiny.en/${NEXT_VERSION_TAG}/coreml/whisper_tiny_en_coreml_fp16.pte`,
  tokenizerPath: `${BASE_URL}-whisper-tiny.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_TINY_EN_MLX_BF16: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-tiny.en/${NEXT_VERSION_TAG}/mlx/whisper_tiny_en_mlx_bf16.pte`,
  tokenizerPath: `${BASE_URL}-whisper-tiny.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_TINY_EN_MLX_INT8: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-tiny.en/${NEXT_VERSION_TAG}/mlx/whisper_tiny_en_mlx_int8.pte`,
  tokenizerPath: `${BASE_URL}-whisper-tiny.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_TINY_EN_VULKAN_FP16: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-tiny.en/${NEXT_VERSION_TAG}/vulkan/whisper_tiny_en_vulkan_fp16.pte`,
  tokenizerPath: `${BASE_URL}-whisper-tiny.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_TINY_EN_VULKAN_INT8: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-tiny.en/${NEXT_VERSION_TAG}/vulkan/whisper_tiny_en_vulkan_int8.pte`,
  tokenizerPath: `${BASE_URL}-whisper-tiny.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};

const WHISPER_TINY_XNNPACK_FP32: WhisperSttModel = {
  modelPath: `${BASE_URL}-whisper-tiny/${NEXT_VERSION_TAG}/xnnpack/whisper_tiny_xnnpack_fp32.pte`,
  tokenizerPath: `${BASE_URL}-whisper-tiny/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: WHISPER_LANGUAGES,
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_TINY_COREML_FP16: WhisperSttModel = {
  modelPath: `${BASE_URL}-whisper-tiny/${NEXT_VERSION_TAG}/coreml/whisper_tiny_coreml_fp16.pte`,
  tokenizerPath: `${BASE_URL}-whisper-tiny/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: WHISPER_LANGUAGES,
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_TINY_MLX_BF16: WhisperSttModel = {
  modelPath: `${BASE_URL}-whisper-tiny/${NEXT_VERSION_TAG}/mlx/whisper_tiny_mlx_bf16.pte`,
  tokenizerPath: `${BASE_URL}-whisper-tiny/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: WHISPER_LANGUAGES,
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_TINY_MLX_INT8: WhisperSttModel = {
  modelPath: `${BASE_URL}-whisper-tiny/${NEXT_VERSION_TAG}/mlx/whisper_tiny_mlx_int8.pte`,
  tokenizerPath: `${BASE_URL}-whisper-tiny/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: WHISPER_LANGUAGES,
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_TINY_VULKAN_FP16: WhisperSttModel = {
  modelPath: `${BASE_URL}-whisper-tiny/${NEXT_VERSION_TAG}/vulkan/whisper_tiny_vulkan_fp16.pte`,
  tokenizerPath: `${BASE_URL}-whisper-tiny/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: WHISPER_LANGUAGES,
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_TINY_VULKAN_INT8: WhisperSttModel = {
  modelPath: `${BASE_URL}-whisper-tiny/${NEXT_VERSION_TAG}/vulkan/whisper_tiny_vulkan_int8.pte`,
  tokenizerPath: `${BASE_URL}-whisper-tiny/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: WHISPER_LANGUAGES,
  vadModel: FSMN_VAD_XNNPACK_FP32,
};

const WHISPER_BASE_EN_XNNPACK_FP32: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-base.en/${NEXT_VERSION_TAG}/xnnpack/whisper_base_en_xnnpack_fp32.pte`,
  tokenizerPath: `${BASE_URL}-whisper-base.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_BASE_EN_XNNPACK_INT8: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-base.en/${NEXT_VERSION_TAG}/xnnpack/whisper_base_en_xnnpack_int8.pte`,
  tokenizerPath: `${BASE_URL}-whisper-base.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_BASE_EN_COREML_FP16: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-base.en/${NEXT_VERSION_TAG}/coreml/whisper_base_en_coreml_fp16.pte`,
  tokenizerPath: `${BASE_URL}-whisper-base.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_BASE_EN_MLX_BF16: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-base.en/${NEXT_VERSION_TAG}/mlx/whisper_base_en_mlx_bf16.pte`,
  tokenizerPath: `${BASE_URL}-whisper-base.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_BASE_EN_MLX_INT8: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-base.en/${NEXT_VERSION_TAG}/mlx/whisper_base_en_mlx_int8.pte`,
  tokenizerPath: `${BASE_URL}-whisper-base.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_BASE_EN_VULKAN_FP16: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-base.en/${NEXT_VERSION_TAG}/vulkan/whisper_base_en_vulkan_fp16.pte`,
  tokenizerPath: `${BASE_URL}-whisper-base.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_BASE_EN_VULKAN_INT8: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-base.en/${NEXT_VERSION_TAG}/vulkan/whisper_base_en_vulkan_int8.pte`,
  tokenizerPath: `${BASE_URL}-whisper-base.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};

const WHISPER_BASE_XNNPACK_FP32: WhisperSttModel = {
  modelPath: `${BASE_URL}-whisper-base/${NEXT_VERSION_TAG}/xnnpack/whisper_base_xnnpack_fp32.pte`,
  tokenizerPath: `${BASE_URL}-whisper-base/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: WHISPER_LANGUAGES,
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_BASE_COREML_FP16: WhisperSttModel = {
  modelPath: `${BASE_URL}-whisper-base/${NEXT_VERSION_TAG}/coreml/whisper_base_coreml_fp16.pte`,
  tokenizerPath: `${BASE_URL}-whisper-base/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: WHISPER_LANGUAGES,
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_BASE_MLX_BF16: WhisperSttModel = {
  modelPath: `${BASE_URL}-whisper-base/${NEXT_VERSION_TAG}/mlx/whisper_base_mlx_bf16.pte`,
  tokenizerPath: `${BASE_URL}-whisper-base/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: WHISPER_LANGUAGES,
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_BASE_MLX_INT8: WhisperSttModel = {
  modelPath: `${BASE_URL}-whisper-base/${NEXT_VERSION_TAG}/mlx/whisper_base_mlx_int8.pte`,
  tokenizerPath: `${BASE_URL}-whisper-base/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: WHISPER_LANGUAGES,
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_BASE_VULKAN_FP16: WhisperSttModel = {
  modelPath: `${BASE_URL}-whisper-base/${NEXT_VERSION_TAG}/vulkan/whisper_base_vulkan_fp16.pte`,
  tokenizerPath: `${BASE_URL}-whisper-base/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: WHISPER_LANGUAGES,
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_BASE_VULKAN_INT8: WhisperSttModel = {
  modelPath: `${BASE_URL}-whisper-base/${NEXT_VERSION_TAG}/vulkan/whisper_base_vulkan_int8.pte`,
  tokenizerPath: `${BASE_URL}-whisper-base/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: WHISPER_LANGUAGES,
  vadModel: FSMN_VAD_XNNPACK_FP32,
};

const WHISPER_SMALL_EN_XNNPACK_FP32: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-small.en/${NEXT_VERSION_TAG}/xnnpack/whisper_small_en_xnnpack_fp32.pte`,
  tokenizerPath: `${BASE_URL}-whisper-small.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_SMALL_EN_XNNPACK_INT8: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-small.en/${NEXT_VERSION_TAG}/xnnpack/whisper_small_en_xnnpack_int8.pte`,
  tokenizerPath: `${BASE_URL}-whisper-small.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_SMALL_EN_COREML_FP16: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-small.en/${NEXT_VERSION_TAG}/coreml/whisper_small_en_coreml_fp16.pte`,
  tokenizerPath: `${BASE_URL}-whisper-small.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_SMALL_EN_MLX_INT8: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-small.en/${NEXT_VERSION_TAG}/mlx/whisper_small_en_mlx_int8.pte`,
  tokenizerPath: `${BASE_URL}-whisper-small.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_SMALL_EN_VULKAN_FP16: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-small.en/${NEXT_VERSION_TAG}/vulkan/whisper_small_en_vulkan_fp16.pte`,
  tokenizerPath: `${BASE_URL}-whisper-small.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_SMALL_EN_VULKAN_INT8: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-small.en/${NEXT_VERSION_TAG}/vulkan/whisper_small_en_vulkan_int8.pte`,
  tokenizerPath: `${BASE_URL}-whisper-small.en/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: ['en'],
  vadModel: FSMN_VAD_XNNPACK_FP32,
};

const WHISPER_SMALL_XNNPACK_FP32: WhisperSttModel = {
  modelPath: `${BASE_URL}-whisper-small/${NEXT_VERSION_TAG}/xnnpack/whisper_small_xnnpack_fp32.pte`,
  tokenizerPath: `${BASE_URL}-whisper-small/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: WHISPER_LANGUAGES,
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_SMALL_COREML_FP16: WhisperSttModel = {
  modelPath: `${BASE_URL}-whisper-small/${NEXT_VERSION_TAG}/coreml/whisper_small_coreml_fp16.pte`,
  tokenizerPath: `${BASE_URL}-whisper-small/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: WHISPER_LANGUAGES,
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_SMALL_MLX_INT8: WhisperSttModel = {
  modelPath: `${BASE_URL}-whisper-small/${NEXT_VERSION_TAG}/mlx/whisper_small_mlx_int8.pte`,
  tokenizerPath: `${BASE_URL}-whisper-small/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: WHISPER_LANGUAGES,
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_SMALL_VULKAN_FP16: WhisperSttModel = {
  modelPath: `${BASE_URL}-whisper-small/${NEXT_VERSION_TAG}/vulkan/whisper_small_vulkan_fp16.pte`,
  tokenizerPath: `${BASE_URL}-whisper-small/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: WHISPER_LANGUAGES,
  vadModel: FSMN_VAD_XNNPACK_FP32,
};
const WHISPER_SMALL_VULKAN_INT8: WhisperSttModel = {
  modelPath: `${BASE_URL}-whisper-small/${NEXT_VERSION_TAG}/vulkan/whisper_small_vulkan_int8.pte`,
  tokenizerPath: `${BASE_URL}-whisper-small/${NEXT_VERSION_TAG}/tokenizer.json`,
  supportedLanguages: WHISPER_LANGUAGES,
  vadModel: FSMN_VAD_XNNPACK_FP32,
};

// =============================================================================
// Text to Image
// =============================================================================
const SDXS_512_DREAMSHAPER_TOKENIZER = `${BASE_URL}-sdxs-512-dreamshaper/${NEXT_VERSION_TAG}/tokenizer.json`;
const SDXS_512_DREAMSHAPER_XNNPACK_FP32: SdxsTextToImageModel = {
  modelPath: `${BASE_URL}-sdxs-512-dreamshaper/${NEXT_VERSION_TAG}/xnnpack/sdxs_512_dreamshaper_xnnpack_fp32.pte`,
  tokenizerPath: SDXS_512_DREAMSHAPER_TOKENIZER,
};
const SDXS_512_DREAMSHAPER_COREML_FP16: SdxsTextToImageModel = {
  modelPath: `${BASE_URL}-sdxs-512-dreamshaper/${NEXT_VERSION_TAG}/coreml/sdxs_512_dreamshaper_coreml_fp16.pte`,
  tokenizerPath: SDXS_512_DREAMSHAPER_TOKENIZER,
};

// =============================================================================
// Text to Speech
// =============================================================================
const SUPERTONIC_DEFAULT_VOICE_STYLES = SUPERTONIC_DEFAULT_VOICE_NAMES.reduce(
  (acc, name) => ({
    ...acc,
    [name]: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/voice_styles/${name}.json`,
  }),
  {} as Record<SupertonicDefaultVoiceName, string>
);

const SUPERTONIC_3_XNNPACK_FP32: SupertonicTtsModel<SupertonicDefaultVoiceName> = {
  name: 'supertonic',
  modelPaths: {
    durationPredictor: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/xnnpack/duration_predictor_xnnpack_fp32.pte`,
    vectorEstimator: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/xnnpack/vector_estimator_xnnpack_fp32.pte`,
    textEncoder: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/xnnpack/text_encoder_xnnpack_fp32.pte`,
    vocoder: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/xnnpack/vocoder_xnnpack_fp32.pte`,
  },
  unicodeIndexerPath: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/unicode_indexer.json`,
  voiceStyles: SUPERTONIC_DEFAULT_VOICE_STYLES,
};

const SUPERTONIC_3_MLX_FP32: SupertonicTtsModel<SupertonicDefaultVoiceName> = {
  name: 'supertonic',
  modelPaths: {
    durationPredictor: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/mlx/duration_predictor_mlx_fp32.pte`,
    vectorEstimator: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/mlx/vector_estimator_mlx_fp32.pte`,
    textEncoder: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/mlx/text_encoder_mlx_fp32.pte`,
    vocoder: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/mlx/vocoder_mlx_fp32.pte`,
  },
  unicodeIndexerPath: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/unicode_indexer.json`,
  voiceStyles: SUPERTONIC_DEFAULT_VOICE_STYLES,
};

const SUPERTONIC_3_VULKAN_FP16: SupertonicTtsModel<SupertonicDefaultVoiceName> = {
  name: 'supertonic',
  modelPaths: {
    durationPredictor: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/vulkan/duration_predictor_vulkan_fp16.pte`,
    vectorEstimator: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/vulkan/vector_estimator_vulkan_fp16.pte`,
    textEncoder: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/vulkan/text_encoder_vulkan_fp16.pte`,
    vocoder: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/vulkan/vocoder_vulkan_fp16.pte`,
  },
  unicodeIndexerPath: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/unicode_indexer.json`,
  voiceStyles: SUPERTONIC_DEFAULT_VOICE_STYLES,
};

const KOKORO_ROOT = `${BASE_URL}-kokoro/${NEXT_VERSION_TAG}`;
const KOKORO_PHONEMIZER_ROOT = `${KOKORO_ROOT}/phonemizer`;

const kokoroModelPaths = (
  backend: 'xnnpack' | 'coreml',
  variant: 'std' | 'pl' | 'de',
  dir: string
) => ({
  durationPredictor: `${KOKORO_ROOT}/${backend}/${dir}/duration_predictor_${variant}_${backend}_fp32.pte`,
  synthesizer: `${KOKORO_ROOT}/${backend}/${dir}/synthesizer_${variant}_${backend}_fp32.pte`,
});

const kokoroVoices = <const N extends string>(names: readonly N[]) =>
  names.reduce(
    (acc, name) => ({ ...acc, [name]: `${KOKORO_ROOT}/voices/${name}.bin` }),
    {} as Record<N, string>
  );

// English relies on a part-of-speech tagger and a pronunciation lexicon; the
// remaining languages are phonemized by a neural grapheme-to-phoneme model.
const kokoroEnglishPhonemizer = (lang: 'en-us' | 'en-gb') => ({
  lang,
  taggerSource: `${KOKORO_PHONEMIZER_ROOT}/${lang}/tags.json`,
  lexiconSource: `${KOKORO_PHONEMIZER_ROOT}/${lang}/lexicon.json`,
  neuralModelSource: `${KOKORO_PHONEMIZER_ROOT}/${lang}/phonemizer_${lang.replace('-', '_')}.pte`,
});

const kokoroNeuralPhonemizer = <const L extends Exclude<PhonemizerLanguage, 'en-us' | 'en-gb'>>(
  lang: L
) => ({
  lang,
  neuralModelSource: `${KOKORO_PHONEMIZER_ROOT}/${lang}/phonemizer_${lang}.pte`,
});

const KOKORO_EN_US_XNNPACK_FP32: KokoroTtsModel<
  'af_heart' | 'af_river' | 'af_sarah' | 'am_adam' | 'am_michael' | 'am_santa'
> = {
  name: 'kokoro',
  modelPaths: kokoroModelPaths('xnnpack', 'std', 'standard'),
  phonemizer: kokoroEnglishPhonemizer('en-us'),
  voices: kokoroVoices(['af_heart', 'af_river', 'af_sarah', 'am_adam', 'am_michael', 'am_santa']),
};
const KOKORO_EN_GB_XNNPACK_FP32: KokoroTtsModel<'bf_emma' | 'bm_daniel'> = {
  name: 'kokoro',
  modelPaths: kokoroModelPaths('xnnpack', 'std', 'standard'),
  phonemizer: kokoroEnglishPhonemizer('en-gb'),
  voices: kokoroVoices(['bf_emma', 'bm_daniel']),
};
const KOKORO_ES_XNNPACK_FP32: KokoroTtsModel<'ef_dora' | 'em_alex'> = {
  name: 'kokoro',
  modelPaths: kokoroModelPaths('xnnpack', 'std', 'standard'),
  phonemizer: kokoroNeuralPhonemizer('es'),
  voices: kokoroVoices(['ef_dora', 'em_alex']),
};
const KOKORO_FR_XNNPACK_FP32: KokoroTtsModel<'ff_siwis'> = {
  name: 'kokoro',
  modelPaths: kokoroModelPaths('xnnpack', 'std', 'standard'),
  phonemizer: kokoroNeuralPhonemizer('fr'),
  voices: kokoroVoices(['ff_siwis']),
};
const KOKORO_IT_XNNPACK_FP32: KokoroTtsModel<'if_sara' | 'im_nicola'> = {
  name: 'kokoro',
  modelPaths: kokoroModelPaths('xnnpack', 'std', 'standard'),
  phonemizer: kokoroNeuralPhonemizer('it'),
  voices: kokoroVoices(['if_sara', 'im_nicola']),
};
const KOKORO_PT_XNNPACK_FP32: KokoroTtsModel<'pf_dora' | 'pm_santa'> = {
  name: 'kokoro',
  modelPaths: kokoroModelPaths('xnnpack', 'std', 'standard'),
  phonemizer: kokoroNeuralPhonemizer('pt'),
  voices: kokoroVoices(['pf_dora', 'pm_santa']),
};
const KOKORO_HI_XNNPACK_FP32: KokoroTtsModel<'hf_alpha' | 'hm_omega' | 'hm_psi'> = {
  name: 'kokoro',
  modelPaths: kokoroModelPaths('xnnpack', 'std', 'standard'),
  phonemizer: kokoroNeuralPhonemizer('hi'),
  voices: kokoroVoices(['hf_alpha', 'hm_omega', 'hm_psi']),
};
const KOKORO_PL_XNNPACK_FP32: KokoroTtsModel<'pm_mateusz'> = {
  name: 'kokoro',
  modelPaths: kokoroModelPaths('xnnpack', 'pl', 'polish'),
  phonemizer: kokoroNeuralPhonemizer('pl'),
  voices: kokoroVoices(['pm_mateusz']),
};
const KOKORO_DE_XNNPACK_FP32: KokoroTtsModel<'df_anna'> = {
  name: 'kokoro',
  modelPaths: kokoroModelPaths('xnnpack', 'de', 'german'),
  phonemizer: kokoroNeuralPhonemizer('de'),
  voices: kokoroVoices(['df_anna']),
};

// Core ML counterparts: the same weights, phonemizer and voices as the XNNPACK
// presets, only the `.pte` files differ. Their token axis is fixed at 128, so
// the pipeline pads every chunk up to it. iOS only.
const KOKORO_EN_US_COREML_FP32: KokoroTtsModel<
  'af_heart' | 'af_river' | 'af_sarah' | 'am_adam' | 'am_michael' | 'am_santa'
> = {
  name: 'kokoro',
  modelPaths: kokoroModelPaths('coreml', 'std', 'standard'),
  phonemizer: kokoroEnglishPhonemizer('en-us'),
  voices: kokoroVoices(['af_heart', 'af_river', 'af_sarah', 'am_adam', 'am_michael', 'am_santa']),
};
const KOKORO_EN_GB_COREML_FP32: KokoroTtsModel<'bf_emma' | 'bm_daniel'> = {
  name: 'kokoro',
  modelPaths: kokoroModelPaths('coreml', 'std', 'standard'),
  phonemizer: kokoroEnglishPhonemizer('en-gb'),
  voices: kokoroVoices(['bf_emma', 'bm_daniel']),
};
const KOKORO_ES_COREML_FP32: KokoroTtsModel<'ef_dora' | 'em_alex'> = {
  name: 'kokoro',
  modelPaths: kokoroModelPaths('coreml', 'std', 'standard'),
  phonemizer: kokoroNeuralPhonemizer('es'),
  voices: kokoroVoices(['ef_dora', 'em_alex']),
};
const KOKORO_FR_COREML_FP32: KokoroTtsModel<'ff_siwis'> = {
  name: 'kokoro',
  modelPaths: kokoroModelPaths('coreml', 'std', 'standard'),
  phonemizer: kokoroNeuralPhonemizer('fr'),
  voices: kokoroVoices(['ff_siwis']),
};
const KOKORO_IT_COREML_FP32: KokoroTtsModel<'if_sara' | 'im_nicola'> = {
  name: 'kokoro',
  modelPaths: kokoroModelPaths('coreml', 'std', 'standard'),
  phonemizer: kokoroNeuralPhonemizer('it'),
  voices: kokoroVoices(['if_sara', 'im_nicola']),
};
const KOKORO_PT_COREML_FP32: KokoroTtsModel<'pf_dora' | 'pm_santa'> = {
  name: 'kokoro',
  modelPaths: kokoroModelPaths('coreml', 'std', 'standard'),
  phonemizer: kokoroNeuralPhonemizer('pt'),
  voices: kokoroVoices(['pf_dora', 'pm_santa']),
};
const KOKORO_HI_COREML_FP32: KokoroTtsModel<'hf_alpha' | 'hm_omega' | 'hm_psi'> = {
  name: 'kokoro',
  modelPaths: kokoroModelPaths('coreml', 'std', 'standard'),
  phonemizer: kokoroNeuralPhonemizer('hi'),
  voices: kokoroVoices(['hf_alpha', 'hm_omega', 'hm_psi']),
};

const KOKORO_PL_COREML_FP32: KokoroTtsModel<'pm_mateusz'> = {
  name: 'kokoro',
  modelPaths: kokoroModelPaths('coreml', 'pl', 'polish'),
  phonemizer: kokoroNeuralPhonemizer('pl'),
  voices: kokoroVoices(['pm_mateusz']),
};
const KOKORO_DE_COREML_FP32: KokoroTtsModel<'df_anna'> = {
  name: 'kokoro',
  modelPaths: kokoroModelPaths('coreml', 'de', 'german'),
  phonemizer: kokoroNeuralPhonemizer('de'),
  voices: kokoroVoices(['df_anna']),
};

// =============================================================================
// Privacy Filter
// =============================================================================
// Token-level PII detectors over a BIOES label space. Both presets share the
// o200k tokenizer, whose <|endoftext|> id doubles as the pad token; only the
// label space differs between them. The pad token lives in each model's config
// so a future model on a different tokenizer can declare its own.
const O200K_PAD_TOKEN_ID = 199999;

const PRIVACY_FILTER_OPENAI_TOKENIZER = `${BASE_URL}-privacy-filter-openai/${NEXT_VERSION_TAG}/tokenizer.json`;
const PRIVACY_FILTER_OPENAI_OPTS = {
  labelNames: PRIVACY_FILTER_OPENAI_LABELS,
  padTokenId: O200K_PAD_TOKEN_ID,
};
const PRIVACY_FILTER_OPENAI_XNNPACK_8DA4W: PrivacyFilterModel<PrivacyFilterOpenaiLabel> = {
  modelPath: `${BASE_URL}-privacy-filter-openai/${NEXT_VERSION_TAG}/xnnpack/privacy_filter_openai_xnnpack_8da4w.pte`,
  tokenizerPath: PRIVACY_FILTER_OPENAI_TOKENIZER,
  modelOpts: PRIVACY_FILTER_OPENAI_OPTS,
};
const PRIVACY_FILTER_OPENAI_MLX_INT4: PrivacyFilterModel<PrivacyFilterOpenaiLabel> = {
  modelPath: `${BASE_URL}-privacy-filter-openai/${NEXT_VERSION_TAG}/mlx/privacy_filter_openai_mlx_int4.pte`,
  tokenizerPath: PRIVACY_FILTER_OPENAI_TOKENIZER,
  modelOpts: PRIVACY_FILTER_OPENAI_OPTS,
};

const PRIVACY_FILTER_NEMOTRON_TOKENIZER = `${BASE_URL}-privacy-filter-nemotron/${NEXT_VERSION_TAG}/tokenizer.json`;
const PRIVACY_FILTER_NEMOTRON_OPTS = {
  labelNames: PRIVACY_FILTER_NEMOTRON_LABELS,
  padTokenId: O200K_PAD_TOKEN_ID,
};
const PRIVACY_FILTER_NEMOTRON_XNNPACK_8DA4W: PrivacyFilterModel<PrivacyFilterNemotronLabel> = {
  modelPath: `${BASE_URL}-privacy-filter-nemotron/${NEXT_VERSION_TAG}/xnnpack/privacy_filter_nemotron_xnnpack_8da4w.pte`,
  tokenizerPath: PRIVACY_FILTER_NEMOTRON_TOKENIZER,
  modelOpts: PRIVACY_FILTER_NEMOTRON_OPTS,
};
const PRIVACY_FILTER_NEMOTRON_MLX_INT8: PrivacyFilterModel<PrivacyFilterNemotronLabel> = {
  modelPath: `${BASE_URL}-privacy-filter-nemotron/${NEXT_VERSION_TAG}/mlx/privacy_filter_nemotron_mlx_int8.pte`,
  tokenizerPath: PRIVACY_FILTER_NEMOTRON_TOKENIZER,
  modelOpts: PRIVACY_FILTER_NEMOTRON_OPTS,
};

// =============================================================================
// Tokenizers
// =============================================================================
const ALL_MINILM_L6_V2_TOKENIZER = `${BASE_URL}-all-MiniLM-L6-v2/${VERSION_TAG}/tokenizer.json`;

// =============================================================================
// OCR
// =============================================================================
const PPOCRV6_OPTS = { defaultConfidenceThreshold: 0.5 };

// Every OCR export is mixed-precision, and the tag in each filename below names
// the DETECTOR's precision only: `pp_ocrv6_xnnpack_int8.pte` is an int8 DBNet
// paired with an fp32 SVTR recognizer, kept fp32 because int8 is lossy on the
// SVTR attention stack.
const PPOCRV6_CHARSET = `${BASE_URL}-pp-ocrv6/${NEXT_VERSION_TAG}/charset.json`;
const PPOCRV6_SMALL_XNNPACK_INT8: PaddleOcrModel = {
  modelPath: `${BASE_URL}-pp-ocrv6/${NEXT_VERSION_TAG}/xnnpack/pp_ocrv6_xnnpack_int8.pte`,
  charsetPath: PPOCRV6_CHARSET,
  modelOpts: PPOCRV6_OPTS,
};
const PPOCRV6_SMALL_XNNPACK_FP32: PaddleOcrModel = {
  modelPath: `${BASE_URL}-pp-ocrv6/${NEXT_VERSION_TAG}/xnnpack/pp_ocrv6_xnnpack_fp32.pte`,
  charsetPath: PPOCRV6_CHARSET,
  modelOpts: PPOCRV6_OPTS,
};
const PPOCRV6_SMALL_COREML_INT8: PaddleOcrModel = {
  modelPath: `${BASE_URL}-pp-ocrv6/${NEXT_VERSION_TAG}/coreml/pp_ocrv6_coreml_int8.pte`,
  charsetPath: PPOCRV6_CHARSET,
  modelOpts: PPOCRV6_OPTS,
};
const PPOCRV6_SMALL_VULKAN_FP16: PaddleOcrModel = {
  modelPath: `${BASE_URL}-pp-ocrv6/${NEXT_VERSION_TAG}/vulkan/pp_ocrv6_vulkan_fp16.pte`,
  charsetPath: PPOCRV6_CHARSET,
  modelOpts: PPOCRV6_OPTS,
};

// =============================================================================
// LLMs
// =============================================================================
const LFM2_5_BASE_URL = `${BASE_URL}-lfm-2.5/${NEXT_VERSION_TAG}`;

const LFM2_5_1_2B_XNNPACK_8DA4W: LLMModel = {
  modelPath: `${LFM2_5_BASE_URL}/1_2b/xnnpack/lfm_2_5_1_2b_xnnpack_8da4w.pte`,
  tokenizerPath: `${LFM2_5_BASE_URL}/1_2b/tokenizer.json`,
  tokenizerConfigPath: `${LFM2_5_BASE_URL}/1_2b/tokenizer_config.json`,
};
const LFM2_5_1_2B_XNNPACK_FP16: LLMModel = {
  modelPath: `${LFM2_5_BASE_URL}/1_2b/xnnpack/lfm_2_5_1_2b_xnnpack_fp16.pte`,
  tokenizerPath: `${LFM2_5_BASE_URL}/1_2b/tokenizer.json`,
  tokenizerConfigPath: `${LFM2_5_BASE_URL}/1_2b/tokenizer_config.json`,
};
const LFM2_5_1_2B_MLX_INT4: LLMModel = {
  modelPath: `${LFM2_5_BASE_URL}/1_2b/mlx/lfm_2_5_1_2b_mlx_int4.pte`,
  tokenizerPath: `${LFM2_5_BASE_URL}/1_2b/tokenizer.json`,
  tokenizerConfigPath: `${LFM2_5_BASE_URL}/1_2b/tokenizer_config.json`,
};
const LFM2_5_350M_XNNPACK_8DA4W: LLMModel = {
  modelPath: `${LFM2_5_BASE_URL}/350m/xnnpack/lfm_2_5_350m_xnnpack_8da4w.pte`,
  tokenizerPath: `${LFM2_5_BASE_URL}/350m/tokenizer.json`,
  tokenizerConfigPath: `${LFM2_5_BASE_URL}/350m/tokenizer_config.json`,
};
const LFM2_5_350M_XNNPACK_FP16: LLMModel = {
  modelPath: `${LFM2_5_BASE_URL}/350m/xnnpack/lfm_2_5_350m_xnnpack_fp16.pte`,
  tokenizerPath: `${LFM2_5_BASE_URL}/350m/tokenizer.json`,
  tokenizerConfigPath: `${LFM2_5_BASE_URL}/350m/tokenizer_config.json`,
};
const LFM2_5_350M_MLX_INT4: LLMModel = {
  modelPath: `${LFM2_5_BASE_URL}/350m/mlx/lfm_2_5_350m_mlx_int4.pte`,
  tokenizerPath: `${LFM2_5_BASE_URL}/350m/tokenizer.json`,
  tokenizerConfigPath: `${LFM2_5_BASE_URL}/350m/tokenizer_config.json`,
};

const LFM2_5_VL_PREPROCESSOR_CONFIG = {
  image: {
    visionToken: { start: '<|image_start|>', end: '<|image_end|>' },
    targetShape: [3, 512, 512] as const,
    preprocessorOpts: {
      resizeMode: 'letterbox' as const,
      interpolation: 'linear' as const,
      normalizeOpts: { alpha: 1.0, beta: 0.0 },
    },
  },
};
const LFM2_5_VL_450M_XNNPACK_8DA4W: LLMModel = {
  modelPath: `${LFM2_5_BASE_URL}/vl_450m/xnnpack/lfm_2_5_vl_450m_xnnpack_8da4w.pte`,
  tokenizerPath: `${LFM2_5_BASE_URL}/vl_450m/tokenizer.json`,
  tokenizerConfigPath: `${LFM2_5_BASE_URL}/vl_450m/tokenizer_config.json`,
  modalities: ['image'],
  preprocessorConfig: LFM2_5_VL_PREPROCESSOR_CONFIG,
};
const LFM2_5_VL_450M_MLX_INT4: LLMModel = {
  modelPath: `${LFM2_5_BASE_URL}/vl_450m/mlx/lfm_2_5_vl_450m_mlx_int4.pte`,
  tokenizerPath: `${LFM2_5_BASE_URL}/vl_450m/tokenizer.json`,
  tokenizerConfigPath: `${LFM2_5_BASE_URL}/vl_450m/tokenizer_config.json`,
  modalities: ['image'],
  preprocessorConfig: LFM2_5_VL_PREPROCESSOR_CONFIG,
};
const LFM2_5_VL_1_6B_XNNPACK_8DA4W: LLMModel = {
  modelPath: `${LFM2_5_BASE_URL}/vl_1_6b/xnnpack/lfm_2_5_vl_1_6b_xnnpack_8da4w.pte`,
  tokenizerPath: `${LFM2_5_BASE_URL}/vl_1_6b/tokenizer.json`,
  tokenizerConfigPath: `${LFM2_5_BASE_URL}/vl_1_6b/tokenizer_config.json`,
  modalities: ['image'],
  preprocessorConfig: LFM2_5_VL_PREPROCESSOR_CONFIG,
};
const LFM2_5_VL_450M_VULKAN_8DA4W: LLMModel = {
  modelPath: `${LFM2_5_BASE_URL}/vl_450m/vulkan/lfm_2_5_vl_450m_vulkan_8da4w.pte`,
  tokenizerPath: `${LFM2_5_BASE_URL}/vl_450m/tokenizer.json`,
  tokenizerConfigPath: `${LFM2_5_BASE_URL}/vl_450m/tokenizer_config.json`,
  modalities: ['image'],
  preprocessorConfig: LFM2_5_VL_PREPROCESSOR_CONFIG,
};
const LFM2_5_VL_1_6B_VULKAN_8DA4W: LLMModel = {
  modelPath: `${LFM2_5_BASE_URL}/vl_1_6b/vulkan/lfm_2_5_vl_1_6b_vulkan_8da4w.pte`,
  tokenizerPath: `${LFM2_5_BASE_URL}/vl_1_6b/tokenizer.json`,
  tokenizerConfigPath: `${LFM2_5_BASE_URL}/vl_1_6b/tokenizer_config.json`,
  modalities: ['image'],
  preprocessorConfig: LFM2_5_VL_PREPROCESSOR_CONFIG,
};
const LFM2_5_VL_1_6B_MLX_INT4: LLMModel = {
  modelPath: `${LFM2_5_BASE_URL}/vl_1_6b/mlx/lfm_2_5_vl_1_6b_mlx_int4.pte`,
  tokenizerPath: `${LFM2_5_BASE_URL}/vl_1_6b/tokenizer.json`,
  tokenizerConfigPath: `${LFM2_5_BASE_URL}/vl_1_6b/tokenizer_config.json`,
  modalities: ['image'],
  preprocessorConfig: LFM2_5_VL_PREPROCESSOR_CONFIG,
};
const LFM2_5_VL_1_6B_MLX_INT8: LLMModel = {
  modelPath: `${LFM2_5_BASE_URL}/vl_1_6b/mlx/lfm_2_5_vl_1_6b_mlx_int8.pte`,
  tokenizerPath: `${LFM2_5_BASE_URL}/vl_1_6b/tokenizer.json`,
  tokenizerConfigPath: `${LFM2_5_BASE_URL}/vl_1_6b/tokenizer_config.json`,
  modalities: ['image'],
  preprocessorConfig: LFM2_5_VL_PREPROCESSOR_CONFIG,
};

const BIELIK_V3_1_5B_BASE_URL = `${BASE_URL}-bielik-v3.0/${NEXT_VERSION_TAG}`;

const BIELIK_V3_1_5B_XNNPACK_8DA4W: LLMModel = {
  modelPath: `${BIELIK_V3_1_5B_BASE_URL}/xnnpack/bielik_v3_0_1_5b_xnnpack_8da4w.pte`,
  tokenizerPath: `${BIELIK_V3_1_5B_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${BIELIK_V3_1_5B_BASE_URL}/tokenizer_config.json`,
};
const BIELIK_V3_1_5B_XNNPACK_FP16: LLMModel = {
  modelPath: `${BIELIK_V3_1_5B_BASE_URL}/xnnpack/bielik_v3_0_1_5b_xnnpack_fp16.pte`,
  tokenizerPath: `${BIELIK_V3_1_5B_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${BIELIK_V3_1_5B_BASE_URL}/tokenizer_config.json`,
};

const LLAMA3_2_BASE_URL = `${BASE_URL}-llama-3.2/${NEXT_VERSION_TAG}`;

const LLAMA3_2_3B_SPINQUANT: LLMModel = {
  modelPath: `${LLAMA3_2_BASE_URL}/3b/xnnpack/llama_3_2_3b_xnnpack_spinquant.pte`,
  tokenizerPath: `${LLAMA3_2_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${LLAMA3_2_BASE_URL}/tokenizer_config.json`,
};
const LLAMA3_2_3B_BF16: LLMModel = {
  modelPath: `${LLAMA3_2_BASE_URL}/3b/xnnpack/llama_3_2_3b_xnnpack_bf16.pte`,
  tokenizerPath: `${LLAMA3_2_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${LLAMA3_2_BASE_URL}/tokenizer_config.json`,
};
const LLAMA3_2_1B_SPINQUANT: LLMModel = {
  modelPath: `${LLAMA3_2_BASE_URL}/1b/xnnpack/llama_3_2_1b_xnnpack_spinquant.pte`,
  tokenizerPath: `${LLAMA3_2_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${LLAMA3_2_BASE_URL}/tokenizer_config.json`,
};
const LLAMA3_2_1B_BF16: LLMModel = {
  modelPath: `${LLAMA3_2_BASE_URL}/1b/xnnpack/llama_3_2_1b_xnnpack_bf16.pte`,
  tokenizerPath: `${LLAMA3_2_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${LLAMA3_2_BASE_URL}/tokenizer_config.json`,
};

const SMOLLM2_BASE_URL = `${BASE_URL}-smolLm-2/${NEXT_VERSION_TAG}`;

const SMOLLM2_135M_8DA8W: LLMModel = {
  modelPath: `${SMOLLM2_BASE_URL}/135m/xnnpack/smollm2_135m_xnnpack_8da8w.pte`,
  tokenizerPath: `${SMOLLM2_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${SMOLLM2_BASE_URL}/tokenizer_config.json`,
};
const SMOLLM2_360M_8DA8W: LLMModel = {
  modelPath: `${SMOLLM2_BASE_URL}/360m/xnnpack/smollm2_360m_xnnpack_8da8w.pte`,
  tokenizerPath: `${SMOLLM2_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${SMOLLM2_BASE_URL}/tokenizer_config.json`,
};
const SMOLLM2_1_7B_8DA8W: LLMModel = {
  modelPath: `${SMOLLM2_BASE_URL}/1_7b/xnnpack/smollm2_1_7b_xnnpack_8da8w.pte`,
  tokenizerPath: `${SMOLLM2_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${SMOLLM2_BASE_URL}/tokenizer_config.json`,
};

const HAMMER2_1_BASE_URL = `${BASE_URL}-hammer-2.1/${NEXT_VERSION_TAG}`;

const HAMMER2_1_0_5B_XNNPACK_8DA4W: LLMModel = {
  modelPath: `${HAMMER2_1_BASE_URL}/0_5b/xnnpack/hammer_2_1_0_5b_xnnpack_8da4w.pte`,
  tokenizerPath: `${HAMMER2_1_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${HAMMER2_1_BASE_URL}/tokenizer_config.json`,
};
const HAMMER2_1_0_5B_XNNPACK_BF16: LLMModel = {
  modelPath: `${HAMMER2_1_BASE_URL}/0_5b/xnnpack/hammer_2_1_0_5b_xnnpack_bf16.pte`,
  tokenizerPath: `${HAMMER2_1_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${HAMMER2_1_BASE_URL}/tokenizer_config.json`,
};
const HAMMER2_1_1_5B_XNNPACK_8DA4W: LLMModel = {
  modelPath: `${HAMMER2_1_BASE_URL}/1_5b/xnnpack/hammer_2_1_1_5b_xnnpack_8da4w.pte`,
  tokenizerPath: `${HAMMER2_1_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${HAMMER2_1_BASE_URL}/tokenizer_config.json`,
};
const HAMMER2_1_1_5B_XNNPACK_BF16: LLMModel = {
  modelPath: `${HAMMER2_1_BASE_URL}/1_5b/xnnpack/hammer_2_1_1_5b_xnnpack_bf16.pte`,
  tokenizerPath: `${HAMMER2_1_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${HAMMER2_1_BASE_URL}/tokenizer_config.json`,
};
const HAMMER2_1_3B_XNNPACK_8DA4W: LLMModel = {
  modelPath: `${HAMMER2_1_BASE_URL}/3b/xnnpack/hammer_2_1_3b_xnnpack_8da4w.pte`,
  tokenizerPath: `${HAMMER2_1_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${HAMMER2_1_BASE_URL}/tokenizer_config.json`,
};
const HAMMER2_1_3B_XNNPACK_BF16: LLMModel = {
  modelPath: `${HAMMER2_1_BASE_URL}/3b/xnnpack/hammer_2_1_3b_xnnpack_bf16.pte`,
  tokenizerPath: `${HAMMER2_1_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${HAMMER2_1_BASE_URL}/tokenizer_config.json`,
};

const PHI4_MINI_BASE_URL = `${BASE_URL}-phi-4-mini/${NEXT_VERSION_TAG}`;

const PHI4_MINI_XNNPACK_8DA4W: LLMModel = {
  modelPath: `${PHI4_MINI_BASE_URL}/xnnpack/phi_4_mini_xnnpack_8da4w.pte`,
  tokenizerPath: `${PHI4_MINI_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${PHI4_MINI_BASE_URL}/tokenizer_config.json`,
};
const PHI4_MINI_XNNPACK_BF16: LLMModel = {
  modelPath: `${PHI4_MINI_BASE_URL}/xnnpack/phi_4_mini_xnnpack_bf16.pte`,
  tokenizerPath: `${PHI4_MINI_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${PHI4_MINI_BASE_URL}/tokenizer_config.json`,
};

const QWEN2_5_BASE_URL = `${BASE_URL}-qwen-2.5/${NEXT_VERSION_TAG}`;

const QWEN2_5_0_5B_XNNPACK_8DA4W: LLMModel = {
  modelPath: `${QWEN2_5_BASE_URL}/0_5b/xnnpack/qwen_2_5_0_5b_xnnpack_8da4w.pte`,
  tokenizerPath: `${QWEN2_5_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${QWEN2_5_BASE_URL}/tokenizer_config.json`,
};
const QWEN2_5_0_5B_XNNPACK_BF16: LLMModel = {
  modelPath: `${QWEN2_5_BASE_URL}/0_5b/xnnpack/qwen_2_5_0_5b_xnnpack_bf16.pte`,
  tokenizerPath: `${QWEN2_5_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${QWEN2_5_BASE_URL}/tokenizer_config.json`,
};
const QWEN2_5_1_5B_XNNPACK_8DA4W: LLMModel = {
  modelPath: `${QWEN2_5_BASE_URL}/1_5b/xnnpack/qwen_2_5_1_5b_xnnpack_8da4w.pte`,
  tokenizerPath: `${QWEN2_5_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${QWEN2_5_BASE_URL}/tokenizer_config.json`,
};
const QWEN2_5_1_5B_XNNPACK_BF16: LLMModel = {
  modelPath: `${QWEN2_5_BASE_URL}/1_5b/xnnpack/qwen_2_5_1_5b_xnnpack_bf16.pte`,
  tokenizerPath: `${QWEN2_5_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${QWEN2_5_BASE_URL}/tokenizer_config.json`,
};
const QWEN2_5_3B_XNNPACK_8DA4W: LLMModel = {
  modelPath: `${QWEN2_5_BASE_URL}/3b/xnnpack/qwen_2_5_3b_xnnpack_8da4w.pte`,
  tokenizerPath: `${QWEN2_5_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${QWEN2_5_BASE_URL}/tokenizer_config.json`,
};
const QWEN2_5_3B_XNNPACK_BF16: LLMModel = {
  modelPath: `${QWEN2_5_BASE_URL}/3b/xnnpack/qwen_2_5_3b_xnnpack_bf16.pte`,
  tokenizerPath: `${QWEN2_5_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${QWEN2_5_BASE_URL}/tokenizer_config.json`,
};

const GEMMA4_BASE_URL = `${BASE_URL}-gemma-4/${NEXT_VERSION_TAG}`;

const GEMMA4_E2B_XNNPACK_8DA4W: LLMModel = {
  modelPath: `${GEMMA4_BASE_URL}/e2b/xnnpack/gemma_4_e2b_xnnpack_8da4w.pte`,
  tokenizerPath: `${GEMMA4_BASE_URL}/e2b/tokenizer.json`,
  tokenizerConfigPath: `${GEMMA4_BASE_URL}/e2b/tokenizer_config.json`,
};
const GEMMA4_E2B_VULKAN_8DA4W: LLMModel = {
  modelPath: `${GEMMA4_BASE_URL}/e2b/vulkan/gemma_4_e2b_vulkan_8da4w.pte`,
  tokenizerPath: `${GEMMA4_BASE_URL}/e2b/tokenizer.json`,
  tokenizerConfigPath: `${GEMMA4_BASE_URL}/e2b/tokenizer_config.json`,
};
const GEMMA4_E2B_MLX_INT4: LLMModel = {
  modelPath: `${GEMMA4_BASE_URL}/e2b/mlx/gemma4_e2b_mlx_int4.pte`,
  tokenizerPath: `${GEMMA4_BASE_URL}/e2b/tokenizer.json`,
  tokenizerConfigPath: `${GEMMA4_BASE_URL}/e2b/tokenizer_config.json`,
};

const QWEN3_BASE_URL = `${BASE_URL}-qwen-3/${NEXT_VERSION_TAG}`;

const QWEN3_0_6B_XNNPACK_8DA4W: LLMModel = {
  modelPath: `${QWEN3_BASE_URL}/0_6b/xnnpack/qwen_3_0_6b_xnnpack_8da4w.pte`,
  tokenizerPath: `${QWEN3_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${QWEN3_BASE_URL}/tokenizer_config.json`,
};
const QWEN3_0_6B_XNNPACK_BF16: LLMModel = {
  modelPath: `${QWEN3_BASE_URL}/0_6b/xnnpack/qwen_3_0_6b_xnnpack_bf16.pte`,
  tokenizerPath: `${QWEN3_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${QWEN3_BASE_URL}/tokenizer_config.json`,
};
const QWEN3_1_7B_XNNPACK_8DA4W: LLMModel = {
  modelPath: `${QWEN3_BASE_URL}/1_7b/xnnpack/qwen_3_1_7b_xnnpack_8da4w.pte`,
  tokenizerPath: `${QWEN3_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${QWEN3_BASE_URL}/tokenizer_config.json`,
};
const QWEN3_1_7B_XNNPACK_BF16: LLMModel = {
  modelPath: `${QWEN3_BASE_URL}/1_7b/xnnpack/qwen_3_1_7b_xnnpack_bf16.pte`,
  tokenizerPath: `${QWEN3_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${QWEN3_BASE_URL}/tokenizer_config.json`,
};
const QWEN3_4B_XNNPACK_8DA4W: LLMModel = {
  modelPath: `${QWEN3_BASE_URL}/4b/xnnpack/qwen_3_4b_xnnpack_8da4w.pte`,
  tokenizerPath: `${QWEN3_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${QWEN3_BASE_URL}/tokenizer_config.json`,
};
const QWEN3_4B_XNNPACK_BF16: LLMModel = {
  modelPath: `${QWEN3_BASE_URL}/4b/xnnpack/qwen_3_4b_xnnpack_bf16.pte`,
  tokenizerPath: `${QWEN3_BASE_URL}/tokenizer.json`,
  tokenizerConfigPath: `${QWEN3_BASE_URL}/tokenizer_config.json`,
};

/**
 * Registry of pre-configured ExecuTorch models.
 *
 * This provides Hugging Face repository URLs and baseline configurations for
 * tasks, allowing quick model loading and execution without manual option
 * setup.
 *
 * Models published for more than one backend expose their exports as named
 * variants (`XNNPACK_INT8`, `COREML_FP16`, ...) plus a `DEFAULT` alias. The
 * alias is chosen for the device the app runs on: Core ML then MLX on iOS
 * hardware, Vulkan on Android, XNNPACK as the fallback everywhere and the only
 * option on the iOS simulator — always narrowed to the backends the app
 * actually linked in. Reach for a named variant to override that.
 * @category Models
 */
export const models = {
  /**
   * Image classification models that categorize input images into pre-defined
   * classes.
   */
  classification: {
    /**
     * EfficientNetV2-S image classification model pre-trained on ImageNet-1k
     * (1000 categories, see {@link IMAGENET1K_LABELS}). Compact and efficient
     * architecture providing high accuracy for general-purpose image
     * classification.
     */
    EFFICIENTNET_V2_S: variants({
      XNNPACK_INT8: EFFICIENTNET_V2_S_XNNPACK_INT8,
      XNNPACK_FP32: EFFICIENTNET_V2_S_XNNPACK_FP32,
      COREML_FP16: EFFICIENTNET_V2_S_COREML_FP16,
    }),
  },

  /**
   * Artistic style transfer models that re-style input images according to
   * artwork patterns.
   */
  styleTransfer: {
    /**
     * Fast neural style transfer model generating a vibrant, artistic "Candy"
     * style effect.
     */
    CANDY: variants({
      XNNPACK_INT8: STYLE_TRANSFER_CANDY_XNNPACK_INT8,
      XNNPACK_FP32: STYLE_TRANSFER_CANDY_XNNPACK_FP32,
      COREML_FP16: STYLE_TRANSFER_CANDY_COREML_FP16,
    }),
    /**
     * Fast neural style transfer model applying a classic tile mosaic artistic
     * pattern.
     */
    MOSAIC: variants({
      XNNPACK_INT8: STYLE_TRANSFER_MOSAIC_XNNPACK_INT8,
      XNNPACK_FP32: STYLE_TRANSFER_MOSAIC_XNNPACK_FP32,
      COREML_FP16: STYLE_TRANSFER_MOSAIC_COREML_FP16,
    }),
    /**
     * Fast neural style transfer model applying a painterly "Rain Princess" oil
     * painting aesthetic.
     */
    RAIN_PRINCESS: variants({
      XNNPACK_INT8: STYLE_TRANSFER_RAIN_PRINCESS_XNNPACK_INT8,
      XNNPACK_FP32: STYLE_TRANSFER_RAIN_PRINCESS_XNNPACK_FP32,
      COREML_FP16: STYLE_TRANSFER_RAIN_PRINCESS_COREML_FP16,
    }),
    /**
     * Fast neural style transfer model applying Francis Picabia's "Udnie"
     * abstract art style.
     */
    UDNIE: variants({
      XNNPACK_INT8: STYLE_TRANSFER_UDNIE_XNNPACK_INT8,
      XNNPACK_FP32: STYLE_TRANSFER_UDNIE_XNNPACK_FP32,
      COREML_FP16: STYLE_TRANSFER_UDNIE_COREML_FP16,
    }),
  },

  /**
   * Semantic segmentation models that classify each pixel into target object or
   * background classes.
   */
  semanticSegmentation: {
    /**
     * Lightweight portrait selfie segmentation model for real-time person vs
     * background separation. Categorizes pixels into `background` and `person`.
     * Ideal for background blur and replacement effects.
     */
    SELFIE_SEGMENTATION: variants({
      XNNPACK_FP32: SELFIE_SEGMENTATION_XNNPACK_FP32,
      COREML_FP16: SELFIE_SEGMENTATION_COREML_FP16,
    }),
    /**
     * MediaPipe Selfie Segmentation, landscape orientation. A separate
     * 256x144 checkpoint rather than a resize of the portrait model.
     */
    SELFIE_SEGMENTATION_LANDSCAPE: variants({
      XNNPACK_FP32: SELFIE_SEGMENTATION_LANDSCAPE_XNNPACK_FP32,
      COREML_FP16: SELFIE_SEGMENTATION_LANDSCAPE_COREML_FP16,
    }),
    /**
     * Lite R-ASPP semantic segmentation model with MobileNetV3-Large backbone
     * (21 classes, see {@link PASCAL_VOC_LABELS}). Optimized for low-latency,
     * real-time pixel-level segmentation on mobile devices.
     */
    LRASPP_MOBILENET_V3_LARGE: variants({
      XNNPACK_INT8: LRASPP_MOBILENET_V3_LARGE_XNNPACK_INT8,
      XNNPACK_FP32: LRASPP_MOBILENET_V3_LARGE_XNNPACK_FP32,
      COREML_FP16: LRASPP_MOBILENET_V3_LARGE_COREML_FP16,
    }),
    /**
     * DeepLabV3 semantic segmentation model with ResNet-50 backbone (21
     * classes, see {@link PASCAL_VOC_LABELS}). High-accuracy segmentation
     * utilizing atrous spatial pyramid pooling.
     */
    DEEPLAB_V3_RESNET50: variants({
      XNNPACK_INT8: DEEPLAB_V3_RESNET50_XNNPACK_INT8,
      XNNPACK_FP32: DEEPLAB_V3_RESNET50_XNNPACK_FP32,
      COREML_FP16: DEEPLAB_V3_RESNET50_COREML_FP16,
    }),
    /**
     * DeepLabV3 semantic segmentation model with ResNet-101 backbone (21
     * classes, see {@link PASCAL_VOC_LABELS}). High-capacity backbone for
     * maximum segmentation detail and boundary accuracy.
     */
    DEEPLAB_V3_RESNET101: variants({
      XNNPACK_INT8: DEEPLAB_V3_RESNET101_XNNPACK_INT8,
      XNNPACK_FP32: DEEPLAB_V3_RESNET101_XNNPACK_FP32,
      COREML_FP16: DEEPLAB_V3_RESNET101_COREML_FP16,
    }),
    /**
     * DeepLabV3 semantic segmentation model with MobileNetV3-Large backbone (21
     * classes, see {@link PASCAL_VOC_LABELS}). Combines DeepLabV3 feature
     * extraction quality with a lightweight mobile backbone.
     */
    DEEPLAB_V3_MOBILENET_V3_LARGE: variants({
      XNNPACK_INT8: DEEPLAB_V3_MOBILENET_V3_LARGE_XNNPACK_INT8,
      XNNPACK_FP32: DEEPLAB_V3_MOBILENET_V3_LARGE_XNNPACK_FP32,
      COREML_FP16: DEEPLAB_V3_MOBILENET_V3_LARGE_COREML_FP16,
    }),
    /**
     * Fully Convolutional Network (FCN) semantic segmentation model with
     * ResNet-50 backbone (21 classes, see {@link PASCAL_VOC_LABELS}).
     */
    FCN_RESNET50: variants({
      XNNPACK_INT8: FCN_RESNET50_XNNPACK_INT8,
      XNNPACK_FP32: FCN_RESNET50_XNNPACK_FP32,
      COREML_FP16: FCN_RESNET50_COREML_FP16,
    }),
    /**
     * Fully Convolutional Network (FCN) semantic segmentation model with
     * ResNet-101 backbone (21 classes, see {@link PASCAL_VOC_LABELS}).
     */
    FCN_RESNET101: variants({
      XNNPACK_INT8: FCN_RESNET101_XNNPACK_INT8,
      XNNPACK_FP32: FCN_RESNET101_XNNPACK_FP32,
      COREML_FP16: FCN_RESNET101_COREML_FP16,
    }),
  },

  /**
   * Object detection models that identify object locations and bounding boxes.
   */
  objectDetection: {
    /**
     * SSDLite object detector with MobileNetV3-Large backbone trained on COCO
     * (see {@link COCO_CLASSES}) at 320x320 resolution. Fast, lightweight
     * detector suited for real-time mobile applications.
     */
    SSDLITE320_MOBILENET_V3_LARGE: variants({
      XNNPACK_FP32: SSDLITE320_MOBILENET_V3_LARGE_XNNPACK_FP32,
      COREML_FP16: SSDLITE320_MOBILENET_V3_LARGE_COREML_FP16,
    }),
    /**
     * RF-DETR (Roboflow Detection Transformer) Nano variant trained on COCO
     * (see {@link COCO_CLASSES}). Modern end-to-end DINOv2-based transformer
     * object detector.
     */
    RFDETR_NANO: variants({
      XNNPACK_FP32: RFDETR_NANO_DETECTOR_XNNPACK_FP32,
      COREML_FP16: RFDETR_NANO_DETECTOR_COREML_FP16,
    }),
    /**
     * Ultralytics YOLO26 real-time object detection models trained on COCO (80
     * classes, see {@link COCO_CLASSES_YOLO}). Available across multiple scale
     * sizes (NANO, SMALL, MEDIUM, LARGE, XLARGE) and resolutions (384x384,
     * 512x512, 640x640).
     */
    YOLO26: family({
      /**
       * Nano scale YOLO26 object detection model. High speed, ultra low
       * latency.
       */
      NANO: family({
        SIZE_384: variants({
          XNNPACK_FP32: YOLO26_NANO_384_XNNPACK_FP32,
          COREML_FP16: YOLO26_NANO_384_COREML_FP16,
        }),
        SIZE_512: variants({
          XNNPACK_FP32: YOLO26_NANO_512_XNNPACK_FP32,
          COREML_FP16: YOLO26_NANO_512_COREML_FP16,
        }),
        SIZE_640: variants({
          XNNPACK_FP32: YOLO26_NANO_640_XNNPACK_FP32,
          COREML_FP16: YOLO26_NANO_640_COREML_FP16,
        }),
      }),
      /**
       * Small scale YOLO26 object detection model. Balanced latency and
       * accuracy.
       */
      SMALL: family({
        SIZE_384: variants({
          XNNPACK_FP32: YOLO26_SMALL_384_XNNPACK_FP32,
          COREML_FP16: YOLO26_SMALL_384_COREML_FP16,
        }),
        SIZE_512: variants({
          XNNPACK_FP32: YOLO26_SMALL_512_XNNPACK_FP32,
          COREML_FP16: YOLO26_SMALL_512_COREML_FP16,
        }),
        SIZE_640: variants({
          XNNPACK_FP32: YOLO26_SMALL_640_XNNPACK_FP32,
          COREML_FP16: YOLO26_SMALL_640_COREML_FP16,
        }),
      }),
      /**
       * Medium scale YOLO26 object detection model. Higher precision for
       * complex scenes.
       */
      MEDIUM: family({
        SIZE_384: variants({
          XNNPACK_FP32: YOLO26_MEDIUM_384_XNNPACK_FP32,
          COREML_FP16: YOLO26_MEDIUM_384_COREML_FP16,
        }),
        SIZE_512: variants({
          XNNPACK_FP32: YOLO26_MEDIUM_512_XNNPACK_FP32,
          COREML_FP16: YOLO26_MEDIUM_512_COREML_FP16,
        }),
        SIZE_640: variants({
          XNNPACK_FP32: YOLO26_MEDIUM_640_XNNPACK_FP32,
          COREML_FP16: YOLO26_MEDIUM_640_COREML_FP16,
        }),
      }),
      /**
       * Large scale YOLO26 object detection model. High accuracy model variant.
       */
      LARGE: family({
        SIZE_384: variants({
          XNNPACK_FP32: YOLO26_LARGE_384_XNNPACK_FP32,
          COREML_FP16: YOLO26_LARGE_384_COREML_FP16,
        }),
        SIZE_512: variants({
          XNNPACK_FP32: YOLO26_LARGE_512_XNNPACK_FP32,
          COREML_FP16: YOLO26_LARGE_512_COREML_FP16,
        }),
        SIZE_640: variants({
          XNNPACK_FP32: YOLO26_LARGE_640_XNNPACK_FP32,
          COREML_FP16: YOLO26_LARGE_640_COREML_FP16,
        }),
      }),
      /**
       * Extra Large scale YOLO26 object detection model. Maximum detection
       * performance.
       */
      XLARGE: family({
        SIZE_384: variants({
          XNNPACK_FP32: YOLO26_XLARGE_384_XNNPACK_FP32,
          COREML_FP16: YOLO26_XLARGE_384_COREML_FP16,
        }),
        SIZE_512: variants({
          XNNPACK_FP32: YOLO26_XLARGE_512_XNNPACK_FP32,
          COREML_FP16: YOLO26_XLARGE_512_COREML_FP16,
        }),
        SIZE_640: variants({
          XNNPACK_FP32: YOLO26_XLARGE_640_XNNPACK_FP32,
          COREML_FP16: YOLO26_XLARGE_640_COREML_FP16,
        }),
      }),
    }),
  },

  /**
   * Keypoint and pose detection models that estimate facial landmarks or human
   * body skeletal keypoints.
   */
  keypointDetection: {
    /**
     * MediaPipe BlazeFace lightweight face detection and 6-point facial
     * landmark locator (eyes, nose, mouth, ears, see
     * {@link BLAZEFACE_LANDMARKS}).
     */
    BLAZEFACE: variants({
      XNNPACK_FP32: BLAZEFACE_XNNPACK_FP32,
    }),
    /**
     * YOLO26 human pose estimation model predicting 17 COCO body keypoints (see
     * {@link COCO_LANDMARKS}). Available across 384x384, 512x512, and 640x640
     * resolutions.
     */
    YOLO26_POSE: family({
      SIZE_384: variants({
        XNNPACK_FP32: YOLO26_POSE_384_XNNPACK_FP32,
        COREML_FP16: YOLO26_POSE_384_COREML_FP16,
      }),
      SIZE_512: variants({
        XNNPACK_FP32: YOLO26_POSE_512_XNNPACK_FP32,
        COREML_FP16: YOLO26_POSE_512_COREML_FP16,
      }),
      SIZE_640: variants({
        XNNPACK_FP32: YOLO26_POSE_640_XNNPACK_FP32,
        COREML_FP16: YOLO26_POSE_640_COREML_FP16,
      }),
    }),
    /**
     * RF-DETR (Roboflow Detection Transformer) pose keypoint detector
     * predicting 17 COCO body keypoints (see {@link COCO_LANDMARKS}).
     */
    RFDETR_KEYPOINT: variants(
      {
        XNNPACK_FP32: RFDETR_KEYPOINT_XNNPACK_FP32,
        COREML_FP16: RFDETR_KEYPOINT_COREML_FP16,
        MLX_FP32: RFDETR_KEYPOINT_MLX_FP32,
      },
      // Core ML over MLX: 144.0 ms against 272.3 on an iPhone 16, at 263 MB
      // against 1304 MB. fp16 matches the fp32 build it replaced (landmarks to
      // 1.04 px over 13 photos) but only under the GPU-only compute unit and an
      // iOS17 deployment target — every other combination degrades it, and a
      // macOS check passes builds the device gets wrong. See export-scripts
      // MR !18 before re-exporting.
      { ios: 'COREML_FP16' }
    ),
  },

  /**
   * Instance segmentation models predicting both bounding boxes and
   * fine-grained pixel masks per object instance.
   */
  instanceSegmentation: {
    /**
     * Fast Segment Anything Model (FastSAM) for promptable or global object
     * instance mask segmentation. Available in Small (S) and Extra Large (X)
     * variants.
     */
    FASTSAM: {
      /**
       * FastSAM Small - lightweight instance segmenter for mobile.
       */
      S: variants({
        XNNPACK_FP32: FASTSAM_S_XNNPACK_FP32,
        COREML_FP16: FASTSAM_S_COREML_FP16,
      }),
      /**
       * FastSAM Extra Large - high-accuracy instance segmenter.
       */
      X: variants({
        XNNPACK_FP32: FASTSAM_X_XNNPACK_FP32,
        COREML_FP16: FASTSAM_X_COREML_FP16,
      }),
    },
    /**
     * RF-DETR (Roboflow Detection Transformer) Nano instance segmentation model
     * predicting COCO class masks and bounding boxes (see
     * {@link COCO_CLASSES}).
     */
    RFDETR_NANO: variants({
      XNNPACK_FP32: RFDETR_NANO_SEG_XNNPACK_FP32,
      COREML_FP16: RFDETR_NANO_SEG_COREML_FP16,
    }),
    /**
     * YOLO26 instance segmentation models predicting COCO class instance masks
     * and bounding boxes (see {@link COCO_CLASSES_YOLO}). Available across
     * multiple sizes (NANO, SMALL, MEDIUM, LARGE, XLARGE) and resolutions
     * (384x384, 512x512, 640x640).
     */
    YOLO26: family({
      /**
       * Nano scale YOLO26 instance segmentation model. High speed, ultra low
       * latency mask generation.
       */
      NANO: family({
        SIZE_384: variants({
          XNNPACK_FP32: YOLO26_NANO_SEG_384_XNNPACK_FP32,
          COREML_FP16: YOLO26_NANO_SEG_384_COREML_FP16,
        }),
        SIZE_512: variants({
          XNNPACK_FP32: YOLO26_NANO_SEG_512_XNNPACK_FP32,
          COREML_FP16: YOLO26_NANO_SEG_512_COREML_FP16,
        }),
        SIZE_640: variants({
          XNNPACK_FP32: YOLO26_NANO_SEG_640_XNNPACK_FP32,
          COREML_FP16: YOLO26_NANO_SEG_640_COREML_FP16,
        }),
      }),
      /**
       * Small scale YOLO26 instance segmentation model. Balanced latency and
       * mask accuracy.
       */
      SMALL: family({
        SIZE_384: variants({
          XNNPACK_FP32: YOLO26_SMALL_SEG_384_XNNPACK_FP32,
          COREML_FP16: YOLO26_SMALL_SEG_384_COREML_FP16,
        }),
        SIZE_512: variants({
          XNNPACK_FP32: YOLO26_SMALL_SEG_512_XNNPACK_FP32,
          COREML_FP16: YOLO26_SMALL_SEG_512_COREML_FP16,
        }),
        SIZE_640: variants({
          XNNPACK_FP32: YOLO26_SMALL_SEG_640_XNNPACK_FP32,
          COREML_FP16: YOLO26_SMALL_SEG_640_COREML_FP16,
        }),
      }),
      /**
       * Medium scale YOLO26 instance segmentation model. Higher mask boundary
       * precision for complex multi-object scenes.
       */
      MEDIUM: family({
        SIZE_384: variants({
          XNNPACK_FP32: YOLO26_MEDIUM_SEG_384_XNNPACK_FP32,
          COREML_FP16: YOLO26_MEDIUM_SEG_384_COREML_FP16,
        }),
        SIZE_512: variants({
          XNNPACK_FP32: YOLO26_MEDIUM_SEG_512_XNNPACK_FP32,
          COREML_FP16: YOLO26_MEDIUM_SEG_512_COREML_FP16,
        }),
        SIZE_640: variants({
          XNNPACK_FP32: YOLO26_MEDIUM_SEG_640_XNNPACK_FP32,
          COREML_FP16: YOLO26_MEDIUM_SEG_640_COREML_FP16,
        }),
      }),
      /**
       * Large scale YOLO26 instance segmentation model. High accuracy instance
       * segmentation variant for demanding visual pipelines.
       */
      LARGE: family({
        SIZE_384: variants({
          XNNPACK_FP32: YOLO26_LARGE_SEG_384_XNNPACK_FP32,
          COREML_FP16: YOLO26_LARGE_SEG_384_COREML_FP16,
        }),
        SIZE_512: variants({
          XNNPACK_FP32: YOLO26_LARGE_SEG_512_XNNPACK_FP32,
          COREML_FP16: YOLO26_LARGE_SEG_512_COREML_FP16,
        }),
        SIZE_640: variants({
          XNNPACK_FP32: YOLO26_LARGE_SEG_640_XNNPACK_FP32,
          COREML_FP16: YOLO26_LARGE_SEG_640_COREML_FP16,
        }),
      }),
      /**
       * Extra Large scale YOLO26 instance segmentation model. Maximum instance
       * segmentation and mask delineation performance.
       */
      XLARGE: family({
        SIZE_384: variants({
          XNNPACK_FP32: YOLO26_XLARGE_SEG_384_XNNPACK_FP32,
          COREML_FP16: YOLO26_XLARGE_SEG_384_COREML_FP16,
        }),
        SIZE_512: variants({
          XNNPACK_FP32: YOLO26_XLARGE_SEG_512_XNNPACK_FP32,
          COREML_FP16: YOLO26_XLARGE_SEG_512_COREML_FP16,
        }),
        SIZE_640: variants({
          XNNPACK_FP32: YOLO26_XLARGE_SEG_640_XNNPACK_FP32,
          COREML_FP16: YOLO26_XLARGE_SEG_640_COREML_FP16,
        }),
      }),
    }),
  },

  /**
   * Voice Activity Detection (VAD) models detecting speech vs non-speech
   * intervals in real-time audio streams.
   */
  voiceActivityDetection: {
    /**
     * Feedforward Sequential Memory Network (FSMN) Voice Activity Detection
     * model. Extremely lightweight model evaluating continuous speech
     * probability chunks for live mic streaming and STT preprocessing.
     */
    FSMN_VAD: variants({
      XNNPACK_FP32: FSMN_VAD_XNNPACK_FP32,
    }),
  },

  /**
   * Automatic Speech Recognition (ASR) / Speech-to-Text models.
   */
  speechToText: {
    /**
     * OpenAI Whisper automatic speech recognition model family with integrated
     * Voice Activity Detection. Includes multilingual and English-only (`EN`)
     * variants across model sizes (`TINY`, `BASE`, `SMALL`).
     */
    // Every size defaults to Core ML over MLX on iOS: 2.5-3.1x faster end to
    // end on an iPhone 16, a third of the peak memory (MLX bf16 at `SMALL` does
    // not load at all), and more accurate on the same clip. Reach for MLX_INT8
    // explicitly if you want the GPU path.
    WHISPER: {
      /**
       * Multilingual Whisper Tiny model. Supporting 99+ languages. High speed
       * speech recognition.
       */
      TINY: variants(
        {
          XNNPACK_FP32: WHISPER_TINY_XNNPACK_FP32,
          COREML_FP16: WHISPER_TINY_COREML_FP16,
          MLX_BF16: WHISPER_TINY_MLX_BF16,
          MLX_INT8: WHISPER_TINY_MLX_INT8,
          VULKAN_FP16: WHISPER_TINY_VULKAN_FP16,
          VULKAN_INT8: WHISPER_TINY_VULKAN_INT8,
        },
        // Core ML over MLX, see the note on WHISPER.
        { ios: 'COREML_FP16' }
      ),
      /**
       * Multilingual Whisper Base model. Higher accuracy across supported
       * languages.
       */
      BASE: variants(
        {
          XNNPACK_FP32: WHISPER_BASE_XNNPACK_FP32,
          COREML_FP16: WHISPER_BASE_COREML_FP16,
          MLX_BF16: WHISPER_BASE_MLX_BF16,
          MLX_INT8: WHISPER_BASE_MLX_INT8,
          VULKAN_FP16: WHISPER_BASE_VULKAN_FP16,
          VULKAN_INT8: WHISPER_BASE_VULKAN_INT8,
        },
        // Core ML over MLX, see the note on WHISPER.
        { ios: 'COREML_FP16' }
      ),
      /**
       * Multilingual Whisper Small model. Best accuracy for complex
       * multi-language audio.
       */
      SMALL: variants(
        {
          XNNPACK_FP32: WHISPER_SMALL_XNNPACK_FP32,
          COREML_FP16: WHISPER_SMALL_COREML_FP16,
          MLX_INT8: WHISPER_SMALL_MLX_INT8,
          VULKAN_FP16: WHISPER_SMALL_VULKAN_FP16,
          VULKAN_INT8: WHISPER_SMALL_VULKAN_INT8,
        },
        // Core ML over MLX, see the note on WHISPER.
        { ios: 'COREML_FP16' }
      ),
      /** English-only optimized Whisper models (`TINY`, `BASE`, `SMALL`). */
      // The only sizes with an XNNPACK int8 export, and int8 leads fp32 for all
      // but `TINY`. Greedy-decoding 250 LibriSpeech test-clean clips (31 min,
      // ~4600 words) through this pipeline, int8 moves base.en 4.84% -> 5.20%
      // WER and small.en 3.42% -> 3.38%: too little to outweigh halving the
      // download (247 MB against 399, 448 against 1129). `TINY` keeps fp32
      // first because there int8 costs 6.08% -> 7.77%, a quarter of the
      // accuracy the smallest model has left.
      EN: {
        /**
         * English-only Whisper Tiny model. Fast and compact for English STT.
         */
        TINY: variants(
          {
            XNNPACK_FP32: WHISPER_TINY_EN_XNNPACK_FP32,
            XNNPACK_INT8: WHISPER_TINY_EN_XNNPACK_INT8,
            COREML_FP16: WHISPER_TINY_EN_COREML_FP16,
            MLX_BF16: WHISPER_TINY_EN_MLX_BF16,
            MLX_INT8: WHISPER_TINY_EN_MLX_INT8,
            VULKAN_FP16: WHISPER_TINY_EN_VULKAN_FP16,
            VULKAN_INT8: WHISPER_TINY_EN_VULKAN_INT8,
          },
          // Core ML over MLX, see the note on WHISPER.
          { ios: 'COREML_FP16' }
        ),
        /**
         * English-only Whisper Base model. High accuracy English speech
         * recognition.
         */
        BASE: variants(
          {
            XNNPACK_INT8: WHISPER_BASE_EN_XNNPACK_INT8,
            XNNPACK_FP32: WHISPER_BASE_EN_XNNPACK_FP32,
            COREML_FP16: WHISPER_BASE_EN_COREML_FP16,
            MLX_BF16: WHISPER_BASE_EN_MLX_BF16,
            MLX_INT8: WHISPER_BASE_EN_MLX_INT8,
            VULKAN_FP16: WHISPER_BASE_EN_VULKAN_FP16,
            VULKAN_INT8: WHISPER_BASE_EN_VULKAN_INT8,
          },
          // Core ML over MLX, see the note on WHISPER.
          { ios: 'COREML_FP16' }
        ),
        /**
         * English-only Whisper Small model. Superior accuracy for English
         * transcription.
         */
        SMALL: variants(
          {
            XNNPACK_INT8: WHISPER_SMALL_EN_XNNPACK_INT8,
            XNNPACK_FP32: WHISPER_SMALL_EN_XNNPACK_FP32,
            COREML_FP16: WHISPER_SMALL_EN_COREML_FP16,
            MLX_INT8: WHISPER_SMALL_EN_MLX_INT8,
            VULKAN_FP16: WHISPER_SMALL_EN_VULKAN_FP16,
            VULKAN_INT8: WHISPER_SMALL_EN_VULKAN_INT8,
          },
          // Core ML over MLX, see the note on WHISPER.
          { ios: 'COREML_FP16' }
        ),
      },
    },
  },

  /**
   * Standalone text tokenizers for preprocessing strings into token ID arrays.
   */
  tokenizer: {
    /** WordPiece tokenizer URL for the `all-MiniLM-L6-v2` embedding model. */
    ALL_MINILM_L6_V2: ALL_MINILM_L6_V2_TOKENIZER,
  },

  /**
   * Generative Large Language Models (LLMs) for instruction following, chat,
   * text generation, and reasoning.
   */
  llm: {
    /**
     * Liquid AI LFM 2.5 1.2B general-purpose hybrid language model. Built on
     * the Liquid Foundation Model architecture for low memory bandwidth usage,
     * and high-throughput token generation. Delivers strong general-purpose
     * reasoning, instruction following, and fast multi-turn conversational chat
     * on mobile devices.
     */
    LFM2_5_1_2B: variants({
      XNNPACK_8DA4W: LFM2_5_1_2B_XNNPACK_8DA4W,
      XNNPACK_FP16: LFM2_5_1_2B_XNNPACK_FP16,
      MLX_INT4: LFM2_5_1_2B_MLX_INT4,
    }),
    /**
     * Liquid AI LFM 2.5 350M ultra-compact hybrid language model. Optimized for
     * minimal memory footprint and sub-second first-token response times. Ideal
     * for lightweight text completion, fast intent classification, query
     * routing, and low-latency chat on resource-constrained edge hardware.
     */
    LFM2_5_350M: variants({
      XNNPACK_8DA4W: LFM2_5_350M_XNNPACK_8DA4W,
      XNNPACK_FP16: LFM2_5_350M_XNNPACK_FP16,
      MLX_INT4: LFM2_5_350M_MLX_INT4,
    }),
    /**
     * Liquid AI LFM 2.5 VL 450M lightweight multimodal vision-language model.
     * Combines Liquid hybrid language modeling with visual token embeddings for
     * real-time on-device visual question answering (VQA), image description,
     * UI element inspection, and low-latency multimodal conversational agents.
     */
    LFM2_5_VL_450M: variants({
      XNNPACK_8DA4W: LFM2_5_VL_450M_XNNPACK_8DA4W,
      MLX_INT4: LFM2_5_VL_450M_MLX_INT4,
      VULKAN_8DA4W: LFM2_5_VL_450M_VULKAN_8DA4W,
    }),
    /**
     * Liquid AI LFM 2.5 VL 1.6B high-capacity vision-language model. Provides
     * fine-grained visual scene understanding, document/chart interpretation,
     * detailed image captioning, and multi-turn visual dialogue with higher
     * precision and reasoning fidelity than the 450M variant.
     */
    LFM2_5_VL_1_6B: variants({
      XNNPACK_8DA4W: LFM2_5_VL_1_6B_XNNPACK_8DA4W,
      VULKAN_8DA4W: LFM2_5_VL_1_6B_VULKAN_8DA4W,
      MLX_INT4: LFM2_5_VL_1_6B_MLX_INT4,
      MLX_INT8: LFM2_5_VL_1_6B_MLX_INT8,
    }),
    /**
     * Bielik v3 1.5B bilingual Polish & English language model, developed by
     * SpeakLeash. Fine-tuned on curated Polish corpora and instruction datasets
     * for native Polish cultural nuance, grammar accuracy, idioms, and
     * high-fidelity bidirectional Polish-English translation.
     */
    BIELIK_V3_1_5B: variants({
      XNNPACK_8DA4W: BIELIK_V3_1_5B_XNNPACK_8DA4W,
      XNNPACK_FP16: BIELIK_V3_1_5B_XNNPACK_FP16,
    }),
    /**
     * Meta Llama 3.2 1B lightweight instruction-tuned multilingual model.
     * Features Grouped-Query Attention (GQA) and SpinQuant quantization for
     * compact memory utilization and high throughput. Well suited for on-device
     * text summarization, prompt rewriting, and lightweight conversational
     * assistance.
     */
    LLAMA3_2_1B: variants({
      XNNPACK_SPINQUANT: LLAMA3_2_1B_SPINQUANT,
      XNNPACK_BF16: LLAMA3_2_1B_BF16,
    }),
    /**
     * Meta Llama 3.2 3B instruction-tuned multilingual language model. Delivers
     * strong instruction adherence, multi-turn reasoning, and high-quality
     * content creation across 8+ core languages while maintaining a compact
     * on-device memory profile.
     */
    LLAMA3_2_3B: variants({
      XNNPACK_SPINQUANT: LLAMA3_2_3B_SPINQUANT,
      XNNPACK_BF16: LLAMA3_2_3B_BF16,
    }),
    /**
     * Hugging Face SmolLM2 135M ultra-compact language model. Engineered for
     * micro-memory footprints, instant token generation, text classification,
     * and background processing on low-power devices.
     */
    SMOLLM2_135M: variants({
      XNNPACK_8DA8W: SMOLLM2_135M_8DA8W,
    }),
    /**
     * Hugging Face SmolLM2 360M compact instruction-tuned model. Provides a
     * practical balance between fast mobile generation speed and conversational
     * coherence, ideal for lightweight on-device assistants, text
     * simplification, and structured data extraction.
     */
    SMOLLM2_360M: variants({
      XNNPACK_8DA8W: SMOLLM2_360M_8DA8W,
    }),
    /**
     * Hugging Face SmolLM2 1.7B language model trained on curated educational,
     * synthetic, and web data. Delivers competitive reasoning, creative text
     * generation, and general knowledge Q&A performance approaching larger
     * 2B-3B models while maintaining fast on-device inference.
     */
    SMOLLM2_1_7B: variants({
      XNNPACK_8DA8W: SMOLLM2_1_7B_8DA8W,
    }),
    /**
     * Hammer 2.1 0.5B specialized function-calling model. Fine-tuned
     * specifically for agentic tool use, structured JSON extraction, and
     * single/multi-tool invocation with ultra-low latency for real-time mobile
     * tool calling flows.
     */
    HAMMER2_1_0_5B: variants({
      XNNPACK_8DA4W: HAMMER2_1_0_5B_XNNPACK_8DA4W,
      XNNPACK_BF16: HAMMER2_1_0_5B_XNNPACK_BF16,
    }),
    /**
     * Hammer 2.1 1.5B function-calling language model. Optimized for multi-tool
     * agentic workflows, API parameter schema validation, and structured JSON
     * output generation on edge devices.
     */
    HAMMER2_1_1_5B: variants({
      XNNPACK_8DA4W: HAMMER2_1_1_5B_XNNPACK_8DA4W,
      XNNPACK_BF16: HAMMER2_1_1_5B_XNNPACK_BF16,
    }),
    /**
     * Hammer 2.1 3B high-capacity function-calling model. Provides top-tier
     * tool selection precision, multi-turn tool calling, error recovery, and
     * strict compliance with complex TypeScript/JSON schema specifications in
     * autonomous mobile agent pipelines.
     */
    HAMMER2_1_3B: variants({
      XNNPACK_8DA4W: HAMMER2_1_3B_XNNPACK_8DA4W,
      XNNPACK_BF16: HAMMER2_1_3B_XNNPACK_BF16,
    }),
    /**
     * Microsoft Phi-4 Mini 3.8B high-density reasoning model. Trained on
     * synthetic textbook-grade datasets for state-of-the-art on-device STEM
     * problem solving, complex mathematical reasoning, multi-step code
     * synthesis, and structured analytical tasks.
     */
    PHI4_MINI: variants({
      XNNPACK_8DA4W: PHI4_MINI_XNNPACK_8DA4W,
      XNNPACK_BF16: PHI4_MINI_XNNPACK_BF16,
    }),
    /**
     * Alibaba Qwen 2.5 0.5B ultra-lightweight multilingual model. Trained on
     * 18T tokens supporting 29+ languages; optimized for near-instant response
     * times, basic instruction following, multilingual translation, and
     * lightweight conversational assistants on mobile devices.
     */
    QWEN2_5_0_5B: variants({
      XNNPACK_8DA4W: QWEN2_5_0_5B_XNNPACK_8DA4W,
      XNNPACK_BF16: QWEN2_5_0_5B_XNNPACK_BF16,
    }),
    /**
     * Alibaba Qwen 2.5 1.5B multilingual instruction model. Combines broad
     * multilingual comprehension across 29+ languages with strong coding and
     * math capabilities, well suited for interactive chat, summarization, and
     * cross-lingual translation.
     */
    QWEN2_5_1_5B: variants({
      XNNPACK_8DA4W: QWEN2_5_1_5B_XNNPACK_8DA4W,
      XNNPACK_BF16: QWEN2_5_1_5B_XNNPACK_BF16,
    }),
    /**
     * Alibaba Qwen 2.5 3B high-capability multilingual model. Delivers strong
     * reasoning, coding, mathematics, and multilingual fluency across 29+
     * languages for in-depth text generation and complex multi-turn dialogue.
     */
    QWEN2_5_3B: variants({
      XNNPACK_8DA4W: QWEN2_5_3B_XNNPACK_8DA4W,
      XNNPACK_BF16: QWEN2_5_3B_XNNPACK_BF16,
    }),
    /**
     * Alibaba Qwen 3 0.6B next-generation compact language model. Features
     * updated architectural optimizations for reduced latency, enhanced
     * multilingual token representation, and efficient conversational
     * turn-taking on mobile devices.
     */
    QWEN3_0_6B: variants({
      XNNPACK_8DA4W: QWEN3_0_6B_XNNPACK_8DA4W,
      XNNPACK_BF16: QWEN3_0_6B_XNNPACK_BF16,
    }),
    /**
     * Alibaba Qwen 3 1.7B next-generation multilingual language model. Balances
     * high reasoning capability, general knowledge retrieval, coding
     * proficiency, and conversational fluidity across multiple languages.
     */
    QWEN3_1_7B: variants({
      XNNPACK_8DA4W: QWEN3_1_7B_XNNPACK_8DA4W,
      XNNPACK_BF16: QWEN3_1_7B_XNNPACK_BF16,
    }),
    /**
     * Alibaba Qwen 3 4B high-capacity generative model. Delivers advanced
     * multi-step reasoning, comprehensive world knowledge, complex coding
     * capabilities, and top-tier multilingual performance for demanding
     * on-device AI applications.
     */
    QWEN3_4B: variants({
      XNNPACK_8DA4W: QWEN3_4B_XNNPACK_8DA4W,
      XNNPACK_BF16: QWEN3_4B_XNNPACK_BF16,
    }),
    /**
     * Google Gemma 4 E2B generative language model. Built on Google's Gemini
     * research and architecture innovations, offering high-fidelity instruction
     * following, creative text generation, and reasoning efficiency optimized
     * for mobile deployment.
     */
    GEMMA4_E2B: variants({
      XNNPACK_8DA4W: GEMMA4_E2B_XNNPACK_8DA4W,
      VULKAN_8DA4W: GEMMA4_E2B_VULKAN_8DA4W,
      MLX_INT4: GEMMA4_E2B_MLX_INT4,
    }),
  },

  /**
   * Text embedding models mapping sentences and documents into dense vector
   * representations for semantic search and RAG.
   */
  textEmbeddings: {
    /**
     * Compact 384-dimensional sentence transformer mapping text to a dense
     * vector space. Optimized for fast, general-purpose semantic search,
     * sentence similarity, and clustering.
     */
    ALL_MINILM_L6_V2: variants({
      XNNPACK_FP32: ALL_MINILM_L6_V2_EMBEDDINGS,
      COREML_FP16: ALL_MINILM_L6_V2_COREML_FP16,
      VULKAN_FP16: ALL_MINILM_L6_V2_VULKAN_FP16,
    }),
    /**
     * High-quality 768-dimensional sentence transformer model based on MPNet.
     * Provides higher quality semantic embeddings compared to MiniLM.
     */
    ALL_MPNET_BASE_V2: variants({
      XNNPACK_FP32: ALL_MPNET_BASE_V2_EMBEDDINGS,
      VULKAN_FP16: ALL_MPNET_BASE_V2_VULKAN_FP16,
      VULKAN_INT8: ALL_MPNET_BASE_V2_VULKAN_INT8,
    }),
    /**
     * 384-dimensional sentence transformer fine-tuned specifically for semantic
     * QA matching using cosine similarity.
     */
    MULTI_QA_MINILM_L6_COS_V1: variants({
      XNNPACK_FP32: MULTI_QA_MINILM_L6_COS_V1_EMBEDDINGS,
      COREML_FP16: MULTI_QA_MINILM_L6_COS_V1_COREML_FP16,
      VULKAN_FP16: MULTI_QA_MINILM_L6_COS_V1_VULKAN_FP16,
    }),
    /**
     * 768-dimensional sentence transformer fine-tuned specifically for
     * question-answering matching using dot product distance.
     */
    MULTI_QA_MPNET_BASE_DOT_V1: variants({
      XNNPACK_FP32: MULTI_QA_MPNET_BASE_DOT_V1_EMBEDDINGS,
      VULKAN_FP16: MULTI_QA_MPNET_BASE_DOT_V1_VULKAN_FP16,
      VULKAN_INT8: MULTI_QA_MPNET_BASE_DOT_V1_VULKAN_INT8,
    }),
    /**
     * 384-dimensional sentence transformer supporting 50+ languages for
     * cross-lingual semantic similarity.
     */
    PARAPHRASE_MULTILINGUAL_MINILM_L12_V2: variants({
      XNNPACK_8DA4W: PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_EMBEDDINGS,
      XNNPACK_FP32: PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_XNNPACK_FP32,
      COREML_FP16: PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_COREML_FP16,
      VULKAN_FP16: PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_VULKAN_FP16,
    }),
    /**
     * Multilingual sentence transformer supporting 50+ languages, based on
     * distilled Universal Sentence Encoder (512-dim output).
     */
    DISTILUSE_BASE_MULTILINGUAL_CASED_V2: variants(
      {
        XNNPACK_8DA4W: DISTILUSE_BASE_MULTILINGUAL_CASED_V2_EMBEDDINGS,
        XNNPACK_FP32: DISTILUSE_BASE_MULTILINGUAL_CASED_V2_XNNPACK_FP32,
        COREML_FP16: DISTILUSE_BASE_MULTILINGUAL_CASED_V2_COREML_FP16,
        MLX_INT8: DISTILUSE_BASE_MULTILINGUAL_CASED_V2_MLX_INT8,
        VULKAN_FP16: DISTILUSE_BASE_MULTILINGUAL_CASED_V2_VULKAN_FP16,
      },
      // The one Core ML/MLX pair that does not go Core ML's way: on an
      // iPhone 16, warm, MLX int8 embeds in 3.46 ms against Core ML fp16's
      // 3.96, at half the download and no first-use compile, and the two match
      // the XNNPACK reference equally well.
      { ios: 'MLX_INT8' }
    ),
    /**
     * CLIP text encoder (ViT-B/32) mapping text queries into a 512-dimensional
     * joint text-image embedding space. Used in combination with
     * `imageEmbeddings.CLIP_VIT_BASE_PATCH32` for zero-shot text-to-image
     * search.
     */
    CLIP_VIT_BASE_PATCH32_TEXT: variants({
      XNNPACK_FP32: CLIP_VIT_BASE_PATCH32_TEXT_EMBEDDINGS,
      COREML_FP16: CLIP_VIT_BASE_PATCH32_TEXT_COREML_FP16,
      VULKAN_FP16: CLIP_VIT_BASE_PATCH32_TEXT_VULKAN_FP16,
    }),
    /**
     * Liquid AI LFM 2.5 350M parameter embedding model for asymmetric search
     * and retrieval tasks. Prompts queries with `query: ` (the default) and
     * passages with `document: ` via {@link TextEmbedder.embed}.
     */
    LFM2_5_EMBEDDING_350M: variants({
      XNNPACK_8DA4W: LFM2_5_EMBEDDING_350M_EMBEDDINGS,
      MLX_INT4: LFM2_5_EMBEDDING_350M_MLX_INT4,
    }),
  },

  /**
   * Models that find and label personally identifiable information (PII) —
   * names, emails, phone numbers, addresses, and the like — in free text, so it
   * can be redacted or handled with care.
   */
  privacyFilter: {
    /**
     * OpenAI-style detector covering 8 common PII types (name, email, phone,
     * address, and similar). Compact label space, best for general redaction.
     */
    OPENAI: variants({
      XNNPACK_8DA4W: PRIVACY_FILTER_OPENAI_XNNPACK_8DA4W,
      MLX_INT4: PRIVACY_FILTER_OPENAI_MLX_INT4,
    }),
    /**
     * Nemotron-based detector covering 55 fine-grained PII types. Larger label
     * space for stricter compliance-oriented redaction.
     */
    NEMOTRON: variants({
      XNNPACK_8DA4W: PRIVACY_FILTER_NEMOTRON_XNNPACK_8DA4W,
      MLX_INT8: PRIVACY_FILTER_NEMOTRON_MLX_INT8,
    }),
  },

  /**
   * Image feature extraction and vision embedding models.
   */
  imageEmbeddings: {
    /**
     * CLIP vision encoder (ViT-B/32) mapping images into a 512-dimensional
     * shared text-image space. Used for zero-shot visual classification and
     * cross-modal image search.
     */
    CLIP_VIT_BASE_PATCH32: variants(
      {
        XNNPACK_FP32: CLIP_VIT_BASE_PATCH32_IMAGE_XNNPACK_FP32,
        COREML_FP16: CLIP_VIT_BASE_PATCH32_IMAGE_COREML_FP16,
        MLX_INT8: CLIP_VIT_BASE_PATCH32_IMAGE_MLX_INT8,
        VULKAN_FP16: CLIP_VIT_BASE_PATCH32_IMAGE_VULKAN_FP16,
      },
      // Core ML over MLX: 3.5 ms against 14.1 on an iPhone 16, the widest
      // margin of any pair that ships both.
      { ios: 'COREML_FP16' }
    ),
  },

  /**
   * Generative text-to-image synthesis models.
   */
  textToImage: {
    /**
     * Ultra-fast SDXS (Stable Diffusion eXtreme Speed) 512x512 text-to-image
     * generation model based on DreamShaper. Generates high-quality images from
     * text prompts in real time.
     */
    SDXS_512_DREAMSHAPER: variants({
      XNNPACK_FP32: SDXS_512_DREAMSHAPER_XNNPACK_FP32,
      COREML_FP16: SDXS_512_DREAMSHAPER_COREML_FP16,
    }),
  },

  /**
   * Text-to-Speech (TTS) models that synthesize audio waveforms from input
   * text.
   */
  textToSpeech: {
    /**
     * Supertonic 3 multilingual flow-matching Text-to-Speech model. Delivers
     * natural, highly expressive speech synthesis with configurable speaker
     * voice presets (see {@link SUPERTONIC_DEFAULT_VOICE_NAMES}).
     */
    SUPERTONIC: variants({
      XNNPACK_FP32: SUPERTONIC_3_XNNPACK_FP32,
      MLX_FP32: SUPERTONIC_3_MLX_FP32,
      VULKAN_FP16: SUPERTONIC_3_VULKAN_FP16,
    }),

    /**
     * Kokoro — a lightweight phoneme-driven Text-to-Speech model. Each language
     * entry bundles the matching model weights, grapheme-to-phoneme assets and
     * the voices available for that language, nested per backend.
     */
    // The Core ML builds are the registry's only fp32 Core ML exports, which
    // keeps them off the fp16-only Neural Engine, and they still default on
    // iOS: the duration predictor runs 14-21x faster warm than the XNNPACK one
    // on an iPhone 16. The cost is a one-time ~13s compile on first use, cached
    // across launches; reach for `XNNPACK_FP32` explicitly to avoid it.
    KOKORO: {
      EN_US: variants({
        XNNPACK_FP32: KOKORO_EN_US_XNNPACK_FP32,
        COREML_FP32: KOKORO_EN_US_COREML_FP32,
      }),
      EN_GB: variants({
        XNNPACK_FP32: KOKORO_EN_GB_XNNPACK_FP32,
        COREML_FP32: KOKORO_EN_GB_COREML_FP32,
      }),
      ES: variants({
        XNNPACK_FP32: KOKORO_ES_XNNPACK_FP32,
        COREML_FP32: KOKORO_ES_COREML_FP32,
      }),
      FR: variants({
        XNNPACK_FP32: KOKORO_FR_XNNPACK_FP32,
        COREML_FP32: KOKORO_FR_COREML_FP32,
      }),
      IT: variants({
        XNNPACK_FP32: KOKORO_IT_XNNPACK_FP32,
        COREML_FP32: KOKORO_IT_COREML_FP32,
      }),
      PT: variants({
        XNNPACK_FP32: KOKORO_PT_XNNPACK_FP32,
        COREML_FP32: KOKORO_PT_COREML_FP32,
      }),
      HI: variants({
        XNNPACK_FP32: KOKORO_HI_XNNPACK_FP32,
        COREML_FP32: KOKORO_HI_COREML_FP32,
      }),
      PL: variants({
        XNNPACK_FP32: KOKORO_PL_XNNPACK_FP32,
        COREML_FP32: KOKORO_PL_COREML_FP32,
      }),
      DE: variants({
        XNNPACK_FP32: KOKORO_DE_XNNPACK_FP32,
        COREML_FP32: KOKORO_DE_COREML_FP32,
      }),
    },
  },

  /**
   * Optical Character Recognition models — a text detector paired with a text
   * recognizer, run as one two-stage pipeline.
   */
  ocr: {
    /**
     * PP-OCRv6 small — DBNet detector plus an SVTR recognizer, one model for
     * every language.
     *
     * On Android, `VULKAN` is the faster choice.
     */
    PADDLE: {
      /**
       * PP-OCRv6 Small multilingual OCR model.
       */
      PPOCRV6_SMALL: variants({
        XNNPACK: PPOCRV6_SMALL_XNNPACK_INT8,
        XNNPACK_FP32: PPOCRV6_SMALL_XNNPACK_FP32,
        COREML: PPOCRV6_SMALL_COREML_INT8,
        VULKAN: PPOCRV6_SMALL_VULKAN_FP16,
      }),
    },
  },
};
