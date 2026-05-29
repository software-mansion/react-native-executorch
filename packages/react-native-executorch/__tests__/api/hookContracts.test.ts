import type { RnExecutorchError } from '../../src';
import type {
  useClassification,
  useImageEmbeddings,
  useInstanceSegmentation,
  useObjectDetection,
  useOCR,
  usePoseEstimation,
  useSemanticSegmentation,
  useStyleTransfer,
  useTextToImage,
  useVerticalOCR,
} from '../../src';
import type {
  useExecutorchModule,
  useLLM,
  usePrivacyFilter,
  useSpeechToText,
  useTextEmbeddings,
  useTextToSpeech,
  useTokenizer,
  useVAD,
} from '../../src';

// Every public `useXxx` hook is expected to expose at least this state shape.
// The contract is enforced at compile time via `satisfies` below — any hook
// whose return type drifts from this contract will fail `tsc -p
// tsconfig.test.json`, naming the offending hook in the error.
type HookBaseState = {
  error: RnExecutorchError | null;
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;
};

type HookReturn<T> = T extends (...args: never[]) => infer R ? R : never;

// Allocate a stub value of each hook's return type and assert the whole map
// satisfies `Record<string, HookBaseState>`. If a hook's return type does not
// include the base state, `tsc` errors at the `satisfies` clause and reports
// the failing entry.
const HOOK_RETURN_TYPES = {
  // computer vision
  useClassification: null as unknown as HookReturn<typeof useClassification>,
  useImageEmbeddings: null as unknown as HookReturn<typeof useImageEmbeddings>,
  useInstanceSegmentation: null as unknown as HookReturn<
    typeof useInstanceSegmentation
  >,
  useObjectDetection: null as unknown as HookReturn<typeof useObjectDetection>,
  useOCR: null as unknown as HookReturn<typeof useOCR>,
  usePoseEstimation: null as unknown as HookReturn<typeof usePoseEstimation>,
  useSemanticSegmentation: null as unknown as HookReturn<
    typeof useSemanticSegmentation
  >,
  useStyleTransfer: null as unknown as HookReturn<typeof useStyleTransfer>,
  useTextToImage: null as unknown as HookReturn<typeof useTextToImage>,
  useVerticalOCR: null as unknown as HookReturn<typeof useVerticalOCR>,
  // general
  useExecutorchModule: null as unknown as HookReturn<
    typeof useExecutorchModule
  >,
  // natural language processing
  useLLM: null as unknown as HookReturn<typeof useLLM>,
  usePrivacyFilter: null as unknown as HookReturn<typeof usePrivacyFilter>,
  useSpeechToText: null as unknown as HookReturn<typeof useSpeechToText>,
  useTextEmbeddings: null as unknown as HookReturn<typeof useTextEmbeddings>,
  useTextToSpeech: null as unknown as HookReturn<typeof useTextToSpeech>,
  useTokenizer: null as unknown as HookReturn<typeof useTokenizer>,
  useVAD: null as unknown as HookReturn<typeof useVAD>,
} satisfies Record<string, HookBaseState>;

describe('Hook return contracts', () => {
  it('every public hook return type satisfies HookBaseState (compile-time)', () => {
    // The real assertion is the `satisfies` clause above, checked by tsc.
    // This runtime test exists so the file appears in the Jest report and
    // so the symbol is referenced (preventing dead-code elimination
    // surprises and surfacing import-time regressions).
    expect(Object.keys(HOOK_RETURN_TYPES).length).toBeGreaterThan(0);
  });
});
