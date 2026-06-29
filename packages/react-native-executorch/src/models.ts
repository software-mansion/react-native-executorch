import type { ClassifierModel } from './extensions/cv/tasks/classification';
import type { TextToSpeechModel } from './extensions/speech/tasks/textToSpeech';
import type { Language } from './extensions/speech/utils/phonemizer';
import type { ObjectDetectorModel } from './extensions/cv/tasks/objectDetection';
import type { StyleTransferModel } from './extensions/cv/tasks/styleTransfer';
import type { SemanticSegmentationModel } from './extensions/cv/tasks/semanticSegmentation';
import type { KeypointDetectorModel } from './extensions/cv/tasks/keypointDetection';
import type { InstanceSegmenterModel } from './extensions/cv/tasks/instanceSegmentation';
import {
  IMAGENET_NORM,
  IMAGENET1K_LABELS,
  PASCAL_VOC_LABELS,
  COCO_CLASSES,
  COCO_CLASSES_YOLO,
  BLAZEFACE_LANDMARKS,
  COCO_LANDMARKS,
  type ImageNet1KLabel,
  type PascalVocLabel,
  type CocoClass,
  type CocoClassYolo,
  type BlazeFaceLandmark,
  type CocoLandmark,
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
  alpha: 1 / 255.0,
  beta: 0.0,
  labels: IMAGENET1K_LABELS,
};
const EFFICIENTNET_V2_S_XNNPACK_INT8: ClassifierModel<ImageNet1KLabel> = {
  modelPath: `${BASE_URL}-efficientnet-v2-s/${VERSION_TAG}/xnnpack/efficientnet_v2_s_xnnpack_int8.pte`,
  classifierOpts: EFFICIENTNET_V2_S_OPTS,
};
const EFFICIENTNET_V2_S_XNNPACK_FP32: ClassifierModel<ImageNet1KLabel> = {
  modelPath: `${BASE_URL}-efficientnet-v2-s/${VERSION_TAG}/xnnpack/efficientnet_v2_s_xnnpack_fp32.pte`,
  classifierOpts: EFFICIENTNET_V2_S_OPTS,
};
const EFFICIENTNET_V2_S_COREML_FP16: ClassifierModel<ImageNet1KLabel> = {
  modelPath: `${BASE_URL}-efficientnet-v2-s/${VERSION_TAG}/coreml/efficientnet_v2_s_coreml_fp16.pte`,
  classifierOpts: EFFICIENTNET_V2_S_OPTS,
};

// =============================================================================
// Style Transfer
// =============================================================================
const STYLE_TRANSFER_OPTS = {
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  alpha: 1 / 255.0,
  beta: 0.0,
  outAlpha: 255.0,
  outBeta: 0.0,
  outInterpolation: 'lanczos' as const,
};
const STYLE_TRANSFER_CANDY_XNNPACK_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-candy/${VERSION_TAG}/xnnpack/style_transfer_candy_xnnpack_fp32.pte`,
  opts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_CANDY_XNNPACK_INT8: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-candy/${VERSION_TAG}/xnnpack/style_transfer_candy_xnnpack_int8.pte`,
  opts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_CANDY_COREML_FP16: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-candy/${VERSION_TAG}/coreml/style_transfer_candy_coreml_fp16.pte`,
  opts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_CANDY_COREML_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-candy/${VERSION_TAG}/coreml/style_transfer_candy_coreml_fp32.pte`,
  opts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_MOSAIC_XNNPACK_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-mosaic/${VERSION_TAG}/xnnpack/style_transfer_mosaic_xnnpack_fp32.pte`,
  opts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_MOSAIC_XNNPACK_INT8: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-mosaic/${VERSION_TAG}/xnnpack/style_transfer_mosaic_xnnpack_int8.pte`,
  opts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_MOSAIC_COREML_FP16: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-mosaic/${VERSION_TAG}/coreml/style_transfer_mosaic_coreml_fp16.pte`,
  opts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_MOSAIC_COREML_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-mosaic/${VERSION_TAG}/coreml/style_transfer_mosaic_coreml_fp32.pte`,
  opts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_RAIN_PRINCESS_XNNPACK_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-rain-princess/${VERSION_TAG}/xnnpack/style_transfer_rain_princess_xnnpack_fp32.pte`,
  opts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_RAIN_PRINCESS_XNNPACK_INT8: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-rain-princess/${VERSION_TAG}/xnnpack/style_transfer_rain_princess_xnnpack_int8.pte`,
  opts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_RAIN_PRINCESS_COREML_FP16: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-rain-princess/${VERSION_TAG}/coreml/style_transfer_rain_princess_coreml_fp16.pte`,
  opts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_RAIN_PRINCESS_COREML_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-rain-princess/${VERSION_TAG}/coreml/style_transfer_rain_princess_coreml_fp32.pte`,
  opts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_UDNIE_XNNPACK_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-udnie/${VERSION_TAG}/xnnpack/style_transfer_udnie_xnnpack_fp32.pte`,
  opts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_UDNIE_XNNPACK_INT8: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-udnie/${VERSION_TAG}/xnnpack/style_transfer_udnie_xnnpack_int8.pte`,
  opts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_UDNIE_COREML_FP16: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-udnie/${VERSION_TAG}/coreml/style_transfer_udnie_coreml_fp16.pte`,
  opts: STYLE_TRANSFER_OPTS,
};
const STYLE_TRANSFER_UDNIE_COREML_FP32: StyleTransferModel = {
  modelPath: `${BASE_URL}-style-transfer-udnie/${VERSION_TAG}/coreml/style_transfer_udnie_coreml_fp32.pte`,
  opts: STYLE_TRANSFER_OPTS,
};

// =============================================================================
// Semantic Segmentation
// =============================================================================
const SELFIE_SEGMENTATION_XNNPACK_FP32: SemanticSegmentationModel<'background' | 'person'> = {
  modelPath: `${BASE_URL}-selfie-segmentation/${VERSION_TAG}/xnnpack/selfie_segmentation_xnnpack_fp32.pte`,
  opts: {
    labels: ['background', 'person'] as const,
    resizeMode: 'stretch',
    interpolation: 'linear',
    alpha: 1 / 255.0,
    beta: 0.0,
    outInterpolation: 'lanczos',
  },
};

const LRASPP_MOBILENET_V3_LARGE_OPTS = {
  labels: PASCAL_VOC_LABELS,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  outInterpolation: 'lanczos' as const,
  ...IMAGENET_NORM,
};
const LRASPP_MOBILENET_V3_LARGE_XNNPACK_FP32: SemanticSegmentationModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-lraspp/${VERSION_TAG}/xnnpack/lraspp_mobilenet_v3_large_xnnpack_fp32.pte`,
  opts: LRASPP_MOBILENET_V3_LARGE_OPTS,
};
const LRASPP_MOBILENET_V3_LARGE_XNNPACK_INT8: SemanticSegmentationModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-lraspp/${VERSION_TAG}/xnnpack/lraspp_mobilenet_v3_large_xnnpack_int8.pte`,
  opts: LRASPP_MOBILENET_V3_LARGE_OPTS,
};

const DEEPLAB_V3_OPTS = {
  labels: PASCAL_VOC_LABELS,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  outInterpolation: 'lanczos' as const,
  ...IMAGENET_NORM,
};
const DEEPLAB_V3_RESNET50_XNNPACK_FP32: SemanticSegmentationModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-deeplab-v3/${NEXT_VERSION_TAG}/xnnpack/deeplab_v3_resnet50_xnnpack_fp32.pte`,
  opts: DEEPLAB_V3_OPTS,
};
const DEEPLAB_V3_RESNET50_XNNPACK_INT8: SemanticSegmentationModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-deeplab-v3/${NEXT_VERSION_TAG}/xnnpack/deeplab_v3_resnet50_xnnpack_int8.pte`,
  opts: DEEPLAB_V3_OPTS,
};
const DEEPLAB_V3_RESNET101_XNNPACK_FP32: SemanticSegmentationModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-deeplab-v3/${NEXT_VERSION_TAG}/xnnpack/deeplab_v3_resnet101_xnnpack_fp32.pte`,
  opts: DEEPLAB_V3_OPTS,
};
const DEEPLAB_V3_RESNET101_XNNPACK_INT8: SemanticSegmentationModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-deeplab-v3/${NEXT_VERSION_TAG}/xnnpack/deeplab_v3_resnet101_xnnpack_int8.pte`,
  opts: DEEPLAB_V3_OPTS,
};
const DEEPLAB_V3_MOBILENET_V3_LARGE_XNNPACK_FP32: SemanticSegmentationModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-deeplab-v3/${NEXT_VERSION_TAG}/xnnpack/deeplab_v3_mobilenet_v3_large_xnnpack_fp32.pte`,
  opts: DEEPLAB_V3_OPTS,
};
const DEEPLAB_V3_MOBILENET_V3_LARGE_XNNPACK_INT8: SemanticSegmentationModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-deeplab-v3/${NEXT_VERSION_TAG}/xnnpack/deeplab_v3_mobilenet_v3_large_xnnpack_int8.pte`,
  opts: DEEPLAB_V3_OPTS,
};

const FCN_OPTS = {
  labels: PASCAL_VOC_LABELS,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  outInterpolation: 'lanczos' as const,
  ...IMAGENET_NORM,
};
const FCN_RESNET50_XNNPACK_FP32: SemanticSegmentationModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-fcn/${NEXT_VERSION_TAG}/xnnpack/fcn_resnet50_xnnpack_fp32.pte`,
  opts: FCN_OPTS,
};
const FCN_RESNET50_XNNPACK_INT8: SemanticSegmentationModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-fcn/${NEXT_VERSION_TAG}/xnnpack/fcn_resnet50_xnnpack_int8.pte`,
  opts: FCN_OPTS,
};
const FCN_RESNET101_XNNPACK_FP32: SemanticSegmentationModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-fcn/${NEXT_VERSION_TAG}/xnnpack/fcn_resnet101_xnnpack_fp32.pte`,
  opts: FCN_OPTS,
};
const FCN_RESNET101_XNNPACK_INT8: SemanticSegmentationModel<PascalVocLabel> = {
  modelPath: `${BASE_URL}-fcn/${NEXT_VERSION_TAG}/xnnpack/fcn_resnet101_xnnpack_int8.pte`,
  opts: FCN_OPTS,
};

// =============================================================================
// Object Detection
// =============================================================================
const SSDLITE320_MOBILENET_V3_LARGE_OPTS = {
  labels: COCO_CLASSES,
  boxFormat: 'xyxy' as const,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  alpha: 1 / 255.0,
  beta: 0.0,
  defaultConfidenceThreshold: 0.5,
  defaultIouThreshold: 0.55,
};
const SSDLITE320_MOBILENET_V3_LARGE_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClass> = {
  modelPath: `${BASE_URL}-ssdlite320-mobilenet-v3-large/${VERSION_TAG}/xnnpack/ssdlite320_mobilenet_v3_large_xnnpack_fp32.pte`,
  opts: SSDLITE320_MOBILENET_V3_LARGE_OPTS,
};
const SSDLITE320_MOBILENET_V3_LARGE_COREML_FP16: ObjectDetectorModel<'xyxy', CocoClass> = {
  modelPath: `${BASE_URL}-ssdlite320-mobilenet-v3-large/${VERSION_TAG}/coreml/ssdlite320_mobilenet_v3_large_coreml_fp16.pte`,
  opts: SSDLITE320_MOBILENET_V3_LARGE_OPTS,
};
const SSDLITE320_MOBILENET_V3_LARGE_COREML_FP32: ObjectDetectorModel<'xyxy', CocoClass> = {
  modelPath: `${BASE_URL}-ssdlite320-mobilenet-v3-large/${VERSION_TAG}/coreml/ssdlite320_mobilenet_v3_large_coreml_fp32.pte`,
  opts: SSDLITE320_MOBILENET_V3_LARGE_OPTS,
};

const RFDETR_NANO_DETECTOR_OPTS = {
  labels: COCO_CLASSES,
  boxFormat: 'xyxy' as const,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  ...IMAGENET_NORM,
  defaultConfidenceThreshold: 0.5,
  defaultIouThreshold: 0.55,
};
const RFDETR_NANO_DETECTOR_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClass> = {
  modelPath: `${BASE_URL}-rfdetr-nano-detector/${VERSION_TAG}/xnnpack/rfdetr_nano_xnnpack_fp32.pte`,
  opts: RFDETR_NANO_DETECTOR_OPTS,
};
const RFDETR_NANO_DETECTOR_COREML_INT8: ObjectDetectorModel<'xyxy', CocoClass> = {
  modelPath: `${BASE_URL}-rfdetr-nano-detector/${VERSION_TAG}/coreml/rfdetr_nano_coreml_int8.pte`,
  opts: RFDETR_NANO_DETECTOR_OPTS,
};

const YOLO26_DETECTOR_OPTS = {
  labels: COCO_CLASSES_YOLO,
  boxFormat: 'xyxy' as const,
  resizeMode: 'letterbox' as const,
  interpolation: 'linear' as const,
  alpha: 1 / 255.0,
  beta: 0.0,
  defaultConfidenceThreshold: 0.25,
  defaultIouThreshold: 0.7,
};

const YOLO26_NANO_384_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/n/xnnpack/yolo26n_384_xnnpack_fp32.pte`,
  opts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_NANO_512_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/n/xnnpack/yolo26n_512_xnnpack_fp32.pte`,
  opts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_NANO_640_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/n/xnnpack/yolo26n_640_xnnpack_fp32.pte`,
  opts: YOLO26_DETECTOR_OPTS,
};

const YOLO26_SMALL_384_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/s/xnnpack/yolo26s_384_xnnpack_fp32.pte`,
  opts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_SMALL_512_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/s/xnnpack/yolo26s_512_xnnpack_fp32.pte`,
  opts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_SMALL_640_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/s/xnnpack/yolo26s_640_xnnpack_fp32.pte`,
  opts: YOLO26_DETECTOR_OPTS,
};

const YOLO26_MEDIUM_384_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/m/xnnpack/yolo26m_384_xnnpack_fp32.pte`,
  opts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_MEDIUM_512_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/m/xnnpack/yolo26m_512_xnnpack_fp32.pte`,
  opts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_MEDIUM_640_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/m/xnnpack/yolo26m_640_xnnpack_fp32.pte`,
  opts: YOLO26_DETECTOR_OPTS,
};

const YOLO26_LARGE_384_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/l/xnnpack/yolo26l_384_xnnpack_fp32.pte`,
  opts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_LARGE_512_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/l/xnnpack/yolo26l_512_xnnpack_fp32.pte`,
  opts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_LARGE_640_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/l/xnnpack/yolo26l_640_xnnpack_fp32.pte`,
  opts: YOLO26_DETECTOR_OPTS,
};

const YOLO26_XLARGE_384_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/x/xnnpack/yolo26x_384_xnnpack_fp32.pte`,
  opts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_XLARGE_512_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/x/xnnpack/yolo26x_512_xnnpack_fp32.pte`,
  opts: YOLO26_DETECTOR_OPTS,
};
const YOLO26_XLARGE_640_XNNPACK_FP32: ObjectDetectorModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26/${NEXT_VERSION_TAG}/x/xnnpack/yolo26x_640_xnnpack_fp32.pte`,
  opts: YOLO26_DETECTOR_OPTS,
};

// =============================================================================
// Keypoint Detection
// =============================================================================
const BLAZEFACE_XNNPACK_FP32: KeypointDetectorModel<'xyxy', BlazeFaceLandmark> = {
  modelPath: `${BASE_URL}-blazeface/${NEXT_VERSION_TAG}/xnnpack/blazeface_xnnpack_fp32.pte`,
  opts: {
    boxFormat: 'xyxy',
    resizeMode: 'letterbox',
    interpolation: 'linear',
    alpha: 1 / 127.5,
    beta: -1.0,
    defaultIouThreshold: 0.3,
    defaultConfidenceThreshold: 0.75,
    landmarks: BLAZEFACE_LANDMARKS,
  },
};

const YOLO26_POSE_OPTS = {
  boxFormat: 'xyxy' as const,
  resizeMode: 'letterbox' as const,
  interpolation: 'linear' as const,
  alpha: 1 / 255.0,
  beta: 0.0,
  defaultIouThreshold: 0.7,
  defaultConfidenceThreshold: 0.25,
  landmarks: COCO_LANDMARKS,
};
const YOLO26_POSE_384_XNNPACK_FP32: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-yolo26-pose/${NEXT_VERSION_TAG}/xnnpack/yolo26n_pose_384_xnnpack_fp32.pte`,
  opts: YOLO26_POSE_OPTS,
};
const YOLO26_POSE_512_XNNPACK_FP32: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-yolo26-pose/${NEXT_VERSION_TAG}/xnnpack/yolo26n_pose_512_xnnpack_fp32.pte`,
  opts: YOLO26_POSE_OPTS,
};
const YOLO26_POSE_640_XNNPACK_FP32: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-yolo26-pose/${NEXT_VERSION_TAG}/xnnpack/yolo26n_pose_640_xnnpack_fp32.pte`,
  opts: YOLO26_POSE_OPTS,
};

const RFDETR_KEYPOINT_OPTS = {
  boxFormat: 'xyxy' as const,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  ...IMAGENET_NORM,
  defaultIouThreshold: 0.55,
  defaultConfidenceThreshold: 0.5,
  landmarks: COCO_LANDMARKS,
};
const RFDETR_KEYPOINT_XNNPACK_FP32: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-rfdetr-keypoint/${VERSION_TAG}/preview/xnnpack/rfdetr_keypoint_preview_xnnpack_fp32.pte`,
  opts: RFDETR_KEYPOINT_OPTS,
};
const RFDETR_KEYPOINT_COREML_FP32: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-rfdetr-keypoint/${VERSION_TAG}/preview/coreml/rfdetr_keypoint_preview_coreml_fp32.pte`,
  opts: RFDETR_KEYPOINT_OPTS,
};
const RFDETR_KEYPOINT_MLX_FP32: KeypointDetectorModel<'xyxy', CocoLandmark> = {
  modelPath: `${BASE_URL}-rfdetr-keypoint/${VERSION_TAG}/preview/mlx/rfdetr_keypoint_preview_mlx_fp32.pte`,
  opts: RFDETR_KEYPOINT_OPTS,
};

// =============================================================================
// Instance Segmentation
// =============================================================================
const FASTSAM_OPTS = {
  labels: ['object'] as const,
  boxFormat: 'xyxy' as const,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  alpha: 1 / 255.0,
  beta: 0.0,
  defaultConfidenceThreshold: 0.5,
  defaultIouThreshold: 0.9,
  defaultMaskThreshold: 0.5,
};
const FASTSAM_S_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', 'object'> = {
  modelPath: `${BASE_URL}-fast-sam/${NEXT_VERSION_TAG}/s/xnnpack/fast_sam_s_xnnpack_fp32.pte`,
  opts: FASTSAM_OPTS,
};
const FASTSAM_S_COREML_FP32: InstanceSegmenterModel<'xyxy', 'object'> = {
  modelPath: `${BASE_URL}-fast-sam/${NEXT_VERSION_TAG}/s/coreml/fast_sam_s_coreml_fp32.pte`,
  opts: FASTSAM_OPTS,
};
const FASTSAM_S_COREML_FP16: InstanceSegmenterModel<'xyxy', 'object'> = {
  modelPath: `${BASE_URL}-fast-sam/${NEXT_VERSION_TAG}/s/coreml/fast_sam_s_coreml_fp16.pte`,
  opts: FASTSAM_OPTS,
};
const FASTSAM_X_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', 'object'> = {
  modelPath: `${BASE_URL}-fast-sam/${NEXT_VERSION_TAG}/x/xnnpack/fast_sam_x_xnnpack_fp32.pte`,
  opts: FASTSAM_OPTS,
};
const FASTSAM_X_COREML_FP32: InstanceSegmenterModel<'xyxy', 'object'> = {
  modelPath: `${BASE_URL}-fast-sam/${NEXT_VERSION_TAG}/x/coreml/fast_sam_x_coreml_fp32.pte`,
  opts: FASTSAM_OPTS,
};
const FASTSAM_X_COREML_FP16: InstanceSegmenterModel<'xyxy', 'object'> = {
  modelPath: `${BASE_URL}-fast-sam/${NEXT_VERSION_TAG}/x/coreml/fast_sam_x_coreml_fp16.pte`,
  opts: FASTSAM_OPTS,
};

const RFDETR_NANO_SEG_OPTS = {
  labels: COCO_CLASSES,
  boxFormat: 'xyxy' as const,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  ...IMAGENET_NORM,
  defaultConfidenceThreshold: 0.5,
  defaultIouThreshold: 0.55,
  defaultMaskThreshold: 0.5,
};
const RFDETR_NANO_SEG_COREML_INT8: InstanceSegmenterModel<'xyxy', CocoClass> = {
  modelPath: `${BASE_URL}-rfdetr-nano-segmentation/${NEXT_VERSION_TAG}/coreml/rfdetr_nano_coreml_int8.pte`,
  opts: RFDETR_NANO_SEG_OPTS,
};
const RFDETR_NANO_SEG_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClass> = {
  modelPath: `${BASE_URL}-rfdetr-nano-segmentation/${NEXT_VERSION_TAG}/xnnpack/rfdetr_nano_xnnpack_fp32.pte`,
  opts: RFDETR_NANO_SEG_OPTS,
};

const YOLO26_SEG_OPTS = {
  labels: COCO_CLASSES_YOLO,
  boxFormat: 'xyxy' as const,
  resizeMode: 'stretch' as const,
  interpolation: 'linear' as const,
  alpha: 1 / 255.0,
  beta: 0.0,
  defaultConfidenceThreshold: 0.25,
  defaultIouThreshold: 0.7,
  defaultMaskThreshold: 0.5,
};

const YOLO26_NANO_SEG_384_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/n/xnnpack/yolo26_seg_n_384_xnnpack_fp32.pte`,
  opts: YOLO26_SEG_OPTS,
};
const YOLO26_NANO_SEG_512_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/n/xnnpack/yolo26_seg_n_512_xnnpack_fp32.pte`,
  opts: YOLO26_SEG_OPTS,
};
const YOLO26_NANO_SEG_640_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/n/xnnpack/yolo26_seg_n_640_xnnpack_fp32.pte`,
  opts: YOLO26_SEG_OPTS,
};

const YOLO26_SMALL_SEG_384_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/s/xnnpack/yolo26_seg_s_384_xnnpack_fp32.pte`,
  opts: YOLO26_SEG_OPTS,
};
const YOLO26_SMALL_SEG_512_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/s/xnnpack/yolo26_seg_s_512_xnnpack_fp32.pte`,
  opts: YOLO26_SEG_OPTS,
};
const YOLO26_SMALL_SEG_640_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/s/xnnpack/yolo26_seg_s_640_xnnpack_fp32.pte`,
  opts: YOLO26_SEG_OPTS,
};

const YOLO26_MEDIUM_SEG_384_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/m/xnnpack/yolo26_seg_m_384_xnnpack_fp32.pte`,
  opts: YOLO26_SEG_OPTS,
};
const YOLO26_MEDIUM_SEG_512_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/m/xnnpack/yolo26_seg_m_512_xnnpack_fp32.pte`,
  opts: YOLO26_SEG_OPTS,
};
const YOLO26_MEDIUM_SEG_640_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/m/xnnpack/yolo26_seg_m_640_xnnpack_fp32.pte`,
  opts: YOLO26_SEG_OPTS,
};

const YOLO26_LARGE_SEG_384_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/l/xnnpack/yolo26_seg_l_384_xnnpack_fp32.pte`,
  opts: YOLO26_SEG_OPTS,
};
const YOLO26_LARGE_SEG_512_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/l/xnnpack/yolo26_seg_l_512_xnnpack_fp32.pte`,
  opts: YOLO26_SEG_OPTS,
};
const YOLO26_LARGE_SEG_640_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/l/xnnpack/yolo26_seg_l_640_xnnpack_fp32.pte`,
  opts: YOLO26_SEG_OPTS,
};

const YOLO26_XLARGE_SEG_384_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/x/xnnpack/yolo26_seg_x_384_xnnpack_fp32.pte`,
  opts: YOLO26_SEG_OPTS,
};
const YOLO26_XLARGE_SEG_512_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/x/xnnpack/yolo26_seg_x_512_xnnpack_fp32.pte`,
  opts: YOLO26_SEG_OPTS,
};
const YOLO26_XLARGE_SEG_640_XNNPACK_FP32: InstanceSegmenterModel<'xyxy', CocoClassYolo> = {
  modelPath: `${BASE_URL}-yolo26-seg/${NEXT_VERSION_TAG}/x/xnnpack/yolo26_seg_x_640_xnnpack_fp32.pte`,
  opts: YOLO26_SEG_OPTS,
};

// =============================================================================
// Tokenizers
// =============================================================================
const ALL_MINILM_L6_V2_TOKENIZER = `${BASE_URL}-all-MiniLM-L6-v2/${VERSION_TAG}/tokenizer.json`;


// ------------------------------------------------------------------------------------------------
// --- Text-to-Speech (Kokoro)
// ------------------------------------------------------------------------------------------------

const KOKORO_ROOT = `${BASE_URL}-kokoro/${VERSION_TAG}`;

const KOKORO_STANDARD_SOURCES = {
  durationPredictorPath: `${KOKORO_ROOT}/xnnpack/standard/duration_predictor_std.pte`,
  synthesizerPath: `${KOKORO_ROOT}/xnnpack/standard/synthesizer_std.pte`,
} as const;

const KOKORO_POLISH_SOURCES = {
  durationPredictorPath: `${KOKORO_ROOT}/xnnpack/polish/duration_predictor_pl.pte`,
  synthesizerPath: `${KOKORO_ROOT}/xnnpack/polish/synthesizer_pl.pte`,
} as const;

const KOKORO_GERMAN_SOURCES = {
  durationPredictorPath: `${KOKORO_ROOT}/xnnpack/german/duration_predictor_de.pte`,
  synthesizerPath: `${KOKORO_ROOT}/xnnpack/german/synthesizer_de.pte`,
} as const;

const KOKORO_PHONEMIZER_PREFIX = `${KOKORO_ROOT}/phonemizer`;

const PHONEMIZER_EN_US = {
  lang: 'en-us' as const,
  taggerSource: `${KOKORO_PHONEMIZER_PREFIX}/en-us/tags.json`,
  lexiconSource: `${KOKORO_PHONEMIZER_PREFIX}/en-us/lexicon.json`,
  neuralModelSource: `${KOKORO_PHONEMIZER_PREFIX}/en-us/phonemizer_en_us.pte`,
};

const PHONEMIZER_EN_GB = {
  lang: 'en-gb' as const,
  taggerSource: `${KOKORO_PHONEMIZER_PREFIX}/en-gb/tags.json`,
  lexiconSource: `${KOKORO_PHONEMIZER_PREFIX}/en-gb/lexicon.json`,
  neuralModelSource: `${KOKORO_PHONEMIZER_PREFIX}/en-gb/phonemizer_en_gb.pte`,
};

const PHONEMIZER_SIMPLE = (lang: Language, code: string) => ({
  lang,
  neuralModelSource: `${KOKORO_PHONEMIZER_PREFIX}/${code}/phonemizer_${code}.pte`,
});

const KOKORO_VOICE_PREFIX = `${KOKORO_ROOT}/voices`;

const KOKORO_AF_HEART: TextToSpeechModel = {
  ...KOKORO_STANDARD_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/af_heart.bin`,
  phonemizerConfig: PHONEMIZER_EN_US,
};

const KOKORO_AF_RIVER: TextToSpeechModel = {
  ...KOKORO_STANDARD_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/af_river.bin`,
  phonemizerConfig: PHONEMIZER_EN_US,
};

const KOKORO_AF_SARAH: TextToSpeechModel = {
  ...KOKORO_STANDARD_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/af_sarah.bin`,
  phonemizerConfig: PHONEMIZER_EN_US,
};

const KOKORO_AM_ADAM: TextToSpeechModel = {
  ...KOKORO_STANDARD_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/am_adam.bin`,
  phonemizerConfig: PHONEMIZER_EN_US,
};

const KOKORO_AM_MICHAEL: TextToSpeechModel = {
  ...KOKORO_STANDARD_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/am_michael.bin`,
  phonemizerConfig: PHONEMIZER_EN_US,
};

const KOKORO_AM_SANTA: TextToSpeechModel = {
  ...KOKORO_STANDARD_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/am_santa.bin`,
  phonemizerConfig: PHONEMIZER_EN_US,
};

const KOKORO_BF_EMMA: TextToSpeechModel = {
  ...KOKORO_STANDARD_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/bf_emma.bin`,
  phonemizerConfig: PHONEMIZER_EN_GB,
};

const KOKORO_BM_DANIEL: TextToSpeechModel = {
  ...KOKORO_STANDARD_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/bm_daniel.bin`,
  phonemizerConfig: PHONEMIZER_EN_GB,
};

const KOKORO_FF_SIWIS: TextToSpeechModel = {
  ...KOKORO_STANDARD_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/ff_siwis.bin`,
  phonemizerConfig: PHONEMIZER_SIMPLE('fr', 'fr'),
};

const KOKORO_EF_DORA: TextToSpeechModel = {
  ...KOKORO_STANDARD_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/ef_dora.bin`,
  phonemizerConfig: PHONEMIZER_SIMPLE('es', 'es'),
};

const KOKORO_EM_ALEX: TextToSpeechModel = {
  ...KOKORO_STANDARD_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/em_alex.bin`,
  phonemizerConfig: PHONEMIZER_SIMPLE('es', 'es'),
};

const KOKORO_IF_SARA: TextToSpeechModel = {
  ...KOKORO_STANDARD_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/if_sara.bin`,
  phonemizerConfig: PHONEMIZER_SIMPLE('it', 'it'),
};

const KOKORO_IM_NICOLA: TextToSpeechModel = {
  ...KOKORO_STANDARD_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/im_nicola.bin`,
  phonemizerConfig: PHONEMIZER_SIMPLE('it', 'it'),
};

const KOKORO_PF_DORA: TextToSpeechModel = {
  ...KOKORO_STANDARD_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/pf_dora.bin`,
  phonemizerConfig: PHONEMIZER_SIMPLE('pt', 'pt'),
};

const KOKORO_PM_SANTA: TextToSpeechModel = {
  ...KOKORO_STANDARD_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/pm_santa.bin`,
  phonemizerConfig: PHONEMIZER_SIMPLE('pt', 'pt'),
};

const KOKORO_HF_ALPHA: TextToSpeechModel = {
  ...KOKORO_STANDARD_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/hf_alpha.bin`,
  phonemizerConfig: PHONEMIZER_SIMPLE('hi', 'hi'),
};

const KOKORO_HM_OMEGA: TextToSpeechModel = {
  ...KOKORO_STANDARD_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/hm_omega.bin`,
  phonemizerConfig: PHONEMIZER_SIMPLE('hi', 'hi'),
};

const KOKORO_HM_PSI: TextToSpeechModel = {
  ...KOKORO_STANDARD_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/hm_psi.bin`,
  phonemizerConfig: PHONEMIZER_SIMPLE('hi', 'hi'),
};

const KOKORO_PM_MATEUSZ: TextToSpeechModel = {
  ...KOKORO_POLISH_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/pm_mateusz.bin`,
  phonemizerConfig: PHONEMIZER_SIMPLE('pl', 'pl'),
};

const KOKORO_DF_ANNA: TextToSpeechModel = {
  ...KOKORO_GERMAN_SOURCES,
  voicePath: `${KOKORO_VOICE_PREFIX}/df_anna.bin`,
  phonemizerConfig: PHONEMIZER_SIMPLE('de', 'de'),
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
  classification: {
    EFFICIENTNET_V2_S: {
      ...EFFICIENTNET_V2_S_XNNPACK_INT8,
      XNNPACK_INT8: EFFICIENTNET_V2_S_XNNPACK_INT8,
      XNNPACK_FP32: EFFICIENTNET_V2_S_XNNPACK_FP32,
      COREML_FP16: EFFICIENTNET_V2_S_COREML_FP16,
    },
  },
  styleTransfer: {
    CANDY: {
      ...STYLE_TRANSFER_CANDY_XNNPACK_INT8,
      XNNPACK_FP32: STYLE_TRANSFER_CANDY_XNNPACK_FP32,
      XNNPACK_INT8: STYLE_TRANSFER_CANDY_XNNPACK_INT8,
      COREML_FP16: STYLE_TRANSFER_CANDY_COREML_FP16,
      COREML_FP32: STYLE_TRANSFER_CANDY_COREML_FP32,
    },
    MOSAIC: {
      ...STYLE_TRANSFER_MOSAIC_XNNPACK_INT8,
      XNNPACK_FP32: STYLE_TRANSFER_MOSAIC_XNNPACK_FP32,
      XNNPACK_INT8: STYLE_TRANSFER_MOSAIC_XNNPACK_INT8,
      COREML_FP16: STYLE_TRANSFER_MOSAIC_COREML_FP16,
      COREML_FP32: STYLE_TRANSFER_MOSAIC_COREML_FP32,
    },
    RAIN_PRINCESS: {
      ...STYLE_TRANSFER_RAIN_PRINCESS_XNNPACK_INT8,
      XNNPACK_FP32: STYLE_TRANSFER_RAIN_PRINCESS_XNNPACK_FP32,
      XNNPACK_INT8: STYLE_TRANSFER_RAIN_PRINCESS_XNNPACK_INT8,
      COREML_FP16: STYLE_TRANSFER_RAIN_PRINCESS_COREML_FP16,
      COREML_FP32: STYLE_TRANSFER_RAIN_PRINCESS_COREML_FP32,
    },
    UDNIE: {
      ...STYLE_TRANSFER_UDNIE_XNNPACK_INT8,
      XNNPACK_FP32: STYLE_TRANSFER_UDNIE_XNNPACK_FP32,
      XNNPACK_INT8: STYLE_TRANSFER_UDNIE_XNNPACK_INT8,
      COREML_FP16: STYLE_TRANSFER_UDNIE_COREML_FP16,
      COREML_FP32: STYLE_TRANSFER_UDNIE_COREML_FP32,
    },
  },
  semanticSegmentation: {
    SELFIE_SEGMENTATION: {
      ...SELFIE_SEGMENTATION_XNNPACK_FP32,
      XNNPACK_FP32: SELFIE_SEGMENTATION_XNNPACK_FP32,
    },
    LRASPP_MOBILENET_V3_LARGE: {
      ...LRASPP_MOBILENET_V3_LARGE_XNNPACK_INT8,
      XNNPACK_FP32: LRASPP_MOBILENET_V3_LARGE_XNNPACK_FP32,
      XNNPACK_INT8: LRASPP_MOBILENET_V3_LARGE_XNNPACK_INT8,
    },
    DEEPLAB_V3_RESNET50: {
      ...DEEPLAB_V3_RESNET50_XNNPACK_INT8,
      XNNPACK_FP32: DEEPLAB_V3_RESNET50_XNNPACK_FP32,
      XNNPACK_INT8: DEEPLAB_V3_RESNET50_XNNPACK_INT8,
    },
    DEEPLAB_V3_RESNET101: {
      ...DEEPLAB_V3_RESNET101_XNNPACK_INT8,
      XNNPACK_FP32: DEEPLAB_V3_RESNET101_XNNPACK_FP32,
      XNNPACK_INT8: DEEPLAB_V3_RESNET101_XNNPACK_INT8,
    },
    DEEPLAB_V3_MOBILENET_V3_LARGE: {
      ...DEEPLAB_V3_MOBILENET_V3_LARGE_XNNPACK_INT8,
      XNNPACK_FP32: DEEPLAB_V3_MOBILENET_V3_LARGE_XNNPACK_FP32,
      XNNPACK_INT8: DEEPLAB_V3_MOBILENET_V3_LARGE_XNNPACK_INT8,
    },
    FCN_RESNET50: {
      ...FCN_RESNET50_XNNPACK_INT8,
      XNNPACK_FP32: FCN_RESNET50_XNNPACK_FP32,
      XNNPACK_INT8: FCN_RESNET50_XNNPACK_INT8,
    },
    FCN_RESNET101: {
      ...FCN_RESNET101_XNNPACK_INT8,
      XNNPACK_FP32: FCN_RESNET101_XNNPACK_FP32,
      XNNPACK_INT8: FCN_RESNET101_XNNPACK_INT8,
    },
  },
  objectDetection: {
    SSDLITE320_MOBILENET_V3_LARGE: {
      ...SSDLITE320_MOBILENET_V3_LARGE_XNNPACK_FP32,
      XNNPACK_FP32: SSDLITE320_MOBILENET_V3_LARGE_XNNPACK_FP32,
      COREML_FP16: SSDLITE320_MOBILENET_V3_LARGE_COREML_FP16,
      COREML_FP32: SSDLITE320_MOBILENET_V3_LARGE_COREML_FP32,
    },
    RFDETR_NANO: {
      ...RFDETR_NANO_DETECTOR_XNNPACK_FP32,
      XNNPACK_FP32: RFDETR_NANO_DETECTOR_XNNPACK_FP32,
      COREML_INT8: RFDETR_NANO_DETECTOR_COREML_INT8,
    },
    YOLO26: {
      ...YOLO26_NANO_384_XNNPACK_FP32,
      NANO: {
        ...YOLO26_NANO_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_NANO_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_NANO_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_NANO_640_XNNPACK_FP32 },
      },
      SMALL: {
        ...YOLO26_SMALL_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_SMALL_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_SMALL_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_SMALL_640_XNNPACK_FP32 },
      },
      MEDIUM: {
        ...YOLO26_MEDIUM_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_MEDIUM_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_MEDIUM_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_MEDIUM_640_XNNPACK_FP32 },
      },
      LARGE: {
        ...YOLO26_LARGE_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_LARGE_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_LARGE_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_LARGE_640_XNNPACK_FP32 },
      },
      XLARGE: {
        ...YOLO26_XLARGE_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_XLARGE_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_XLARGE_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_XLARGE_640_XNNPACK_FP32 },
      },
    },
  },
  keypointDetection: {
    BLAZEFACE: {
      ...BLAZEFACE_XNNPACK_FP32,
      XNNPACK_FP32: BLAZEFACE_XNNPACK_FP32,
    },
    YOLO26_POSE: {
      ...YOLO26_POSE_384_XNNPACK_FP32,
      SIZE_384: { XNNPACK_FP32: YOLO26_POSE_384_XNNPACK_FP32 },
      SIZE_512: { XNNPACK_FP32: YOLO26_POSE_512_XNNPACK_FP32 },
      SIZE_640: { XNNPACK_FP32: YOLO26_POSE_640_XNNPACK_FP32 },
    },
    RFDETR_KEYPOINT: {
      ...RFDETR_KEYPOINT_XNNPACK_FP32,
      XNNPACK_FP32: RFDETR_KEYPOINT_XNNPACK_FP32,
      COREML_FP32: RFDETR_KEYPOINT_COREML_FP32,
      MLX_FP32: RFDETR_KEYPOINT_MLX_FP32,
    },
  },
  instanceSegmentation: {
    FASTSAM: {
      S: {
        ...FASTSAM_S_XNNPACK_FP32,
        XNNPACK_FP32: FASTSAM_S_XNNPACK_FP32,
        COREML_FP32: FASTSAM_S_COREML_FP32,
        COREML_FP16: FASTSAM_S_COREML_FP16,
      },
      X: {
        ...FASTSAM_X_XNNPACK_FP32,
        XNNPACK_FP32: FASTSAM_X_XNNPACK_FP32,
        COREML_FP32: FASTSAM_X_COREML_FP32,
        COREML_FP16: FASTSAM_X_COREML_FP16,
      },
    },
    RFDETR_NANO: {
      ...RFDETR_NANO_SEG_COREML_INT8,
      COREML_INT8: RFDETR_NANO_SEG_COREML_INT8,
      XNNPACK_FP32: RFDETR_NANO_SEG_XNNPACK_FP32,
    },
    YOLO26: {
      ...YOLO26_NANO_SEG_384_XNNPACK_FP32,
      NANO: {
        ...YOLO26_NANO_SEG_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_NANO_SEG_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_NANO_SEG_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_NANO_SEG_640_XNNPACK_FP32 },
      },
      SMALL: {
        ...YOLO26_SMALL_SEG_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_SMALL_SEG_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_SMALL_SEG_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_SMALL_SEG_640_XNNPACK_FP32 },
      },
      MEDIUM: {
        ...YOLO26_MEDIUM_SEG_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_MEDIUM_SEG_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_MEDIUM_SEG_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_MEDIUM_SEG_640_XNNPACK_FP32 },
      },
      LARGE: {
        ...YOLO26_LARGE_SEG_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_LARGE_SEG_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_LARGE_SEG_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_LARGE_SEG_640_XNNPACK_FP32 },
      },
      XLARGE: {
        ...YOLO26_XLARGE_SEG_384_XNNPACK_FP32,
        SIZE_384: { XNNPACK_FP32: YOLO26_XLARGE_SEG_384_XNNPACK_FP32 },
        SIZE_512: { XNNPACK_FP32: YOLO26_XLARGE_SEG_512_XNNPACK_FP32 },
        SIZE_640: { XNNPACK_FP32: YOLO26_XLARGE_SEG_640_XNNPACK_FP32 },
      },
    },
  },
  tokenizer: {
    ALL_MINILM_L6_V2: ALL_MINILM_L6_V2_TOKENIZER,
  },
  textToSpeech: {
    KOKORO: {
      AF_HEART: KOKORO_AF_HEART,
      AF_RIVER: KOKORO_AF_RIVER,
      AF_SARAH: KOKORO_AF_SARAH,
      AM_ADAM: KOKORO_AM_ADAM,
      AM_MICHAEL: KOKORO_AM_MICHAEL,
      AM_SANTA: KOKORO_AM_SANTA,
      BF_EMMA: KOKORO_BF_EMMA,
      BM_DANIEL: KOKORO_BM_DANIEL,
      FF_SIWIS: KOKORO_FF_SIWIS,
      EF_DORA: KOKORO_EF_DORA,
      EM_ALEX: KOKORO_EM_ALEX,
      IF_SARA: KOKORO_IF_SARA,
      IM_NICOLA: KOKORO_IM_NICOLA,
      PF_DORA: KOKORO_PF_DORA,
      PM_SANTA: KOKORO_PM_SANTA,
      HF_ALPHA: KOKORO_HF_ALPHA,
      HM_OMEGA: KOKORO_HM_OMEGA,
      HM_PSI: KOKORO_HM_PSI,
      PM_MATEUSZ: KOKORO_PM_MATEUSZ,
      DF_ANNA: KOKORO_DF_ANNA,
    }
  }
};
