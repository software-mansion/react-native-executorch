---
title: Memory Usage
sidebar_position: 2
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

| Model                                               | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| --------------------------------------------------- | :--------------------: | :----------------: |
| CRAFT_800 + CRNN_EN_512 + CRNN_EN_256 + CRNN_EN_128 |          2100          |        1782        |

## Vertical OCR

| Model                                | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ------------------------------------ | :--------------------: | :----------------: |
| CRAFT_1280 + CRAFT_320 + CRNN_EN_512 |          2770          |        3720        |
| CRAFT_1280 + CRAFT_320 + CRNN_EN_64  |          1770          |        2740        |

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

| Model            | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ---------------- | :--------------------: | :----------------: |
| ALL_MINILM_L6_V2 |          140           |         64         |
