---
title: Model Registry
---

The Model Registry is a collection of all pre-configured model definitions shipped with React Native ExecuTorch. Each entry contains the model's name and all source URLs needed to download and run it, so you don't have to manage URLs manually.

## Usage

```typescript
import { MODEL_REGISTRY, LLAMA3_2_1B } from 'react-native-executorch';
```

### Accessing a model directly

Every model config is exported as a standalone constant:

```typescript
import { LLAMA3_2_1B } from 'react-native-executorch';

const model = useExecutorchModule(LLAMA3_2_1B);
```

### Listing all models

Use `MODEL_REGISTRY` to discover and enumerate all available models:

```typescript
import { MODEL_REGISTRY } from 'react-native-executorch';

// Get all model names
const names = Object.values(MODEL_REGISTRY.ALL_MODELS).map((m) => m.modelName);

// Find models by name
const whisperModels = Object.values(MODEL_REGISTRY.ALL_MODELS).filter((m) =>
  m.modelName.includes('whisper')
);
```

## Model config shape

Each model config is a plain object with a `modelName` and one or more source URLs. The exact fields depend on the model type:

```typescript
// Simple model (classification, segmentation, etc.)
{
  modelName: 'efficientnet-v2-s',
  modelSource: 'https://...',
}

// LLM (requires tokenizer)
{
  modelName: 'llama-3.2-1b',
  modelSource: 'https://...',
  tokenizerSource: 'https://...',
  tokenizerConfigSource: 'https://...',
}

// Speech-to-text (includes multilingual flag)
{
  modelName: 'whisper-tiny',
  isMultilingual: true,
  modelSource: 'https://...',
  tokenizerSource: 'https://...',
}

// Image generation (multiple model components)
{
  modelName: 'bk-sdm-tiny-vpred-512',
  schedulerSource: 'https://...',
  tokenizerSource: 'https://...',
  encoderSource: 'https://...',
  unetSource: 'https://...',
  decoderSource: 'https://...',
}
```

## Available models

### Large Language Models (LLM)

| Constant                         | Model Name                     |
| -------------------------------- | ------------------------------ |
| `LLAMA3_2_3B`                    | llama-3.2-3b                   |
| `LLAMA3_2_3B_QLORA`              | llama-3.2-3b-qlora             |
| `LLAMA3_2_3B_SPINQUANT`          | llama-3.2-3b-spinquant         |
| `LLAMA3_2_1B`                    | llama-3.2-1b                   |
| `LLAMA3_2_1B_QLORA`              | llama-3.2-1b-qlora             |
| `LLAMA3_2_1B_SPINQUANT`          | llama-3.2-1b-spinquant         |
| `QWEN3_0_6B`                     | qwen3-0.6b                     |
| `QWEN3_0_6B_QUANTIZED`           | qwen3-0.6b-quantized           |
| `QWEN3_1_7B`                     | qwen3-1.7b                     |
| `QWEN3_1_7B_QUANTIZED`           | qwen3-1.7b-quantized           |
| `QWEN3_4B`                       | qwen3-4b                       |
| `QWEN3_4B_QUANTIZED`             | qwen3-4b-quantized             |
| `HAMMER2_1_0_5B`                 | hammer2.1-0.5b                 |
| `HAMMER2_1_0_5B_QUANTIZED`       | hammer2.1-0.5b-quantized       |
| `HAMMER2_1_1_5B`                 | hammer2.1-1.5b                 |
| `HAMMER2_1_1_5B_QUANTIZED`       | hammer2.1-1.5b-quantized       |
| `HAMMER2_1_3B`                   | hammer2.1-3b                   |
| `HAMMER2_1_3B_QUANTIZED`         | hammer2.1-3b-quantized         |
| `SMOLLM2_1_135M`                 | smollm2.1-135m                 |
| `SMOLLM2_1_135M_QUANTIZED`       | smollm2.1-135m-quantized       |
| `SMOLLM2_1_360M`                 | smollm2.1-360m                 |
| `SMOLLM2_1_360M_QUANTIZED`       | smollm2.1-360m-quantized       |
| `SMOLLM2_1_1_7B`                 | smollm2.1-1.7b                 |
| `SMOLLM2_1_1_7B_QUANTIZED`       | smollm2.1-1.7b-quantized       |
| `QWEN2_5_0_5B`                   | qwen2.5-0.5b                   |
| `QWEN2_5_0_5B_QUANTIZED`         | qwen2.5-0.5b-quantized         |
| `QWEN2_5_1_5B`                   | qwen2.5-1.5b                   |
| `QWEN2_5_1_5B_QUANTIZED`         | qwen2.5-1.5b-quantized         |
| `QWEN2_5_3B`                     | qwen2.5-3b                     |
| `QWEN2_5_3B_QUANTIZED`           | qwen2.5-3b-quantized           |
| `PHI_4_MINI_4B`                  | phi-4-mini-4b                  |
| `PHI_4_MINI_4B_QUANTIZED`        | phi-4-mini-4b-quantized        |
| `LFM2_5_1_2B_INSTRUCT`           | lfm2.5-1.2b-instruct           |
| `LFM2_5_1_2B_INSTRUCT_QUANTIZED` | lfm2.5-1.2b-instruct-quantized |

### Vision Language Models (VLM)

| Constant                 | Model Name               |
| ------------------------ | ------------------------ |
| `LFM2_VL_1_6B_QUANTIZED` | lfm2.5-vl-1.6b-quantized |

### Classification

| Constant                      | Model Name                  |
| ----------------------------- | --------------------------- |
| `EFFICIENTNET_V2_S`           | efficientnet-v2-s           |
| `EFFICIENTNET_V2_S_QUANTIZED` | efficientnet-v2-s-quantized |

### Object Detection

| Constant                         | Model Name                     |
| -------------------------------- | ------------------------------ |
| `SSDLITE_320_MOBILENET_V3_LARGE` | ssdlite-320-mobilenet-v3-large |
| `RF_DETR_NANO`                   | rf-detr-nano                   |

### Style Transfer

| Constant                                 | Model Name                             |
| ---------------------------------------- | -------------------------------------- |
| `STYLE_TRANSFER_CANDY`                   | style-transfer-candy                   |
| `STYLE_TRANSFER_CANDY_QUANTIZED`         | style-transfer-candy-quantized         |
| `STYLE_TRANSFER_MOSAIC`                  | style-transfer-mosaic                  |
| `STYLE_TRANSFER_MOSAIC_QUANTIZED`        | style-transfer-mosaic-quantized        |
| `STYLE_TRANSFER_RAIN_PRINCESS`           | style-transfer-rain-princess           |
| `STYLE_TRANSFER_RAIN_PRINCESS_QUANTIZED` | style-transfer-rain-princess-quantized |
| `STYLE_TRANSFER_UDNIE`                   | style-transfer-udnie                   |
| `STYLE_TRANSFER_UDNIE_QUANTIZED`         | style-transfer-udnie-quantized         |

### Speech to Text

| Constant                     | Model Name                 |
| ---------------------------- | -------------------------- |
| `WHISPER_TINY_EN`            | whisper-tiny-en            |
| `WHISPER_TINY_EN_QUANTIZED`  | whisper-tiny-en-quantized  |
| `WHISPER_BASE_EN`            | whisper-base-en            |
| `WHISPER_BASE_EN_QUANTIZED`  | whisper-base-en-quantized  |
| `WHISPER_SMALL_EN`           | whisper-small-en           |
| `WHISPER_SMALL_EN_QUANTIZED` | whisper-small-en-quantized |
| `WHISPER_TINY`               | whisper-tiny               |
| `WHISPER_BASE`               | whisper-base               |
| `WHISPER_SMALL`              | whisper-small              |

### Semantic Segmentation

| Constant                                  | Model Name                              |
| ----------------------------------------- | --------------------------------------- |
| `DEEPLAB_V3_RESNET50`                     | deeplab-v3-resnet50                     |
| `DEEPLAB_V3_RESNET101`                    | deeplab-v3-resnet101                    |
| `DEEPLAB_V3_MOBILENET_V3_LARGE`           | deeplab-v3-mobilenet-v3-large           |
| `LRASPP_MOBILENET_V3_LARGE`               | lraspp-mobilenet-v3-large               |
| `FCN_RESNET50`                            | fcn-resnet50                            |
| `FCN_RESNET101`                           | fcn-resnet101                           |
| `DEEPLAB_V3_RESNET50_QUANTIZED`           | deeplab-v3-resnet50-quantized           |
| `DEEPLAB_V3_RESNET101_QUANTIZED`          | deeplab-v3-resnet101-quantized          |
| `DEEPLAB_V3_MOBILENET_V3_LARGE_QUANTIZED` | deeplab-v3-mobilenet-v3-large-quantized |
| `LRASPP_MOBILENET_V3_LARGE_QUANTIZED`     | lraspp-mobilenet-v3-large-quantized     |
| `FCN_RESNET50_QUANTIZED`                  | fcn-resnet50-quantized                  |
| `FCN_RESNET101_QUANTIZED`                 | fcn-resnet101-quantized                 |
| `SELFIE_SEGMENTATION`                     | selfie-segmentation                     |

### Instance Segmentation

| Constant           | Model Name      |
| ------------------ | --------------- |
| `YOLO26N_SEG`      | yolo26n-seg     |
| `YOLO26S_SEG`      | yolo26s-seg     |
| `YOLO26M_SEG`      | yolo26m-seg     |
| `YOLO26L_SEG`      | yolo26l-seg     |
| `YOLO26X_SEG`      | yolo26x-seg     |
| `RF_DETR_NANO_SEG` | rfdetr-nano-seg |

### Image Embeddings

| Constant                                | Model Name                            |
| --------------------------------------- | ------------------------------------- |
| `CLIP_VIT_BASE_PATCH32_IMAGE`           | clip-vit-base-patch32-image           |
| `CLIP_VIT_BASE_PATCH32_IMAGE_QUANTIZED` | clip-vit-base-patch32-image-quantized |

### Text Embeddings

| Constant                     | Model Name                 |
| ---------------------------- | -------------------------- |
| `ALL_MINILM_L6_V2`           | all-minilm-l6-v2           |
| `ALL_MPNET_BASE_V2`          | all-mpnet-base-v2          |
| `MULTI_QA_MINILM_L6_COS_V1`  | multi-qa-minilm-l6-cos-v1  |
| `MULTI_QA_MPNET_BASE_DOT_V1` | multi-qa-mpnet-base-dot-v1 |
| `CLIP_VIT_BASE_PATCH32_TEXT` | clip-vit-base-patch32-text |

### Image Generation

| Constant                | Model Name            |
| ----------------------- | --------------------- |
| `BK_SDM_TINY_VPRED_512` | bk-sdm-tiny-vpred-512 |
| `BK_SDM_TINY_VPRED_256` | bk-sdm-tiny-vpred-256 |

### Voice Activity Detection

| Constant   | Model Name |
| ---------- | ---------- |
| `FSMN_VAD` | fsmn-vad   |
