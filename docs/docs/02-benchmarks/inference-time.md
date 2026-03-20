---
title: Inference Time
---

:::warning
Times presented in the tables are measured as consecutive runs of the model.
Initial run times may be up to 2x longer due to model loading and
initialization.
:::

## Classification

:::info
Inference times are measured directly from native C++ code, wrapping only the
model's forward pass, excluding input-dependent pre- and post-processing (e.g.
image resizing, normalization) and any overhead from React Native runtime.
:::

:::info
For this model all input images, whether larger or smaller, are resized before
processing. Resizing is typically fast for small images but may be noticeably
slower for very large images, which can increase total time.
:::

| Model / Device                   | iPhone 17 Pro [ms] | Google Pixel 10 [ms] |
| :------------------------------- | :----------------: | :------------------: |
| EFFICIENTNET_V2_S (XNNPACK FP32) |         70         |         100          |
| EFFICIENTNET_V2_S (XNNPACK INT8) |         22         |          38          |
| EFFICIENTNET_V2_S (Core ML FP32) |         12         |          -           |
| EFFICIENTNET_V2_S (Core ML FP16) |         5          |          -           |

## Object Detection

:::info
Inference times are measured directly from native C++ code, wrapping only the
model's forward pass, excluding input-dependent pre- and post-processing (e.g.
image resizing, normalization) and any overhead from React Native runtime.
:::

:::info
For this model all input images, whether larger or smaller, are resized before
processing. Resizing is typically fast for small images but may be noticeably
slower for very large images, which can increase total time.
:::

:::warning
Times presented in the tables are measured for forward method with input size equal to 512. Other input sizes may yield slower or faster inference times.
:::

| Model / Device                                | iPhone 17 Pro [ms] | Google Pixel 10 [ms] |
| :-------------------------------------------- | :----------------: | :------------------: |
| SSDLITE_320_MOBILENET_V3_LARGE (XNNPACK FP32) |         20         |          18          |
| SSDLITE_320_MOBILENET_V3_LARGE (Core ML FP32) |         18         |          -           |
| SSDLITE_320_MOBILENET_V3_LARGE (Core ML FP16) |         8          |          -           |
| RF_DETR_NANO (XNNPACK FP32)                   |        TBD         |         TBD          |
| YOLO26N (XNNPACK FP32)                        |        TBD         |         TBD          |
| YOLO26S (XNNPACK FP32)                        |        TBD         |         TBD          |
| YOLO26M (XNNPACK FP32)                        |        TBD         |         TBD          |
| YOLO26L (XNNPACK FP32)                        |        TBD         |         TBD          |
| YOLO26X (XNNPACK FP32)                        |        TBD         |         TBD          |

## Style Transfer

:::info
Inference times are measured directly from native C++ code, wrapping only the
model's forward pass, excluding input-dependent pre- and post-processing (e.g.
image resizing, normalization) and any overhead from React Native runtime.
:::

:::info
For this model all input images, whether larger or smaller, are resized before
processing. Resizing is typically fast for small images but may be noticeably
slower for very large images, which can increase total time.
:::

| Model / Device                              | iPhone 17 Pro [ms] | Google Pixel 10 [ms] |
| :------------------------------------------ | :----------------: | :------------------: |
| STYLE_TRANSFER_CANDY (XNNPACK FP32)         |        1192        |         1025         |
| STYLE_TRANSFER_CANDY (XNNPACK INT8)         |        272         |         430          |
| STYLE_TRANSFER_CANDY (Core ML FP32)         |        100         |          -           |
| STYLE_TRANSFER_CANDY (Core ML FP16)         |        150         |          -           |
| STYLE_TRANSFER_MOSAIC (XNNPACK FP32)        |        1192        |         1025         |
| STYLE_TRANSFER_MOSAIC (XNNPACK INT8)        |        272         |         430          |
| STYLE_TRANSFER_MOSAIC (Core ML FP32)        |        100         |          -           |
| STYLE_TRANSFER_MOSAIC (Core ML FP16)        |        150         |          -           |
| STYLE_TRANSFER_UDNIE (XNNPACK FP32)         |        1192        |         1025         |
| STYLE_TRANSFER_UDNIE (XNNPACK INT8)         |        272         |         430          |
| STYLE_TRANSFER_UDNIE (Core ML FP32)         |        100         |          -           |
| STYLE_TRANSFER_UDNIE (Core ML FP16)         |        150         |          -           |
| STYLE_TRANSFER_RAIN_PRINCESS (XNNPACK FP32) |        1192        |         1025         |
| STYLE_TRANSFER_RAIN_PRINCESS (XNNPACK INT8) |        272         |         430          |
| STYLE_TRANSFER_RAIN_PRINCESS (Core ML FP32) |        100         |          -           |
| STYLE_TRANSFER_RAIN_PRINCESS (Core ML FP16) |        150         |          -           |

## OCR

Notice that the recognizer models were executed between 3 and 7 times during a single recognition.
The values below represent the averages across all runs for the benchmark image.

| Model                           | iPhone 17 Pro [ms] | iPhone 16 Pro [ms] | iPhone SE 3 | Samsung Galaxy S24 [ms] | OnePlus 12 [ms] |
| ------------------------------- | ------------------ | ------------------ | ----------- | ----------------------- | --------------- |
| **Total Inference Time**        | 652                | 600                | 2855        | 1092                    | 1034            |
| Detector (CRAFT) `forward_800`  | 220                | 221                | 1740        | 521                     | 492             |
| Recognizer (CRNN) `forward_512` | 45                 | 38                 | 110         | 40                      | 38              |
| Recognizer (CRNN) `forward_256` | 21                 | 18                 | 54          | 20                      | 19              |
| Recognizer (CRNN) `forward_128` | 11                 | 9                  | 27          | 10                      | 10              |

## Vertical OCR

Notice that the recognizer models, as well as detector's `forward_320` method, were executed between 4 and 21 times during a single recognition.
The values below represent the averages across all runs for the benchmark image.

| Model                           | iPhone 17 Pro <br /> [ms] | iPhone 16 Pro <br /> [ms] | iPhone SE 3 | Samsung Galaxy S24 <br /> [ms] | OnePlus 12 <br /> [ms] |
| ------------------------------- | ------------------------- | ------------------------- | ----------- | ------------------------------ | ---------------------- |
| **Total Inference Time**        | 1104                      | 1113                      | 8840        | 2845                           | 2640                   |
| Detector (CRAFT) `forward_1280` | 501                       | 507                       | 4317        | 1405                           | 1275                   |
| Detector (CRAFT) `forward_320`  | 125                       | 121                       | 1060        | 338                            | 299                    |
| Recognizer (CRNN) `forward_512` | 46                        | 42                        | 109         | 47                             | 37                     |
| Recognizer (CRNN) `forward_64`  | 5                         | 6                         | 14          | 7                              | 6                      |

## LLMs

| Model                 | iPhone 16 Pro (XNNPACK) [tokens/s] | iPhone 13 Pro (XNNPACK) [tokens/s] | iPhone SE 3 (XNNPACK) [tokens/s] | Samsung Galaxy S24 (XNNPACK) [tokens/s] | OnePlus 12 (XNNPACK) [tokens/s] |
| --------------------- | :--------------------------------: | :--------------------------------: | :------------------------------: | :-------------------------------------: | :-----------------------------: |
| LLAMA3_2_1B           |                16.1                |                11.4                |                ❌                |                  15.6                   |              19.3               |
| LLAMA3_2_1B_SPINQUANT |                40.6                |                16.7                |               16.5               |                  40.3                   |              48.2               |
| LLAMA3_2_1B_QLORA     |                31.8                |                11.4                |               11.2               |                  37.3                   |              44.4               |
| LLAMA3_2_3B           |                 ❌                 |                 ❌                 |                ❌                |                   ❌                    |               7.1               |
| LLAMA3_2_3B_SPINQUANT |                17.2                |                8.2                 |                ❌                |                  16.2                   |              19.4               |
| LLAMA3_2_3B_QLORA     |                14.5                |                 ❌                 |                ❌                |                  14.8                   |              18.1               |

❌ - Insufficient RAM.

## Speech to Text

### Encoding

Average time for encoding audio of given length over 10 runs. For `Whisper` model we only list 30 sec audio chunks since `Whisper` does not accept other lengths (for shorter audio the audio needs to be padded to 30sec with silence).

| Model              | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------------ | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| Whisper-tiny (30s) |             248              |             254              |            1145            |                435                |            526            |

### Decoding

Average time for decoding one token in sequence of approximately 100 tokens, with encoding context is obtained from audio of noted length.

| Model              | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------------ | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| Whisper-tiny (30s) |              23              |              25              |            121             |                92                 |            115            |

## Text to Speech

Average time to synthesize speech from an input text of approximately 60 tokens, resulting in 2 to 5 seconds of audio depending on the input and selected voice.

| Model         | iPhone 17 Pro (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------- | :--------------------------: | :-----------------------: |
| Kokoro-small  |             2051             |           1548            |
| Kokoro-medium |             2124             |           1625            |

## Text Embeddings

| Model                      | iPhone 17 Pro (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| -------------------------- | :--------------------------: | :-----------------------: |
| ALL_MINILM_L6_V2           |              7               |            21             |
| ALL_MPNET_BASE_V2          |              24              |            90             |
| MULTI_QA_MINILM_L6_COS_V1  |              7               |            19             |
| MULTI_QA_MPNET_BASE_DOT_V1 |              24              |            88             |
| CLIP_VIT_BASE_PATCH32_TEXT |              14              |            39             |

:::info
Benchmark times for text embeddings are highly dependent on the sentence length. The numbers above are based on a sentence of around 80 tokens. For shorter or longer sentences, inference time may vary accordingly.
:::

## Image Embeddings

:::info
Inference times are measured directly from native C++ code, wrapping only the
model's forward pass, excluding input-dependent pre- and post-processing (e.g.
image resizing, normalization) and any overhead from React Native runtime.
:::

:::info
For this model all input images, whether larger or smaller, are resized before
processing. Resizing is typically fast for small images but may be noticeably
slower for very large images, which can increase total time.
:::

| Model / Device                             | iPhone 17 Pro [ms] | Google Pixel 10 [ms] |
| :----------------------------------------- | :----------------: | :------------------: |
| CLIP_VIT_BASE_PATCH32_IMAGE (XNNPACK FP32) |         14         |          68          |
| CLIP_VIT_BASE_PATCH32_IMAGE (XNNPACK INT8) |         11         |          31          |

## Semantic Segmentation

:::info
Inference times are measured directly from native C++ code, wrapping only the
model's forward pass, excluding input-dependent pre- and post-processing (e.g.
image resizing, normalization) and any overhead from React Native runtime.
:::

:::info
For this model all input images, whether larger or smaller, are resized before
processing. Resizing is typically fast for small images but may be noticeably
slower for very large images, which can increase total time.
:::

| Model / Device                               | iPhone 17 Pro [ms] | Google Pixel 10 [ms] |
| :------------------------------------------- | :----------------: | :------------------: |
| DEEPLAB_V3_RESNET50 (XNNPACK FP32)           |        2000        |         2200         |
| DEEPLAB_V3_RESNET50 (XNNPACK INT8)           |        118         |         380          |
| DEEPLAB_V3_RESNET101 (XNNPACK FP32)          |        2900        |         3300         |
| DEEPLAB_V3_RESNET101 (XNNPACK INT8)          |        174         |         660          |
| DEEPLAB_V3_MOBILENET_V3_LARGE (XNNPACK FP32) |        131         |         153          |
| DEEPLAB_V3_MOBILENET_V3_LARGE (XNNPACK INT8) |         17         |          40          |
| LRASPP_MOBILENET_V3_LARGE (XNNPACK FP32)     |         13         |          36          |
| LRASPP_MOBILENET_V3_LARGE (XNNPACK INT8)     |         12         |          20          |
| FCN_RESNET50 (XNNPACK FP32)                  |        1800        |         2160         |
| FCN_RESNET50 (XNNPACK INT8)                  |        100         |         320          |
| FCN_RESNET101 (XNNPACK FP32)                 |        2600        |         3160         |
| FCN_RESNET101 (XNNPACK INT8)                 |        160         |         620          |

## Instance Segmentation

:::warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::
:::warning
Times presented in the tables are measured for forward method with input size equal to 512. Other input sizes may yield slower or faster inference times.
:::

| Model            | Samsung Galaxy S24 (XNNPACK) [ms] | Iphone 17 pro (XNNPACK) [ms] |
| ---------------- | --------------------------------- | ---------------------------- |
| YOLO26N_SEG      | 92                                | 90                           |
| YOLO26S_SEG      | 220                               | 188                          |
| YOLO26M_SEG      | 570                               | 550                          |
| YOLO26L_SEG      | 680                               | 608                          |
| YOLO26X_SEG      | 1410                              | 1338                         |
| RF_DETR_NANO_SEG | 549                               | 330                          |

## Text to image

| Model                 | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| --------------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| BK_SDM_TINY_VPRED_256 |            21184             |            21021             |             ❌             |               18834               |           16617           |
