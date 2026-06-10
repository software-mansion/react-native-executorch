import { models } from '../../src/constants/modelRegistry';
import type {
  ClassificationModelSources,
  ImageEmbeddingsProps,
  InstanceSegmentationModelSources,
  LLMProps,
  ObjectDetectionModelSources,
  OCRProps,
  PoseEstimationModelSources,
  PrivacyFilterProps,
  SemanticSegmentationModelSources,
  SpeechToTextProps,
  StyleTransferProps,
  TextEmbeddingsProps,
  TextToImageProps,
  TextToSpeechModelConfig,
  VADProps,
} from '../../src';

// Compile-time assertion: every registry accessor returns a config that is
// assignable to the corresponding hook's `model` prop type. If the registry
// drifts from the hook prop shape, tsc errors here naming the offending
// (accessor → prop) pair.
//
// One sample per category is enough — all accessors in a category go through
// the same `base`/`pair`/`variant` builders so their static return types are
// structurally identical. Add a row only when a new category lands.
//
// Generic hook props (ClassificationProps<C>, etc.) wrap a source-of-truth
// `XxxModelSources` type, and the props' `model` field is `C`. We assert
// against the unwrapped `XxxModelSources` directly so the generic constraint
// can't collapse to `never`.

function _assertRegistryAssignability() {
  // computer vision
  models.classification.efficientnet_v2_s() satisfies ClassificationModelSources;
  models.object_detection.rf_detr_nano() satisfies ObjectDetectionModelSources;
  models.pose_estimation.yolo26n() satisfies PoseEstimationModelSources;
  models.semantic_segmentation.deeplab_v3_resnet50() satisfies SemanticSegmentationModelSources;
  models.instance_segmentation.yolo26n() satisfies InstanceSegmentationModelSources;
  models.style_transfer.candy() satisfies StyleTransferProps['model'];
  models.image_embedding.clip_vit_base_patch32_image() satisfies ImageEmbeddingsProps['model'];
  models.image_generation.bk_sdm_tiny_vpred_512() satisfies TextToImageProps['model'];
  models.ocr.craft({ language: 'en' }) satisfies OCRProps['model'];

  // natural language processing
  models.llm.qwen3_4b() satisfies LLMProps['model'];
  models.privacy_filter.openai() satisfies PrivacyFilterProps['model'];
  models.speech_to_text.whisper_tiny_en() satisfies SpeechToTextProps['model'];
  models.text_embedding.all_minilm_l6_v2() satisfies TextEmbeddingsProps['model'];
  models.vad.fsmn_vad() satisfies VADProps['model'];

  // TTS leafs return a TextToSpeechModelConfig directly (no `model:` wrapper
  // — useTextToSpeech is the outlier that takes the config as a positional
  // arg, tracked in #1202).
  models.text_to_speech.kokoro.en_us.heart() satisfies TextToSpeechModelConfig;
}
// eslint-disable-next-line no-void
void _assertRegistryAssignability;

describe('Registry → hook prop compatibility', () => {
  it('every category sample is assignable to its hook prop (compile-time)', () => {
    // The real assertion is the `satisfies` clause above, checked by tsc.
    expect(typeof _assertRegistryAssignability).toBe('function');
  });
});
