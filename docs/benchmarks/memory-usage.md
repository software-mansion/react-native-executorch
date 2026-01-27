# Memory Usage

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

All the below benchmarks were performed on iPhone 17 Pro (iOS) and OnePlus 12 (Android).

## Classification[​](#classification "Direct link to Classification")

| Model               | Android (XNNPACK) \[MB] | iOS (Core ML) \[MB] |
| ------------------- | ----------------------- | ------------------- |
| EFFICIENTNET\_V2\_S | 230                     | 87                  |

## Object Detection[​](#object-detection "Direct link to Object Detection")

| Model                              | Android (XNNPACK) \[MB] | iOS (XNNPACK) \[MB] |
| ---------------------------------- | ----------------------- | ------------------- |
| SSDLITE\_320\_MOBILENET\_V3\_LARGE | 164                     | 132                 |

## Style Transfer[​](#style-transfer "Direct link to Style Transfer")

| Model                           | Android (XNNPACK) \[MB] | iOS (Core ML) \[MB] |
| ------------------------------- | ----------------------- | ------------------- |
| STYLE\_TRANSFER\_CANDY          | 1200                    | 380                 |
| STYLE\_TRANSFER\_MOSAIC         | 1200                    | 380                 |
| STYLE\_TRANSFER\_UDNIE          | 1200                    | 380                 |
| STYLE\_TRANSFER\_RAIN\_PRINCESS | 1200                    | 380                 |

## OCR[​](#ocr "Direct link to OCR")

| Model                                                                                                       | Android (XNNPACK) \[MB] | iOS (XNNPACK) \[MB] |
| ----------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------- |
| Detector (CRAFT\_800\_QUANTIZED) + Recognizer (CRNN\_512) + Recognizer (CRNN\_256) + Recognizer (CRNN\_128) | 1400                    | 1320                |

## Vertical OCR[​](#vertical-ocr "Direct link to Vertical OCR")

| Model                                                                                         | Android (XNNPACK) \[MB] | iOS (XNNPACK) \[MB] |
| --------------------------------------------------------------------------------------------- | ----------------------- | ------------------- |
| Detector (CRAFT\_1280\_QUANTIZED) + Detector (CRAFT\_320\_QUANTIZED) + Recognizer (CRNN\_512) | 1540                    | 1470                |
| Detector(CRAFT\_1280\_QUANTIZED) + Detector(CRAFT\_320\_QUANTIZED) + Recognizer (CRNN\_64)    | 1070                    | 1000                |

## LLMs[​](#llms "Direct link to LLMs")

| Model                    | Android (XNNPACK) \[GB] | iOS (XNNPACK) \[GB] |
| ------------------------ | ----------------------- | ------------------- |
| LLAMA3\_2\_1B            | 3.3                     | 3.1                 |
| LLAMA3\_2\_1B\_SPINQUANT | 1.9                     | 2.4                 |
| LLAMA3\_2\_1B\_QLORA     | 2.7                     | 2.8                 |
| LLAMA3\_2\_3B            | 7.1                     | 7.3                 |
| LLAMA3\_2\_3B\_SPINQUANT | 3.7                     | 3.8                 |
| LLAMA3\_2\_3B\_QLORA     | 3.9                     | 4.0                 |

## Speech to text[​](#speech-to-text "Direct link to Speech to text")

| Model         | Android (XNNPACK) \[MB] | iOS (XNNPACK) \[MB] |
| ------------- | ----------------------- | ------------------- |
| WHISPER\_TINY | 410                     | 375                 |

## Text Embeddings[​](#text-embeddings "Direct link to Text Embeddings")

| Model                           | Android (XNNPACK) \[MB] | iOS (XNNPACK) \[MB] |
| ------------------------------- | ----------------------- | ------------------- |
| ALL\_MINILM\_L6\_V2             | 95                      | 110                 |
| ALL\_MPNET\_BASE\_V2            | 405                     | 455                 |
| MULTI\_QA\_MINILM\_L6\_COS\_V1  | 120                     | 140                 |
| MULTI\_QA\_MPNET\_BASE\_DOT\_V1 | 435                     | 455                 |
| CLIP\_VIT\_BASE\_PATCH32\_TEXT  | 200                     | 280                 |

## Image Embeddings[​](#image-embeddings "Direct link to Image Embeddings")

| Model                           | Android (XNNPACK) \[MB] | iOS (XNNPACK) \[MB] |
| ------------------------------- | ----------------------- | ------------------- |
| CLIP\_VIT\_BASE\_PATCH32\_IMAGE | 345                     | 340                 |

## Image Segmentation[​](#image-segmentation "Direct link to Image Segmentation")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

Data presented in the following sections is based on inference with non-resized output. When resize is enabled, expect higher memory usage and inference time with higher resolutions.

| Model              | Android (XNNPACK) \[MB] | iOS (XNNPACK) \[MB] |
| ------------------ | ----------------------- | ------------------- |
| DEELABV3\_RESNET50 | 930                     | 660                 |

## Text to Image[​](#text-to-image "Direct link to Text to Image")

| Model                     | Android (XNNPACK) \[MB] | iOS (XNNPACK) \[MB] |
| ------------------------- | ----------------------- | ------------------- |
| BK\_SDM\_TINY\_VPRED\_256 | 2400                    | 2400                |
| BK\_SDM\_TINY\_VPRED      | 6210                    | 6050                |
