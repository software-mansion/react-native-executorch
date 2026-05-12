# Model Spec

This document defines how react-native-executorch publishes models on Hugging
Face and exposes them through the JS API. It is the contract between the
library, the HF repositories under
[`software-mansion`](https://huggingface.co/software-mansion), and downstream
apps. It resolves
[#431](https://github.com/software-mansion/react-native-executorch/issues/431)
(HF naming inconsistencies) and
[#612](https://github.com/software-mansion/react-native-executorch/issues/612)
(typed model registry) as one coordinated change.

## 1. Goals

- One naming convention across every `.pte` file on Hugging Face.
- One directory layout across every model repo.
- A machine-readable `config.json` per `(model, backend)` so consumers do not
  have to parse filenames or read code.
- A typed `MODEL_REGISTRY` accessor that lets users pick `(quant, backend)`
  without learning per-model constant names.

## 2. Hugging Face repo layout

Every model repository under `software-mansion/react-native-executorch-*`
follows the same shape:

```
react-native-executorch-<model>/
├── README.md
├── tokenizer.json              # optional, when the model has one
├── tokenizer_config.json       # optional, when the model has one
├── xnnpack/
│   ├── config.json
│   ├── <model>_<size>_xnnpack_<precision>.pte
│   └── <model>_<size>_xnnpack_<other_precision>.pte
├── coreml/
│   ├── config.json
│   ├── <model>_<size>_coreml_<precision>.pte
│   └── ...
└── <other_backend>/
    └── ...
```

Rules:

- One subdirectory per backend the model has been exported to (`xnnpack`,
  `coreml`, `vulkan`, `qnn`, ...).
- Tokenizer files (`tokenizer.json`, `tokenizer_config.json`) live at the
  repo root when shared across backends. A backend-specific tokenizer goes
  inside the backend directory.
- Each backend directory contains a `config.json` describing the variants
  inside it. See [§4](#4-configjson-schema).
- Repo names are not renamed in this migration. Repo-name cleanup is out of
  scope; only the contents are restructured. (See
  [§7](#7-execution-and-rollout).)

## 3. File naming convention

```
<model>_<size>_<backend>_<precision>.pte
```

Tokens are lowercase and joined with `_`. Dashes, dots, and mixed case are not
allowed inside any token.

| Token       | Examples                                                  | Notes                                                                  |
| ----------- | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| `model`     | `llama_3_2`, `qwen_2_5`, `whisper_tiny`, `yolo26`         | Dots/dashes in versions are flattened to `_`.                          |
| `size`      | `1b`, `3b`, `135m`, `n`, `s`, `m`, `l`, `x`               | Omit when the model has no size variants (e.g. `selfie_segmentation`). |
| `backend`   | `xnnpack`, `coreml`, `vulkan`, `qnn`                      | Matches the parent directory.                                          |
| `precision` | `bf16`, `fp16`, `fp32`, `int8`, `8da4w`, `spinquant`, ... | Drives quantization detection. See [§5](#5-quantization-detection).    |

Examples:

- `llama_3_2_3b_xnnpack_bf16.pte`
- `llama_3_2_3b_xnnpack_spinquant.pte`
- `qwen_2_5_0_5b_xnnpack_8da4w.pte`
- `yolo26_m_coreml_int8.pte`
- `selfie_segmentation_xnnpack_fp32.pte`

For multi-component models (image generation pipelines, encoder/decoder
pairs, vision-language models with separate vision/text towers), the
component name is inserted before `backend`:

```
<model>_<size>?_<component>_<backend>_<precision>.pte
```

Examples:

- `bk_sdm_tiny_text_encoder_xnnpack_fp32.pte`
- `bk_sdm_tiny_unet_xnnpack_fp32.pte`
- `clip_vit_base_patch32_image_xnnpack_fp32.pte`
- `clip_vit_base_patch32_text_xnnpack_fp32.pte`
- `whisper_tiny_encoder_xnnpack_fp32.pte`
- `whisper_tiny_decoder_xnnpack_fp32.pte`

## 4. `config.json` schema

One `config.json` per backend directory. Schema URL points at the central
`software-mansion/react-native-executorch-spec` HF repo.

```json
{
  "$schema": "https://huggingface.co/software-mansion/react-native-executorch-spec/resolve/main/config.schema.json",
  "model": "llama_3_2",
  "family": "llama",
  "size": "3b",
  "capabilities": ["text-generation"],
  "backend": "xnnpack",
  "license": "llama-3.2-community",
  "tokenizer": "../tokenizer.json",
  "tokenizer_config": "../tokenizer_config.json",
  "variants": [
    {
      "file": "llama_3_2_3b_xnnpack_bf16.pte",
      "precision": "bf16",
      "quantized": false,
      "default": true,
      "size_bytes": 6500000000,
      "methods": {
        "forward": {
          "inputs": [{ "name": "tokens", "shape": [1, -1], "dtype": "int64" }],
          "outputs": [
            { "name": "logits", "shape": [1, -1, 128256], "dtype": "float32" }
          ]
        }
      }
    },
    {
      "file": "llama_3_2_3b_xnnpack_spinquant.pte",
      "precision": "spinquant",
      "quantized": true,
      "default": false,
      "size_bytes": 2200000000,
      "methods": {
        "forward": {
          "inputs": [{ "name": "tokens", "shape": [1, -1], "dtype": "int64" }],
          "outputs": [
            { "name": "logits", "shape": [1, -1, 128256], "dtype": "float32" }
          ]
        }
      }
    }
  ]
}
```

Field reference:

| Field                   | Required | Notes                                                                                                                                                                                                                                                                                                                        |
| ----------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$schema`               | yes      | Pins consumers to a versioned schema.                                                                                                                                                                                                                                                                                        |
| `model`                 | yes      | Matches the `model` token used in filenames.                                                                                                                                                                                                                                                                                 |
| `family`                | yes      | Loose grouping (`llama`, `qwen`, `whisper`, `yolo`, `style_transfer`, ...).                                                                                                                                                                                                                                                  |
| `size`                  | no       | Omitted when the model has no size variants.                                                                                                                                                                                                                                                                                 |
| `capabilities`          | yes      | Drives `MODEL_REGISTRY` grouping. One of: `text-generation`, `vision`, `speech-to-text`, `classification`, `object-detection`, `semantic-segmentation`, `instance-segmentation`, `style-transfer`, `text-embedding`, `image-embedding`, `image-generation`, `voice-activity-detection`. Multi-valued for multi-modal models. |
| `backend`               | yes      | Matches parent directory.                                                                                                                                                                                                                                                                                                    |
| `license`               | yes      | SPDX identifier when available, otherwise model card slug.                                                                                                                                                                                                                                                                   |
| `tokenizer`             | no       | Relative path to `tokenizer.json` if the model uses one.                                                                                                                                                                                                                                                                     |
| `tokenizer_config`      | no       | Relative path to `tokenizer_config.json` if applicable.                                                                                                                                                                                                                                                                      |
| `variants`              | yes      | One entry per `.pte` in this directory.                                                                                                                                                                                                                                                                                      |
| `variants[].file`       | yes      | File name (relative to this `config.json`). `null` for multi-component variants (see below).                                                                                                                                                                                                                                 |
| `variants[].components` | no       | Multi-component variants list their files keyed by component (`encoder`, `decoder`, `unet`, ...).                                                                                                                                                                                                                            |
| `variants[].precision`  | yes      | One of the tokens from [§3](#3-file-naming-convention).                                                                                                                                                                                                                                                                      |
| `variants[].quantized`  | yes      | Explicit boolean. Derived from `precision`; written explicitly for consumer convenience.                                                                                                                                                                                                                                     |
| `variants[].default`    | yes      | Exactly one variant per `(quantized: true)` group and one per `(quantized: false)` group is `default: true`. Drives `quant: true` / `quant: false` resolution in `MODEL_REGISTRY`.                                                                                                                                           |
| `variants[].size_bytes` | no       | Total bytes on disk; helps UIs display download size.                                                                                                                                                                                                                                                                        |
| `variants[].methods`    | yes      | Per-method I/O. Names match the method names exported into the `.pte`.                                                                                                                                                                                                                                                       |

Multi-component variant example (BK-SDM):

```json
{
  "file": null,
  "components": {
    "scheduler": "../scheduler/scheduler_config.json",
    "tokenizer": "../tokenizer/tokenizer.json",
    "text_encoder": "bk_sdm_tiny_text_encoder_xnnpack_fp32.pte",
    "unet": "bk_sdm_tiny_unet_xnnpack_fp32.pte",
    "vae": "bk_sdm_tiny_vae_xnnpack_fp32.pte"
  },
  "precision": "fp32",
  "quantized": false,
  "default": true,
  "methods": { "...": "..." }
}
```

## 5. Quantization detection

A variant is quantized iff its `precision` token is in:

```
{ int8, 8da4w, 4w, a8w8, spinquant, qat_lora }
```

Float precisions (`fp32`, `fp16`, `bf16`) are non-quantized. New precision
tokens added in future variants must be classified in this list as part of
the same change.

Consumers should prefer reading `variants[].quantized` from `config.json`
over parsing filenames; the field is the authoritative answer.

## 6. JS API — `MODEL_REGISTRY`

The accessor is a callable Proxy that returns the default variant when
read as a plain object, and a chosen variant when called:

```ts
import { MODEL_REGISTRY } from 'react-native-executorch';

// Default (non-quantized on the platform's default backend)
const m1 = MODEL_REGISTRY.LLM.LLAMA3_2_3B;

// Default quantized variant
const m2 = MODEL_REGISTRY.LLM.LLAMA3_2_3B({ quant: true });

// Explicit backend
const m3 = MODEL_REGISTRY.LLM.LLAMA3_2_3B({ backend: 'xnnpack' });

// Both
const m4 = MODEL_REGISTRY.LLM.LLAMA3_2_3B({ quant: true, backend: 'xnnpack' });
```

Shape:

```ts
type ModelConfig = {
  modelName: string;
  modelSource: string;
  tokenizerSource?: string;
  tokenizerConfigSource?: string;
  // ...component-specific fields for multi-part models
};

type Backend = 'xnnpack' | 'coreml' | 'vulkan' | 'qnn';

type ModelOpts<B extends Backend = Backend> = {
  quant?: boolean;
  backend?: B;
};

type ModelAccessor<B extends Backend> = ModelConfig &
  ((opts?: ModelOpts<B>) => ModelConfig);

export const MODEL_REGISTRY: {
  LLM: Record<string, ModelAccessor<Backend>>;
  VLM: Record<string, ModelAccessor<Backend>>;
  CLASSIFICATION: Record<string, ModelAccessor<Backend>>;
  OBJECT_DETECTION: Record<string, ModelAccessor<Backend>>;
  SEMANTIC_SEGMENTATION: Record<string, ModelAccessor<Backend>>;
  INSTANCE_SEGMENTATION: Record<string, ModelAccessor<Backend>>;
  STYLE_TRANSFER: Record<string, ModelAccessor<Backend>>;
  SPEECH_TO_TEXT: Record<string, ModelAccessor<Backend>>;
  TEXT_EMBEDDING: Record<string, ModelAccessor<Backend>>;
  IMAGE_EMBEDDING: Record<string, ModelAccessor<Backend>>;
  IMAGE_GENERATION: Record<string, ModelAccessor<Backend>>;
  VAD: Record<string, ModelAccessor<Backend>>;
};
```

Each accessor's `backend` parameter is narrowed at the type level to the
backends actually published for that model — `LLAMA3_2_3B` only accepts
`'xnnpack'`, while `EFFICIENTNET_V2_S` accepts `'xnnpack' | 'coreml'`. The
flat per-model unions are generated from the spec at build time so the type
surface stays accurate without hand-curated tables.

The grouping keys (`LLM`, `VLM`, ...) come from `capabilities` in each
`config.json`. A model with `capabilities: ["vision", "text-generation"]`
appears under `VLM`.

### Backwards compatibility

Every previously-exported constant (`LLAMA3_2_3B`, `QWEN3_0_6B_QUANTIZED`,
...) remains exported as a `@deprecated` alias for the corresponding
`MODEL_REGISTRY` resolution for one minor release. They are removed in the
release after that.

Constants for variants that are not promoted into `MODEL_REGISTRY` (see
[§7.2](#72-variant-pruning)) are also kept as `@deprecated` aliases pointing
at their existing HF URLs at the `v0.8.0` tag, so apps that pin to them
continue working until they are removed.

## 7. Execution and rollout

The migration is staged so that the library and HF state move in lockstep.

### 7.1 New HF tag

All restructured content lands on each repo's `main` branch and is tagged
`v0.9.0`. The library bumps `VERSION_TAG` from `resolve/v0.8.0` to
`resolve/v0.9.0`. Existing `v0.8.0` URLs are not modified, so users on
older library versions are unaffected.

### 7.2 Variant pruning

Per [§4](#4-configjson-schema), each backend exposes at most one default
non-quantized variant and one default quantized variant. Files for
non-promoted variants stay on HF (under their existing paths) but are no
longer the registry's responsibility.

Concrete cases in this migration:

- **Llama 3.2 1B / 3B** — three variants today (`original`, `QLoRA`,
  `SpinQuant`). SpinQuant becomes the default quantized variant. QLoRA is
  removed from `MODEL_REGISTRY` and the `LLAMA3_2_*_QLORA` constants become
  `@deprecated` aliases pointing at their existing `v0.8.0` URLs. The
  QLoRA files themselves remain on HF.

### 7.3 Repo consolidation

Models currently split across a base repo and a `*-quantized` repo are
consolidated. Quantized files move into the base repo under the
appropriate backend directory.

Affected repos (orphaned after migration, **not deleted**):

- `react-native-executorch-style-transfer-candy-quantized`
- `react-native-executorch-style-transfer-mosaic-quantized`
- `react-native-executorch-style-transfer-rain-princess-quantized`
- `react-native-executorch-style-transfer-udnie-quantized`
- `react-native-executorch-whisper-tiny-quantized.en`
- `react-native-executorch-whisper-base-quantized.en`
- `react-native-executorch-whisper-small-quantized.en`

Old constants that referenced them stay as `@deprecated` aliases pointing
at the orphaned repos at `v0.8.0`.

### 7.4 Spec repo

A new HF repo `software-mansion/react-native-executorch-spec` hosts:

- `config.schema.json` — JSON Schema for [§4](#4-configjson-schema).
- `precisions.json` — authoritative quantized/non-quantized partition for
  precision tokens.
- `README.md` — explains the spec and links back to this document.

### 7.5 Tooling in this repo

Under `scripts/hf-migration/`:

- `mapping.yaml` — full `old_path → new_path` map across all 44 repos.
  Hand-reviewable, committed.
- `migrate.py` — applies the mapping via `huggingface_hub`. Supports
  `--dry-run`. Writes `config.json` for each backend dir.
- `gen_config.py` — builds `config.json` from a `.pte` file by
  introspecting method I/O.

### 7.6 PR sequence

1. **This PR (#TBD)** — `MODEL_SPEC.md`, draft. No code or HF changes.
2. **Spec repo PR** — bootstrap `software-mansion/react-native-executorch-spec`.
3. **Mapping + migration tooling PR** — add `scripts/hf-migration/` with
   dry-run output committed for review.
4. **HF migration run** — execute `migrate.py` against HF, tag `v0.9.0`
   on every repo. Done outside this repo's git history; tracked by a
   checklist in the issue.
5. **Library PR** — rewrite `modelUrls.ts`, add `MODEL_REGISTRY`
   accessor, bump `VERSION_TAG`, regenerate API docs, update
   `RELEASE.md`. Marks `@deprecated` aliases. Tested end-to-end against
   the new HF tag.

## 8. Out of scope

- Renaming the HF repos themselves. (`react-native-executorch-llama-3.2`
  stays — only its contents are restructured.)
- Cleaning up `docs/versioned_docs/version-*.x/` snapshots. Those pin to
  past releases and continue to reference the `v0.8.0` paths, which still
  resolve.
- Adding new model families. This is a structural migration only.
