---
title: Inference Time
---

:::warning warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

## Classification

| Model             | iPhone 17 Pro (Core ML) [ms] | iPhone 16 Pro (Core ML) [ms] | iPhone SE 3 (Core ML) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ----------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| EFFICIENTNET_V2_S |              64              |              68              |            217             |                205                |            198            |

## Object Detection

| Model                          | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------------------------ | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| SSDLITE_320_MOBILENET_V3_LARGE |              71              |              74              |            257             |                115                |            109            |

## Style Transfer

| Model                        | iPhone 17 Pro (Core ML) [ms] | iPhone 16 Pro (Core ML) [ms] | iPhone SE 3 (Core ML) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ---------------------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| STYLE_TRANSFER_CANDY         |             1400             |             1485             |            4255            |               2510                |           2355            |
| STYLE_TRANSFER_MOSAIC        |             1400             |             1485             |            4255            |               2510                |           2355            |
| STYLE_TRANSFER_UDNIE         |             1400             |             1485             |            4255            |               2510                |           2355            |
| STYLE_TRANSFER_RAIN_PRINCESS |             1400             |             1485             |            4255            |               2510                |           2355            |

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

| Model                       | iPhone 17 Pro (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| --------------------------- | :--------------------------: | :-----------------------: |
| CLIP_VIT_BASE_PATCH32_IMAGE |              18              |            55             |

:::info
Image embedding benchmark times are measured using 224×224 pixel images, as required by the model. All input images, whether larger or smaller, are resized to 224×224 before processing. Resizing is typically fast for small images but may be noticeably slower for very large images, which can increase total inference time.
:::

## Text to Image

| Model                 | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| --------------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| BK_SDM_TINY_VPRED_256 |            21184             |            21021             |             ❌             |               18834               |           16617           |
