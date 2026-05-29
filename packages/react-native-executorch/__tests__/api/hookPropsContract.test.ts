import type {
  ClassificationProps,
  ExecutorchModuleProps,
  ImageEmbeddingsProps,
  InstanceSegmentationProps,
  LLMProps,
  ObjectDetectionProps,
  OCRProps,
  PoseEstimationProps,
  PrivacyFilterProps,
  SemanticSegmentationProps,
  SpeechToTextProps,
  StyleTransferProps,
  TextEmbeddingsProps,
  TextToImageProps,
  TokenizerProps,
  VADProps,
  VerticalOCRProps,
} from '../../src';
import type {
  useClassification,
  useExecutorchModule,
  useImageEmbeddings,
  useInstanceSegmentation,
  useLLM,
  useObjectDetection,
  useOCR,
  usePoseEstimation,
  usePrivacyFilter,
  useSemanticSegmentation,
  useSpeechToText,
  useStyleTransfer,
  useTextEmbeddings,
  useTextToImage,
  useTokenizer,
  useVAD,
  useVerticalOCR,
} from '../../src';
import { useTextToSpeech } from '../../src';

// ─────────────────────────────────────────────────────────────────────────────
// preventLoad presence on every *Props type. tsc errors on the `satisfies`
// clause if a Props type drops the field.
// ─────────────────────────────────────────────────────────────────────────────

type HasPreventLoad = { preventLoad?: boolean };

const PROPS_TYPES_WITH_PREVENT_LOAD = {
  ClassificationProps: null as unknown as ClassificationProps<never>,
  ExecutorchModuleProps: null as unknown as ExecutorchModuleProps,
  ImageEmbeddingsProps: null as unknown as ImageEmbeddingsProps,
  InstanceSegmentationProps:
    null as unknown as InstanceSegmentationProps<never>,
  LLMProps: null as unknown as LLMProps,
  ObjectDetectionProps: null as unknown as ObjectDetectionProps<never>,
  OCRProps: null as unknown as OCRProps,
  PoseEstimationProps: null as unknown as PoseEstimationProps<never>,
  PrivacyFilterProps: null as unknown as PrivacyFilterProps,
  SemanticSegmentationProps:
    null as unknown as SemanticSegmentationProps<never>,
  SpeechToTextProps: null as unknown as SpeechToTextProps,
  StyleTransferProps: null as unknown as StyleTransferProps,
  TextEmbeddingsProps: null as unknown as TextEmbeddingsProps,
  TextToImageProps: null as unknown as TextToImageProps,
  TokenizerProps: null as unknown as TokenizerProps,
  VADProps: null as unknown as VADProps,
  VerticalOCRProps: null as unknown as VerticalOCRProps,
} satisfies Record<string, HasPreventLoad>;

// ─────────────────────────────────────────────────────────────────────────────
// Hook call shape consistency. Every public `useXxx` is expected to take a
// single object argument, so the second positional parameter should resolve
// to `undefined` at the type level. `useTextToSpeech` is the lone outlier —
// it takes `(model, { preventLoad })` — and is documented as a known
// inconsistency until the API is normalized.
// ─────────────────────────────────────────────────────────────────────────────

type SecondParam<F> = F extends (...args: infer A) => unknown ? A[1] : never;

// `unknown` for the OK case, an error-bearing object literal otherwise. Used
// as the rhs of `as` so any non-OK type yields a tsc error.
type AssertSingleArg<F> =
  SecondParam<F> extends undefined
    ? unknown
    : {
        ERROR: 'hook should take a single object argument';
        actualSecondParam: SecondParam<F>;
      };

const _HOOKS_TAKE_SINGLE_ARG = {
  useClassification: undefined as AssertSingleArg<typeof useClassification>,
  useExecutorchModule: undefined as AssertSingleArg<typeof useExecutorchModule>,
  useImageEmbeddings: undefined as AssertSingleArg<typeof useImageEmbeddings>,
  useInstanceSegmentation: undefined as AssertSingleArg<
    typeof useInstanceSegmentation
  >,
  useLLM: undefined as AssertSingleArg<typeof useLLM>,
  useObjectDetection: undefined as AssertSingleArg<typeof useObjectDetection>,
  useOCR: undefined as AssertSingleArg<typeof useOCR>,
  usePoseEstimation: undefined as AssertSingleArg<typeof usePoseEstimation>,
  usePrivacyFilter: undefined as AssertSingleArg<typeof usePrivacyFilter>,
  useSemanticSegmentation: undefined as AssertSingleArg<
    typeof useSemanticSegmentation
  >,
  useSpeechToText: undefined as AssertSingleArg<typeof useSpeechToText>,
  useStyleTransfer: undefined as AssertSingleArg<typeof useStyleTransfer>,
  useTextEmbeddings: undefined as AssertSingleArg<typeof useTextEmbeddings>,
  useTextToImage: undefined as AssertSingleArg<typeof useTextToImage>,
  // useTextToSpeech: takes (model, { preventLoad? }) — outlier, see #1202.
  useTokenizer: undefined as AssertSingleArg<typeof useTokenizer>,
  useVAD: undefined as AssertSingleArg<typeof useVAD>,
  useVerticalOCR: undefined as AssertSingleArg<typeof useVerticalOCR>,
};

// Suppress noUnusedLocals — the type assertion *is* the test.
// eslint-disable-next-line no-void
void _HOOKS_TAKE_SINGLE_ARG;

describe('Hook props + signature contracts', () => {
  it('every *Props type carries preventLoad (compile-time)', () => {
    expect(Object.keys(PROPS_TYPES_WITH_PREVENT_LOAD).length).toBeGreaterThan(
      0
    );
  });

  it('useTextToSpeech is the single known multi-arg hook', () => {
    // Documented in #1202. The single-arg assertion above is opted-out for
    // this hook so the suite stays green; remove the opt-out once the API is
    // normalized.
    expect(typeof useTextToSpeech).toBe('function');
  });
});
