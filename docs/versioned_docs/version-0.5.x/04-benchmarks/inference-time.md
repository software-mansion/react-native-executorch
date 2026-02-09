---
title: Inference Time
---

:::warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

## Classification

| Model             | iPhone 17 Pro (Core ML) [ms] | iPhone 16 Pro (Core ML) [ms] | iPhone SE 3 (Core ML) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ----------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| EFFICIENTNET_V2_S |             105              |             110              |            149             |                299                |            227            |

## Object Detection

| Model                          | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------------------------ | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| SSDLITE_320_MOBILENET_V3_LARGE |             116              |             120              |            164             |                257                |            129            |

## Style Transfer

| Model                        | iPhone 17 Pro (Core ML) [ms] | iPhone 16 Pro (Core ML) [ms] | iPhone SE 3 (Core ML) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ---------------------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| STYLE_TRANSFER_CANDY         |             1356             |             1550             |            2003            |               2578                |           2328            |
| STYLE_TRANSFER_MOSAIC        |             1376             |             1456             |            1971            |               2657                |           2394            |
| STYLE_TRANSFER_UDNIE         |             1389             |             1499             |            1858            |               2380                |           2124            |
| STYLE_TRANSFER_RAIN_PRINCESS |             1339             |             1514             |            2004            |               2608                |           2371            |

## OCR

Notice that the recognizer models were executed between 3 and 7 times during a single recognition.
The values below represent the averages across all runs for the benchmark image.

| Model                          | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------------------------ | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| Detector (CRAFT_800_QUANTIZED) |             669              |             649              |            825             |                541                |            474            |
| Recognizer (CRNN_512)          |              48              |              47              |             60             |                91                 |            72             |
| Recognizer (CRNN_256)          |              22              |              22              |             29             |                51                 |            30             |
| Recognizer (CRNN_128)          |              11              |              11              |             14             |                28                 |            17             |

## Vertical OCR

Notice that the recognizer models, as well as detector CRAFT_320 model, were executed between 4 and 21 times during a single recognition.
The values below represent the averages across all runs for the benchmark image.

| Model                           | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------------------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| Detector (CRAFT_1280_QUANTIZED) |             1749             |             1804             |            2105            |               1216                |           1171            |
| Detector (CRAFT_320_QUANTIZED)  |             458              |             474              |            561             |                360                |            332            |
| Recognizer (CRNN_512)           |              54              |              52              |             68             |                144                |            72             |
| Recognizer (CRNN_64)            |              5               |              6               |             7              |                28                 |            11             |

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

| Model              | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------------ | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| Whisper-tiny (30s) |             1391             |             1372             |            1894            |               1303                |           1214            |

### Decoding

Average time for decoding one token in sequence of approximately 100 tokens, with encoding context is obtained from audio of noted length.

| Model              | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------------ | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| Whisper-tiny (30s) |              53              |              53              |             74             |                100                |            84             |

## Text Embeddings

| Model                      | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| -------------------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| ALL_MINILM_L6_V2           |              16              |              16              |             19             |                54                 |            28             |
| ALL_MPNET_BASE_V2          |             115              |             116              |            144             |                145                |            95             |
| MULTI_QA_MINILM_L6_COS_V1  |              16              |              16              |             20             |                47                 |            28             |
| MULTI_QA_MPNET_BASE_DOT_V1 |             112              |             119              |            144             |                146                |            96             |
| CLIP_VIT_BASE_PATCH32_TEXT |              47              |              45              |             57             |                65                 |            48             |

:::info
Benchmark times for text embeddings are highly dependent on the sentence length. The numbers above are based on a sentence of around 80 tokens. For shorter or longer sentences, inference time may vary accordingly.
:::

## Image Embeddings

| Model                       | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| --------------------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| CLIP_VIT_BASE_PATCH32_IMAGE |              70              |              70              |             90             |                66                 |            58             |

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


## Text to Image

| Model                 | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| --------------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| BK_SDM_TINY_VPRED_256 |            21184             |            21021             |             ❌             |               18834               |           16617           |
