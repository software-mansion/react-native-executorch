---
title: Model Size
---

## Classification

| Model             | XNNPACK FP32 [MB] | XNNPACK INT8 [MB] | Core ML FP32 [MB] | Core ML FP16 [MB] |
| :---------------- | :---------------: | :---------------: | :---------------: | :---------------: |
| EFFICIENTNET_V2_S |       85.7        |       22.9        |       86.5        |       43.9        |

## Object Detection

| Model                          | XNNPACK FP32 [MB] | Core ML FP32 [MB] | Core ML FP16 [MB] |
| ------------------------------ | :---------------: | :---------------: | :---------------: |
| SSDLITE_320_MOBILENET_V3_LARGE |       13.9        |       15.6        |       8.46        |
| RF_DETR_NANO                   |        112        |         -         |         -         |
| YOLO26N                        |       10.3        |         -         |         -         |
| YOLO26S                        |       38.6        |         -         |         -         |
| YOLO26M                        |       82.3        |         -         |         -         |
| YOLO26L                        |        100        |         -         |         -         |
| YOLO26X                        |        224        |         -         |         -         |

## Instance Segmentation

| Model            | XNNPACK [MB] |
| ---------------- | :----------: |
| YOLO26N_SEG      |     11.6     |
| YOLO26S_SEG      |     42.3     |
| YOLO26M_SEG      |     95.4     |
| YOLO26L_SEG      |     113      |
| YOLO26X_SEG      |     252      |
| RF_DETR_NANO_SEG |     124      |

## Style Transfer

| Model                        | XNNPACK FP32 [MB] | XNNPACK INT8 [MB] | Core ML FP32 [MB] | Core ML FP16 [MB] |
| ---------------------------- | :---------------: | :---------------: | :---------------: | :---------------: |
| STYLE_TRANSFER_CANDY         |       6.82        |       1.84        |       7.12        |       3.79        |
| STYLE_TRANSFER_MOSAIC        |       6.82        |       1.84        |       7.12        |       3.79        |
| STYLE_TRANSFER_UDNIE         |       6.82        |       1.84        |       7.12        |       3.79        |
| STYLE_TRANSFER_RAIN_PRINCESS |       6.82        |       1.84        |       7.12        |       3.79        |

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

## Text to speech

| Model         | XNNPACK [MB] |
| ------------- | :----------: |
| KOKORO_SMALL  |    329.6     |
| KOKORO_MEDIUM |    334.4     |

## Text Embeddings

| Model                      | XNNPACK [MB] |
| -------------------------- | :----------: |
| ALL_MINILM_L6_V2           |      91      |
| ALL_MPNET_BASE_V2          |     438      |
| MULTI_QA_MINILM_L6_COS_V1  |      91      |
| MULTI_QA_MPNET_BASE_DOT_V1 |     438      |
| CLIP_VIT_BASE_PATCH32_TEXT |     254      |

## Image Embeddings

| Model                       | XNNPACK FP32 [MB] | XNNPACK INT8 [MB] |
| --------------------------- | :---------------: | :---------------: |
| CLIP_VIT_BASE_PATCH32_IMAGE |        352        |       96.4        |

## Semantic Segmentation

| Model                         | XNNPACK FP32 [MB] | XNNPACK INT8 [MB] |
| ----------------------------- | :---------------: | :---------------: |
| DEEPLAB_V3_RESNET50           |        168        |       42.4        |
| DEEPLAB_V3_RESNET101          |        244        |       61.7        |
| DEEPLAB_V3_MOBILENET_V3_LARGE |       44.1        |       11.4        |
| LRASPP_MOBILENET_V3_LARGE     |       12.9        |       3.53        |
| FCN_RESNET50                  |        141        |       35.7        |
| FCN_RESNET101                 |        217        |        55         |

## Text to image

| Model             | Text encoder (XNNPACK) [MB] | UNet (XNNPACK) [MB] | VAE decoder (XNNPACK) [MB] |
| ----------------- | --------------------------- | ------------------- | -------------------------- |
| BK_SDM_TINY_VPRED | 492                         | 1290                | 198                        |

## Voice Activity Detection (VAD)

| Model    | XNNPACK [MB] |
| -------- | :----------: |
| FSMN_VAD |     1.83     |
