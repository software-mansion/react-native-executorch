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
import {
  type WhisperSttModel,
  WHISPER_LANGUAGES,
} from './extensions/speech/tasks/whisperSpeechToText';
import type { OcrModel, OcrModelOptions } from './extensions/cv/tasks/ocr/ocr';
import { dbnetExtractBoxes } from './extensions/cv/tasks/ocr/detectors';
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
  modelPath: `${BASE_URL}-efficientnet-v2-s/${VERSION_TAG}/xnnpack/efficientnet_v2_s_xnnpack_int8.pte`,
  modelOpts: EFFICIENTNET_V2_S_OPTS,
};
const EFFICIENTNET_V2_S_XNNPACK_FP32: ClassifierModel<ImageNet1KLabel> = {
  modelPath: `${BASE_URL}-efficientnet-v2-s/${VERSION_TAG}/xnnpack/efficientnet_v2_s_xnnpack_fp32.pte`,
  modelOpts: EFFICIENTNET_V2_S_OPTS,
};
const EFFICIENTNET_V2_S_COREML_FP16: ClassifierModel<ImageNet1KLabel> = {
  modelPath: `${BASE_URL}-efficientnet-v2-s/${VERSION_TAG}/coreml/efficientnet_v2_s_coreml_fp16.pte`,
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
  modelPath: `${BASE_URL}-style-transfer-candy/${VERSION_TAG}/xnnpack/style_transfer_candy_xnnpack_fp32.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_CANDY_XNNPACK_INT8: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-candy/${VERSION_TAG}/xnnpack/style_transfer_candy_xnnpack_int8.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_CANDY_COREML_FP16: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-candy/${VERSION_TAG}/coreml/style_transfer_candy_coreml_fp16.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_CANDY_COREML_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-candy/${VERSION_TAG}/coreml/style_transfer_candy_coreml_fp32.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_MOSAIC_XNNPACK_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-mosaic/${VERSION_TAG}/xnnpack/style_transfer_mosaic_xnnpack_fp32.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_MOSAIC_XNNPACK_INT8: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-mosaic/${VERSION_TAG}/xnnpack/style_transfer_mosaic_xnnpack_int8.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_MOSAIC_COREML_FP16: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-mosaic/${VERSION_TAG}/coreml/style_transfer_mosaic_coreml_fp16.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_MOSAIC_COREML_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-mosaic/${VERSION_TAG}/coreml/style_transfer_mosaic_coreml_fp32.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_RAIN_PRINCESS_XNNPACK_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-rain-princess/${VERSION_TAG}/xnnpack/style_transfer_rain_princess_xnnpack_fp32.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_RAIN_PRINCESS_XNNPACK_INT8: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-rain-princess/${VERSION_TAG}/xnnpack/style_transfer_rain_princess_xnnpack_int8.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_RAIN_PRINCESS_COREML_FP16: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-rain-princess/${VERSION_TAG}/coreml/style_transfer_rain_princess_coreml_fp16.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_RAIN_PRINCESS_COREML_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-rain-princess/${VERSION_TAG}/coreml/style_transfer_rain_princess_coreml_fp32.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_UDNIE_XNNPACK_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-udnie/${VERSION_TAG}/xnnpack/style_transfer_udnie_xnnpack_fp32.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_UDNIE_XNNPACK_INT8: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-udnie/${VERSION_TAG}/xnnpack/style_transfer_udnie_xnnpack_int8.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_UDNIE_COREML_FP16: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-udnie/${VERSION_TAG}/coreml/style_transfer_udnie_coreml_fp16.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_UDNIE_COREML_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-udnie/${VERSION_TAG}/coreml/style_transfer_udnie_coreml_fp32.pte`,
  modelOpts: STYLE_TRANSFER_OPTS,
};

// =============================================================================
// Semantic Segmentation
// =============================================================================
const SELFIE_SEGMENTATION_XNNPACK_FP32: SemanticSegmenterModel<'background' | 'person'> = {
  modelPath: `${BASE_URL}-selfie-segmentation/${VERSION_TAG}/xnnpack/selfie_segmentation_xnnpack_fp32.pte`,
  modelOpts: {
    labels: ['background', 'person'] as const,
    resizeMode: 'stretch',
    interpolation: 'linear',
    normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
    outInterpolation: 'lanczos',
  },
};

const LRASPP_MOBILENET_V3_LARGE_OPTS = {
  labels: PASCAL_VOC_LABELS,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  outInterpolation: 'lanczos' as const,
  normalizeOpts: IMAGENET_NORM,
};
const LRASPP_MOBILENET_V3_LARGE_XNNPACK_FP32: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-lraspp/${VERSION_TAG}/xnnpack/lraspp_mobilenet_v3_large_xnnpack_fp32.pte`,
  modelOpts: LRASPP_MOBILENET_V3_LARGE_OPTS,
};
const LRASPP_MOBILENET_V3_LARGE_XNNPACK_INT8: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-lraspp/${VERSION_TAG}/xnnpack/lraspp_mobilenet_v3_large_xnnpack_int8.pte`,
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
const DEEPLAB_V3_RESNET101_XNNPACK_FP32: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-deeplab-v3/${NEXT_VERSION_TAG}/xnnpack/deeplab_v3_resnet101_xnnpack_fp32.pte`,
  modelOpts: DEEPLAB_V3_OPTS,
};
const DEEPLAB_V3_RESNET101_XNNPACK_INT8: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-deeplab-v3/${NEXT_VERSION_TAG}/xnnpack/deeplab_v3_resnet101_xnnpack_int8.pte`,
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
const FCN_RESNET101_XNNPACK_FP32: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-fcn/${NEXT_VERSION_TAG}/xnnpack/fcn_resnet101_xnnpack_fp32.pte`,
  modelOpts: FCN_OPTS,
};
const FCN_RESNET101_XNNPACK_INT8: SemanticSegmenterModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-fcn/${NEXT_VERSION_TAG}/xnnpack/fcn_resnet101_xnnpack_int8.pte`,
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
  modelPath: `${BASE_URL}-ssdlite320-mobilenet-v3-large/${VERSION_TAG}/xnnpack/ssdlite320_mobilenet_v3_large_xnnpack_fp32.pte`,
  modelOpts: SSDLITE320_MOBILENET_V3_LARGE_OPTS,
};
const SSDLITE320_MOBILENET_V3_LARGE_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClass> = {
  modelPath: `${BASE_URL}-ssdlite320-mobilenet-v3-large/${VERSION_TAG}/coreml/ssdlite320_mobilenet_v3_large_coreml_fp16.pte`,
  modelOpts: SSDLITE320_MOBILENET_V3_LARGE_OPTS,
};
const SSDLITE320_MOBILENET_V3_LARGE_COREML_FP32: ObjectDetectorModel<'xyxy', CocoClass> = {
  modelPath: `${BASE_URL}-ssdlite320-mobilenet-v3-large/${VERSION_TAG}/coreml/ssdlite320_mobilenet_v3_large_coreml_fp32.pte`,
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
  modelPath: `${BASE_URL}-rfdetr-nano-detector/${VERSION_TAG}/xnnpack/rfdetr_nano_xnnpack_fp32.pte`,
  modelOpts: RFDETR_NANO_DETECTOR_OPTS,
};
const RFDETR_NANO_DETECTOR_COREML_INT8: ObjectDetectorModel<'xyxy', CocoClass> = {
  modelPath: `${BASE_URL}-rfdetr-nano-detector/${VERSION_TAG}/coreml/rfdetr_nano_coreml_int8.pte`,
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
const YOLO26_NANO_512_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/n/xnnpack/yolo26n_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_NANO_640_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/n/xnnpack/yolo26n_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};

const YOLO26_SMALL_384_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/s/xnnpack/yolo26s_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_SMALL_512_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/s/xnnpack/yolo26s_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_SMALL_640_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/s/xnnpack/yolo26s_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};

const YOLO26_MEDIUM_384_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/m/xnnpack/yolo26m_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_MEDIUM_512_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/m/xnnpack/yolo26m_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_MEDIUM_640_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/m/xnnpack/yolo26m_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};

const YOLO26_LARGE_384_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/l/xnnpack/yolo26l_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_LARGE_512_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/l/xnnpack/yolo26l_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_LARGE_640_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/l/xnnpack/yolo26l_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};

const YOLO26_XLARGE_384_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/x/xnnpack/yolo26x_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_XLARGE_512_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/x/xnnpack/yolo26x_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_XLARGE_640_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/x/xnnpack/yolo26x_640_xnnpack_fp32.pte`,
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
const YOLO26_POSE_512_XNNPACK_FP32: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-yolo26-pose/${NEXT_VERSION_TAG}/xnnpack/yolo26n_pose_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_POSE_OPTS,
};
const YOLO26_POSE_640_XNNPACK_FP32: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-yolo26-pose/${NEXT_VERSION_TAG}/xnnpack/yolo26n_pose_640_xnnpack_fp32.pte`,
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
  modelPath: `${BASE_URL}-rfdetr-keypoint/${VERSION_TAG}/preview/xnnpack/rfdetr_keypoint_preview_xnnpack_fp32.pte`,
  modelOpts: RFDETR_KEYPOINT_OPTS,
};
const RFDETR_KEYPOINT_COREML_FP32: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-rfdetr-keypoint/${VERSION_TAG}/preview/coreml/rfdetr_keypoint_preview_coreml_fp32.pte`,
  modelOpts: RFDETR_KEYPOINT_OPTS,
};
const RFDETR_KEYPOINT_MLX_FP32: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-rfdetr-keypoint/${VERSION_TAG}/preview/mlx/rfdetr_keypoint_preview_mlx_fp32.pte`,
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
const FASTSAM_S_COREML_FP32: InstanceSegmenterModel<'xyxy', 'object'> = {
  modelPath: `${BASE_URL}-fast-sam/${NEXT_VERSION_TAG}/s/coreml/fast_sam_s_coreml_fp32.pte`,
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
const FASTSAM_X_COREML_FP32: InstanceSegmenterModel<'xyxy', 'object'> = {
  modelPath: `${BASE_URL}-fast-sam/${NEXT_VERSION_TAG}/x/coreml/fast_sam_x_coreml_fp32.pte`,
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
const RFDETR_NANO_SEG_COREML_INT8: InstanceSegmenterModel<'xyxy', CocoClass> = {
  modelPath: `${BASE_URL}-rfdetr-nano-segmentation/${NEXT_VERSION_TAG}/coreml/rfdetr_nano_coreml_int8.pte`,
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
const YOLO26_NANO_SEG_512_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/n/xnnpack/yolo26_seg_n_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_NANO_SEG_640_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/n/xnnpack/yolo26_seg_n_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};

const YOLO26_SMALL_SEG_384_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/s/xnnpack/yolo26_seg_s_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_SMALL_SEG_512_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/s/xnnpack/yolo26_seg_s_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_SMALL_SEG_640_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/s/xnnpack/yolo26_seg_s_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};

const YOLO26_MEDIUM_SEG_384_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/m/xnnpack/yolo26_seg_m_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_MEDIUM_SEG_512_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/m/xnnpack/yolo26_seg_m_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_MEDIUM_SEG_640_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/m/xnnpack/yolo26_seg_m_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};

const YOLO26_LARGE_SEG_384_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/l/xnnpack/yolo26_seg_l_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_LARGE_SEG_512_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/l/xnnpack/yolo26_seg_l_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_LARGE_SEG_640_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/l/xnnpack/yolo26_seg_l_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};

const YOLO26_XLARGE_SEG_384_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/x/xnnpack/yolo26_seg_x_384_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_XLARGE_SEG_512_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/x/xnnpack/yolo26_seg_x_512_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};
const YOLO26_XLARGE_SEG_640_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/x/xnnpack/yolo26_seg_x_640_xnnpack_fp32.pte`,
  modelOpts: YOLO26_SEG_OPTS,
};

// =============================================================================
// Text Embeddings
// =============================================================================
const ALL_MINILM_L6_V2_EMBEDDINGS: TextEmbedderModel = {
  modelPath: `${BASE_URL}-all-MiniLM-L6-v2/${NEXT_VERSION_TAG}/xnnpack/all_minilm_l6_v2_xnnpack_fp32.pte`,
  tokenizerPath: `${BASE_URL}-all-MiniLM-L6-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const ALL_MPNET_BASE_V2_EMBEDDINGS: TextEmbedderModel = {
  modelPath: `${BASE_URL}-all-mpnet-base-v2/${NEXT_VERSION_TAG}/xnnpack/all_mpnet_base_v2_xnnpack_fp32.pte`,
  tokenizerPath: `${BASE_URL}-all-mpnet-base-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const MULTI_QA_MINILM_L6_COS_V1_EMBEDDINGS: TextEmbedderModel = {
  modelPath: `${BASE_URL}-multi-qa-MiniLM-L6-cos-v1/${NEXT_VERSION_TAG}/xnnpack/multi_qa_minilm_l6_cos_v1_xnnpack_fp32.pte`,
  tokenizerPath: `${BASE_URL}-multi-qa-MiniLM-L6-cos-v1/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const MULTI_QA_MPNET_BASE_DOT_V1_EMBEDDINGS: TextEmbedderModel = {
  modelPath: `${BASE_URL}-multi-qa-mpnet-base-dot-v1/${NEXT_VERSION_TAG}/xnnpack/multi_qa_mpnet_base_dot_v1_xnnpack_fp32.pte`,
  tokenizerPath: `${BASE_URL}-multi-qa-mpnet-base-dot-v1/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_EMBEDDINGS: TextEmbedderModel = {
  modelPath: `${BASE_URL}-paraphrase-multilingual-MiniLM-L12-v2/${NEXT_VERSION_TAG}/xnnpack/paraphrase_multilingual_minilm_l12_v2_xnnpack_8da4w.pte`,
  tokenizerPath: `${BASE_URL}-paraphrase-multilingual-MiniLM-L12-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const DISTILUSE_BASE_MULTILINGUAL_CASED_V2_EMBEDDINGS: TextEmbedderModel = {
  modelPath: `${BASE_URL}-distiluse-base-multilingual-cased-v2/${NEXT_VERSION_TAG}/xnnpack/distiluse_base_multilingual_cased_v2_xnnpack_8da4w.pte`,
  tokenizerPath: `${BASE_URL}-distiluse-base-multilingual-cased-v2/${NEXT_VERSION_TAG}/tokenizer.json`,
};
const CLIP_VIT_BASE_PATCH32_TEXT_EMBEDDINGS: TextEmbedderModel = {
  modelPath: `${BASE_URL}-clip-vit-base-patch32/${NEXT_VERSION_TAG}/xnnpack/clip_vit_base_patch32_text_xnnpack_fp32.pte`,
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
const CLIP_VIT_BASE_PATCH32_IMAGE_XNNPACK_INT8: ImageEmbedderModel = {
  modelPath: `${BASE_URL}-clip-vit-base-patch32/${NEXT_VERSION_TAG}/xnnpack/clip_vit_base_patch32_image_xnnpack_int8.pte`,
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

const WHISPER_BASE_EN_XNNPACK_FP32: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-base.en/${NEXT_VERSION_TAG}/xnnpack/whisper_base_en_xnnpack_fp32.pte`,
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

const WHISPER_SMALL_EN_XNNPACK_FP32: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-small.en/${NEXT_VERSION_TAG}/xnnpack/whisper_small_en_xnnpack_fp32.pte`,
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
const WHISPER_SMALL_EN_MLX_BF16: WhisperSttModel<'en'> = {
  modelPath: `${BASE_URL}-whisper-small.en/${NEXT_VERSION_TAG}/mlx/whisper_small_en_mlx_bf16.pte`,
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
const WHISPER_SMALL_MLX_BF16: WhisperSttModel = {
  modelPath: `${BASE_URL}-whisper-small/${NEXT_VERSION_TAG}/mlx/whisper_small_mlx_bf16.pte`,
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
  modelPaths: {
    durationPredictor: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/mlx/duration_predictor_mlx_fp32.pte`,
    vectorEstimator: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/mlx/vector_estimator_mlx_fp32.pte`,
    textEncoder: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/mlx/text_encoder_mlx_fp32.pte`,
    vocoder: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/mlx/vocoder_mlx_fp32.pte`,
  },
  unicodeIndexerPath: `${BASE_URL}-supertonic/${NEXT_VERSION_TAG}/unicode_indexer.json`,
  voiceStyles: SUPERTONIC_DEFAULT_VOICE_STYLES,
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
// The OCR export carries NO baked input normalization, so the norm is a property
// of the model rather than of the call: `detectorNorm` below makes the pipeline
// apply it before every `detect`, and callers never touch it. It is spelled out
// here (instead of relying on the IMAGENET_NORM default) because a model whose
// export bakes normalization in must override it.
// The recognizer charset is NOT bundled: `charsetPath` points at the
// `charset.json` published beside the `.pte`, which the resource fetcher resolves
// to a local path like any other model file. Inlining it would put ~128 KB of
// CJK tables into every app that imports this registry, OCR or not.
const PADDLE_PPOCRV6_OPTS: OcrModelOptions = {
  extractBoxes: dbnetExtractBoxes,
  minConfidence: 0.5,
  detectorNorm: IMAGENET_NORM,
};

// Every OCR export is mixed-precision, and the tag in the filename names the
// DETECTOR's precision only: `pp_ocrv6_xnnpack_int8.pte` is an int8 DBNet paired
// with an fp32 SVTR recognizer, kept fp32 because int8 is lossy on the SVTR
// attention stack.
const PPOCRV6_PRECISION = { xnnpack: 'int8', coreml: 'int8', vulkan: 'fp16' } as const;

type OcrBackend = keyof typeof PPOCRV6_PRECISION;

const makePpOcrV6 = (backend: OcrBackend): OcrModel => ({
  modelPath:
    `${BASE_URL}-pp-ocrv6/${NEXT_VERSION_TAG}/${backend}/` +
    `pp_ocrv6_${backend}_${PPOCRV6_PRECISION[backend]}.pte`,
  charsetPath: `${BASE_URL}-pp-ocrv6/${NEXT_VERSION_TAG}/charset.json`,
  modelOpts: PADDLE_PPOCRV6_OPTS,
});
const ppOcrV6 = {
  XNNPACK: makePpOcrV6('xnnpack'),
  COREML: makePpOcrV6('coreml'),
  VULKAN: makePpOcrV6('vulkan'),
};

/**
 * Registry of pre-configured ExecuTorch models.
 *
 * This provides Hugging Face repository URLs and baseline configurations for
 * tasks, allowing quick model loading and execution without manual option
 * setup.
 * @category Utils
 */
export const models = {
  /**
   * Image classification models that categorize input images into pre-defined
   * classes.
   */
  classification: {
    /**
     * EfficientNetV2-S image classification model pre-trained on ImageNet-1k
     * (1000 categories, see {@link IMAGENET1K_LABELS}).
     * Compact and efficient architecture providing high accuracy for
     * general-purpose image classification.
     */
    EFFICIENTNET_V2_S: {
      ...EFFICIENTNET_V2_S_XNNPACK_INT8,
      XNNPACK_INT8: EFFICIENTNET_V2_S_XNNPACK_INT8,
      XNNPACK_FP32: EFFICIENTNET_V2_S_XNNPACK_FP32,
      COREML_FP16: EFFICIENTNET_V2_S_COREML_FP16,
    },
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
    CANDY: {
      ...STYLE_TRANSFER_CANDY_XNNPACK_INT8,
      XNNPACK_FP32: STYLE_TRANSFER_CANDY_XNNPACK_FP32,
      XNNPACK_INT8: STYLE_TRANSFER_CANDY_XNNPACK_INT8,
      COREML_FP16: STYLE_TRANSFER_CANDY_COREML_FP16,
      COREML_FP32: STYLE_TRANSFER_CANDY_COREML_FP32,
    },
    /**
     * Fast neural style transfer model applying a classic tile mosaic
     * artistic pattern.
     */
    MOSAIC: {
      ...STYLE_TRANSFER_MOSAIC_XNNPACK_INT8,
      XNNPACK_FP32: STYLE_TRANSFER_MOSAIC_XNNPACK_FP32,
      XNNPACK_INT8: STYLE_TRANSFER_MOSAIC_XNNPACK_INT8,
      COREML_FP16: STYLE_TRANSFER_MOSAIC_COREML_FP16,
      COREML_FP32: STYLE_TRANSFER_MOSAIC_COREML_FP32,
    },
    /**
     * Fast neural style transfer model applying a painterly "Rain Princess"
     * oil painting aesthetic.
     */
    RAIN_PRINCESS: {
      ...STYLE_TRANSFER_RAIN_PRINCESS_XNNPACK_INT8,
      XNNPACK_FP32: STYLE_TRANSFER_RAIN_PRINCESS_XNNPACK_FP32,
      XNNPACK_INT8: STYLE_TRANSFER_RAIN_PRINCESS_XNNPACK_INT8,
      COREML_FP16: STYLE_TRANSFER_RAIN_PRINCESS_COREML_FP16,
      COREML_FP32: STYLE_TRANSFER_RAIN_PRINCESS_COREML_FP32,
    },
    /**
     * Fast neural style transfer model applying Francis Picabia's "Udnie"
     * abstract art style.
     */
    UDNIE: {
      ...STYLE_TRANSFER_UDNIE_XNNPACK_INT8,
      XNNPACK_FP32: STYLE_TRANSFER_UDNIE_XNNPACK_FP32,
      XNNPACK_INT8: STYLE_TRANSFER_UDNIE_XNNPACK_INT8,
      COREML_FP16: STYLE_TRANSFER_UDNIE_COREML_FP16,
      COREML_FP32: STYLE_TRANSFER_UDNIE_COREML_FP32,
    },
  },

  /**
   * Semantic segmentation models that classify each pixel into target object
   * or background classes.
   */
  semanticSegmentation: {
    /**
     * Lightweight portrait selfie segmentation model for real-time person vs
     * background separation. Categorizes pixels into `background` and
     * `person`. Ideal for background blur and replacement effects.
     */
    SELFIE_SEGMENTATION: {
      ...SELFIE_SEGMENTATION_XNNPACK_FP32,
      XNNPACK_FP32: SELFIE_SEGMENTATION_XNNPACK_FP32,
    },
    /**
     * Lite R-ASPP semantic segmentation model with MobileNetV3-Large backbone
     * (21 classes, see {@link PASCAL_VOC_LABELS}). Optimized for low-latency,
     * real-time pixel-level segmentation on mobile devices.
     */
    LRASPP_MOBILENET_V3_LARGE: {
      ...LRASPP_MOBILENET_V3_LARGE_XNNPACK_INT8,
      XNNPACK_FP32: LRASPP_MOBILENET_V3_LARGE_XNNPACK_FP32,
      XNNPACK_INT8: LRASPP_MOBILENET_V3_LARGE_XNNPACK_INT8,
    },
    /**
     * DeepLabV3 semantic segmentation model with ResNet-50 backbone
     * (21 classes, see {@link PASCAL_VOC_LABELS}). High-accuracy segmentation
     * utilizing atrous spatial pyramid pooling.
     */
    DEEPLAB_V3_RESNET50: {
      ...DEEPLAB_V3_RESNET50_XNNPACK_INT8,
      XNNPACK_FP32: DEEPLAB_V3_RESNET50_XNNPACK_FP32,
      XNNPACK_INT8: DEEPLAB_V3_RESNET50_XNNPACK_INT8,
    },
    /**
     * DeepLabV3 semantic segmentation model with ResNet-101 backbone
     * (21 classes, see {@link PASCAL_VOC_LABELS}). High-capacity backbone for
     * maximum segmentation detail and boundary accuracy.
     */
    DEEPLAB_V3_RESNET101: {
      ...DEEPLAB_V3_RESNET101_XNNPACK_INT8,
      XNNPACK_FP32: DEEPLAB_V3_RESNET101_XNNPACK_FP32,
      XNNPACK_INT8: DEEPLAB_V3_RESNET101_XNNPACK_INT8,
    },
    /**
     * DeepLabV3 semantic segmentation model with MobileNetV3-Large backbone
     * (21 classes, see {@link PASCAL_VOC_LABELS}). Combines DeepLabV3 feature
     * extraction quality with a lightweight mobile backbone.
     */
    DEEPLAB_V3_MOBILENET_V3_LARGE: {
      ...DEEPLAB_V3_MOBILENET_V3_LARGE_XNNPACK_INT8,
      XNNPACK_FP32: DEEPLAB_V3_MOBILENET_V3_LARGE_XNNPACK_FP32,
      XNNPACK_INT8: DEEPLAB_V3_MOBILENET_V3_LARGE_XNNPACK_INT8,
    },
    /**
     * Fully Convolutional Network (FCN) semantic segmentation model with
     * ResNet-50 backbone (21 classes, see {@link PASCAL_VOC_LABELS}).
     */
    FCN_RESNET50: {
      ...FCN_RESNET50_XNNPACK_INT8,
      XNNPACK_FP32: FCN_RESNET50_XNNPACK_FP32,
      XNNPACK_INT8: FCN_RESNET50_XNNPACK_INT8,
    },
    /**
     * Fully Convolutional Network (FCN) semantic segmentation model with
     * ResNet-101 backbone (21 classes, see {@link PASCAL_VOC_LABELS}).
     */
    FCN_RESNET101: {
      ...FCN_RESNET101_XNNPACK_INT8,
      XNNPACK_FP32: FCN_RESNET101_XNNPACK_FP32,
      XNNPACK_INT8: FCN_RESNET101_XNNPACK_INT8,
    },
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
    SSDLITE320_MOBILENET_V3_LARGE: {
      ...SSDLITE320_MOBILENET_V3_LARGE_XNNPACK_FP32,
      XNNPACK_FP32: SSDLITE320_MOBILENET_V3_LARGE_XNNPACK_FP32,
      COREML_FP16: SSDLITE320_MOBILENET_V3_LARGE_COREML_FP16,
      COREML_FP32: SSDLITE320_MOBILENET_V3_LARGE_COREML_FP32,
    },
    /**
     * RF-DETR (Roboflow Detection Transformer) Nano variant trained on COCO
     * (see {@link COCO_CLASSES}). Modern end-to-end DINOv2-based transformer
     * object detector.
     */
    RFDETR_NANO: {
      ...RFDETR_NANO_DETECTOR_XNNPACK_FP32,
      XNNPACK_FP32: RFDETR_NANO_DETECTOR_XNNPACK_FP32,
      COREML_INT8: RFDETR_NANO_DETECTOR_COREML_INT8,
    },
    /**
     * Ultralytics YOLO26 real-time object detection models trained on COCO
     * (80 classes, see {@link COCO_CLASSES_YOLO}). Available across multiple
     * scale sizes (NANO, SMALL, MEDIUM, LARGE, XLARGE) and resolutions
     * (384x384, 512x512, 640x640).
     */
    YOLO26: {
      ...YOLO26_NANO_384_XNNPACK_FP32,
      /**
       * Nano scale YOLO26 object detection model. High speed,
       * ultra low latency.
       */
      NANO: {
        ...YOLO26_NANO_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_NANO_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_NANO_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_NANO_640_XNNPACK_FP32 },
      },
      /**
       * Small scale YOLO26 object detection model. Balanced
       * latency and accuracy.
       */
      SMALL: {
        ...YOLO26_SMALL_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_SMALL_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_SMALL_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_SMALL_640_XNNPACK_FP32 },
      },
      /**
       * Medium scale YOLO26 object detection model. Higher
       * precision for complex scenes.
       */
      MEDIUM: {
        ...YOLO26_MEDIUM_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_MEDIUM_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_MEDIUM_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_MEDIUM_640_XNNPACK_FP32 },
      },
      /**
       * Large scale YOLO26 object detection model. High accuracy
       * model variant.
       */
      LARGE: {
        ...YOLO26_LARGE_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_LARGE_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_LARGE_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_LARGE_640_XNNPACK_FP32 },
      },
      /**
       * Extra Large scale YOLO26 object detection model.
       * Maximum detection performance.
       */
      XLARGE: {
        ...YOLO26_XLARGE_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_XLARGE_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_XLARGE_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_XLARGE_640_XNNPACK_FP32 },
      },
    },
  },

  /**
   * Keypoint and pose detection models that estimate facial landmarks or human
   * body skeletal keypoints.
   */
  keypointDetection: {
    /**
     * MediaPipe BlazeFace lightweight face detection and 6-point facial landmark
     * locator (eyes, nose, mouth, ears, see {@link BLAZEFACE_LANDMARKS}).
     */
    BLAZEFACE: {
      ...BLAZEFACE_XNNPACK_FP32,
      XNNPACK_FP32: BLAZEFACE_XNNPACK_FP32,
    },
    /**
     * YOLO26 human pose estimation model predicting 17 COCO body keypoints
     * (see {@link COCO_LANDMARKS}). Available across 384x384, 512x512, and
     * 640x640 resolutions.
     */
    YOLO26_POSE: {
      ...YOLO26_POSE_384_XNNPACK_FP32,
      SIZE_384: { XNNPACK_FP32: YOLO26_POSE_384_XNNPACK_FP32 },
      SIZE_512: { XNNPACK_FP32: YOLO26_POSE_512_XNNPACK_FP32 },
      SIZE_640: { XNNPACK_FP32: YOLO26_POSE_640_XNNPACK_FP32 },
    },
    /**
     * RF-DETR (Roboflow Detection Transformer) pose keypoint detector
     * predicting 17 COCO body keypoints (see {@link COCO_LANDMARKS}).
     */
    RFDETR_KEYPOINT: {
      ...RFDETR_KEYPOINT_XNNPACK_FP32,
      XNNPACK_FP32: RFDETR_KEYPOINT_XNNPACK_FP32,
      COREML_FP32: RFDETR_KEYPOINT_COREML_FP32,
      MLX_FP32: RFDETR_KEYPOINT_MLX_FP32,
    },
  },

  /**
   * Instance segmentation models predicting both bounding boxes and fine-grained
   * pixel masks per object instance.
   */
  instanceSegmentation: {
    /**
     * Fast Segment Anything Model (FastSAM) for promptable or global object
     * instance mask segmentation. Available in Small (S) and Extra Large (X)
     * variants.
     */
    FASTSAM: {
      /**
       * FastSAM Small - lightweight instance segmenter for
       * mobile.
       */
      S: {
        ...FASTSAM_S_XNNPACK_FP32,
        XNNPACK_FP32: FASTSAM_S_XNNPACK_FP32,
        COREML_FP32: FASTSAM_S_COREML_FP32,
        COREML_FP16: FASTSAM_S_COREML_FP16,
      },
      /**
       * FastSAM Extra Large - high-accuracy instance segmenter.
       */
      X: {
        ...FASTSAM_X_XNNPACK_FP32,
        XNNPACK_FP32: FASTSAM_X_XNNPACK_FP32,
        COREML_FP32: FASTSAM_X_COREML_FP32,
        COREML_FP16: FASTSAM_X_COREML_FP16,
      },
    },
    /**
     * RF-DETR (Roboflow Detection Transformer) Nano instance segmentation
     * model predicting COCO class masks and bounding boxes
     * (see {@link COCO_CLASSES}).
     */
    RFDETR_NANO: {
      ...RFDETR_NANO_SEG_COREML_INT8,
      COREML_INT8: RFDETR_NANO_SEG_COREML_INT8,
      XNNPACK_FP32: RFDETR_NANO_SEG_XNNPACK_FP32,
    },
    /**
     * YOLO26 instance segmentation models predicting COCO class instance masks
     * and bounding boxes (see {@link COCO_CLASSES_YOLO}). Available across
     * multiple sizes (NANO, SMALL, MEDIUM, LARGE, XLARGE) and resolutions
     * (384x384, 512x512, 640x640).
     */
    YOLO26: {
      ...YOLO26_NANO_SEG_384_XNNPACK_FP32,
      /**
       * Nano scale YOLO26 instance segmentation model. High
       * speed.
       */
      NANO: {
        ...YOLO26_NANO_SEG_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_NANO_SEG_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_NANO_SEG_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_NANO_SEG_640_XNNPACK_FP32 },
      },
      /** Small scale YOLO26 instance segmentation model. */
      SMALL: {
        ...YOLO26_SMALL_SEG_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_SMALL_SEG_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_SMALL_SEG_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_SMALL_SEG_640_XNNPACK_FP32 },
      },
      /** Medium scale YOLO26 instance segmentation model. */
      MEDIUM: {
        ...YOLO26_MEDIUM_SEG_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_MEDIUM_SEG_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_MEDIUM_SEG_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_MEDIUM_SEG_640_XNNPACK_FP32 },
      },
      /** Large scale YOLO26 instance segmentation model. */
      LARGE: {
        ...YOLO26_LARGE_SEG_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_LARGE_SEG_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_LARGE_SEG_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_LARGE_SEG_640_XNNPACK_FP32 },
      },
      /** Extra Large scale YOLO26 instance segmentation model. */
      XLARGE: {
        ...YOLO26_XLARGE_SEG_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_XLARGE_SEG_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_XLARGE_SEG_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_XLARGE_SEG_640_XNNPACK_FP32 },
      },
    },
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
    FSMN_VAD: {
      ...FSMN_VAD_XNNPACK_FP32,
      XNNPACK_FP32: FSMN_VAD_XNNPACK_FP32,
    },
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
    WHISPER: {
      /**
       * Multilingual Whisper Tiny model. Supporting 99+
       * languages. High speed speech recognition.
       */
      TINY: {
        ...WHISPER_TINY_XNNPACK_FP32,
        XNNPACK_FP32: WHISPER_TINY_XNNPACK_FP32,
        COREML_FP16: WHISPER_TINY_COREML_FP16,
        MLX_BF16: WHISPER_TINY_MLX_BF16,
      },
      /**
       * Multilingual Whisper Base model. Higher accuracy across
       * supported languages.
       */
      BASE: {
        ...WHISPER_BASE_XNNPACK_FP32,
        XNNPACK_FP32: WHISPER_BASE_XNNPACK_FP32,
        COREML_FP16: WHISPER_BASE_COREML_FP16,
        MLX_BF16: WHISPER_BASE_MLX_BF16,
      },
      /**
       * Multilingual Whisper Small model. Best accuracy for
       * complex multi-language audio.
       */
      SMALL: {
        ...WHISPER_SMALL_XNNPACK_FP32,
        XNNPACK_FP32: WHISPER_SMALL_XNNPACK_FP32,
        COREML_FP16: WHISPER_SMALL_COREML_FP16,
        MLX_BF16: WHISPER_SMALL_MLX_BF16,
      },
      /** English-only optimized Whisper models (`TINY`, `BASE`, `SMALL`). */
      EN: {
        /**
         * English-only Whisper Tiny model. Fast and compact for
         * English STT.
         */
        TINY: {
          ...WHISPER_TINY_EN_XNNPACK_FP32,
          XNNPACK_FP32: WHISPER_TINY_EN_XNNPACK_FP32,
          COREML_FP16: WHISPER_TINY_EN_COREML_FP16,
          MLX_BF16: WHISPER_TINY_EN_MLX_BF16,
        },
        /**
         * English-only Whisper Base model. High accuracy
         * English speech recognition.
         */
        BASE: {
          ...WHISPER_BASE_EN_XNNPACK_FP32,
          XNNPACK_FP32: WHISPER_BASE_EN_XNNPACK_FP32,
          COREML_FP16: WHISPER_BASE_EN_COREML_FP16,
          MLX_BF16: WHISPER_BASE_EN_MLX_BF16,
        },
        /**
         * English-only Whisper Small model. Superior accuracy
         * for English transcription.
         */
        SMALL: {
          ...WHISPER_SMALL_EN_XNNPACK_FP32,
          XNNPACK_FP32: WHISPER_SMALL_EN_XNNPACK_FP32,
          COREML_FP16: WHISPER_SMALL_EN_COREML_FP16,
          MLX_BF16: WHISPER_SMALL_EN_MLX_BF16,
        },
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
   * Text embedding models mapping sentences and documents into dense vector
   * representations for semantic search and RAG.
   */
  textEmbeddings: {
    /**
     * Compact 384-dimensional sentence transformer mapping text to a dense
     * vector space. Optimized for fast, general-purpose semantic search,
     * sentence similarity, and clustering.
     */
    ALL_MINILM_L6_V2: {
      ...ALL_MINILM_L6_V2_EMBEDDINGS,
      XNNPACK_FP32: ALL_MINILM_L6_V2_EMBEDDINGS,
    },
    /**
     * High-quality 768-dimensional sentence transformer model based on MPNet.
     * Provides higher quality semantic embeddings compared to MiniLM.
     */
    ALL_MPNET_BASE_V2: {
      ...ALL_MPNET_BASE_V2_EMBEDDINGS,
      XNNPACK_FP32: ALL_MPNET_BASE_V2_EMBEDDINGS,
    },
    /**
     * 384-dimensional sentence transformer fine-tuned specifically for
     * semantic QA matching using cosine similarity.
     */
    MULTI_QA_MINILM_L6_COS_V1: {
      ...MULTI_QA_MINILM_L6_COS_V1_EMBEDDINGS,
      XNNPACK_FP32: MULTI_QA_MINILM_L6_COS_V1_EMBEDDINGS,
    },
    /**
     * 768-dimensional sentence transformer fine-tuned specifically for
     * question-answering matching using dot product distance.
     */
    MULTI_QA_MPNET_BASE_DOT_V1: {
      ...MULTI_QA_MPNET_BASE_DOT_V1_EMBEDDINGS,
      XNNPACK_FP32: MULTI_QA_MPNET_BASE_DOT_V1_EMBEDDINGS,
    },
    /**
     * 384-dimensional sentence transformer supporting 50+ languages for
     * cross-lingual semantic similarity.
     */
    PARAPHRASE_MULTILINGUAL_MINILM_L12_V2: {
      ...PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_EMBEDDINGS,
      XNNPACK_8DA4W: PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_EMBEDDINGS,
    },
    /**
     * Multilingual sentence transformer supporting 50+ languages, based on
     * distilled Universal Sentence Encoder (512-dim output).
     */
    DISTILUSE_BASE_MULTILINGUAL_CASED_V2: {
      ...DISTILUSE_BASE_MULTILINGUAL_CASED_V2_EMBEDDINGS,
      XNNPACK_8DA4W: DISTILUSE_BASE_MULTILINGUAL_CASED_V2_EMBEDDINGS,
    },
    /**
     * CLIP text encoder (ViT-B/32) mapping text queries into a
     * 512-dimensional joint text-image embedding space. Used in combination
     * with `imageEmbeddings.CLIP_VIT_BASE_PATCH32` for zero-shot text-to-image
     * search.
     */
    CLIP_VIT_BASE_PATCH32_TEXT: {
      ...CLIP_VIT_BASE_PATCH32_TEXT_EMBEDDINGS,
      XNNPACK_FP32: CLIP_VIT_BASE_PATCH32_TEXT_EMBEDDINGS,
    },
    /**
     * Liquid AI LFM 2.5 350M parameter embedding model for asymmetric search
     * and retrieval tasks. Prompts queries with `query: ` (the default) and
     * passages with `document: ` via `embed(text, 'document: ')`.
     */
    LFM2_5_EMBEDDING_350M: {
      ...LFM2_5_EMBEDDING_350M_EMBEDDINGS,
      XNNPACK_8DA4W: LFM2_5_EMBEDDING_350M_EMBEDDINGS,
      MLX_INT4: LFM2_5_EMBEDDING_350M_MLX_INT4,
    },
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
    OPENAI: {
      ...PRIVACY_FILTER_OPENAI_XNNPACK_8DA4W,
      XNNPACK_8DA4W: PRIVACY_FILTER_OPENAI_XNNPACK_8DA4W,
      MLX_INT4: PRIVACY_FILTER_OPENAI_MLX_INT4,
    },
    /**
     * Nemotron-based detector covering 55 fine-grained PII types. Larger label
     * space for stricter compliance-oriented redaction.
     */
    NEMOTRON: {
      ...PRIVACY_FILTER_NEMOTRON_XNNPACK_8DA4W,
      XNNPACK_8DA4W: PRIVACY_FILTER_NEMOTRON_XNNPACK_8DA4W,
      MLX_INT8: PRIVACY_FILTER_NEMOTRON_MLX_INT8,
    },
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
    CLIP_VIT_BASE_PATCH32: {
      ...CLIP_VIT_BASE_PATCH32_IMAGE_XNNPACK_FP32,
      XNNPACK_FP32: CLIP_VIT_BASE_PATCH32_IMAGE_XNNPACK_FP32,
      XNNPACK_INT8: CLIP_VIT_BASE_PATCH32_IMAGE_XNNPACK_INT8,
    },
  },

  /**
   * Generative text-to-image synthesis models.
   */
  textToImage: {
    /**
     * Ultra-fast SDXS (Stable Diffusion eXtreme Speed) 512x512 text-to-image
     * generation model based on DreamShaper. Generates high-quality images
     * from text prompts in real time.
     */
    SDXS_512_DREAMSHAPER: {
      ...SDXS_512_DREAMSHAPER_XNNPACK_FP32,
      XNNPACK_FP32: SDXS_512_DREAMSHAPER_XNNPACK_FP32,
      COREML_FP16: SDXS_512_DREAMSHAPER_COREML_FP16,
    },
  },

  /**
   * Text-to-Speech (TTS) models that synthesize audio waveforms from input text.
   */
  textToSpeech: {
    /**
     * Supertonic 3 multilingual flow-matching Text-to-Speech model.
     */
    SUPERTONIC: {
      ...SUPERTONIC_3_XNNPACK_FP32,
      XNNPACK_FP32: SUPERTONIC_3_XNNPACK_FP32,
      MLX_FP32: SUPERTONIC_3_MLX_FP32,
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
      PPOCRV6_SMALL: ppOcrV6,
    },
  },
};
