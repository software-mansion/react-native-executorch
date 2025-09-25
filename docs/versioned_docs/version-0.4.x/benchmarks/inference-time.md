---
title: Inference Time
---

:::warning warning
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

| Model                 | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro Max (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | Samsung Galaxy S21 (XNNPACK) [ms] |
| --------------------- | :--------------------------: | :------------------------------: | :------------------------: | :-------------------------------: | :-------------------------------: |
| Detector (CRAFT_800)  |             2099             |               2227               |             ❌             |               2245                |               7108                |
| Recognizer (CRNN_512) |              70              |               252                |             ❌             |                54                 |                151                |
| Recognizer (CRNN_256) |              39              |               123                |             ❌             |                24                 |                78                 |
| Recognizer (CRNN_128) |              17              |                83                |             ❌             |                14                 |                39                 |

❌ - Insufficient RAM.

## Vertical OCR

| Model                 | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro Max (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | Samsung Galaxy S21 (XNNPACK) [ms] |
| --------------------- | :--------------------------: | :------------------------------: | :------------------------: | :-------------------------------: | :-------------------------------: |
| Detector (CRAFT_1280) |             5457             |               5833               |             ❌             |               6296                |               14053               |
| Detector (CRAFT_320)  |             1351             |               1460               |             ❌             |               1485                |               3101                |
| Recognizer (CRNN_512) |              39              |               123                |             ❌             |                24                 |                78                 |
| Recognizer (CRNN_64)  |              10              |                33                |             ❌             |                 7                 |                18                 |

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

## Speech to text

### Streaming mode

Notice than for `Whisper` model which has to take as an input 30 seconds audio chunks (for shorter audio it is automatically padded with silence to 30 seconds) `fast` mode has the lowest latency (time from starting transcription to first token returned, caused by streaming algorithm), but the slowest speed. That's why for the lowest latency and the fastest transcription we suggest using `Moonshine` model, if you still want to proceed with `Whisper` use preferably the `balanced` mode.

| Model (mode)              | iPhone 16 Pro (XNNPACK) [latency \| tokens/s] | iPhone 14 Pro (XNNPACK) [latency \| tokens/s] | iPhone SE 3 (XNNPACK) [latency \| tokens/s] | Samsung Galaxy S24 (XNNPACK) [latency \| tokens/s] | OnePlus 12 (XNNPACK) [latency \| tokens/s] |
| ------------------------- | :-------------------------------------------: | :-------------------------------------------: | :-----------------------------------------: | :------------------------------------------------: | :----------------------------------------: |
| Moonshine-tiny (fast)     |                0.8s \| 19.0t/s                |                1.5s \| 11.3t/s                |               1.5s \| 10.4t/s               |                   2.0s \| 8.8t/s                   |              1.6s \| 12.5t/s               |
| Moonshine-tiny (balanced) |                2.0s \| 20.0t/s                |                3.2s \| 12.4t/s                |               3.7s \| 10.4t/s               |                  4.6s \| 11.2t/s                   |              3.4s \| 14.6t/s               |
| Moonshine-tiny (quality)  |                4.3s \| 16.8t/s                |                6.6s \| 10.8t/s                |               8.0s \| 8.9t/s                |                  7.7s \| 11.1t/s                   |              6.8s \| 13.1t/s               |
| Whisper-tiny (fast)       |                2.8s \| 5.5t/s                 |                3.7s \| 4.4t/s                 |               4.4s \| 3.4t/s                |                   5.5s \| 3.1t/s                   |               5.3s \| 3.8t/s               |
| Whisper-tiny (balanced)   |                5.6s \| 7.9t/s                 |                7.0s \| 6.3t/s                 |               8.3s \| 5.0t/s                |                   8.4s \| 6.7t/s                   |               7.7s \| 7.2t/s               |
| Whisper-tiny (quality)    |                10.3s \| 8.3t/s                |                12.6s \| 6.8t/s                |               7.8s \| 8.9t/s                |                  13.5s \| 7.1t/s                   |              12.9s \| 7.5t/s               |

### Encoding

Average time for encoding audio of given length over 10 runs. For `Whisper` model we only list 30 sec audio chunks since `Whisper` does not accept other lengths (for shorter audio the audio needs to be padded to 30sec with silence).

| Model                | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| -------------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| Moonshine-tiny (5s)  |              99              |              95              |            115             |                284                |            277            |
| Moonshine-tiny (10s) |             178              |             177              |            204             |                555                |            528            |
| Moonshine-tiny (30s) |             580              |             576              |            689             |               1726                |           1617            |
| Whisper-tiny (30s)   |             1034             |             1344             |            1269            |               2916                |           2143            |

### Decoding

Average time for decoding one token in sequence of 100 tokens, with encoding context obtained from audio of noted length.

| Model                | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| -------------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| Moonshine-tiny (5s)  |            48.98             |            47.98             |           46.86            |               36.70               |           29.03           |
| Moonshine-tiny (10s) |            54.24             |            51.74             |           55.07            |               46.31               |           32.41           |
| Moonshine-tiny (30s) |            76.38             |            76.19             |           87.37            |               65.61               |           45.04           |
| Whisper-tiny (30s)   |            128.03            |            113.65            |           141.63           |               89.08               |           84.49           |

## Text Embeddings

| Model                      | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro Max (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) | OnePlus 12 (XNNPACK) [ms] |
| -------------------------- | :--------------------------: | :------------------------------: | :------------------------: | :--------------------------: | :-----------------------: |
| ALL_MINILM_L6_V2           |              53              |                69                |             78             |              60              |            65             |
| ALL_MPNET_BASE_V2          |             352              |               423                |            478             |             521              |            527            |
| MULTI_QA_MINILM_L6_COS_V1  |             135              |               166                |            180             |             158              |            165            |
| MULTI_QA_MPNET_BASE_DOT_V1 |             503              |               598                |            680             |             694              |            743            |
