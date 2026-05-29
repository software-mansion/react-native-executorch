import type {
  ExecutorchModule,
  ExecutorchModuleType,
  ImageEmbeddingsModule,
  ImageEmbeddingsType,
  LLMModule,
  LLMType,
  StyleTransferModule,
  StyleTransferType,
  TextEmbeddingsModule,
  TextEmbeddingsType,
  TextToImageModule,
  TextToImageType,
  TokenizerModule,
  TokenizerType,
  VADModule,
  VADType,
} from '../../src';

// Compile-time alignment between every non-generic module's primary
// inference method(s) and the matching hook return type's method(s).
//
// The hook wrappers around each module are thin (`(...args) =>
// runForward((inst) => inst.method(...args))`), so a Hook → Module signature
// mismatch means the hook silently advertises a narrower or wider surface
// than the module actually supports. The assertions below run via tsc and
// flag any drift naming the (module, method) pair.
//
// Modules with class-level generics (Classification, ObjectDetection,
// PoseEstimation, Semantic/InstanceSegmentation, VerticalOCR) are left out
// of this file because their hook return shape and module prototype shape
// depend on per-call type parameters that don't survive `Parameters<>` /
// `ReturnType<>` extraction. Their alignment is exercised at runtime in
// moduleConstruction.test.ts.

type EqualParam<F, G> = Parameters<
  F extends (...a: never[]) => unknown ? F : never
>[0] extends Parameters<G extends (...a: never[]) => unknown ? G : never>[0]
  ? Parameters<
      G extends (...a: never[]) => unknown ? G : never
    >[0] extends Parameters<F extends (...a: never[]) => unknown ? F : never>[0]
    ? true
    : {
        ERROR: 'module accepts inputs the hook does not advertise';
        moduleParam: Parameters<
          F extends (...a: never[]) => unknown ? F : never
        >[0];
        hookParam: Parameters<
          G extends (...a: never[]) => unknown ? G : never
        >[0];
      }
  : {
      ERROR: 'hook accepts inputs the module does not';
      moduleParam: Parameters<
        F extends (...a: never[]) => unknown ? F : never
      >[0];
      hookParam: Parameters<
        G extends (...a: never[]) => unknown ? G : never
      >[0];
    };

type EqualReturn<F, G> =
  Awaited<
    ReturnType<F extends (...a: never[]) => unknown ? F : never>
  > extends Awaited<
    ReturnType<G extends (...a: never[]) => unknown ? G : never>
  >
    ? Awaited<
        ReturnType<G extends (...a: never[]) => unknown ? G : never>
      > extends Awaited<
        ReturnType<F extends (...a: never[]) => unknown ? F : never>
      >
      ? true
      : {
          ERROR: 'module returns more than the hook advertises';
        }
    : { ERROR: 'hook returns more than the module produces' };

// For each (module, method, hook field) row, both an input-shape and a
// return-shape equality is asserted. Any breakage shows up as the
// satisfies-clause failing with one of the labelled error types above.
const _ALIGNMENT = {
  // ExecutorchModule has no `forward` wrapper on its hook return — the hook
  // returns the instance's `forward` (Tensor I/O) directly.
  executorchModule_forward: {
    inputs: true as EqualParam<
      ExecutorchModule['forward'],
      ExecutorchModuleType['forward']
    >,
    returns: true as EqualReturn<
      ExecutorchModule['forward'],
      ExecutorchModuleType['forward']
    >,
  },
  imageEmbeddings_forward: {
    inputs: true as EqualParam<
      ImageEmbeddingsModule['forward'],
      ImageEmbeddingsType['forward']
    >,
    returns: true as EqualReturn<
      ImageEmbeddingsModule['forward'],
      ImageEmbeddingsType['forward']
    >,
  },
  // LLM's primary method is `generate` (not `forward`) because it is a
  // streaming autoregressive text-generation API — matching the HuggingFace
  // transformers / llama.cpp / OpenAI convention — rather than a single-pass
  // tensor I/O call. Both the module method and the hook return field are
  // named `generate` consistently, so the alignment check still holds.
  llm_generate: {
    inputs: true as EqualParam<LLMModule['generate'], LLMType['generate']>,
    returns: true as EqualReturn<LLMModule['generate'], LLMType['generate']>,
  },
  styleTransfer_forward: {
    inputs: true as EqualParam<
      StyleTransferModule['forward'],
      StyleTransferType['forward']
    >,
    returns: true as EqualReturn<
      StyleTransferModule['forward'],
      StyleTransferType['forward']
    >,
  },
  textEmbeddings_forward: {
    inputs: true as EqualParam<
      TextEmbeddingsModule['forward'],
      TextEmbeddingsType['forward']
    >,
    returns: true as EqualReturn<
      TextEmbeddingsModule['forward'],
      TextEmbeddingsType['forward']
    >,
  },
  textToImage_forward: {
    inputs: true as EqualParam<
      TextToImageModule['forward'],
      TextToImageType['forward']
    >,
    returns: true as EqualReturn<
      TextToImageModule['forward'],
      TextToImageType['forward']
    >,
  },
  tokenizer_encode: {
    inputs: true as EqualParam<
      TokenizerModule['encode'],
      TokenizerType['encode']
    >,
    returns: true as EqualReturn<
      TokenizerModule['encode'],
      TokenizerType['encode']
    >,
  },
  vad_forward: {
    inputs: true as EqualParam<VADModule['forward'], VADType['forward']>,
    returns: true as EqualReturn<VADModule['forward'], VADType['forward']>,
  },
};
// eslint-disable-next-line no-void
void _ALIGNMENT;

describe('Module ↔ hook signature alignment', () => {
  it('every checked module method aligns with its hook return field (compile-time)', () => {
    expect(typeof _ALIGNMENT).toBe('object');
  });
});
