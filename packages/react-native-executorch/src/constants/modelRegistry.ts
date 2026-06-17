import { Platform } from 'react-native';
import { isEmulatorSync } from 'react-native-device-info';
import * as M from './modelUrls';
import * as OCR from './ocr/models';
import { symbols } from './ocr/symbols';
import {
  KOKORO_AMERICAN_ENGLISH_FEMALE_HEART,
  KOKORO_AMERICAN_ENGLISH_FEMALE_RIVER,
  KOKORO_AMERICAN_ENGLISH_FEMALE_SARAH,
  KOKORO_AMERICAN_ENGLISH_MALE_ADAM,
  KOKORO_AMERICAN_ENGLISH_MALE_MICHAEL,
  KOKORO_AMERICAN_ENGLISH_MALE_SANTA,
  KOKORO_BRITISH_ENGLISH_FEMALE_EMMA,
  KOKORO_BRITISH_ENGLISH_MALE_DANIEL,
  KOKORO_FRENCH_FEMALE_SIWIS,
  KOKORO_SPANISH_FEMALE_DORA,
  KOKORO_SPANISH_MALE_ALEX,
  KOKORO_ITALIAN_FEMALE_SARA,
  KOKORO_ITALIAN_MALE_NICOLA,
  KOKORO_PORTUGUESE_FEMALE_DORA,
  KOKORO_PORTUGUESE_MALE_SANTA,
  KOKORO_HINDI_FEMALE_ALPHA,
  KOKORO_HINDI_MALE_OMEGA,
  KOKORO_HINDI_MALE_PSI,
  KOKORO_POLISH_MALE_MATEUSZ,
  KOKORO_GERMAN_FEMALE_ANNA,
} from './tts/voices';
import { TextToSpeechModelConfig } from '../types/tts';
import { RnExecutorchError } from '../errors/errorUtils';
import { RnExecutorchErrorCode } from '../errors/ErrorCodes';

/**
 * Backend options accepted by `models` accessors.
 *
 * The set of backends a particular model can be loaded with is encoded in
 * its accessor's call signature — e.g. `models.llm.llama3_2_3b` only accepts
 * `'xnnpack'`, while `models.object_detection.rf_detr_nano` accepts
 * `'xnnpack' | 'coreml'`. Passing a backend a model doesn't ship is a
 * compile-time error.
 * @category Utils
 */
export type Backend = 'xnnpack' | 'coreml' | 'vulkan' | 'qnn' | 'mlx';

/**
 * Options for a `models` accessor call.
 * @typeParam B - Subset of {@link Backend} that the accessor actually supports.
 * @category Utils
 */
export type ModelOpts<B extends Backend = Backend> = {
  /** Pick the non-quantized variant when `false`. Defaults to the quantized variant when one is published. */
  quant?: boolean;
  /** Explicit backend; defaults to the platform-preferred backend for the model. */
  backend?: B;
};

// Accessors are functions; calling with no opts returns the platform default.
type Accessor<C extends { modelName: string }, B extends Backend = Backend> = (
  opts?: ModelOpts<B>
) => C;

type BackendCell = {
  base?: { modelName: string };
  quant?: { modelName: string };
};
type AnyVariantMap = Partial<Record<Backend, BackendCell>>;
type PlatformDefaults<B extends Backend> = {
  ios?: B;
  android?: B;
  /** Fallback when no platform-specific default is set. */
  default?: B;
};

type CellConfig<T> = T extends { base?: infer D; quant?: infer Q }
  ? NonNullable<D> | NonNullable<Q>
  : never;
type ConfigOf<V> = Extract<
  { [K in keyof V]: CellConfig<V[K]> }[keyof V],
  { modelName: string }
>;
type BackendsOf<V> = Extract<keyof V, Backend>;

const PLATFORM_PREFERENCE: Partial<Record<typeof Platform.OS, Backend[]>> = {
  ios: ['coreml', 'mlx', 'xnnpack'],
  android: ['vulkan', 'qnn', 'xnnpack'],
};

function applySimulatorPolicy(
  backend: Backend,
  variants: AnyVariantMap,
  explicit: boolean
): Backend {
  if (backend !== 'mlx' || Platform.OS !== 'ios' || !isEmulatorSync()) {
    return backend;
  }
  if (!explicit && variants.xnnpack) return 'xnnpack';
  throw new RnExecutorchError(
    RnExecutorchErrorCode.InvalidConfig,
    'The MLX backend requires a physical iOS device and cannot run on the ' +
      'simulator.' +
      (variants.xnnpack
        ? " Pass `{ backend: 'xnnpack' }` (or omit `backend`) to run on the " +
          'simulator.'
        : ' This model ships no simulator-compatible backend.')
  );
}

function selectBackend(
  variants: AnyVariantMap,
  platformDefaults: PlatformDefaults<Backend> | undefined,
  requested: Backend | undefined
): Backend {
  if (requested) return requested;
  if (platformDefaults) {
    if (Platform.OS === 'ios' && platformDefaults.ios)
      return platformDefaults.ios;
    if (Platform.OS === 'android' && platformDefaults.android)
      return platformDefaults.android;
    if (platformDefaults.default) return platformDefaults.default;
  }
  // Implicit platform default: walk the platform's preference order (iOS:
  // coreml → mlx → xnnpack, Android: vulkan → qnn → xnnpack) and take the
  // first backend the model ships. Models can override via `platformDefaults`.
  const preference = PLATFORM_PREFERENCE[Platform.OS] ?? [];
  for (const b of preference) {
    if (variants[b]) return b;
  }
  // No backend the model ships can run on this platform.
  throw new RnExecutorchError(
    RnExecutorchErrorCode.InvalidConfig,
    `This model ships no backend compatible with ${Platform.OS}.`
  );
}

function resolveBackend(
  variants: AnyVariantMap,
  platformDefaults: PlatformDefaults<Backend> | undefined,
  requested: Backend | undefined
): Backend {
  const explicit = requested !== undefined;
  const backend = selectBackend(variants, platformDefaults, requested);
  return applySimulatorPolicy(backend, variants, explicit);
}

function resolveCell(cell: BackendCell, quant: boolean): { modelName: string } {
  // Fall back to the other slot when the requested precision is missing,
  // so single-precision backends still work either way.
  const primary = quant ? cell.quant : cell.base;
  const fallback = quant ? cell.base : cell.quant;
  const result = primary ?? fallback;
  if (!result) {
    throw new RnExecutorchError(
      RnExecutorchErrorCode.Internal,
      'Model variant cell has no config.'
    );
  }
  return result;
}

function resolveVariant(
  variants: AnyVariantMap,
  platformDefaults: PlatformDefaults<Backend> | undefined,
  opts: ModelOpts
): { modelName: string } {
  const backend = resolveBackend(variants, platformDefaults, opts.backend);
  const cell = variants[backend];
  if (!cell) {
    throw new RnExecutorchError(
      RnExecutorchErrorCode.InvalidConfig,
      `Backend '${backend}' is not available for this model.`
    );
  }
  return resolveCell(cell, opts.quant !== false);
}

// Build an Accessor from a per-backend variant map and an optional
// platform-default policy. The resulting accessor's `backend` parameter is
// typed to exactly the keys present in `variants`.
function variant<const V extends AnyVariantMap>(
  variants: V,
  platformDefaults?: PlatformDefaults<BackendsOf<V>>
): Accessor<ConfigOf<V>, BackendsOf<V>> {
  type C = ConfigOf<V>;
  type B = BackendsOf<V>;
  return (opts: ModelOpts<B> = {}) =>
    resolveVariant(variants, platformDefaults, opts) as C;
}

// Single-config accessor (xnnpack-only, no quantized variant).
function base<C extends { modelName: string }>(c: C) {
  return variant({ xnnpack: { base: c } });
}

// xnnpack-only accessor with a `base` / `quant` pair.
function pair<D extends { modelName: string }, Q extends { modelName: string }>(
  baseC: D,
  quantC: Q
) {
  return variant({ xnnpack: { base: baseC, quant: quantC } });
}

// TTS presets bundle model + voice + phonemizer in a single config; they
// don't share the `{ modelName: string }` shape of the rest of the registry,
// and have no quant/backend axis. Expose them as a plain `() => Config`
// accessor so the call style stays consistent (`models.text_to_speech.en_us.heart()`).
function tts<C extends TextToSpeechModelConfig>(c: C): () => C {
  return () => c;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-backend variant maps for models that ship more than one backend.
// ─────────────────────────────────────────────────────────────────────────────

const GEMMA4_E2B_VARIANTS = {
  mlx: {
    base: {
      modelName: 'gemma4-e2b' as const,
      modelSource: M.GEMMA4_E2B_MLX_MODEL,
      tokenizerSource: M.GEMMA4_E2B_TOKENIZER,
      tokenizerConfigSource: M.GEMMA4_E2B_TOKENIZER_CONFIG,
    },
  },
  xnnpack: {
    base: {
      modelName: 'gemma4-e2b' as const,
      modelSource: M.GEMMA4_E2B_XNNPACK_MODEL,
      tokenizerSource: M.GEMMA4_E2B_TOKENIZER,
      tokenizerConfigSource: M.GEMMA4_E2B_TOKENIZER_CONFIG,
    },
  },
  vulkan: {
    base: {
      modelName: 'gemma4-e2b' as const,
      modelSource: M.GEMMA4_E2B_VULKAN_MODEL,
      tokenizerSource: M.GEMMA4_E2B_TOKENIZER,
      tokenizerConfigSource: M.GEMMA4_E2B_TOKENIZER_CONFIG,
    },
  },
};

const GEMMA4_E2B_MM_CONFIG = {
  modelName: 'gemma4-e2b-multimodal' as const,
  tokenizerSource: M.GEMMA4_E2B_TOKENIZER,
  tokenizerConfigSource: M.GEMMA4_E2B_TOKENIZER_CONFIG,
  capabilities: ['vision', 'audio'] as const,
  audioConfig: {
    samplesPerBlock: 7680,
    tokensPerBlock: 12,
  },
};

const GEMMA4_E2B_MM_VARIANTS = {
  mlx: {
    base: { ...GEMMA4_E2B_MM_CONFIG, modelSource: M.GEMMA4_E2B_MLX_MM },
  },
  vulkan: {
    base: { ...GEMMA4_E2B_MM_CONFIG, modelSource: M.GEMMA4_E2B_VULKAN_MM },
  },
  xnnpack: {
    base: { ...GEMMA4_E2B_MM_CONFIG, modelSource: M.GEMMA4_E2B_XNNPACK_MM },
  },
};

const EFFICIENTNET_V2_S_VARIANTS = {
  xnnpack: {
    base: {
      modelName: 'efficientnet-v2-s' as const,
      modelSource: M.EFFICIENTNET_V2_S_XNNPACK_FP32_MODEL,
    },
    quant: {
      modelName: 'efficientnet-v2-s-quantized' as const,
      modelSource: M.EFFICIENTNET_V2_S_XNNPACK_INT8_MODEL,
    },
  },
  coreml: {
    base: {
      modelName: 'efficientnet-v2-s' as const,
      modelSource: M.EFFICIENTNET_V2_S_COREML_FP32_MODEL,
    },
    quant: {
      modelName: 'efficientnet-v2-s-quantized' as const,
      modelSource: M.EFFICIENTNET_V2_S_COREML_FP16_MODEL,
    },
  },
};

const SSDLITE_320_MOBILENET_V3_LARGE_VARIANTS = {
  xnnpack: {
    base: {
      modelName: 'ssdlite-320-mobilenet-v3-large' as const,
      modelSource: M.SSDLITE_320_MOBILENET_V3_LARGE_XNNPACK_FP32_MODEL,
    },
  },
  coreml: {
    base: {
      modelName: 'ssdlite-320-mobilenet-v3-large' as const,
      modelSource: M.SSDLITE_320_MOBILENET_V3_LARGE_COREML_FP16_MODEL,
    },
  },
};

const RF_DETR_NANO_VARIANTS = {
  xnnpack: {
    base: {
      modelName: 'rf-detr-nano' as const,
      modelSource: M.RF_DETR_NANO_XNNPACK_FP32_MODEL,
    },
  },
  coreml: {
    base: {
      modelName: 'rf-detr-nano' as const,
      modelSource: M.RF_DETR_NANO_COREML_INT8_MODEL,
    },
  },
};

const RF_DETR_NANO_SEG_VARIANTS = {
  xnnpack: {
    base: {
      modelName: 'rfdetr-nano-seg' as const,
      modelSource: M.RF_DETR_NANO_SEG_XNNPACK_FP32_MODEL,
    },
  },
  coreml: {
    base: {
      modelName: 'rfdetr-nano-seg' as const,
      modelSource: M.RF_DETR_NANO_SEG_COREML_INT8_MODEL,
    },
  },
};

// RF-DETR Keypoint (pose estimation) — BETA preview. Configs mirror the
// All three backends ship fp32
// (non-quantized); this entry may be re-exported under a different constant
// once more RF-DETR keypoint weights are released.
const RF_DETR_KEYPOINT_PREVIEW_VARIANTS = {
  xnnpack: {
    base: {
      modelName: 'rfdetr-keypoint-preview' as const,
      modelSource: M.RF_DETR_KEYPOINT_PREVIEW_XNNPACK_FP32_MODEL,
    },
  },
  coreml: {
    base: {
      modelName: 'rfdetr-keypoint-preview' as const,
      modelSource: M.RF_DETR_KEYPOINT_PREVIEW_COREML_FP32_MODEL,
    },
  },
  mlx: {
    base: {
      modelName: 'rfdetr-keypoint-preview' as const,
      modelSource: M.RF_DETR_KEYPOINT_PREVIEW_MLX_FP32_MODEL,
    },
  },
};

const FASTSAM_S_VARIANTS = {
  xnnpack: {
    base: {
      modelName: 'fastsam-s' as const,
      modelSource: M.FASTSAM_S_XNNPACK_FP32_MODEL,
    },
  },
  coreml: {
    base: {
      modelName: 'fastsam-s' as const,
      modelSource: M.FASTSAM_S_COREML_FP16_MODEL,
    },
  },
};

const FASTSAM_X_VARIANTS = {
  xnnpack: {
    base: {
      modelName: 'fastsam-x' as const,
      modelSource: M.FASTSAM_X_XNNPACK_FP32_MODEL,
    },
  },
  coreml: {
    base: {
      modelName: 'fastsam-x' as const,
      modelSource: M.FASTSAM_X_COREML_FP16_MODEL,
    },
  },
};

function styleTransferVariants<
  const Display extends string,
  const Slug extends string,
>(display: Display, slug: Slug) {
  const urls = M.styleTransferUrls(display, slug);
  return {
    xnnpack: {
      base: {
        modelName: `style-transfer-${display}`,
        modelSource: urls.xnnpackBase,
      } as {
        modelName: `style-transfer-${Display}`;
        modelSource: string;
      },
      quant: {
        modelName: `style-transfer-${display}-quantized`,
        modelSource: urls.xnnpackQuant,
      } as {
        modelName: `style-transfer-${Display}-quantized`;
        modelSource: string;
      },
    },
    coreml: {
      base: {
        modelName: `style-transfer-${display}`,
        modelSource: urls.coremlBase,
      } as {
        modelName: `style-transfer-${Display}`;
        modelSource: string;
      },
      quant: {
        modelName: `style-transfer-${display}-quantized`,
        modelSource: urls.coremlQuant,
      } as {
        modelName: `style-transfer-${Display}-quantized`;
        modelSource: string;
      },
    },
  };
}

const STYLE_TRANSFER_CANDY_VARIANTS = styleTransferVariants('candy', 'candy');
const STYLE_TRANSFER_MOSAIC_VARIANTS = styleTransferVariants(
  'mosaic',
  'mosaic'
);
const STYLE_TRANSFER_RAIN_PRINCESS_VARIANTS = styleTransferVariants(
  'rain-princess',
  'rain_princess'
);
const STYLE_TRANSFER_UDNIE_VARIANTS = styleTransferVariants('udnie', 'udnie');

function whisperVariants<const N extends string, const IsML extends boolean>(
  modelName: N,
  isMultilingual: IsML,
  xnnpackUrl: string,
  coremlUrl: string,
  tokenizerUrl: string
) {
  return {
    xnnpack: {
      base: {
        modelName,
        isMultilingual,
        modelSource: xnnpackUrl,
        tokenizerSource: tokenizerUrl,
      } as {
        modelName: N;
        isMultilingual: IsML;
        modelSource: string;
        tokenizerSource: string;
      },
    },
    coreml: {
      base: {
        modelName,
        isMultilingual,
        modelSource: coremlUrl,
        tokenizerSource: tokenizerUrl,
      } as {
        modelName: N;
        isMultilingual: IsML;
        modelSource: string;
        tokenizerSource: string;
      },
    },
  };
}

const WHISPER_TINY_EN_VARIANTS = whisperVariants(
  'whisper-tiny-en',
  false,
  M.WHISPER_TINY_EN_MODEL_XNNPACK,
  M.WHISPER_TINY_EN_MODEL_COREML,
  M.WHISPER_TINY_EN_TOKENIZER
);
const WHISPER_BASE_EN_VARIANTS = whisperVariants(
  'whisper-base-en',
  false,
  M.WHISPER_BASE_EN_MODEL_XNNPACK,
  M.WHISPER_BASE_EN_MODEL_COREML,
  M.WHISPER_BASE_EN_TOKENIZER
);
const WHISPER_SMALL_EN_VARIANTS = whisperVariants(
  'whisper-small-en',
  false,
  M.WHISPER_SMALL_EN_MODEL_XNNPACK,
  M.WHISPER_SMALL_EN_MODEL_COREML,
  M.WHISPER_SMALL_EN_TOKENIZER
);
const WHISPER_TINY_VARIANTS = whisperVariants(
  'whisper-tiny',
  true,
  M.WHISPER_TINY_MODEL_XNNPACK,
  M.WHISPER_TINY_MODEL_COREML,
  M.WHISPER_TINY_TOKENIZER
);
const WHISPER_BASE_VARIANTS = whisperVariants(
  'whisper-base',
  true,
  M.WHISPER_BASE_MODEL_XNNPACK,
  M.WHISPER_BASE_MODEL_COREML,
  M.WHISPER_BASE_TOKENIZER
);
const WHISPER_SMALL_VARIANTS = whisperVariants(
  'whisper-small',
  true,
  M.WHISPER_SMALL_MODEL_XNNPACK,
  M.WHISPER_SMALL_MODEL_COREML,
  M.WHISPER_SMALL_TOKENIZER
);

// ─────────────────────────────────────────────────────────────────────────────
// OCR — language-parameterized accessor.
//
// The OCR pipeline ships one CRAFT detector + per-alphabet CRNN recognizers,
// already paired up in `OCR_<LANGUAGE>` objects keyed by ISO language token
// (the `.language` field on each export). Build a runtime map from those
// exports so the user only needs to pass `{ language: 'en' }`.
// ─────────────────────────────────────────────────────────────────────────────

type OcrConfig = typeof OCR.OCR_ABAZA;
type SupportedLanguage = keyof typeof symbols;

const OCR_BY_LANGUAGE: Partial<Record<SupportedLanguage, OcrConfig>> = (() => {
  const map: Partial<Record<SupportedLanguage, OcrConfig>> = {};
  for (const value of Object.values(OCR) as OcrConfig[]) {
    if (value && typeof value === 'object' && 'language' in value) {
      map[value.language as SupportedLanguage] = value;
    }
  }
  return map;
})();

function craft({ language }: { language: SupportedLanguage }): OcrConfig {
  const cfg = OCR_BY_LANGUAGE[language];
  if (!cfg) {
    throw new RnExecutorchError(
      RnExecutorchErrorCode.LanguageNotSupported,
      `OCR is not published for language '${language}'. ` +
        `Supported: ${Object.keys(OCR_BY_LANGUAGE).sort().join(', ')}`
    );
  }
  return cfg;
}

/**
 * Typed model registry grouped by capability. Each entry is a function-only
 * accessor: call it (optionally with `{ quant, backend }`) to get the resolved
 * config. The `backend` parameter is typed to exactly the backends a given
 * model ships with — asking for a backend a model doesn't publish is a
 * compile-time error.
 * @example
 * ```ts
 * import { models } from 'react-native-executorch';
 *
 * // Platform default (CoreML on iOS, XNNPACK on Android for multi-backend models).
 * useObjectDetection({ model: models.object_detection.rf_detr_nano() });
 *
 * // Explicit backend.
 * useObjectDetection({
 *   model: models.object_detection.rf_detr_nano({ backend: 'xnnpack' }),
 * });
 *
 * // Non-quantized variant.
 * useLLM({ model: models.llm.llama3_2_3b({ quant: false }) });
 *
 * // OCR — language-parameterized.
 * useOcr({ model: models.ocr({ language: 'en' }) });
 * ```
 * @category Utils
 */
export const models = {
  llm: {
    llama3_2_1b: pair(M.LLAMA3_2_1B, M.LLAMA3_2_1B_SPINQUANT),
    llama3_2_3b: pair(M.LLAMA3_2_3B, M.LLAMA3_2_3B_SPINQUANT),
    qwen3_0_6b: pair(M.QWEN3_0_6B, M.QWEN3_0_6B_QUANTIZED),
    qwen3_1_7b: pair(M.QWEN3_1_7B, M.QWEN3_1_7B_QUANTIZED),
    qwen3_4b: pair(M.QWEN3_4B, M.QWEN3_4B_QUANTIZED),
    qwen3_5_0_8b: base(M.QWEN3_5_0_8B_QUANTIZED),
    qwen3_5_2b: base(M.QWEN3_5_2B_QUANTIZED),
    qwen2_5_0_5b: pair(M.QWEN2_5_0_5B, M.QWEN2_5_0_5B_QUANTIZED),
    qwen2_5_1_5b: pair(M.QWEN2_5_1_5B, M.QWEN2_5_1_5B_QUANTIZED),
    qwen2_5_3b: pair(M.QWEN2_5_3B, M.QWEN2_5_3B_QUANTIZED),
    hammer2_1_0_5b: pair(M.HAMMER2_1_0_5B, M.HAMMER2_1_0_5B_QUANTIZED),
    hammer2_1_1_5b: pair(M.HAMMER2_1_1_5B, M.HAMMER2_1_1_5B_QUANTIZED),
    hammer2_1_3b: pair(M.HAMMER2_1_3B, M.HAMMER2_1_3B_QUANTIZED),
    smollm2_1_135m: pair(M.SMOLLM2_1_135M, M.SMOLLM2_1_135M_QUANTIZED),
    smollm2_1_360m: pair(M.SMOLLM2_1_360M, M.SMOLLM2_1_360M_QUANTIZED),
    smollm2_1_1_7b: pair(M.SMOLLM2_1_1_7B, M.SMOLLM2_1_1_7B_QUANTIZED),
    phi_4_mini_4b: pair(M.PHI_4_MINI_4B, M.PHI_4_MINI_4B_QUANTIZED),
    lfm2_5_350m: pair(M.LFM2_5_350M, M.LFM2_5_350M_QUANTIZED),
    lfm2_5_1_2b_instruct: pair(
      M.LFM2_5_1_2B_INSTRUCT,
      M.LFM2_5_1_2B_INSTRUCT_QUANTIZED
    ),
    bielik_v3_0_1_5b: pair(M.BIELIK_V3_0_1_5B, M.BIELIK_V3_0_1_5B_QUANTIZED),
    gemma4_e2b: variant(GEMMA4_E2B_VARIANTS, {
      ios: 'mlx',
      android: 'vulkan',
    }),
    // Multimodal LLMs — same hook/module as plain LLMs, listed here so users
    // pick a model by capability ("LLM") rather than by modality.
    lfm2_5_vl_1_6b: base(M.LFM2_5_VL_1_6B_QUANTIZED),
    lfm2_5_vl_450m: base(M.LFM2_5_VL_450M_QUANTIZED),
    gemma4_e2b_multimodal: variant(GEMMA4_E2B_MM_VARIANTS, {
      ios: 'mlx',
      android: 'vulkan',
    }),
  },
  classification: {
    efficientnet_v2_s: variant(EFFICIENTNET_V2_S_VARIANTS),
  },
  privacy_filter: {
    openai: base(M.PRIVACY_FILTER_OPENAI),
    nemotron: base(M.PRIVACY_FILTER_NEMOTRON),
  },
  object_detection: {
    ssdlite_320_mobilenet_v3_large: variant(
      SSDLITE_320_MOBILENET_V3_LARGE_VARIANTS
    ),
    rf_detr_nano: variant(RF_DETR_NANO_VARIANTS),
    yolo26n: base(M.YOLO26N),
    yolo26s: base(M.YOLO26S),
    yolo26m: base(M.YOLO26M),
    yolo26l: base(M.YOLO26L),
    yolo26x: base(M.YOLO26X),
  },
  pose_estimation: {
    yolo26n: base(M.YOLO26N_POSE),
    // BETA preview — may be re-exported under a different constant once a
    // stable RF-DETR keypoint model ships.
    rfdetr_keypoint_preview: variant(RF_DETR_KEYPOINT_PREVIEW_VARIANTS),
  },
  semantic_segmentation: {
    deeplab_v3_resnet50: pair(
      M.DEEPLAB_V3_RESNET50,
      M.DEEPLAB_V3_RESNET50_QUANTIZED
    ),
    deeplab_v3_resnet101: pair(
      M.DEEPLAB_V3_RESNET101,
      M.DEEPLAB_V3_RESNET101_QUANTIZED
    ),
    deeplab_v3_mobilenet_v3_large: pair(
      M.DEEPLAB_V3_MOBILENET_V3_LARGE,
      M.DEEPLAB_V3_MOBILENET_V3_LARGE_QUANTIZED
    ),
    lraspp_mobilenet_v3_large: pair(
      M.LRASPP_MOBILENET_V3_LARGE,
      M.LRASPP_MOBILENET_V3_LARGE_QUANTIZED
    ),
    fcn_resnet50: pair(M.FCN_RESNET50, M.FCN_RESNET50_QUANTIZED),
    fcn_resnet101: pair(M.FCN_RESNET101, M.FCN_RESNET101_QUANTIZED),
    selfie_segmentation: base(M.SELFIE_SEGMENTATION),
  },
  instance_segmentation: {
    yolo26n: base(M.YOLO26N_SEG),
    yolo26s: base(M.YOLO26S_SEG),
    yolo26m: base(M.YOLO26M_SEG),
    yolo26l: base(M.YOLO26L_SEG),
    yolo26x: base(M.YOLO26X_SEG),
    rf_detr_nano: variant(RF_DETR_NANO_SEG_VARIANTS),
    fastsam_s: variant(FASTSAM_S_VARIANTS),
    fastsam_x: variant(FASTSAM_X_VARIANTS),
  },
  style_transfer: {
    candy: variant(STYLE_TRANSFER_CANDY_VARIANTS),
    mosaic: variant(STYLE_TRANSFER_MOSAIC_VARIANTS),
    rain_princess: variant(STYLE_TRANSFER_RAIN_PRINCESS_VARIANTS),
    udnie: variant(STYLE_TRANSFER_UDNIE_VARIANTS),
  },
  speech_to_text: {
    whisper_tiny_en: variant(WHISPER_TINY_EN_VARIANTS),
    whisper_base_en: variant(WHISPER_BASE_EN_VARIANTS),
    whisper_small_en: variant(WHISPER_SMALL_EN_VARIANTS),
    whisper_tiny: variant(WHISPER_TINY_VARIANTS),
    whisper_base: variant(WHISPER_BASE_VARIANTS),
    whisper_small: variant(WHISPER_SMALL_VARIANTS),
  },
  // Kokoro presets bundle model + voice + phonemizer per language. They go
  // through `useTextToSpeech` directly — pick one and pass it as the `model`.
  // Nested under the model family (`kokoro`) so a future TTS family can be
  // added without breaking call sites.
  text_to_speech: {
    kokoro: {
      en_us: {
        heart: tts(KOKORO_AMERICAN_ENGLISH_FEMALE_HEART),
        river: tts(KOKORO_AMERICAN_ENGLISH_FEMALE_RIVER),
        sarah: tts(KOKORO_AMERICAN_ENGLISH_FEMALE_SARAH),
        adam: tts(KOKORO_AMERICAN_ENGLISH_MALE_ADAM),
        michael: tts(KOKORO_AMERICAN_ENGLISH_MALE_MICHAEL),
        santa: tts(KOKORO_AMERICAN_ENGLISH_MALE_SANTA),
      },
      en_gb: {
        emma: tts(KOKORO_BRITISH_ENGLISH_FEMALE_EMMA),
        daniel: tts(KOKORO_BRITISH_ENGLISH_MALE_DANIEL),
      },
      fr: {
        siwis: tts(KOKORO_FRENCH_FEMALE_SIWIS),
      },
      es: {
        dora: tts(KOKORO_SPANISH_FEMALE_DORA),
        alex: tts(KOKORO_SPANISH_MALE_ALEX),
      },
      it: {
        sara: tts(KOKORO_ITALIAN_FEMALE_SARA),
        nicola: tts(KOKORO_ITALIAN_MALE_NICOLA),
      },
      pt: {
        dora: tts(KOKORO_PORTUGUESE_FEMALE_DORA),
        santa: tts(KOKORO_PORTUGUESE_MALE_SANTA),
      },
      hi: {
        alpha: tts(KOKORO_HINDI_FEMALE_ALPHA),
        omega: tts(KOKORO_HINDI_MALE_OMEGA),
        psi: tts(KOKORO_HINDI_MALE_PSI),
      },
      pl: {
        mateusz: tts(KOKORO_POLISH_MALE_MATEUSZ),
      },
      de: {
        anna: tts(KOKORO_GERMAN_FEMALE_ANNA),
      },
    },
  },
  text_embedding: {
    all_minilm_l6_v2: base(M.ALL_MINILM_L6_V2),
    all_mpnet_base_v2: base(M.ALL_MPNET_BASE_V2),
    multi_qa_minilm_l6_cos_v1: base(M.MULTI_QA_MINILM_L6_COS_V1),
    multi_qa_mpnet_base_dot_v1: base(M.MULTI_QA_MPNET_BASE_DOT_V1),
    distiluse_base_multilingual_cased_v2: base({
      modelName: 'distiluse-base-multilingual-cased-v2-8da4w' as const,
      modelSource: M.DISTILUSE_BASE_MULTILINGUAL_CASED_V2_8DA4W_MODEL,
      tokenizerSource: M.DISTILUSE_BASE_MULTILINGUAL_CASED_V2_TOKENIZER,
    }),
    paraphrase_multilingual_minilm_l12_v2: base(
      M.PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_QUANTIZED
    ),
    clip_vit_base_patch32_text: base(M.CLIP_VIT_BASE_PATCH32_TEXT),
  },
  image_embedding: {
    clip_vit_base_patch32_image: pair(
      M.CLIP_VIT_BASE_PATCH32_IMAGE,
      M.CLIP_VIT_BASE_PATCH32_IMAGE_QUANTIZED
    ),
  },
  image_generation: {
    bk_sdm_tiny_vpred_512: base(M.BK_SDM_TINY_VPRED_512),
    bk_sdm_tiny_vpred_256: base(M.BK_SDM_TINY_VPRED_256),
  },
  vad: {
    fsmn_vad: base(M.FSMN_VAD),
  },
  // Nested under the detector model (`craft`) so a future OCR pipeline
  // (e.g. an end-to-end TrOCR) can land as a sibling without breaking
  // existing call sites.
  ocr: { craft },
} as const;
