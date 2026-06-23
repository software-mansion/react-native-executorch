import type { ClassifierModel } from './extensions/cv/tasks/classification';
import type { SemanticSegmentationModel } from './extensions/cv/tasks/semanticSegmentation';
import {
  IMAGENET_NORM,
  IMAGENET1K_LABELS,
  PASCAL_VOC_LABELS,
  type ImageNet1KLabel,
  type PascalVocLabel,
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
  tokenizer: {
    ALL_MINILM_L6_V2: ALL_MINILM_L6_V2_TOKENIZER,
  },
};
