---
title: Model Registry
---

The Model Registry is a typed, grouped index of every model shipped with React Native ExecuTorch. It removes the need to memorize per-model constant names: pick a capability group, pick a model, and optionally opt out of quantization or override the backend.

```typescript
import { models } from 'react-native-executorch';

// Default (quantized when available, platform-default backend).
const llm = useLLM({ model: models.llm.llama3_2_3b() });

// Non-quantized variant.
const llmBase = useLLM({ model: models.llm.llama3_2_3b({ quant: false }) });
```

Each leaf is a **function**. Call it (optionally with `{ quant, backend }`) to get the resolved model config. Accessors are not readable as values — this avoids a class of React state pitfalls (`useState` lazy-init, `useMemo`/`useCallback` deps), and pickers can fall back to plain `===` reference equality on the returned config.

## Shape

`models` is grouped by capability. Each leaf is a callable accessor.

| Group                   | Examples                                                                                                                                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `llm`                   | `llama3_2_3b`, `qwen3_4b`, `smollm2_1_1_7b`, `phi_4_mini_4b`, `bielik_v3_0_1_5b`, `lfm2_5_1_2b_instruct`, `lfm2_5_vl_1_6b`, `lfm2_5_vl_450m`, …                                                                                                                                             |
| `classification`        | `efficientnet_v2_s`                                                                                                                                                                                                                                                                         |
| `privacy_filter`        | `openai`, `nemotron`                                                                                                                                                                                                                                                                        |
| `object_detection`      | `ssdlite_320_mobilenet_v3_large`, `yolo26n` … `yolo26x`, `rf_detr_nano`                                                                                                                                                                                                                     |
| `pose_estimation`       | `yolo26n`, `rfdetr_keypoint_preview` _(beta)_                                                                                                                                                                                                                                               |
| `semantic_segmentation` | `deeplab_v3_resnet50`, `lraspp_mobilenet_v3_large`, `fcn_resnet101`, `selfie_segmentation`, …                                                                                                                                                                                               |
| `instance_segmentation` | `yolo26n` … `yolo26x`, `rf_detr_nano`, `fastsam_s`, `fastsam_x`                                                                                                                                                                                                                             |
| `style_transfer`        | `candy`, `mosaic`, `rain_princess`, `udnie`                                                                                                                                                                                                                                                 |
| `speech_to_text`        | `whisper_tiny_en`, `whisper_base`, `whisper_small_en`, …                                                                                                                                                                                                                                    |
| `text_to_speech`        | nested by model family + language: `kokoro.en_us.{heart, river, sarah, adam, …}`, `kokoro.en_gb.{emma, daniel}`, `kokoro.fr.siwis`, `kokoro.es.{dora, alex}`, `kokoro.it.{sara, nicola}`, `kokoro.pt.{dora, santa}`, `kokoro.hi.{alpha, omega, psi}`, `kokoro.pl.mateusz`, `kokoro.de.anna` |
| `text_embedding`        | `all_minilm_l6_v2`, `all_mpnet_base_v2`, `clip_vit_base_patch32_text`, …                                                                                                                                                                                                                    |
| `image_embedding`       | `clip_vit_base_patch32_image`                                                                                                                                                                                                                                                               |
| `image_generation`      | `bk_sdm_tiny_vpred_256`, `bk_sdm_tiny_vpred_512`                                                                                                                                                                                                                                            |
| `vad`                   | `fsmn_vad`                                                                                                                                                                                                                                                                                  |
| `ocr`                   | nested by detector: `craft({ language: 'en' })` — see [§OCR](#ocr) below                                                                                                                                                                                                                    |

## Options

```typescript
type ModelOpts<B extends Backend = Backend> = {
  quant?: boolean; // Pick the non-quantized variant when false. Defaults to the quantized variant when one is published.
  backend?: B; // Explicit backend; the set of allowed values is per-model.
};
```

- `quant` defaults to the quantized variant for models that publish one (e.g. `llama3_2_3b` → SpinQuant, `efficientnet_v2_s` → int8). Pass `{ quant: false }` to get the full-precision variant. For models with a single variant, `quant` is accepted but has no effect.
- `backend` selects an explicit backend. The accessor's call signature is typed to exactly the backends the model ships with, so requesting one the model doesn't publish is a compile-time error (e.g. `models.llm.llama3_2_3b({ backend: 'coreml' })` does not type-check — Llama 3.2 is xnnpack-only). When `backend` is omitted, the platform-default applies: CoreML on iOS and XNNPACK on Android whenever the model ships that backend. Models that ship only one backend (e.g. xnnpack-only LLMs) use that one on both platforms.

## Usage patterns

### Default model

```typescript
import { models } from 'react-native-executorch';

const llm = useLLM({ model: models.llm.llama3_2_3b() });
const classifier = useClassification({
  model: models.classification.efficientnet_v2_s(),
});
const stt = useSpeechToText({
  model: models.speech_to_text.whisper_tiny_en(),
});
```

### Non-quantized variant

```typescript
const llm = useLLM({ model: models.llm.qwen3_4b({ quant: false }) });
const classifier = useClassification({
  model: models.classification.efficientnet_v2_s({ quant: false }),
});
```

### Explicit backend

```typescript
// Force XNNPACK on iOS (overrides the CoreML default).
const detector = useObjectDetection({
  model: models.object_detection.rf_detr_nano({ backend: 'xnnpack' }),
});

// Combine `quant` and `backend`.
const styled = useStyleTransfer({
  model: models.style_transfer.candy({ backend: 'coreml', quant: false }),
});
```

### Text-to-speech

`text_to_speech` is grouped by model family then by language code (`kokoro.en_us`, `kokoro.en_gb`, `kokoro.fr`, `kokoro.es`, `kokoro.it`, `kokoro.pt`, `kokoro.hi`, `kokoro.pl`, `kokoro.de`). Each leaf returns a complete Kokoro preset bundling the model, voice, and phonemizer — pass the whole result to `useTextToSpeech`. The `kokoro` level reserves room for a future TTS family without forcing a breaking rename.

```typescript
import { models, useTextToSpeech } from 'react-native-executorch';

const tts = useTextToSpeech(models.text_to_speech.kokoro.en_us.heart());
// Other languages:
//   models.text_to_speech.kokoro.en_gb.emma()
//   models.text_to_speech.kokoro.fr.siwis()
//   models.text_to_speech.kokoro.pl.mateusz()
```

### OCR

OCR is nested by detector family and parameterized by language. `craft` is the current pipeline (CRAFT detector + per-alphabet CRNN recognizer); future detectors land as siblings so the call site stays stable.

```typescript
const ocr = useOcr({
  model: models.ocr.craft({ language: 'en' }),
});
```

The `language` parameter is type-narrowed to supported tokens (`'en'`, `'es'`, `'ja'`, `'ko'`, …). See the OCR docs for the full list.

### Direct imports still work

Every model is also exported as a top-level constant. Either style is supported:

```typescript
import { LFM2_5_1_2B_INSTRUCT, models } from 'react-native-executorch';

useLLM({ model: LFM2_5_1_2B_INSTRUCT });
useLLM({ model: models.llm.lfm2_5_1_2b_instruct() });
```

## Migration from the previous registry

Earlier releases exposed `MODEL_REGISTRY` as a flat value-only registry (`MODEL_REGISTRY.ALL_MODELS.<NAME>`) and shipped each precision/quantization variant as its own top-level constant. That has been replaced with a function-only, capability-grouped, lowercase `models` export that takes `{ quant, backend }` opts.

```typescript
// Before — flat value-only registry, one constant per variant.
useLLM({ model: MODEL_REGISTRY.ALL_MODELS.LLAMA3_2_3B });
useLLM({ model: MODEL_REGISTRY.ALL_MODELS.LLAMA3_2_3B_SPINQUANT });

// After — callable accessor; pick the variant with opts.
useLLM({ model: models.llm.llama3_2_3b() }); // quantized by default
useLLM({ model: models.llm.llama3_2_3b({ quant: false }) }); // full precision
```

Individual constant imports (`LLAMA3_2_3B`, `WHISPER_TINY_EN`, …) are unchanged.
