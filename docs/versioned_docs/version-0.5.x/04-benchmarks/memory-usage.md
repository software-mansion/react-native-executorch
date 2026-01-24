---
title: Memory Usage
---

:::info
All the below benchmarks were performed on iPhone 17 Pro (iOS) and OnePlus 12 (Android).
:::

## Classification

| Model             | Android (XNNPACK) [MB] | iOS (Core ML) [MB] |
| ----------------- | :--------------------: | :----------------: |
| EFFICIENTNET_V2_S |          230           |         87         |

## Object Detection

| Model                          | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ------------------------------ | :--------------------: | :----------------: |
| SSDLITE_320_MOBILENET_V3_LARGE |          164           |        132         |

## Style Transfer

| Model                        | Android (XNNPACK) [MB] | iOS (Core ML) [MB] |
| ---------------------------- | :--------------------: | :----------------: |
| STYLE_TRANSFER_CANDY         |          1200          |        380         |
| STYLE_TRANSFER_MOSAIC        |          1200          |        380         |
| STYLE_TRANSFER_UDNIE         |          1200          |        380         |
| STYLE_TRANSFER_RAIN_PRINCESS |          1200          |        380         |

## OCR

| Model                                                                                                  | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ------------------------------------------------------------------------------------------------------ | :--------------------: | :----------------: |
| Detector (CRAFT_800_QUANTIZED) + Recognizer (CRNN_512) + Recognizer (CRNN_256) + Recognizer (CRNN_128) |          1400          |        1320        |

## Vertical OCR

| Model                                                                                    | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ---------------------------------------------------------------------------------------- | :--------------------: | :----------------: |
| Detector (CRAFT_1280_QUANTIZED) + Detector (CRAFT_320_QUANTIZED) + Recognizer (CRNN_512) |          1540          |        1470        |
| Detector(CRAFT_1280_QUANTIZED) + Detector(CRAFT_320_QUANTIZED) + Recognizer (CRNN_64)    |          1070          |        1000        |

## LLMs

| Model                 | Android (XNNPACK) [GB] | iOS (XNNPACK) [GB] |
| --------------------- | :--------------------: | :----------------: |
| LLAMA3_2_1B           |          3.3           |        3.1         |
| LLAMA3_2_1B_SPINQUANT |          1.9           |        2.4         |
| LLAMA3_2_1B_QLORA     |          2.7           |        2.8         |
| LLAMA3_2_3B           |          7.1           |        7.3         |
| LLAMA3_2_3B_SPINQUANT |          3.7           |        3.8         |
| LLAMA3_2_3B_QLORA     |          3.9           |        4.0         |

## Speech to text

| Model        | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ------------ | :--------------------: | :----------------: |
| WHISPER_TINY |          410           |        375         |

## Text Embeddings

| Model                      | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| -------------------------- | :--------------------: | :----------------: |
| ALL_MINILM_L6_V2           |           95           |        110         |
| ALL_MPNET_BASE_V2          |          405           |        455         |
| MULTI_QA_MINILM_L6_COS_V1  |          120           |        140         |
| MULTI_QA_MPNET_BASE_DOT_V1 |          435           |        455         |
| CLIP_VIT_BASE_PATCH32_TEXT |          200           |        280         |

## Image Embeddings

| Model                       | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| --------------------------- | :--------------------: | :----------------: |
| CLIP_VIT_BASE_PATCH32_IMAGE |          350           |        340         |

## Image Segmentation

:::warning
Data presented in the following sections is based on inference with non-resized output. When resize is enabled, expect higher memory usage and inference time with higher resolutions.
:::

| Model                       | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| --------------------------- | ---------------------- | ------------------ |
| DEELABV3_RESNET50           | 930                    | 660                |
| CLIP_VIT_BASE_PATCH32_IMAGE | 345                    | 340                |

## Text to Image

| Model                 | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| --------------------- | ---------------------- | ------------------ |
| BK_SDM_TINY_VPRED_256 | 2400                   | 2400               |
| BK_SDM_TINY_VPRED     | 6210                   | 6050               |
