---
title: Supported Models
slug: /fundamentals/supported-models
description: 'Every pre-exported model in the React Native ExecuTorch registry, by task: LLMs and VLMs, speech, computer vision, embeddings and retrieval, with backends and precisions.'
keywords:
  [
    react native executorch,
    supported models,
    on-device llm,
    whisper,
    yolo,
    depth anything,
    colbert,
    xnnpack,
    core ml,
    mlx,
    vulkan,
  ]
---

# Supported Models

Every model below ships pre-exported in the [`models`](./02-downloading-models.md) registry and downloads on first use. Backends: XNNPACK (CPU, iOS and Android), Core ML and MLX (iOS), Vulkan (Android GPU); `DEFAULT` picks the fastest one the device can run. Any other ExecuTorch `.pte` can be loaded too, see [Exporting Custom Models](../03-core-and-advanced/07-exporting-custom-models.md).

## LLMs & VLMs

[Guide](../02-extensions/natural-language/02-llm-chat-and-generation.md) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#llm-chat--text-generation)

Chat sessions stream tokens and support tool calling, a thinking-mode switch, Jinja chat templates, constrained sampling and image/audio inputs on multimodal models.

| Model                        | Description                                                                                                               | Backends             | Precisions        |
| :--------------------------- | :------------------------------------------------------------------------------------------------------------------------ | :------------------- | :---------------- |
| `models.llm.MINICPM5_2B`     | OpenBMB MiniCPM5 2B chat model with an 8K context window.                                                                 | XNNPACK, MLX         | 8da4w, int4       |
| `models.llm.LFM2_5_1_2B`     | Liquid AI LFM 2.5 1.2B general-purpose hybrid language model.                                                             | XNNPACK, MLX         | 8da4w, int4       |
| `models.llm.LFM2_5_2_6B`     | Liquid AI LFM 2.5 2.6B hybrid language model post-trained for instruction following and agentic workloads.                | XNNPACK, MLX         | 8da4w, int4       |
| `models.llm.LFM2_5_350M`     | Liquid AI LFM 2.5 350M ultra-compact hybrid language model.                                                               | XNNPACK, MLX         | 8da4w, int4       |
| `models.llm.LFM2_5_VL_450M`  | Liquid AI LFM 2.5 VL 450M lightweight multimodal vision-language model. Inputs: text, image.                              | XNNPACK, MLX, Vulkan | 8da4w, int4       |
| `models.llm.LFM2_5_VL_1_6B`  | Liquid AI LFM 2.5 VL 1.6B high-capacity vision-language model. Inputs: text, image.                                       | XNNPACK, MLX, Vulkan | int8, 8da4w, int4 |
| `models.llm.BIELIK_V3_1_5B`  | Bielik v3 1.5B bilingual Polish & English language model, developed by SpeakLeash.                                        | XNNPACK              | 8da4w             |
| `models.llm.LLAMA3_2_1B`     | Meta Llama 3.2 1B lightweight instruction-tuned multilingual model.                                                       | XNNPACK, MLX         | int4, spinquant   |
| `models.llm.LLAMA3_2_3B`     | Meta Llama 3.2 3B instruction-tuned multilingual language model.                                                          | XNNPACK, MLX         | int4, spinquant   |
| `models.llm.SMOLLM2_135M`    | Hugging Face SmolLM2 135M ultra-compact language model.                                                                   | XNNPACK, MLX         | int8, 8da8w       |
| `models.llm.SMOLLM2_360M`    | Hugging Face SmolLM2 360M compact instruction-tuned model.                                                                | XNNPACK, MLX         | int8, 8da8w       |
| `models.llm.SMOLLM2_1_7B`    | Hugging Face SmolLM2 1.7B language model trained on curated educational, synthetic, and web data.                         | XNNPACK, MLX         | int8, 8da8w       |
| `models.llm.HAMMER2_1_0_5B`  | Hammer 2.1 0.5B specialized function-calling model.                                                                       | XNNPACK, MLX         | 8da4w, int4       |
| `models.llm.HAMMER2_1_1_5B`  | Hammer 2.1 1.5B function-calling language model.                                                                          | XNNPACK, MLX         | 8da4w, int4       |
| `models.llm.HAMMER2_1_3B`    | Hammer 2.1 3B high-capacity function-calling model.                                                                       | XNNPACK, MLX         | 8da4w, int4       |
| `models.llm.PHI4_MINI`       | Microsoft Phi-4 Mini 3.8B high-density reasoning model.                                                                   | XNNPACK, MLX         | 8da4w, int4       |
| `models.llm.QWEN2_5_0_5B`    | Alibaba Qwen 2.5 0.5B ultra-lightweight multilingual model.                                                               | XNNPACK, MLX         | 8da4w, int4       |
| `models.llm.QWEN2_5_1_5B`    | Alibaba Qwen 2.5 1.5B multilingual instruction model.                                                                     | XNNPACK, MLX         | 8da4w, int4       |
| `models.llm.QWEN2_5_3B`      | Alibaba Qwen 2.5 3B high-capability multilingual model.                                                                   | XNNPACK, MLX         | 8da4w, int4       |
| `models.llm.QWEN3_0_6B`      | Alibaba Qwen 3 0.6B next-generation compact language model.                                                               | XNNPACK, MLX         | int8, 8da4w       |
| `models.llm.QWEN3_1_7B`      | Alibaba Qwen 3 1.7B next-generation multilingual language model.                                                          | XNNPACK, MLX         | 8da4w, int4       |
| `models.llm.QWEN3_4B`        | Alibaba Qwen 3 4B high-capacity generative model.                                                                         | XNNPACK, MLX         | 8da4w, int4       |
| `models.llm.GEMMA4_E2B`      | Google Gemma 4 E2B generative language model.                                                                             | XNNPACK, MLX, Vulkan | 8da4w, int4       |
| `models.llm.GEMMA4_OMNI_E2B` | Google Gemma 4 E2B multimodal (omni) language model supporting text, image, and audio inputs. Inputs: text, image, audio. | XNNPACK, MLX, Vulkan | 8da4w, int4       |

## Text Embeddings

[Guide](../02-extensions/natural-language/03-text-embeddings.md) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#text-embeddings)

| Model                                                         | Description                                                                                                                 | Backends                      | Precisions        |
| :------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------- | :---------------------------- | :---------------- |
| `models.textEmbeddings.ALL_MINILM_L6_V2`                      | Compact 384-dimensional sentence transformer mapping text to a dense vector space.                                          | XNNPACK, Core ML, Vulkan      | fp16, int8        |
| `models.textEmbeddings.ALL_MPNET_BASE_V2`                     | High-quality 768-dimensional sentence transformer model based on MPNet.                                                     | XNNPACK, Vulkan               | fp16, int8, 8da4w |
| `models.textEmbeddings.MULTI_QA_MINILM_L6_COS_V1`             | 384-dimensional sentence transformer fine-tuned specifically for semantic QA matching using cosine similarity.              | XNNPACK, Core ML, Vulkan      | fp16, int8        |
| `models.textEmbeddings.MULTI_QA_MPNET_BASE_DOT_V1`            | 768-dimensional sentence transformer fine-tuned specifically for question-answering matching using dot product distance.    | XNNPACK, Vulkan               | fp16, int8, 8da4w |
| `models.textEmbeddings.PARAPHRASE_MULTILINGUAL_MINILM_L12_V2` | 384-dimensional sentence transformer supporting 50+ languages for cross-lingual semantic similarity.                        | XNNPACK, Core ML, Vulkan      | fp16, int8, 8da4w |
| `models.textEmbeddings.DISTILUSE_BASE_MULTILINGUAL_CASED_V2`  | Multilingual sentence transformer supporting 50+ languages, based on distilled Universal Sentence Encoder (512-dim output). | XNNPACK, Core ML, MLX, Vulkan | fp16, int8, 8da4w |
| `models.textEmbeddings.CLIP_VIT_BASE_PATCH32_TEXT`            | CLIP text encoder (ViT-B/32) mapping text queries into a 512-dimensional joint text-image embedding space.                  | XNNPACK, Core ML, Vulkan      | fp16, int8        |
| `models.textEmbeddings.LFM2_5_EMBEDDING_350M`                 | Liquid AI LFM 2.5 350M parameter embedding model for asymmetric search and retrieval tasks.                                 | XNNPACK, MLX                  | 8da4w, int4       |

## ColBERT Retrieval

[Guide](../02-extensions/natural-language/06-colbert-retrieval.md) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#colbert-embeddings)

| Model                                          | Description                                                                                                                                           | Backends     | Precisions  |
| :--------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- | :----------- | :---------- |
| `models.colbertEmbeddings.LFM2_5_COLBERT_350M` | Liquid AI LFM 2.5 350M ColBERT model: 128-dimensional token vectors, multilingual (11 languages), 32-token queries and documents of up to 512 tokens. | XNNPACK, MLX | 8da4w, int4 |

## Privacy Filter (PII detection)

[Guide](../02-extensions/natural-language/04-privacy-filter.md) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#privacy-filter)

| Model                           | Description                                                                                   | Backends     | Precisions  |
| :------------------------------ | :-------------------------------------------------------------------------------------------- | :----------- | :---------- |
| `models.privacyFilter.OPENAI`   | OpenAI-style detector covering 8 common PII types (name, email, phone, address, and similar). | XNNPACK, MLX | 8da4w, int4 |
| `models.privacyFilter.NEMOTRON` | Nemotron-based detector covering 55 fine-grained PII types.                                   | XNNPACK, MLX | int8, 8da4w |

## Speech to Text

[Guide](../02-extensions/speech/03-speech-to-text.md) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#speech-to-text)

| Model                         | Description                                                                                                                                                 | Backends                      | Precisions       |
| :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------- | :--------------- |
| `models.speechToText.WHISPER` | OpenAI Whisper automatic speech recognition model family with integrated Voice Activity Detection. Variants: TINY, BASE, SMALL, EN.TINY, EN.BASE, EN.SMALL. | XNNPACK, Core ML, MLX, Vulkan | fp16, bf16, int8 |

## Text to Speech

[Guide](../02-extensions/speech/02-text-to-speech.md) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#text-to-speech)

| Model                            | Description                                                                                                         | Backends             | Precisions       |
| :------------------------------- | :------------------------------------------------------------------------------------------------------------------ | :------------------- | :--------------- |
| `models.textToSpeech.SUPERTONIC` | Supertonic 3 multilingual flow-matching Text-to-Speech model.                                                       | XNNPACK, MLX, Vulkan | fp32, fp16, int8 |
| `models.textToSpeech.KOKORO`     | Kokoro — a lightweight phoneme-driven Text-to-Speech model. Variants: EN_US, EN_GB, ES, FR, IT, PT, HI, PL, DE, ZH. | XNNPACK, Core ML     | fp32             |

## Voice Activity Detection

[Guide](../02-extensions/speech/04-voice-activity-detection.md) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#voice-activity-detection)

| Model                                    | Description                                                                  | Backends | Precisions |
| :--------------------------------------- | :--------------------------------------------------------------------------- | :------- | :--------- |
| `models.voiceActivityDetection.FSMN_VAD` | Feedforward Sequential Memory Network (FSMN) Voice Activity Detection model. | XNNPACK  | fp32       |

## Image Classification

[Guide](../02-extensions/computer-vision/02-image-classification.md) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#image-classification)

| Model                                     | Description                                                                                                        | Backends         | Precisions |
| :---------------------------------------- | :----------------------------------------------------------------------------------------------------------------- | :--------------- | :--------- |
| `models.classification.EFFICIENTNET_V2_S` | EfficientNetV2-S image classification model pre-trained on ImageNet-1k (1000 categories, see `IMAGENET1K_LABELS`). | XNNPACK, Core ML | fp16, int8 |

## Object Detection

[Guide](../02-extensions/computer-vision/03-object-detection.md) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#object-detection)

| Model                                                  | Description                                                                                                                                                                                   | Backends                 | Precisions |
| :----------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------- | :--------- |
| `models.objectDetection.SSDLITE320_MOBILENET_V3_LARGE` | SSDLite object detector with MobileNetV3-Large backbone trained on COCO (see `COCO_CLASSES`) at 320x320 resolution.                                                                           | XNNPACK, Core ML         | fp32, fp16 |
| `models.objectDetection.RFDETR_NANO`                   | RF-DETR (Roboflow Detection Transformer) Nano variant trained on COCO (see `COCO_CLASSES`).                                                                                                   | XNNPACK, Core ML, Vulkan | fp16, int8 |
| `models.objectDetection.YOLO26`                        | Ultralytics YOLO26 real-time object detection models trained on COCO (80 classes, see `COCO_CLASSES_YOLO`). Variants: NANO, SMALL, MEDIUM, LARGE, XLARGE (each SIZE_384, SIZE_512, SIZE_640). | XNNPACK, Core ML, Vulkan | fp16, int8 |

## Instance Segmentation

[Guide](../02-extensions/computer-vision/07-instance-segmentation.md) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#instance-segmentation)

| Model                                     | Description                                                                                                                                                                                              | Backends                 | Precisions |
| :---------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------- | :--------- |
| `models.instanceSegmentation.FASTSAM`     | Fast Segment Anything Model (FastSAM) for promptable or global object instance mask segmentation. Variants: S, X.                                                                                        | XNNPACK, Core ML, Vulkan | fp16, int8 |
| `models.instanceSegmentation.RFDETR_NANO` | RF-DETR (Roboflow Detection Transformer) Nano instance segmentation model predicting COCO class masks and bounding boxes (see `COCO_CLASSES`).                                                           | XNNPACK, Core ML, Vulkan | fp16, int8 |
| `models.instanceSegmentation.YOLO26`      | YOLO26 instance segmentation models predicting COCO class instance masks and bounding boxes (see `COCO_CLASSES_YOLO`). Variants: NANO, SMALL, MEDIUM, LARGE, XLARGE (each SIZE_384, SIZE_512, SIZE_640). | XNNPACK, Core ML, Vulkan | fp16, int8 |

## Semantic Segmentation

[Guide](../02-extensions/computer-vision/06-semantic-segmentation.md) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#semantic-segmentation)

| Model                                                       | Description                                                                                                                   | Backends         | Precisions |
| :---------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- | :--------------- | :--------- |
| `models.semanticSegmentation.SELFIE_SEGMENTATION`           | Lightweight portrait selfie segmentation model for real-time person vs background separation.                                 | XNNPACK, Core ML | fp32, fp16 |
| `models.semanticSegmentation.SELFIE_SEGMENTATION_LANDSCAPE` | MediaPipe Selfie Segmentation, landscape orientation.                                                                         | XNNPACK, Core ML | fp32, fp16 |
| `models.semanticSegmentation.LRASPP_MOBILENET_V3_LARGE`     | Lite R-ASPP semantic segmentation model with MobileNetV3-Large backbone (21 classes, see `PASCAL_VOC_LABELS`).                | XNNPACK, Core ML | fp16, int8 |
| `models.semanticSegmentation.DEEPLAB_V3_RESNET50`           | DeepLabV3 semantic segmentation model with ResNet-50 backbone (21 classes, see `PASCAL_VOC_LABELS`).                          | XNNPACK, Core ML | fp16, int8 |
| `models.semanticSegmentation.DEEPLAB_V3_RESNET101`          | DeepLabV3 semantic segmentation model with ResNet-101 backbone (21 classes, see `PASCAL_VOC_LABELS`).                         | XNNPACK, Core ML | fp16, int8 |
| `models.semanticSegmentation.DEEPLAB_V3_MOBILENET_V3_LARGE` | DeepLabV3 semantic segmentation model with MobileNetV3-Large backbone (21 classes, see `PASCAL_VOC_LABELS`).                  | XNNPACK, Core ML | fp16, int8 |
| `models.semanticSegmentation.FCN_RESNET50`                  | Fully Convolutional Network (FCN) semantic segmentation model with ResNet-50 backbone (21 classes, see `PASCAL_VOC_LABELS`).  | XNNPACK, Core ML | fp16, int8 |
| `models.semanticSegmentation.FCN_RESNET101`                 | Fully Convolutional Network (FCN) semantic segmentation model with ResNet-101 backbone (21 classes, see `PASCAL_VOC_LABELS`). | XNNPACK, Core ML | fp16, int8 |

## Pose & Keypoints

[Guide](../02-extensions/computer-vision/04-pose-and-keypoints.md) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#pose--keypoints)

| Model                                      | Description                                                                                                                                      | Backends                 | Precisions |
| :----------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------- | :--------- |
| `models.keypointDetection.BLAZEFACE`       | MediaPipe BlazeFace lightweight face detection and 6-point facial landmark locator (eyes, nose, mouth, ears, see `BLAZEFACE_LANDMARKS`).         | XNNPACK, Vulkan          | fp32, fp16 |
| `models.keypointDetection.FACEMESH`        | MediaPipe Face Mesh: a dense 468-point 3-D mesh (see `FACEMESH_LANDMARKS`) and a face-presence score, regressed from a 192x192 crop of one face. | XNNPACK, Core ML         | fp32, fp16 |
| `models.keypointDetection.YOLO26_POSE`     | YOLO26 human pose estimation model predicting 17 COCO body keypoints (see `COCO_LANDMARKS`). Variants: SIZE_384, SIZE_512, SIZE_640.             | XNNPACK, Core ML, Vulkan | fp16, int8 |
| `models.keypointDetection.RFDETR_KEYPOINT` | RF-DETR (Roboflow Detection Transformer) pose keypoint detector predicting 17 COCO body keypoints (see `COCO_LANDMARKS`).                        | XNNPACK, Core ML, Vulkan | fp16, int8 |

## Depth Estimation

[Guide](../02-extensions/computer-vision/12-depth-estimation.md) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#depth-estimation)

| Model                                            | Description                                                                | Backends                 | Precisions       |
| :----------------------------------------------- | :------------------------------------------------------------------------- | :----------------------- | :--------------- |
| `models.depthEstimation.DEPTH_ANYTHING_V2_SMALL` | Depth Anything V2 Small with a ViT-S/14 backbone.                          | XNNPACK, Core ML, Vulkan | fp32, fp16, int8 |
| `models.depthEstimation.DEPTH_ANYTHING_V3_SMALL` | Depth Anything 3 Small, exported for single-image relative depth.          | XNNPACK, Core ML, Vulkan | fp32, fp16, int8 |
| `models.depthEstimation.ZIPDEPTH_BASE`           | ZipDepth Base NPU with a 384 × 384 input for low-latency depth estimation. | XNNPACK, Core ML, Vulkan | fp32, fp16       |

## OCR

[Guide](../02-extensions/computer-vision/05-optical-character-recognition.md) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#ocr)

| Model               | Description                                                                            | Backends                 | Precisions |
| :------------------ | :------------------------------------------------------------------------------------- | :----------------------- | :--------- |
| `models.ocr.PADDLE` | PP-OCRv6 small — DBNet detector plus an SVTR recognizer, one model for every language. | XNNPACK, Core ML, Vulkan | fp16, int8 |

## Image Embeddings

[Guide](../02-extensions/computer-vision/09-image-embeddings.md) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#image-embeddings)

| Model                                          | Description                                                                                   | Backends                      | Precisions |
| :--------------------------------------------- | :-------------------------------------------------------------------------------------------- | :---------------------------- | :--------- |
| `models.imageEmbeddings.CLIP_VIT_BASE_PATCH32` | CLIP vision encoder (ViT-B/32) mapping images into a 512-dimensional shared text-image space. | XNNPACK, Core ML, MLX, Vulkan | fp16, int8 |

## Image Inpainting

[Guide](../02-extensions/computer-vision/11-image-inpainting.md) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#image-inpainting)

| Model                     | Description                                                                                                            | Backends                 | Precisions |
| :------------------------ | :--------------------------------------------------------------------------------------------------------------------- | :----------------------- | :--------- |
| `models.inpainting.MIGAN` | MI-GAN, a mobile inpainting GAN trained on Places2 (scenes) and FFHQ (faces). Variants: SIZE_512, SIZE_256, FACES_256. | XNNPACK, Core ML, Vulkan | fp16       |

## Text to Image

[Guide](../02-extensions/computer-vision/10-text-to-image.md) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#text-to-image)

| Model                                     | Description                                                                                                   | Backends                 | Precisions |
| :---------------------------------------- | :------------------------------------------------------------------------------------------------------------ | :----------------------- | :--------- |
| `models.textToImage.SDXS_512_DREAMSHAPER` | Ultra-fast SDXS (Stable Diffusion eXtreme Speed) 512x512 text-to-image generation model based on DreamShaper. | XNNPACK, Core ML, Vulkan | fp16, int8 |

## Style Transfer

[Guide](../02-extensions/computer-vision/08-style-transfer.md) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#style-transfer)

| Model                                | Description                                                                                   | Backends                 | Precisions |
| :----------------------------------- | :-------------------------------------------------------------------------------------------- | :----------------------- | :--------- |
| `models.styleTransfer.CANDY`         | Fast neural style transfer model generating a vibrant, artistic "Candy" style effect.         | XNNPACK, Core ML, Vulkan | fp16, int8 |
| `models.styleTransfer.MOSAIC`        | Fast neural style transfer model applying a classic tile mosaic artistic pattern.             | XNNPACK, Core ML, Vulkan | fp16, int8 |
| `models.styleTransfer.RAIN_PRINCESS` | Fast neural style transfer model applying a painterly "Rain Princess" oil painting aesthetic. | XNNPACK, Core ML, Vulkan | fp16, int8 |
| `models.styleTransfer.UDNIE`         | Fast neural style transfer model applying Francis Picabia's "Udnie" abstract art style.       | XNNPACK, Core ML, Vulkan | fp16, int8 |
