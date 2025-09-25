---
title: Inference Time
---

:::warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

## Classification

| Model             | iPhone 16 Pro (Core ML) [ms] | iPhone 13 Pro (Core ML) [ms] | iPhone SE 3 (Core ML) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ----------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| EFFICIENTNET_V2_S |             100              |             120              |            130             |                180                |            170            |

## Object Detection

| Model                          | iPhone 16 Pro (XNNPACK) [ms] | iPhone 13 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------------------------ | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| SSDLITE_320_MOBILENET_V3_LARGE |             190              |             260              |            280             |                100                |            90             |

## Style Transfer

| Model                        | iPhone 16 Pro (Core ML) [ms] | iPhone 13 Pro (Core ML) [ms] | iPhone SE 3 (Core ML) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ---------------------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| STYLE_TRANSFER_CANDY         |             450              |             600              |            750             |               1650                |           1800            |
| STYLE_TRANSFER_MOSAIC        |             450              |             600              |            750             |               1650                |           1800            |
| STYLE_TRANSFER_UDNIE         |             450              |             600              |            750             |               1650                |           1800            |
| STYLE_TRANSFER_RAIN_PRINCESS |             450              |             600              |            750             |               1650                |           1800            |

## OCR

| Model                 | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro Max (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) | Samsung Galaxy S24 (XNNPACK) [ms] | Samsung Galaxy S21 (XNNPACK) [ms] |
| --------------------- | :--------------------------: | :------------------------------: | :-------------------: | :-------------------------------: | :-------------------------------: |
| Detector (CRAFT_800)  |             2099             |               2227               |          ❌           |               2245                |               7108                |
| Recognizer (CRNN_512) |              70              |               252                |          ❌           |                54                 |                151                |
| Recognizer (CRNN_256) |              39              |               123                |          ❌           |                24                 |                78                 |
| Recognizer (CRNN_128) |              17              |                83                |          ❌           |                14                 |                39                 |

❌ - Insufficient RAM.

## Vertical OCR

| Model                 | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro Max (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) | Samsung Galaxy S24 (XNNPACK) [ms] | Samsung Galaxy S21 (XNNPACK) [ms] |
| --------------------- | :--------------------------: | :------------------------------: | :-------------------: | :-------------------------------: | :-------------------------------: |
| Detector (CRAFT_1280) |             5457             |               5833               |          ❌           |               6296                |               14053               |
| Detector (CRAFT_320)  |             1351             |               1460               |          ❌           |               1485                |               3101                |
| Recognizer (CRNN_512) |              39              |               123                |          ❌           |                24                 |                78                 |
| Recognizer (CRNN_64)  |              10              |                33                |          ❌           |                 7                 |                18                 |

❌ - Insufficient RAM.

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

### Streaming mode

Notice than for `Whisper` model which has to take as an input 30 seconds audio chunks (for shorter audio it is automatically padded with silence to 30 seconds) `fast` mode has the lowest latency (time from starting transcription to first token returned, caused by streaming algorithm), but the slowest speed. If you believe that this might be a problem for you, prefer `balanced` mode instead.

| Model (mode)            | iPhone 16 Pro (XNNPACK) [latency \| tokens/s] | iPhone 14 Pro (XNNPACK) [latency \| tokens/s] | iPhone SE 3 (XNNPACK) [latency \| tokens/s] | Samsung Galaxy S24 (XNNPACK) [latency \| tokens/s] | OnePlus 12 (XNNPACK) [latency \| tokens/s] |
| ----------------------- | :-------------------------------------------: | :-------------------------------------------: | :-----------------------------------------: | :------------------------------------------------: | :----------------------------------------: |
| Whisper-tiny (fast)     |                2.8s \| 5.5t/s                 |                3.7s \| 4.4t/s                 |               4.4s \| 3.4t/s                |                   5.5s \| 3.1t/s                   |               5.3s \| 3.8t/s               |
| Whisper-tiny (balanced) |                5.6s \| 7.9t/s                 |                7.0s \| 6.3t/s                 |               8.3s \| 5.0t/s                |                   8.4s \| 6.7t/s                   |               7.7s \| 7.2t/s               |
| Whisper-tiny (quality)  |                10.3s \| 8.3t/s                |                12.6s \| 6.8t/s                |               7.8s \| 8.9t/s                |                  13.5s \| 7.1t/s                   |              12.9s \| 7.5t/s               |

### Encoding

Average time for encoding audio of given length over 10 runs. For `Whisper` model we only list 30 sec audio chunks since `Whisper` does not accept other lengths (for shorter audio the audio needs to be padded to 30sec with silence).

| Model              | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------------ | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| Whisper-tiny (30s) |             1034             |             1344             |            1269            |               2916                |           2143            |

### Decoding

Average time for decoding one token in sequence of 100 tokens, with encoding context obtained from audio of noted length.

| Model              | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------------ | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| Whisper-tiny (30s) |            128.03            |            113.65            |           141.63           |               89.08               |           84.49           |

## Text Embeddings

| Model                      | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro Max (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) | OnePlus 12 (XNNPACK) [ms] |
| -------------------------- | :--------------------------: | :------------------------------: | :------------------------: | :--------------------------: | :-----------------------: |
| ALL_MINILM_L6_V2           |              15              |                22                |             23             |              36              |            31             |
| ALL_MPNET_BASE_V2          |              71              |                96                |            101             |             112              |            105            |
| MULTI_QA_MINILM_L6_COS_V1  |              15              |                22                |             23             |              36              |            31             |
| MULTI_QA_MPNET_BASE_DOT_V1 |              71              |                95                |            100             |             112              |            105            |
| CLIP_VIT_BASE_PATCH32_TEXT |              31              |                47                |             48             |              55              |            49             |

:::info
Benchmark times for text embeddings are highly dependent on the sentence length. The numbers above are based on a sentence of around 80 tokens. For shorter or longer sentences, inference time may vary accordingly.
:::

## Image Embeddings

| Model                       | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro Max (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| --------------------------- | :--------------------------: | :------------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| CLIP_VIT_BASE_PATCH32_IMAGE |              48              |                64                |             69             |                65                 |            63             |

:::info
Image embedding benchmark times are measured using 224×224 pixel images, as required by the model. All input images, whether larger or smaller, are resized to 224×224 before processing. Resizing is typically fast for small images but may be noticeably slower for very large images, which can increase total inference time.
:::

## Image Segmentation

:::warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

| Model             | iPhone 16 Pro (Core ML) [ms] | iPhone 14 Pro Max (Core ML) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] |
| ----------------- | ---------------------------- | -------------------------------- | --------------------------------- |
| DEELABV3_RESNET50 | 1000                         | 670                              | 700                               |
