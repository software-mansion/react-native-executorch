---
title: Available models and loading models.
description: RN Executorch provides models for a variety of AI tasks - Image classification, Object detection, Style transfer, OCR, Image embeddings, Image segmentation, Text to image, LLMs, Text embeddings, Speech to text, Text to speech, and Voice activity detection. This reference lists all supported models and provides a quick reference on available ways of loading a model.
---

# Available models RN Executorch

It is generally recommended to use models provided by the authors of the library, which are available at [HuggingFace repository](https://huggingface.co/software-mansion/collections).

---

## LLMs (Large Language Models)

For a full list of available LLM models reference [HuggingFace LLMs collection](https://huggingface.co/collections/software-mansion/llm).

### LLAMA 3.2

- **LLAMA3_2_3B** - Llama 3.2 3B original (bf16)
- **LLAMA3_2_3B_QLORA** - Llama 3.2 3B with QLoRA quantization
- **LLAMA3_2_3B_SPINQUANT** - Llama 3.2 3B with SpinQuant
- **LLAMA3_2_1B** - Llama 3.2 1B original (bf16)
- **LLAMA3_2_1B_QLORA** - Llama 3.2 1B with QLoRA quantization
- **LLAMA3_2_1B_SPINQUANT** - Llama 3.2 1B with SpinQuant

[HuggingFace Llama 3.2 Model](https://huggingface.co/software-mansion/react-native-executorch-llama-3.2)

### QWEN 3

- **QWEN3_0_6B** - Qwen 3 0.6B original (bf16)
- **QWEN3_0_6B_QUANTIZED** - Qwen 3 0.6B quantized (8da4w)
- **QWEN3_1_7B** - Qwen 3 1.7B original (bf16)
- **QWEN3_1_7B_QUANTIZED** - Qwen 3 1.7B quantized (8da4w)
- **QWEN3_4B** - Qwen 3 4B original (bf16)
- **QWEN3_4B_QUANTIZED** - Qwen 3 4B quantized (8da4w)

[HuggingFace Qwen 3 Model](https://huggingface.co/software-mansion/react-native-executorch-qwen-3)

### HAMMER 2.1

- **HAMMER2_1_0_5B** - Hammer 2.1 0.5B original (bf16)
- **HAMMER2_1_0_5B_QUANTIZED** - Hammer 2.1 0.5B quantized (8da4w)
- **HAMMER2_1_1_5B** - Hammer 2.1 1.5B original (bf16)
- **HAMMER2_1_1_5B_QUANTIZED** - Hammer 2.1 1.5B quantized (8da4w)
- **HAMMER2_1_3B** - Hammer 2.1 3B original (bf16)
- **HAMMER2_1_3B_QUANTIZED** - Hammer 2.1 3B quantized (8da4w)

[HuggingFace Hammer 2.1 model](https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1)

### SMOLLM2

- **SMOLLM2_1_135M** - SmolLM2 135M original (bf16)
- **SMOLLM2_1_135M_QUANTIZED** - SmolLM2 135M quantized (8da4w)
- **SMOLLM2_1_360M** - SmolLM2 360M original (bf16)
- **SMOLLM2_1_360M_QUANTIZED** - SmolLM2 360M quantized (8da4w)
- **SMOLLM2_1_1_7B** - SmolLM2 1.7B original (bf16)
- **SMOLLM2_1_1_7B_QUANTIZED** - SmolLM2 1.7B quantized (8da4w)

[HuggingFace SmoLlm 2 model](https://huggingface.co/software-mansion/react-native-executorch-smolLm-2)

### QWEN 2.5

- **QWEN2_5_0_5B** - Qwen 2.5 0.5B original (bf16)
- **QWEN2_5_0_5B_QUANTIZED** - Qwen 2.5 0.5B quantized (8da4w)
- **QWEN2_5_1_5B** - Qwen 2.5 1.5B original (bf16)
- **QWEN2_5_1_5B_QUANTIZED** - Qwen 2.5 1.5B quantized (8da4w)
- **QWEN2_5_3B** - Qwen 2.5 3B original (bf16)
- **QWEN2_5_3B_QUANTIZED** - Qwen 2.5 3B quantized (8da4w)

[HuggingFace Qwen 2.5 Model](https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5)

### PHI 4

- **PHI_4_MINI_4B** - Phi 4 Mini 4B original (bf16)
- **PHI_4_MINI_4B_QUANTIZED** - Phi 4 Mini 4B quantized (8da4w)

[HuggingFace PHI 4 Mini Model](https://huggingface.co/software-mansion/react-native-executorch-phi-4-mini)

---

## Image classification

- **EFFICIENTNET_V2_S** - [EfficientNet V2 S](https://huggingface.co/software-mansion/react-native-executorch-efficientnet-v2-s) (CoreML for iOS, XNNPACK for Android)

For a list of all available Image Classification models reference [this Hugging Face collection](https://huggingface.co/collections/software-mansion/classification).

---

## Object detection

- **SSDLITE_320_MOBILENET_V3_LARGE** - [SSDLite 320 with MobileNet V3 Large](https://huggingface.co/software-mansion/react-native-executorch-ssdlite320-mobilenet-v3-large)

For a list of all available Object Detection models reference [this Hugging Face collection](https://huggingface.co/collections/software-mansion/object-detection).

---

## Style transfer

- **STYLE_TRANSFER_CANDY** - [Candy style](https://huggingface.co/software-mansion/react-native-executorch-style-transfer-candy)
- **STYLE_TRANSFER_MOSAIC** - [Mosaic style](https://huggingface.co/software-mansion/react-native-executorch-style-transfer-mosaic)
- **STYLE_TRANSFER_RAIN_PRINCESS** - [Rain Princess style](https://huggingface.co/software-mansion/react-native-executorch-style-transfer-rain-princess)
- **STYLE_TRANSFER_UDNIE** - [Udnie style](https://huggingface.co/software-mansion/react-native-executorch-style-transfer-udnie)

For a list of all available Style Transfer models reference [this Hugging Face collection](https://huggingface.co/collections/software-mansion/style-transfer).

---

## OCR

- **DETECTOR_CRAFT** - [CRAFT text detector](https://huggingface.co/software-mansion/react-native-executorch-detector-craft) - detects text regions in images
- **RECOGNIZER_CRNN_EN** - [CRNN text recognizer](https://huggingface.co/software-mansion/react-native-executorch-recognizer-crnn.en) - recognizes English text

For a list of all available OCR models reference [this Hugging Face collection](https://huggingface.co/collections/software-mansion/ocr).

---

## Image embeddings

- **CLIP_VIT_BASE_PATCH32_IMAGE** - [CLIP ViT Base Patch32](https://huggingface.co/software-mansion/react-native-executorch-clip-vit-base-patch32) for image embeddings

For a list of all available Image embeddings models reference [this Hugging Face collection](https://huggingface.co/collections/software-mansion/image-embeddings).

---

## Image segmentation

- **DEEPLAB_V3_RESNET50** - [DeepLab V3](https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3) with ResNet50 backbone

For a list of all available Image Segmentation models reference [this Hugging Face collection](https://huggingface.co/collections/software-mansion/image-segmentation).

---

## Text to image

- **BK_SDM_TINY_VPRED_256** - BK-SDM Tiny V-Pred (256x256 resolution)

For a list of all available Text to Image models reference [this Hugging Face collection](https://huggingface.co/collections/software-mansion/text-to-image).

---

## Text embeddings

- **ALL_MINILM_L6_V2** - [All-MiniLM-L6-v2](https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2) text embeddings
- **ALL_MPNET_BASE_V2** - [All-MPNet-Base-v2](https://huggingface.co/software-mansion/react-native-executorch-all-mpnet-base-v2) text embeddings
- **MULTI_QA_MINILM_L6_COS_V1** - [Multi-QA MiniLM-L6](https://huggingface.co/software-mansion/react-native-executorch-multi-qa-MiniLM-L6-cos-v1) cosine similarity
- **MULTI_QA_MPNET_BASE_DOT_V1** - Multi-QA MPNet Base dot product
- **CLIP_VIT_BASE_PATCH32_TEXT** - [CLIP ViT Base Patch32](https://huggingface.co/software-mansion/react-native-executorch-clip-vit-base-patch32) for text embeddings

For a list of all available Text embeddings models reference [this Hugging Face collection](https://huggingface.co/collections/software-mansion/text-embeddings).

---

## Speech to text

For a list of all available Speech to Text models reference [this Hugging Face collection](https://huggingface.co/collections/software-mansion/speech-to-text).

### Whisper Models (English only)

- **WHISPER_TINY_EN** - [Whisper Tiny](https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en)
- **WHISPER_TINY_EN_QUANTIZED** - [Whisper Tiny English-only (quantized)](https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny-quantized.en)
- **WHISPER_BASE_EN** - [Whisper Base](https://huggingface.co/software-mansion/react-native-executorch-whisper-base.en)
- **WHISPER_SMALL_EN** - [Whisper Small](https://huggingface.co/software-mansion/react-native-executorch-whisper-small.en)
- **WHISPER_MEDIUM_EN** - [Whisper Medium](https://huggingface.co/software-mansion/react-native-executorch-whisper-medium.en)

### Whisper Models (Multilingual)

- **WHISPER_TINY** - [Whisper Tiny multilingual](https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny)
- **WHISPER_BASE** - [Whisper Base multilingual](https://huggingface.co/software-mansion/react-native-executorch-whisper-base)
- **WHISPER_SMALL** - [Whisper Small multilingual](https://huggingface.co/software-mansion/react-native-executorch-whisper-small)
- **WHISPER_MEDIUM** - [Whisper Medium multilingual](https://huggingface.co/software-mansion/react-native-executorch-whisper-medium)

### Other models

- **MOONSHINE_TINY** - [Moonshine Tiny](https://huggingface.co/software-mansion/react-native-executorch-moonshine-tiny)

---

## Text to speech

- **KOKORO_SMALL** - [Kokoro TTS](https://huggingface.co/software-mansion/react-native-executorch-kokoro) - Text-to-Speech model
- **KOKORO_MEDIUM** - [Kokoro TTS](https://huggingface.co/software-mansion/react-native-executorch-kokoro) - Text-to-Speech model

For a list of all available Text to Speech models reference [this Hugging Face collection](https://huggingface.co/collections/software-mansion/text-to-speech).

---

## Voice activity detection

- **FSMN_VAD** - [FSMN Voice Activity Detection](https://huggingface.co/software-mansion/react-native-executorch-fsmn-vad)

For a list of all available VAD models reference [this Hugging Face collection](https://huggingface.co/collections/software-mansion/voice-activity-detection).

---

# Loading models

## Using predefined constants

**When to use:** This is the recommended approach for all models that have [exported constants in the library](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts). It provides type safety, automatic URL management, and ensures you're using the correct model configuration with all required files.

**Benefits:** No need to manually specify URLs, automatic updates when model versions change, and guaranteed compatibility with the library version you're using.

```typescript
import {
  useLLM,
  LLAMA3_2_1B,
  QWEN3_1_7B_QUANTIZED,
} from 'react-native-executorch';

const llama = useLLM(LLAMA3_2_1B);
const qwen = useLLM(QWEN3_1_7B_QUANTIZED);
```

---

## From React Native assets folder

**When to use:** Best for small models (< 512MB) that you want to bundle with your app for offline use from the first launch. This ensures the model is immediately available without any download, but increases your app's installation size.

**Trade-offs:** Larger app bundle size, but instant availability and guaranteed offline functionality. Good for demo apps or when your target users have limited internet connectivity.

```typescript
useExecutorchModule({
  modelSource: require('../assets/llama3_2.pte'),
});
```

---

## From remote URL

**When to use:** Ideal for large models (> 512MB) or when you want to keep your app's download size small. The model downloads on first use and is cached locally for subsequent uses. Perfect for production apps where initial app size matters.

**Trade-offs:** Requires internet connection on first use, longer initial loading time, but keeps your app bundle small and allows for easy model updates without app resubmission.

```typescript
useExecutorchModule({
  modelSource: 'https://.../llama3_2.pte',
});
```

---

## From local file system

**When to use:** When you want to give users full control over model management, allow custom model imports, or enable advanced users to use their own fine-tuned models. Also useful for development and testing with local model files.

**Trade-offs:** Requires implementing your own download/file management UI, but provides maximum flexibility and user control.

```typescript
useExecutorchModule({
  modelSource: 'file:///var/mobile/.../llama3_2.pte',
});
```

---

# References

- **Documentation:** https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models
- **HuggingFace Repository:** https://huggingface.co/software-mansion
- **Model Constants:** https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts
- **All Collections:** https://huggingface.co/software-mansion/collections
- **Model sizes reference:** https://docs.swmansion.com/react-native-executorch/docs/benchmarks/model-size
- **Model memory usage reference:**: https://docs.swmansion.com/react-native-executorch/docs/benchmarks/memory-usage
- **Model inference time benchmarks:** https://docs.swmansion.com/react-native-executorch/docs/benchmarks/inference-time
