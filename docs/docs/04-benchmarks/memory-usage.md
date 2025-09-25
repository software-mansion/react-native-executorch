---
title: Memory Usage
---

## Classification

| Model             | Android (XNNPACK) [MB] | iOS (Core ML) [MB] |
| ----------------- | :--------------------: | :----------------: |
| EFFICIENTNET_V2_S |          130           |         85         |

## Object Detection

| Model                          | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ------------------------------ | :--------------------: | :----------------: |
| SSDLITE_320_MOBILENET_V3_LARGE |           90           |         90         |

## Style Transfer

| Model                        | Android (XNNPACK) [MB] | iOS (Core ML) [MB] |
| ---------------------------- | :--------------------: | :----------------: |
| STYLE_TRANSFER_CANDY         |          950           |        350         |
| STYLE_TRANSFER_MOSAIC        |          950           |        350         |
| STYLE_TRANSFER_UDNIE         |          950           |        350         |
| STYLE_TRANSFER_RAIN_PRINCESS |          950           |        350         |

## OCR

| Model                                                                                        | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| -------------------------------------------------------------------------------------------- | :--------------------: | :----------------: |
| Detector (CRAFT_800) + Recognizer (CRNN_512) + Recognizer (CRNN_256) + Recognizer (CRNN_128) |          2100          |        1782        |

## Vertical OCR

| Model                                                                | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| -------------------------------------------------------------------- | :--------------------: | :----------------: |
| Detector (CRAFT_1280) + Detector (CRAFT_320) + Recognizer (CRNN_512) |          2770          |        3720        |
| Detector(CRAFT_1280) + Detector(CRAFT_320) + Recognizer (CRNN_64)    |          1770          |        2740        |

## LLMs

| Model                 | Android (XNNPACK) [GB] | iOS (XNNPACK) [GB] |
| --------------------- | :--------------------: | :----------------: |
| LLAMA3_2_1B           |          3.2           |        3.1         |
| LLAMA3_2_1B_SPINQUANT |          1.9           |         2          |
| LLAMA3_2_1B_QLORA     |          2.2           |        2.5         |
| LLAMA3_2_3B           |          7.1           |        7.3         |
| LLAMA3_2_3B_SPINQUANT |          3.7           |        3.8         |
| LLAMA3_2_3B_QLORA     |           4            |        4.1         |

## Speech to text

| Model        | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ------------ | :--------------------: | :----------------: |
| WHISPER_TINY |          900           |        600         |

## Text Embeddings

| Model                      | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| -------------------------- | :--------------------: | :----------------: |
| ALL_MINILM_L6_V2           |           85           |        100         |
| ALL_MPNET_BASE_V2          |          390           |        465         |
| MULTI_QA_MINILM_L6_COS_V1  |          115           |        130         |
| MULTI_QA_MPNET_BASE_DOT_V1 |          415           |        490         |
| CLIP_VIT_BASE_PATCH32_TEXT |          195           |        250         |

## Image Embeddings

| Model                       | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| --------------------------- | :--------------------: | :----------------: |
| CLIP_VIT_BASE_PATCH32_IMAGE |          350           |        340         |

## Image Segmentation

:::warning
Data presented in the following sections is based on inference with non-resized output. When resize is enabled, expect higher memory usage and inference time with higher resolutions.
:::

| Model             | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ----------------- | ---------------------- | ------------------ |
| DEELABV3_RESNET50 | 930                    | 660                |

## Text to image

| Model                 | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| --------------------- | ---------------------- | ------------------ |
| BK_SDM_TINY_VPRED_256 | 2900                   | 2800               |
| BK_SDM_TINY_VPRED     | 6700                   | 6560               |
