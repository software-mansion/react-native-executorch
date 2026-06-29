import type { ClassifierModel } from './extensions/cv/tasks/classification';
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
};
