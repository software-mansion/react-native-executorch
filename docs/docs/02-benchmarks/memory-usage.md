---
title: Memory Usage
---

:::info
Memory usage values represent the peak memory increase observed while the model was
loaded and actively running inference, relative to the baseline app memory
before model initialization.
:::

## Classification

| Model / Device                   | iPhone 17 Pro [MB] | Google Pixel 10 [MB] |
| -------------------------------- | :----------------: | :------------------: |
| EFFICIENTNET_V2_S (XNNPACK FP32) |        101         |         122          |
| EFFICIENTNET_V2_S (XNNPACK INT8) |         62         |          78          |
| EFFICIENTNET_V2_S (Core ML FP32) |        101         |          -           |
| EFFICIENTNET_V2_S (Core ML FP16) |         87         |          -           |

## Object Detection

:::note
Data presented for YOLO models is based on inference with `forward_640` method.
:::

| Model / Device                                | iPhone 17 Pro [MB] | Google Pixel 10 [MB] |
| --------------------------------------------- | :----------------: | :------------------: |
| SSDLITE_320_MOBILENET_V3_LARGE (XNNPACK FP32) |         94         |         104          |
| SSDLITE_320_MOBILENET_V3_LARGE (Core ML FP32) |         83         |          -           |
| SSDLITE_320_MOBILENET_V3_LARGE (Core ML FP16) |         62         |          -           |
| RF_DETR_NANO (XNNPACK FP32)                   |        145         |         162          |
| YOLO26N (XNNPACK FP32)                        |         36         |          44          |
| YOLO26S (XNNPACK FP32)                        |         81         |          82          |
| YOLO26M (XNNPACK FP32)                        |        123         |         158          |
| YOLO26L (XNNPACK FP32)                        |        170         |         172          |
| YOLO26X (XNNPACK FP32)                        |        320         |         309          |

## Style Transfer

| Model / Device                              | iPhone 17 Pro [MB] | Google Pixel 10 [MB] |
| ------------------------------------------- | :----------------: | :------------------: |
| STYLE_TRANSFER_CANDY (XNNPACK FP32)         |        1200        |         1200         |
| STYLE_TRANSFER_CANDY (XNNPACK INT8)         |        800         |         800          |
| STYLE_TRANSFER_CANDY (Core ML FP32)         |        400         |          -           |
| STYLE_TRANSFER_CANDY (Core ML FP16)         |        380         |          -           |
| STYLE_TRANSFER_MOSAIC (XNNPACK FP32)        |        1200        |         1200         |
| STYLE_TRANSFER_MOSAIC (XNNPACK INT8)        |        800         |         800          |
| STYLE_TRANSFER_MOSAIC (Core ML FP32)        |        400         |          -           |
| STYLE_TRANSFER_MOSAIC (Core ML FP16)        |        380         |          -           |
| STYLE_TRANSFER_UDNIE (XNNPACK FP32)         |        1200        |         1200         |
| STYLE_TRANSFER_UDNIE (XNNPACK INT8)         |        800         |         800          |
| STYLE_TRANSFER_UDNIE (Core ML FP32)         |        400         |          -           |
| STYLE_TRANSFER_UDNIE (Core ML FP16)         |        380         |          -           |
| STYLE_TRANSFER_RAIN_PRINCESS (XNNPACK FP32) |        1200        |         1200         |
| STYLE_TRANSFER_RAIN_PRINCESS (XNNPACK INT8) |        800         |         800          |
| STYLE_TRANSFER_RAIN_PRINCESS (Core ML FP32) |        400         |          -           |
| STYLE_TRANSFER_RAIN_PRINCESS (Core ML FP16) |        380         |          -           |

## OCR

| Model / Device                                      | iPhone 17 Pro [MB] | OnePlus 12 [MB] |
| --------------------------------------------------- | :----------------: | :-------------: |
| Detector (CRAFT) + Recognizer (CRNN) (XNNPACK FP32) |        1320        |      1400       |

## Vertical OCR

| Model / Device                                      | iPhone 17 Pro [MB] | OnePlus 12 [MB] |
| --------------------------------------------------- | :----------------: | :-------------: |
| Detector (CRAFT) + Recognizer (CRNN) (XNNPACK FP32) |     1000-1500      |    1000-1600    |

## LLMs

| Model / Device                  | iPhone 17 Pro [GB] | OnePlus 12 [GB] |
| ------------------------------- | :----------------: | :-------------: |
| LLAMA3_2_1B (XNNPACK)           |        3.1         |       3.3       |
| LLAMA3_2_1B_SPINQUANT (XNNPACK) |        2.4         |       1.9       |
| LLAMA3_2_1B_QLORA (XNNPACK)     |        2.8         |       2.7       |
| LLAMA3_2_3B (XNNPACK)           |        7.3         |       7.1       |
| LLAMA3_2_3B_SPINQUANT (XNNPACK) |        3.8         |       3.7       |
| LLAMA3_2_3B_QLORA (XNNPACK)     |        4.0         |       3.9       |

## Speech to Text

| Model / Device         | iPhone 17 Pro [MB] | OnePlus 12 [MB] |
| ---------------------- | :----------------: | :-------------: |
| WHISPER_TINY (XNNPACK) |        375         |       410       |

## Text to Speech

:::note
The reported memory usage values include the memory footprint of the Phonemis package, which is used for phonemizing input text. Currently, this can range from 100 to 150 MB depending on the device.
:::

| Model / Device          | iPhone 17 Pro [MB] | OnePlus 12 [MB] |
| ----------------------- | :----------------: | :-------------: |
| KOKORO_SMALL (XNNPACK)  |        820         |       820       |
| KOKORO_MEDIUM (XNNPACK) |        1100        |      1140       |

## Text Embeddings

| Model / Device                                       | iPhone 17 Pro [MB] | OnePlus 12 [MB] |
| ---------------------------------------------------- | :----------------: | :-------------: |
| ALL_MINILM_L6_V2 (XNNPACK)                           |        110         |       95        |
| ALL_MPNET_BASE_V2 (XNNPACK)                          |        455         |       405       |
| MULTI_QA_MINILM_L6_COS_V1 (XNNPACK)                  |        140         |       120       |
| MULTI_QA_MPNET_BASE_DOT_V1 (XNNPACK)                 |        455         |       435       |
| CLIP_VIT_BASE_PATCH32_TEXT (XNNPACK)                 |        280         |       200       |
| DISTILUSE_BASE_MULTILINGUAL_CASED_V2 (XNNPACK FP32)  |        175         |       196       |
| DISTILUSE_BASE_MULTILINGUAL_CASED_V2 (XNNPACK 8da4w) |         36         |       44        |
| DISTILUSE_BASE_MULTILINGUAL_CASED_V2 (Core ML FP32)  |         55         |        -        |
| DISTILUSE_BASE_MULTILINGUAL_CASED_V2 (Core ML FP16)  |        143         |        -        |

## Image Embeddings

| Model / Device                             | iPhone 17 Pro [MB] | Google Pixel 10 [MB] |
| ------------------------------------------ | :----------------: | :------------------: |
| CLIP_VIT_BASE_PATCH32_IMAGE (XNNPACK FP32) |        340         |         345          |

## Semantic Segmentation

:::note
Data presented in the following sections is based on inference with non-resized
output. When resize is enabled, expect higher memory usage and inference time
with higher resolutions.
:::

| Model / Device               | iPhone 17 Pro [MB] | OnePlus 12 [MB] |
| ---------------------------- | :----------------: | :-------------: |
| DEEPLABV3_RESNET50 (XNNPACK) |        660         |       930       |

## Instance Segmentation

:::note
Data presented in the following sections is based on inference with forward_640 method.
:::

| Model / Device             | iPhone 17 Pro [MB] | OnePlus 12 [MB] |
| -------------------------- | :----------------: | :-------------: |
| YOLO26N_SEG (XNNPACK)      |        668         |       92        |
| YOLO26S_SEG (XNNPACK)      |        712         |       220       |
| YOLO26M_SEG (XNNPACK)      |        815         |       570       |
| YOLO26L_SEG (XNNPACK)      |        1024        |       680       |
| YOLO26X_SEG (XNNPACK)      |        1450        |      1410       |
| RF_DETR_NANO_SEG (XNNPACK) |        603         |       620       |

## Text to Image

| Model / Device                  | iPhone 17 Pro [MB] | OnePlus 12 [MB] |
| ------------------------------- | :----------------: | :-------------: |
| BK_SDM_TINY_VPRED_256 (XNNPACK) |        2400        |      2400       |
| BK_SDM_TINY_VPRED (XNNPACK)     |        6050        |      6210       |
