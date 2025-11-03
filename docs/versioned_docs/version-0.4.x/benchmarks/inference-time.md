---
title: Inference Time
---

:::warning warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

## Classification

| Model             | iPhone 17 Pro (Core ML) [ms] | iPhone 16 Pro (Core ML) [ms] | iPhone SE 3 (Core ML) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ----------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| EFFICIENTNET_V2_S |             150              |             161              |            227             |                196                |            214            |

## Object Detection

| Model                          | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------------------------ | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| SSDLITE_320_MOBILENET_V3_LARGE |             261              |             279              |            414             |                125                |            115            |

## Style Transfer

| Model                        | iPhone 17 Pro (Core ML) [ms] | iPhone 16 Pro (Core ML) [ms] | iPhone SE 3 (Core ML) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ---------------------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| STYLE_TRANSFER_CANDY         |             1565             |             1675             |            2325            |               1750                |           1620            |
| STYLE_TRANSFER_MOSAIC        |             1565             |             1675             |            2325            |               1750                |           1620            |
| STYLE_TRANSFER_UDNIE         |             1565             |             1675             |            2325            |               1750                |           1620            |
| STYLE_TRANSFER_RAIN_PRINCESS |             1565             |             1675             |            2325            |               1750                |           1620            |

## OCR

Notice that the recognizer models were executed between 3 and 7 times during a single recognition.
The values below represent the averages across all runs for the benchmark image.

| Model                          | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------------------------ | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| Detector (CRAFT_800_QUANTIZED) |             779              |             897              |            1276            |                553                |            586            |
| Recognizer (CRNN_512)          |              77              |              74              |            244             |                56                 |            57             |
| Recognizer (CRNN_256)          |              35              |              37              |            120             |                28                 |            30             |
| Recognizer (CRNN_128)          |              18              |              19              |             60             |                14                 |            16             |

## Vertical OCR

Notice that the recognizer models, as well as detector CRAFT_320 model, were executed between 4 and 21 times during a single recognition.
The values below represent the averages across all runs for the benchmark image.

| Model                           | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------------------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| Detector (CRAFT_1280_QUANTIZED) |             1918             |             2304             |            3371            |               1391                |           1445            |
| Detector (CRAFT_320_QUANTIZED)  |             473              |             563              |            813             |                361                |            382            |
| Recognizer (CRNN_512)           |              78              |              83              |            310             |                59                 |            57             |
| Recognizer (CRNN_64)            |              9               |              9               |             38             |                 8                 |             7             |

## LLMs

| Model                 | iPhone 17 Pro (XNNPACK) [tokens/s] | iPhone 16 Pro (XNNPACK) [tokens/s] | iPhone SE 3 (XNNPACK) [tokens/s] | Samsung Galaxy S24 (XNNPACK) [tokens/s] | OnePlus 12 (XNNPACK) [tokens/s] |
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

| Model (mode)              | iPhone 17 Pro (XNNPACK) [latency \| tokens/s] | iPhone 16 Pro (XNNPACK) [latency \| tokens/s] | iPhone SE 3 (XNNPACK) [latency \| tokens/s] | Samsung Galaxy S24 (XNNPACK) [latency \| tokens/s] | OnePlus 12 (XNNPACK) [latency \| tokens/s] |
| ------------------------- | :-------------------------------------------: | :-------------------------------------------: | :-----------------------------------------: | :------------------------------------------------: | :----------------------------------------: |
| Moonshine-tiny (fast)     |                0.8s \| 19.0t/s                |                1.5s \| 11.3t/s                |               1.5s \| 10.4t/s               |                   2.0s \| 8.8t/s                   |              1.6s \| 12.5t/s               |
| Moonshine-tiny (balanced) |                2.0s \| 20.0t/s                |                3.2s \| 12.4t/s                |               3.7s \| 10.4t/s               |                  4.6s \| 11.2t/s                   |              3.4s \| 14.6t/s               |
| Moonshine-tiny (quality)  |                4.3s \| 16.8t/s                |                6.6s \| 10.8t/s                |               8.0s \| 8.9t/s                |                  7.7s \| 11.1t/s                   |              6.8s \| 13.1t/s               |
| Whisper-tiny (fast)       |                2.8s \| 5.5t/s                 |                3.7s \| 4.4t/s                 |               4.4s \| 3.4t/s                |                   5.5s \| 3.1t/s                   |               5.3s \| 3.8t/s               |
| Whisper-tiny (balanced)   |                5.6s \| 7.9t/s                 |                7.0s \| 6.3t/s                 |               8.3s \| 5.0t/s                |                   8.4s \| 6.7t/s                   |               7.7s \| 7.2t/s               |
| Whisper-tiny (quality)    |                10.3s \| 8.3t/s                |                12.6s \| 6.8t/s                |               7.8s \| 8.9t/s                |                  13.5s \| 7.1t/s                   |              12.9s \| 7.5t/s               |

### Encoding

Average time for encoding audio of given length over 10 runs. For `Whisper` model we only list 30 sec audio chunks since `Whisper` does not accept other lengths (for shorter audio the audio needs to be padded to 30sec with silence).

| Model                | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| -------------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| Moonshine-tiny (5s)  |              99              |              95              |            115             |                284                |            277            |
| Moonshine-tiny (10s) |             178              |             177              |            204             |                555                |            528            |
| Moonshine-tiny (30s) |             580              |             576              |            689             |               1726                |           1617            |
| Whisper-tiny (30s)   |             1034             |             1344             |            1269            |               2916                |           2143            |

### Decoding

Average time for decoding one token in sequence of 100 tokens, with encoding context is obtained from audio of noted length.

| Model                | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| -------------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| Moonshine-tiny (5s)  |            48.98             |            47.98             |           46.86            |               36.70               |           29.03           |
| Moonshine-tiny (10s) |            54.24             |            51.74             |           55.07            |               46.31               |           32.41           |
| Moonshine-tiny (30s) |            76.38             |            76.19             |           87.37            |               65.61               |           45.04           |
| Whisper-tiny (30s)   |            128.03            |            113.65            |           141.63           |               89.08               |           84.49           |

## Text Embeddings

| Model                      | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| -------------------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| ALL_MINILM_L6_V2           |              50              |              58              |             84             |                58                 |            58             |
| ALL_MPNET_BASE_V2          |             352              |             428              |            879             |                483                |            517            |
| MULTI_QA_MINILM_L6_COS_V1  |             133              |             161              |            269             |                151                |            155            |
| MULTI_QA_MPNET_BASE_DOT_V1 |             502              |             796              |            1216            |                915                |            713            |
