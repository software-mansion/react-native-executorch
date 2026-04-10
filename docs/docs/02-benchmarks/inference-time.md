---
title: Inference Time
---

:::info
Times presented in the tables are measured as consecutive runs of the model.
Initial run times may be up to 2x longer due to model loading and
initialization.

Inference times are measured directly from native C++ code, wrapping only the
model's forward pass, excluding input-dependent pre- and post-processing (e.g.
image resizing, normalization) and any overhead from React Native runtime.
:::

## Classification

:::note
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

:::note
For this model all input images, whether larger or smaller, are resized before
processing. Resizing is typically fast for small images but may be noticeably
slower for very large images, which can increase total time.

Times presented in the tables are measured for YOLO models with input size equal to 512. Other input sizes may yield slower or faster inference times. RF-DETR Nano uses a fixed resolution of 312×312.
:::

| Model / Device                                | iPhone 17 Pro [ms] | Google Pixel 10 [ms] |
| :-------------------------------------------- | :----------------: | :------------------: |
| SSDLITE_320_MOBILENET_V3_LARGE (XNNPACK FP32) |         20         |          18          |
| SSDLITE_320_MOBILENET_V3_LARGE (Core ML FP32) |         18         |          -           |
| SSDLITE_320_MOBILENET_V3_LARGE (Core ML FP16) |         8          |          -           |
| RF_DETR_NANO (XNNPACK FP32)                   |        101         |         277          |
| YOLO26N (XNNPACK FP32)                        |         29         |          38          |
| YOLO26S (XNNPACK FP32)                        |         60         |          72          |
| YOLO26M (XNNPACK FP32)                        |        134         |         177          |
| YOLO26L (XNNPACK FP32)                        |        169         |         216          |
| YOLO26X (XNNPACK FP32)                        |        371         |         434          |

## Style Transfer

:::note
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

:::note
Recognizer models, as well as detector's `forward_320` method, were executed between 4 and 21 times during a single recognition.
:::
The values below represent the averages across all runs for the benchmark image.

| Model                           | iPhone 17 Pro <br /> [ms] | iPhone 16 Pro <br /> [ms] | iPhone SE 3 | Samsung Galaxy S24 <br /> [ms] | OnePlus 12 <br /> [ms] |
| ------------------------------- | ------------------------- | ------------------------- | ----------- | ------------------------------ | ---------------------- |
| **Total Inference Time**        | 1104                      | 1113                      | 8840        | 2845                           | 2640                   |
| Detector (CRAFT) `forward_1280` | 501                       | 507                       | 4317        | 1405                           | 1275                   |
| Detector (CRAFT) `forward_320`  | 125                       | 121                       | 1060        | 338                            | 299                    |
| Recognizer (CRNN) `forward_512` | 46                        | 42                        | 109         | 47                             | 37                     |
| Recognizer (CRNN) `forward_64`  | 5                         | 6                         | 14          | 7                              | 6                      |

## LLMs

| Model                          | Google Pixel 10 (XNNPACK) [tokens/s] | iPhone 17 Pro (XNNPACK) [tokens/s] | OnePlus 12 (XNNPACK) [tokens/s] | iPhone SE 3 (XNNPACK) [tokens/s] |
| ------------------------------ | :----------------------------------: | :--------------------------------: | :-----------------------------: | :------------------------------: |
| LLAMA3_2_1B                    |                  8                   |                 8                  |               15                |               N/A                |
| LLAMA3_2_1B_QLORA              |                  22                  |                 22                 |               45                |                19                |
| LLAMA3_2_1B_SPINQUANT          |                  24                  |                 36                 |               48                |                17                |
| LLAMA3_2_3B                    |                  2                   |                 3                  |                6                |               N/A                |
| LLAMA3_2_3B_QLORA              |                  8                   |                 7                  |               17                |               N/A                |
| LLAMA3_2_3B_SPINQUANT          |                  11                  |                 12                 |               18                |               N/A                |
| QWEN3_0_6B                     |                  7                   |                 9                  |               15                |                9                 |
| QWEN3_0_6B_QUANTIZED           |                  20                  |                 27                 |               37                |                35                |
| QWEN3_1_7B                     |                  3                   |                 5                  |                8                |               N/A                |
| QWEN3_1_7B_QUANTIZED           |                  10                  |                 14                 |               20                |                13                |
| QWEN3_4B                       |                  2                   |                N/A                 |                4                |               N/A                |
| QWEN3_4B_QUANTIZED             |                  5                   |                 7                  |               10                |               N/A                |
| HAMMER2_1_0_5B                 |                  13                  |                 13                 |               25                |                16                |
| HAMMER2_1_0_5B_QUANTIZED       |                  34                  |                 97                 |               72                |                56                |
| HAMMER2_1_1_5B                 |                  5                   |                 5                  |               10                |               N/A                |
| HAMMER2_1_1_5B_QUANTIZED       |                  14                  |                 16                 |               36                |                22                |
| HAMMER2_1_3B                   |                  2                   |                 3                  |                5                |               N/A                |
| HAMMER2_1_3B_QUANTIZED         |                  9                   |                 10                 |               20                |               N/A                |
| SMOLLM2_1_135M                 |                  25                  |                 24                 |               33                |                42                |
| SMOLLM2_1_135M_QUANTIZED       |                  20                  |                 32                 |               64                |                47                |
| SMOLLM2_1_360M                 |                  12                  |                 13                 |               20                |                15                |
| SMOLLM2_1_360M_QUANTIZED       |                  12                  |                 15                 |               29                |                18                |
| SMOLLM2_1_1_7B                 |                  3                   |                 5                  |                7                |               N/A                |
| SMOLLM2_1_1_7B_QUANTIZED       |                  12                  |                 14                 |               27                |                23                |
| QWEN2_5_0_5B                   |                  12                  |                 12                 |               21                |                15                |
| QWEN2_5_0_5B_QUANTIZED         |                  33                  |                 31                 |               55                |                48                |
| QWEN2_5_1_5B                   |                  5                   |                 5                  |                9                |               N/A                |
| QWEN2_5_1_5B_QUANTIZED         |                  15                  |                 15                 |               28                |                16                |
| QWEN2_5_3B                     |                  2                   |                 3                  |                5                |               N/A                |
| QWEN2_5_3B_QUANTIZED           |                  9                   |                 10                 |               18                |               N/A                |
| PHI_4_MINI_4B                  |                  2                   |                 3                  |                4                |               N/A                |
| PHI_4_MINI_4B_QUANTIZED        |                  4                   |                 7                  |               10                |               N/A                |
| LFM2_5_350M                    |                  16                  |                 26                 |               34                |                21                |
| LFM2_5_350M_QUANTIZED          |                  58                  |                 67                 |               103               |                51                |
| LFM2_5_1_2B_INSTRUCT           |                  6                   |                 10                 |               13                |               N/A                |
| LFM2_5_1_2B_INSTRUCT_QUANTIZED |                  8                   |                 26                 |               47                |                24                |

❌ - Insufficient RAM.

## Speech to Text

### Encoding

Average time for encoding audio of given length over 10 runs. For `Whisper` model we only list 30 sec audio chunks since `Whisper` does not accept other lengths (for shorter audio the audio needs to be padded to 30sec with silence).

| Model              | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------------ | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| Whisper-tiny (30s) |              89              |              93              |            403             |                277                |            260            |

### Decoding

Average time for decoding one token in sequence of approximately 100 tokens, with encoding context is obtained from audio of noted length.

| Model              | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------------ | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| Whisper-tiny (30s) |              6               |              6               |             40             |                28                 |            25             |

## Text to Speech

Average time to synthesize speech from an input text of approximately 60 tokens, resulting in 2 to 5 seconds of audio depending on the input and selected voice.

| Model         | iPhone 17 Pro (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------- | :--------------------------: | :-----------------------: |
| Kokoro-small  |             2051             |           1548            |
| Kokoro-medium |             2124             |           1625            |

## Text Embeddings

:::note
Benchmark times for text embeddings are highly dependent on the sentence length. The numbers below are based on a sentence of around 80 tokens. For shorter or longer sentences, inference time may vary accordingly.
:::

| Model                      | iPhone 17 Pro (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| -------------------------- | :--------------------------: | :-----------------------: |
| ALL_MINILM_L6_V2           |              7               |            21             |
| ALL_MPNET_BASE_V2          |              24              |            90             |
| MULTI_QA_MINILM_L6_COS_V1  |              7               |            19             |
| MULTI_QA_MPNET_BASE_DOT_V1 |              24              |            88             |
| CLIP_VIT_BASE_PATCH32_TEXT |              14              |            39             |

## Image Embeddings

:::note
For this model all input images, whether larger or smaller, are resized before
processing. Resizing is typically fast for small images but may be noticeably
slower for very large images, which can increase total time.
:::

| Model / Device                             | iPhone 17 Pro [ms] | Google Pixel 10 [ms] |
| :----------------------------------------- | :----------------: | :------------------: |
| CLIP_VIT_BASE_PATCH32_IMAGE (XNNPACK FP32) |         14         |          68          |
| CLIP_VIT_BASE_PATCH32_IMAGE (XNNPACK INT8) |         11         |          31          |

## Semantic Segmentation

:::note
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

:::note
Times presented in the tables are measured for YOLO models with input size equal to 512. Other input sizes may yield slower or faster inference times. RF-DETR Nano Seg uses a fixed resolution of 312×312.
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
