---
title: Model Size
sidebar_position: 1
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

| Model                 | XNNPACK [MB] |
| --------------------- | :----------: |
| Detector (CRAFT_800)  |     83.1     |
| Recognizer (CRNN_512) |  15 - 18\*   |
| Recognizer (CRNN_256) |  16 - 18\*   |
| Recognizer (CRNN_128) |  17 - 19\*   |

\* - The model weights vary depending on the language.

## Vertical OCR

| Model                    | XNNPACK [MB] |
| ------------------------ | :----------: |
| Detector (CRAFT_1280)    |     83.1     |
| Detector (CRAFT_320)     |     83.1     |
| Recognizer (CRNN_EN_512) |  15 - 18\*   |
| Recognizer (CRNN_EN_64)  |  15 - 16\*   |

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

| Model          | XNNPACK [MB] |
| -------------- | :----------: |
| WHISPER_TINY   |    231.0     |
| MOONSHINE_TINY |    148.9     |

## Text Embeddings

| Model                      | XNNPACK [MB] |
| -------------------------- | :----------: |
| ALL_MINILM_L6_V2           |      91      |
| ALL_MPNET_BASE_V2          |     438      |
| MULTI_QA_MINILM_L6_COS_V1  |      91      |
| MULTI_QA_MPNET_BASE_DOT_V1 |     438      |
