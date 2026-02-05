# Inference Time

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.

## Classification[​](#classification "Direct link to Classification")

| Model               | iPhone 17 Pro (Core ML) \[ms] | iPhone 16 Pro (Core ML) \[ms] | iPhone SE 3 (Core ML) \[ms] | Samsung Galaxy S24 (XNNPACK) \[ms] | OnePlus 12 (XNNPACK) \[ms] |
| ------------------- | ----------------------------- | ----------------------------- | --------------------------- | ---------------------------------- | -------------------------- |
| EFFICIENTNET\_V2\_S | 64                            | 68                            | 217                         | 205                                | 198                        |

## Object Detection[​](#object-detection "Direct link to Object Detection")

| Model                              | iPhone 17 Pro (XNNPACK) \[ms] | iPhone 16 Pro (XNNPACK) \[ms] | iPhone SE 3 (XNNPACK) \[ms] | Samsung Galaxy S24 (XNNPACK) \[ms] | OnePlus 12 (XNNPACK) \[ms] |
| ---------------------------------- | ----------------------------- | ----------------------------- | --------------------------- | ---------------------------------- | -------------------------- |
| SSDLITE\_320\_MOBILENET\_V3\_LARGE | 71                            | 74                            | 257                         | 115                                | 109                        |

## Style Transfer[​](#style-transfer "Direct link to Style Transfer")

| Model                           | iPhone 17 Pro (Core ML) \[ms] | iPhone 16 Pro (Core ML) \[ms] | iPhone SE 3 (Core ML) \[ms] | Samsung Galaxy S24 (XNNPACK) \[ms] | OnePlus 12 (XNNPACK) \[ms] |
| ------------------------------- | ----------------------------- | ----------------------------- | --------------------------- | ---------------------------------- | -------------------------- |
| STYLE\_TRANSFER\_CANDY          | 1400                          | 1485                          | 4255                        | 2510                               | 2355                       |
| STYLE\_TRANSFER\_MOSAIC         | 1400                          | 1485                          | 4255                        | 2510                               | 2355                       |
| STYLE\_TRANSFER\_UDNIE          | 1400                          | 1485                          | 4255                        | 2510                               | 2355                       |
| STYLE\_TRANSFER\_RAIN\_PRINCESS | 1400                          | 1485                          | 4255                        | 2510                               | 2355                       |

## OCR[​](#ocr "Direct link to OCR")

Notice that the recognizer models were executed between 3 and 7 times during a single recognition. The values below represent the averages across all runs for the benchmark image.

| Model                           | iPhone 17 Pro \[ms] | iPhone 16 Pro \[ms] | iPhone SE 3 | Samsung Galaxy S24 \[ms] | OnePlus 12 \[ms] |
| ------------------------------- | ------------------- | ------------------- | ----------- | ------------------------ | ---------------- |
| **Total Inference Time**        | 652                 | 600                 | 2855        | 1092                     | 1034             |
| Detector (CRAFT) `forward_800`  | 220                 | 221                 | 1740        | 521                      | 492              |
| Recognizer (CRNN) `forward_512` | 45                  | 38                  | 110         | 40                       | 38               |
| Recognizer (CRNN) `forward_256` | 21                  | 18                  | 54          | 20                       | 19               |
| Recognizer (CRNN) `forward_128` | 11                  | 9                   | 27          | 10                       | 10               |

## Vertical OCR[​](#vertical-ocr "Direct link to Vertical OCR")

Notice that the recognizer models, as well as detector's `forward_320` method, were executed between 4 and 21 times during a single recognition. The values below represent the averages across all runs for the benchmark image.

| Model                           | iPhone 17 Pro<br />\[ms] | iPhone 16 Pro<br />\[ms] | iPhone SE 3 | Samsung Galaxy S24<br />\[ms] | OnePlus 12<br />\[ms] |
| ------------------------------- | ------------------------ | ------------------------ | ----------- | ----------------------------- | --------------------- |
| **Total Inference Time**        | 1104                     | 1113                     | 8840        | 2845                          | 2640                  |
| Detector (CRAFT) `forward_1280` | 501                      | 507                      | 4317        | 1405                          | 1275                  |
| Detector (CRAFT) `forward_320`  | 125                      | 121                      | 1060        | 338                           | 299                   |
| Recognizer (CRNN) `forward_512` | 46                       | 42                       | 109         | 47                            | 37                    |
| Recognizer (CRNN) `forward_64`  | 5                        | 6                        | 14          | 7                             | 6                     |

## LLMs[​](#llms "Direct link to LLMs")

| Model                    | iPhone 16 Pro (XNNPACK) \[tokens/s] | iPhone 13 Pro (XNNPACK) \[tokens/s] | iPhone SE 3 (XNNPACK) \[tokens/s] | Samsung Galaxy S24 (XNNPACK) \[tokens/s] | OnePlus 12 (XNNPACK) \[tokens/s] |
| ------------------------ | ----------------------------------- | ----------------------------------- | --------------------------------- | ---------------------------------------- | -------------------------------- |
| LLAMA3\_2\_1B            | 16.1                                | 11.4                                | ❌                                | 15.6                                     | 19.3                             |
| LLAMA3\_2\_1B\_SPINQUANT | 40.6                                | 16.7                                | 16.5                              | 40.3                                     | 48.2                             |
| LLAMA3\_2\_1B\_QLORA     | 31.8                                | 11.4                                | 11.2                              | 37.3                                     | 44.4                             |
| LLAMA3\_2\_3B            | ❌                                  | ❌                                  | ❌                                | ❌                                       | 7.1                              |
| LLAMA3\_2\_3B\_SPINQUANT | 17.2                                | 8.2                                 | ❌                                | 16.2                                     | 19.4                             |
| LLAMA3\_2\_3B\_QLORA     | 14.5                                | ❌                                  | ❌                                | 14.8                                     | 18.1                             |

❌ - Insufficient RAM.

## Speech to Text[​](#speech-to-text "Direct link to Speech to Text")

### Encoding[​](#encoding "Direct link to Encoding")

Average time for encoding audio of given length over 10 runs. For `Whisper` model we only list 30 sec audio chunks since `Whisper` does not accept other lengths (for shorter audio the audio needs to be padded to 30sec with silence).

| Model              | iPhone 17 Pro (XNNPACK) \[ms] | iPhone 16 Pro (XNNPACK) \[ms] | iPhone SE 3 (XNNPACK) \[ms] | Samsung Galaxy S24 (XNNPACK) \[ms] | OnePlus 12 (XNNPACK) \[ms] |
| ------------------ | ----------------------------- | ----------------------------- | --------------------------- | ---------------------------------- | -------------------------- |
| Whisper-tiny (30s) | 248                           | 254                           | 1145                        | 435                                | 526                        |

### Decoding[​](#decoding "Direct link to Decoding")

Average time for decoding one token in sequence of approximately 100 tokens, with encoding context is obtained from audio of noted length.

| Model              | iPhone 17 Pro (XNNPACK) \[ms] | iPhone 16 Pro (XNNPACK) \[ms] | iPhone SE 3 (XNNPACK) \[ms] | Samsung Galaxy S24 (XNNPACK) \[ms] | OnePlus 12 (XNNPACK) \[ms] |
| ------------------ | ----------------------------- | ----------------------------- | --------------------------- | ---------------------------------- | -------------------------- |
| Whisper-tiny (30s) | 23                            | 25                            | 121                         | 92                                 | 115                        |

## Text to Speech[​](#text-to-speech "Direct link to Text to Speech")

Average time to synthesize speech from an input text of approximately 60 tokens, resulting in 2 to 5 seconds of audio depending on the input and selected voice.

| Model         | iPhone 17 Pro (XNNPACK) \[ms] | OnePlus 12 (XNNPACK) \[ms] |
| ------------- | ----------------------------- | -------------------------- |
| Kokoro-small  | 2051                          | 1548                       |
| Kokoro-medium | 2124                          | 1625                       |

## Text Embeddings[​](#text-embeddings "Direct link to Text Embeddings")

| Model                           | iPhone 17 Pro (XNNPACK) \[ms] | OnePlus 12 (XNNPACK) \[ms] |
| ------------------------------- | ----------------------------- | -------------------------- |
| ALL\_MINILM\_L6\_V2             | 7                             | 21                         |
| ALL\_MPNET\_BASE\_V2            | 24                            | 90                         |
| MULTI\_QA\_MINILM\_L6\_COS\_V1  | 7                             | 19                         |
| MULTI\_QA\_MPNET\_BASE\_DOT\_V1 | 24                            | 88                         |
| CLIP\_VIT\_BASE\_PATCH32\_TEXT  | 14                            | 39                         |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

Benchmark times for text embeddings are highly dependent on the sentence length. The numbers above are based on a sentence of around 80 tokens. For shorter or longer sentences, inference time may vary accordingly.

## Image Embeddings[​](#image-embeddings "Direct link to Image Embeddings")

| Model                           | iPhone 17 Pro (XNNPACK) \[ms] | OnePlus 12 (XNNPACK) \[ms] |
| ------------------------------- | ----------------------------- | -------------------------- |
| CLIP\_VIT\_BASE\_PATCH32\_IMAGE | 18                            | 55                         |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

Image embedding benchmark times are measured using 224×224 pixel images, as required by the model. All input images, whether larger or smaller, are resized to 224×224 before processing. Resizing is typically fast for small images but may be noticeably slower for very large images, which can increase total inference time.

## Image Segmentation[​](#image-segmentation "Direct link to Image Segmentation")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.

| Model              | iPhone 16 Pro (Core ML) \[ms] | iPhone 14 Pro Max (Core ML) \[ms] | Samsung Galaxy S24 (XNNPACK) \[ms] |
| ------------------ | ----------------------------- | --------------------------------- | ---------------------------------- |
| DEELABV3\_RESNET50 | 1000                          | 670                               | 700                                |

## Text to image[​](#text-to-image "Direct link to Text to image")

| Model                     | iPhone 17 Pro (XNNPACK) \[ms] | iPhone 16 Pro (XNNPACK) \[ms] | iPhone SE 3 (XNNPACK) \[ms] | Samsung Galaxy S24 (XNNPACK) \[ms] | OnePlus 12 (XNNPACK) \[ms] |
| ------------------------- | ----------------------------- | ----------------------------- | --------------------------- | ---------------------------------- | -------------------------- |
| BK\_SDM\_TINY\_VPRED\_256 | 21184                         | 21021                         | ❌                          | 18834                              | 16617                      |
