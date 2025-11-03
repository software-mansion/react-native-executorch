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

| Model                                                                                                  | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ------------------------------------------------------------------------------------------------------ | :--------------------: | :----------------: |
| Detector (CRAFT_800_QUANTIZED) + Recognizer (CRNN_512) + Recognizer (CRNN_256) + Recognizer (CRNN_128) |          1400          |        1320        |

## Vertical OCR

| Model                                                                                    | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ---------------------------------------------------------------------------------------- | :--------------------: | :----------------: |
| Detector (CRAFT_1280_QUANTIZED) + Detector (CRAFT_320_QUANTIZED) + Recognizer (CRNN_512) |          1540          |        1470        |
| Detector(CRAFT_1280) + Detector(CRAFT_320) + Recognizer (CRNN_64)                        |          1070          |        1000        |

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

| Model          | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| -------------- | :--------------------: | :----------------: |
| WHISPER_TINY   |          900           |        600         |
| MOONSHINE_TINY |          650           |        560         |

## Text Embeddings

| Model                      | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| -------------------------- | :--------------------: | :----------------: |
| ALL_MINILM_L6_V2           |          150           |        190         |
| ALL_MPNET_BASE_V2          |          520           |        470         |
| MULTI_QA_MINILM_L6_COS_V1  |          160           |        225         |
| MULTI_QA_MPNET_BASE_DOT_V1 |          540           |        500         |
