---
title: Model Size
---

## Classification

| Model             | XNNPACK [MB] | Core ML [MB] |
| ----------------- | :----------: | :----------: |
| EFFICIENTNET_V2_S |     85.6     |     43.9     |

## Object Detection

| Model                          | XNNPACK [MB] |
| ------------------------------ | :----------: |
| SSDLITE_320_MOBILENET_V3_LARGE |     13.9     |

## Style Transfer

| Model                        | XNNPACK [MB] | Core ML [MB] |
| ---------------------------- | :----------: | :----------: |
| STYLE_TRANSFER_CANDY         |     6.78     |     5.22     |
| STYLE_TRANSFER_MOSAIC        |     6.78     |     5.22     |
| STYLE_TRANSFER_UDNIE         |     6.78     |     5.22     |
| STYLE_TRANSFER_RAIN_PRINCESS |     6.78     |     5.22     |

## OCR

| Model                      | XNNPACK [MB]  |
| -------------------------- | :-----------: |
| Detector (CRAFT_QUANTIZED) |     20.9      |
| Recognizer (CRNN)          | 18.5 - 25.2\* |

\* - The model weights vary depending on the language.

## Vertical OCR

| Model                      | XNNPACK [MB]  |
| -------------------------- | :-----------: |
| Detector (CRAFT_QUANTIZED) |     20.9      |
| Recognizer (CRNN)          | 18.5 - 25.2\* |

\* - The model weights vary depending on the language.

## LLMs

| Model                 | XNNPACK [GB] |
| --------------------- | :----------: |
| LLAMA3_2_1B           |     2.47     |
| LLAMA3_2_1B_SPINQUANT |     1.14     |
| LLAMA3_2_1B_QLORA     |     1.18     |
| LLAMA3_2_3B           |     6.43     |
| LLAMA3_2_3B_SPINQUANT |     2.55     |
| LLAMA3_2_3B_QLORA     |     2.65     |

## Speech to text

| Model            | XNNPACK [MB] |
| ---------------- | :----------: |
| WHISPER_TINY_EN  |     151      |
| WHISPER_TINY     |     151      |
| WHISPER_BASE_EN  |    290.6     |
| WHISPER_BASE     |    290.6     |
| WHISPER_SMALL_EN |     968      |
| WHISPER_SMALL    |     968      |

## Text Embeddings

| Model                      | XNNPACK [MB] |
| -------------------------- | :----------: |
| ALL_MINILM_L6_V2           |      91      |
| ALL_MPNET_BASE_V2          |     438      |
| MULTI_QA_MINILM_L6_COS_V1  |      91      |
| MULTI_QA_MPNET_BASE_DOT_V1 |     438      |
| CLIP_VIT_BASE_PATCH32_TEXT |     254      |

## Image Embeddings

| Model                       | XNNPACK [MB] |
| --------------------------- | :----------: |
| CLIP_VIT_BASE_PATCH32_IMAGE |     352      |

## Image Segmentation

| Model             | XNNPACK [MB] |
| ----------------- | ------------ |
| DEELABV3_RESNET50 | 168          |

## Text to image

| Model             | Text encoder (XNNPACK) [MB] | UNet (XNNPACK) [MB] | VAE decoder (XNNPACK) [MB] |
| ----------------- | --------------------------- | ------------------- | -------------------------- |
| BK_SDM_TINY_VPRED | 492                         | 1290                | 198                        |

## Voice Activity Detection (VAD)

| Model    | XNNPACK [MB] |
| -------- | :----------: |
| FSMN_VAD |     1.83     |
