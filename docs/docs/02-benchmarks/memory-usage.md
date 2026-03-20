---
title: Memory Usage
---

## Classification

:::info
Memory usage values represent the peak memory increase observed while the model was
loaded and actively running inference, relative to the baseline app memory
before model initialization.
:::

| Model / Device                   | iPhone 17 Pro [MB] | Google Pixel 10 [MB] |
| -------------------------------- | :----------------: | :------------------: |
| EFFICIENTNET_V2_S (XNNPACK FP32) |        101         |         122          |
| EFFICIENTNET_V2_S (XNNPACK INT8) |         62         |          78          |
| EFFICIENTNET_V2_S (Core ML FP32) |        101         |          -           |
| EFFICIENTNET_V2_S (Core ML FP16) |         87         |          -           |

## Object Detection

:::info
Memory usage values represent the peak memory increase observed while the model was
loaded and actively running inference, relative to the baseline app memory
before model initialization.
:::

:::warning
Data presented for YOLO models is based on inference with forward_640 method.
:::

| Model / Device                                | iPhone 17 Pro [MB] | Google Pixel 10 [MB] |
| --------------------------------------------- | :----------------: | :------------------: |
| SSDLITE_320_MOBILENET_V3_LARGE (XNNPACK FP32) |         94         |         104          |
| SSDLITE_320_MOBILENET_V3_LARGE (Core ML FP32) |         83         |          -           |
| SSDLITE_320_MOBILENET_V3_LARGE (Core ML FP16) |         62         |          -           |
| RF_DETR_NANO (XNNPACK FP32)                   |        TBD         |         TBD          |
| YOLO26N (XNNPACK FP32)                        |        TBD         |         TBD          |
| YOLO26S (XNNPACK FP32)                        |        TBD         |         TBD          |
| YOLO26M (XNNPACK FP32)                        |        TBD         |         TBD          |
| YOLO26L (XNNPACK FP32)                        |        TBD         |         TBD          |
| YOLO26X (XNNPACK FP32)                        |        TBD         |         TBD          |

## Style Transfer

:::info
Memory usage values represent the peak memory increase observed while the model was
loaded and actively running inference, relative to the baseline app memory
before model initialization.
:::

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

:::info
All the below benchmarks were performed on iPhone 17 Pro (iOS) and OnePlus 12
(Android).
:::

| Model                                | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ------------------------------------ | :--------------------: | :----------------: |
| Detector (CRAFT) + Recognizer (CRNN) |          1400          |        1320        |

## Vertical OCR

:::info
All the below benchmarks were performed on iPhone 17 Pro (iOS) and OnePlus 12
(Android).
:::

| Model                                | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ------------------------------------ | :--------------------: | :----------------: |
| Detector (CRAFT) + Recognizer (CRNN) |       1000-1600        |     1000-1500      |

## LLMs

:::info
All the below benchmarks were performed on iPhone 17 Pro (iOS) and OnePlus 12
(Android).
:::

| Model                 | Android (XNNPACK) [GB] | iOS (XNNPACK) [GB] |
| --------------------- | :--------------------: | :----------------: |
| LLAMA3_2_1B           |          3.3           |        3.1         |
| LLAMA3_2_1B_SPINQUANT |          1.9           |        2.4         |
| LLAMA3_2_1B_QLORA     |          2.7           |        2.8         |
| LLAMA3_2_3B           |          7.1           |        7.3         |
| LLAMA3_2_3B_SPINQUANT |          3.7           |        3.8         |
| LLAMA3_2_3B_QLORA     |          3.9           |        4.0         |

## Speech to text

:::info
All the below benchmarks were performed on iPhone 17 Pro (iOS) and OnePlus 12
(Android).
:::

| Model        | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ------------ | :--------------------: | :----------------: |
| WHISPER_TINY |          410           |        375         |

## Text to speech

:::info
All the below benchmarks were performed on iPhone 17 Pro (iOS) and OnePlus 12
(Android).
:::

| Model         | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ------------- | :--------------------: | :----------------: |
| KOKORO_SMALL  |          820           |        820         |
| KOKORO_MEDIUM |          1140          |        1100        |

:::info
The reported memory usage values include the memory footprint of the Phonemis package, which is used for phonemizing input text. Currently, this can range from 100 to 150 MB depending on the device.
:::

## Text Embeddings

:::info
All the below benchmarks were performed on iPhone 17 Pro (iOS) and OnePlus 12
(Android).
:::

| Model                      | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| -------------------------- | :--------------------: | :----------------: |
| ALL_MINILM_L6_V2           |           95           |        110         |
| ALL_MPNET_BASE_V2          |          405           |        455         |
| MULTI_QA_MINILM_L6_COS_V1  |          120           |        140         |
| MULTI_QA_MPNET_BASE_DOT_V1 |          435           |        455         |
| CLIP_VIT_BASE_PATCH32_TEXT |          200           |        280         |

## Image Embeddings

:::info
Memory usage values represent the peak memory increase observed while the model was
loaded and actively running inference, relative to the baseline app memory
before model initialization.
:::

| Model / Device                             | iPhone 17 Pro [MB] | Google Pixel 10 [MB] |
| ------------------------------------------ | :----------------: | :------------------: |
| CLIP_VIT_BASE_PATCH32_IMAGE (XNNPACK FP32) |        340         |         345          |

## Semantic Segmentation

:::info
All the below benchmarks were performed on iPhone 17 Pro (iOS) and OnePlus 12
(Android).
:::

:::warning
Data presented in the following sections is based on inference with non-resized
output. When resize is enabled, expect higher memory usage and inference time
with higher resolutions.
:::

| Model             | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ----------------- | ---------------------- | ------------------ |
| DEELABV3_RESNET50 | 930                    | 660                |

## Instance Segmentation

:::info
All the below benchmarks were performed on iPhone 17 Pro (iOS) and OnePlus 12
(Android).
:::

:::warning
Data presented in the following sections is based on inference with forward_640 method.
:::

| Model            | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ---------------- | ---------------------- | ------------------ |
| YOLO26N_SEG      | 92                     | 668                |
| YOLO26S_SEG      | 220                    | 712                |
| YOLO26M_SEG      | 570                    | 815                |
| YOLO26L_SEG      | 680                    | 1024               |
| YOLO26X_SEG      | 1410                   | 1450               |
| RF_DETR_NANO_SEG | 620                    | 603                |

## Text to image

:::info
All the below benchmarks were performed on iPhone 17 Pro (iOS) and OnePlus 12
(Android).
:::

| Model                 | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| --------------------- | ---------------------- | ------------------ |
| BK_SDM_TINY_VPRED_256 | 2400                   | 2400               |
| BK_SDM_TINY_VPRED     | 6210                   | 6050               |
