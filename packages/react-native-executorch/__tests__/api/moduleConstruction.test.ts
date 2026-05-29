import { models } from '../../src/constants/modelRegistry';
import {
  ClassificationModule,
  ExecutorchModule,
  ImageEmbeddingsModule,
  InstanceSegmentationModule,
  LLMModule,
  OCRModule,
  ObjectDetectionModule,
  PoseEstimationModule,
  PrivacyFilterModule,
  ResourceFetcher,
  SemanticSegmentationModule,
  SpeechToTextModule,
  StyleTransferModule,
  TextEmbeddingsModule,
  TextToImageModule,
  TextToSpeechModule,
  TokenizerModule,
  VADModule,
  VerticalOCRModule,
} from '../../src';

// Stub adapter: every fetch resolves to a fixed fake path, regardless of how
// many sources are passed. Enough for factories that just thread the path
// into `global.loadXxx` (which is itself stubbed to resolve to `{}`).
function mockAdapter() {
  return {
    fetch: async (
      _onProgress: (p: number) => void,
      ...sources: unknown[]
    ): Promise<{ paths: string[]; wasDownloaded: boolean[] }> => ({
      paths: sources.map((_, i) => `/tmp/mock-source-${i}.pte`),
      wasDownloaded: sources.map(() => true),
    }),
    readAsString: async () => '{}',
  };
}

beforeAll(() => {
  ResourceFetcher.setAdapter(mockAdapter());
});

afterAll(() => {
  ResourceFetcher.resetAdapter();
});

// Each entry constructs a module via its primary factory using a sample
// config from the registry. The asserted contract is the same for all of
// them: the awaited result is a real instance of the module class and
// `delete()` is callable on it.
// Use `Function` for `ModuleClass` so classes with private constructors
// (Classification, ObjectDetection, …) are accepted. `instanceof` only needs
// a function with a `prototype`.
type Construction = {
  name: string;
  build: () => Promise<{ delete: () => void }>;

  ModuleClass: Function;
};

const constructions: Construction[] = [
  {
    name: 'ClassificationModule.fromModelName',
    ModuleClass: ClassificationModule,
    build: () =>
      ClassificationModule.fromModelName(
        models.classification.efficientnet_v2_s()
      ) as Promise<{ delete: () => void }>,
  },
  {
    name: 'ObjectDetectionModule.fromModelName',
    ModuleClass: ObjectDetectionModule,
    build: () =>
      ObjectDetectionModule.fromModelName(
        models.object_detection.rf_detr_nano()
      ) as Promise<{ delete: () => void }>,
  },
  {
    name: 'PoseEstimationModule.fromModelName',
    ModuleClass: PoseEstimationModule,
    build: () =>
      PoseEstimationModule.fromModelName(
        models.pose_estimation.yolo26n()
      ) as Promise<{ delete: () => void }>,
  },
  {
    name: 'SemanticSegmentationModule.fromModelName',
    ModuleClass: SemanticSegmentationModule,
    build: () =>
      SemanticSegmentationModule.fromModelName(
        models.semantic_segmentation.deeplab_v3_resnet50()
      ) as Promise<{ delete: () => void }>,
  },
  {
    name: 'InstanceSegmentationModule.fromModelName',
    ModuleClass: InstanceSegmentationModule,
    build: () =>
      InstanceSegmentationModule.fromModelName(
        models.instance_segmentation.yolo26n()
      ) as Promise<{ delete: () => void }>,
  },
  {
    name: 'StyleTransferModule.fromModelName',
    ModuleClass: StyleTransferModule,
    build: () =>
      StyleTransferModule.fromModelName(
        models.style_transfer.candy()
      ) as Promise<{ delete: () => void }>,
  },
  {
    name: 'ImageEmbeddingsModule.fromModelName',
    ModuleClass: ImageEmbeddingsModule,
    build: () =>
      ImageEmbeddingsModule.fromModelName(
        models.image_embedding.clip_vit_base_patch32_image()
      ) as Promise<{ delete: () => void }>,
  },
  {
    name: 'TextToImageModule.fromModelName',
    ModuleClass: TextToImageModule,
    build: () =>
      TextToImageModule.fromModelName(
        models.image_generation.bk_sdm_tiny_vpred_512()
      ) as Promise<{ delete: () => void }>,
  },
  {
    name: 'LLMModule.fromModelName',
    ModuleClass: LLMModule,
    build: () =>
      LLMModule.fromModelName(models.llm.qwen3_4b()) as Promise<{
        delete: () => void;
      }>,
  },
  {
    name: 'TextEmbeddingsModule.fromModelName',
    ModuleClass: TextEmbeddingsModule,
    build: () =>
      TextEmbeddingsModule.fromModelName(
        models.text_embedding.all_minilm_l6_v2()
      ) as Promise<{ delete: () => void }>,
  },
  {
    name: 'PrivacyFilterModule.fromModelName',
    ModuleClass: PrivacyFilterModule,
    build: () =>
      PrivacyFilterModule.fromModelName(
        models.privacy_filter.openai()
      ) as Promise<{ delete: () => void }>,
  },
  {
    name: 'VADModule.fromModelName',
    ModuleClass: VADModule,
    build: () =>
      VADModule.fromModelName(models.vad.fsmn_vad()) as Promise<{
        delete: () => void;
      }>,
  },
  {
    name: 'OCRModule.fromModelName',
    ModuleClass: OCRModule,
    build: () =>
      OCRModule.fromModelName(models.ocr.craft({ language: 'en' })) as Promise<{
        delete: () => void;
      }>,
  },
  {
    name: 'VerticalOCRModule.fromModelName',
    ModuleClass: VerticalOCRModule,
    build: () =>
      VerticalOCRModule.fromModelName(
        models.ocr.craft({ language: 'en' })
      ) as Promise<{ delete: () => void }>,
  },
  {
    name: 'SpeechToTextModule.fromModelName',
    ModuleClass: SpeechToTextModule,
    build: () =>
      SpeechToTextModule.fromModelName(
        models.speech_to_text.whisper_tiny_en()
      ) as Promise<{ delete: () => void }>,
  },
  {
    name: 'TextToSpeechModule.fromModelName',
    ModuleClass: TextToSpeechModule,
    build: () =>
      TextToSpeechModule.fromModelName(
        models.text_to_speech.kokoro.en_us.heart()
      ) as Promise<{ delete: () => void }>,
  },
  {
    name: 'TokenizerModule.fromModelName',
    ModuleClass: TokenizerModule,
    build: () =>
      TokenizerModule.fromModelName({
        tokenizerSource:
          models.text_embedding.all_minilm_l6_v2().tokenizerSource,
      }) as Promise<{ delete: () => void }>,
  },
  {
    name: 'ExecutorchModule.fromModelSource',
    ModuleClass: ExecutorchModule,
    build: () =>
      ExecutorchModule.fromModelSource(
        models.text_embedding.all_minilm_l6_v2().modelSource
      ) as Promise<{ delete: () => void }>,
  },
];

describe('Module construction (mocked native)', () => {
  it.each(constructions)(
    '$name yields an instance with a callable delete()',
    async ({ build, ModuleClass }) => {
      const instance = await build();
      expect(instance).toBeInstanceOf(ModuleClass);
      expect(typeof instance.delete).toBe('function');
      // Calling delete on the stubbed instance shouldn't throw — the stub
      // nativeModule is `{}` and BaseModule.delete is guarded against null
      // nativeModule but not against missing `unload`. Modules that rely on
      // `nativeModule.unload()` will throw here, which is itself signal.
      expect(() => instance.delete()).not.toThrow();
    }
  );
});
