# Memory Usage

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

Memory usage values represent the peak memory increase observed while the model was loaded and actively running inference, relative to the baseline app memory before model initialization.

## Classification[​](#classification "Direct link to Classification")

| Model / Device                     | iPhone 17 Pro \[MB] | Google Pixel 10 \[MB] |
| ---------------------------------- | ------------------- | --------------------- |
| EFFICIENTNET\_V2\_S (XNNPACK FP32) | 101                 | 122                   |
| EFFICIENTNET\_V2\_S (XNNPACK INT8) | 62                  | 78                    |
| EFFICIENTNET\_V2\_S (Core ML FP32) | 101                 | -                     |
| EFFICIENTNET\_V2\_S (Core ML FP16) | 87                  | -                     |

## Object Detection[​](#object-detection "Direct link to Object Detection")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)note

Data presented for YOLO models is based on inference with `forward_640` method.

| Model / Device                                    | iPhone 17 Pro \[MB] | Google Pixel 10 \[MB] |
| ------------------------------------------------- | ------------------- | --------------------- |
| SSDLITE\_320\_MOBILENET\_V3\_LARGE (XNNPACK FP32) | 94                  | 104                   |
| SSDLITE\_320\_MOBILENET\_V3\_LARGE (Core ML FP32) | 83                  | -                     |
| SSDLITE\_320\_MOBILENET\_V3\_LARGE (Core ML FP16) | 62                  | -                     |
| RF\_DETR\_NANO (XNNPACK FP32)                     | 145                 | 162                   |
| YOLO26N (XNNPACK FP32)                            | 36                  | 44                    |
| YOLO26S (XNNPACK FP32)                            | 81                  | 82                    |
| YOLO26M (XNNPACK FP32)                            | 123                 | 158                   |
| YOLO26L (XNNPACK FP32)                            | 170                 | 172                   |
| YOLO26X (XNNPACK FP32)                            | 320                 | 309                   |

## Style Transfer[​](#style-transfer "Direct link to Style Transfer")

| Model / Device                                 | iPhone 17 Pro \[MB] | Google Pixel 10 \[MB] |
| ---------------------------------------------- | ------------------- | --------------------- |
| STYLE\_TRANSFER\_CANDY (XNNPACK FP32)          | 1200                | 1200                  |
| STYLE\_TRANSFER\_CANDY (XNNPACK INT8)          | 800                 | 800                   |
| STYLE\_TRANSFER\_CANDY (Core ML FP32)          | 400                 | -                     |
| STYLE\_TRANSFER\_CANDY (Core ML FP16)          | 380                 | -                     |
| STYLE\_TRANSFER\_MOSAIC (XNNPACK FP32)         | 1200                | 1200                  |
| STYLE\_TRANSFER\_MOSAIC (XNNPACK INT8)         | 800                 | 800                   |
| STYLE\_TRANSFER\_MOSAIC (Core ML FP32)         | 400                 | -                     |
| STYLE\_TRANSFER\_MOSAIC (Core ML FP16)         | 380                 | -                     |
| STYLE\_TRANSFER\_UDNIE (XNNPACK FP32)          | 1200                | 1200                  |
| STYLE\_TRANSFER\_UDNIE (XNNPACK INT8)          | 800                 | 800                   |
| STYLE\_TRANSFER\_UDNIE (Core ML FP32)          | 400                 | -                     |
| STYLE\_TRANSFER\_UDNIE (Core ML FP16)          | 380                 | -                     |
| STYLE\_TRANSFER\_RAIN\_PRINCESS (XNNPACK FP32) | 1200                | 1200                  |
| STYLE\_TRANSFER\_RAIN\_PRINCESS (XNNPACK INT8) | 800                 | 800                   |
| STYLE\_TRANSFER\_RAIN\_PRINCESS (Core ML FP32) | 400                 | -                     |
| STYLE\_TRANSFER\_RAIN\_PRINCESS (Core ML FP16) | 380                 | -                     |

## OCR[​](#ocr "Direct link to OCR")

| Model / Device                                      | iPhone 17 Pro \[MB] | OnePlus 12 \[MB] |
| --------------------------------------------------- | ------------------- | ---------------- |
| Detector (CRAFT) + Recognizer (CRNN) (XNNPACK FP32) | 1320                | 1400             |

## Vertical OCR[​](#vertical-ocr "Direct link to Vertical OCR")

| Model / Device                                      | iPhone 17 Pro \[MB] | OnePlus 12 \[MB] |
| --------------------------------------------------- | ------------------- | ---------------- |
| Detector (CRAFT) + Recognizer (CRNN) (XNNPACK FP32) | 1000-1500           | 1000-1600        |

## LLMs[​](#llms "Direct link to LLMs")

| Model / Device                     | iPhone 17 Pro \[GB] | OnePlus 12 \[GB] |
| ---------------------------------- | ------------------- | ---------------- |
| LLAMA3\_2\_1B (XNNPACK)            | 3.1                 | 3.3              |
| LLAMA3\_2\_1B\_SPINQUANT (XNNPACK) | 2.4                 | 1.9              |
| LLAMA3\_2\_1B\_QLORA (XNNPACK)     | 2.8                 | 2.7              |
| LLAMA3\_2\_3B (XNNPACK)            | 7.3                 | 7.1              |
| LLAMA3\_2\_3B\_SPINQUANT (XNNPACK) | 3.8                 | 3.7              |
| LLAMA3\_2\_3B\_QLORA (XNNPACK)     | 4.0                 | 3.9              |

## Speech to Text[​](#speech-to-text "Direct link to Speech to Text")

| Model / Device          | iPhone 17 Pro \[MB] | OnePlus 12 \[MB] |
| ----------------------- | ------------------- | ---------------- |
| WHISPER\_TINY (XNNPACK) | 375                 | 410              |

## Text to Speech[​](#text-to-speech "Direct link to Text to Speech")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)note

The reported memory usage values include the memory footprint of the Phonemis package, which is used for phonemizing input text. Currently, this can range from 100 to 150 MB depending on the device.

| Model / Device           | iPhone 17 Pro \[MB] | OnePlus 12 \[MB] |
| ------------------------ | ------------------- | ---------------- |
| KOKORO\_SMALL (XNNPACK)  | 820                 | 820              |
| KOKORO\_MEDIUM (XNNPACK) | 1100                | 1140             |

## Text Embeddings[​](#text-embeddings "Direct link to Text Embeddings")

| Model / Device                            | iPhone 17 Pro \[MB] | OnePlus 12 \[MB] |
| ----------------------------------------- | ------------------- | ---------------- |
| ALL\_MINILM\_L6\_V2 (XNNPACK)             | 110                 | 95               |
| ALL\_MPNET\_BASE\_V2 (XNNPACK)            | 455                 | 405              |
| MULTI\_QA\_MINILM\_L6\_COS\_V1 (XNNPACK)  | 140                 | 120              |
| MULTI\_QA\_MPNET\_BASE\_DOT\_V1 (XNNPACK) | 455                 | 435              |
| CLIP\_VIT\_BASE\_PATCH32\_TEXT (XNNPACK)  | 280                 | 200              |

## Image Embeddings[​](#image-embeddings "Direct link to Image Embeddings")

| Model / Device                                 | iPhone 17 Pro \[MB] | Google Pixel 10 \[MB] |
| ---------------------------------------------- | ------------------- | --------------------- |
| CLIP\_VIT\_BASE\_PATCH32\_IMAGE (XNNPACK FP32) | 340                 | 345                   |

## Semantic Segmentation[​](#semantic-segmentation "Direct link to Semantic Segmentation")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)note

Data presented in the following sections is based on inference with non-resized output. When resize is enabled, expect higher memory usage and inference time with higher resolutions.

| Model / Device                | iPhone 17 Pro \[MB] | OnePlus 12 \[MB] |
| ----------------------------- | ------------------- | ---------------- |
| DEEPLABV3\_RESNET50 (XNNPACK) | 660                 | 930              |

## Instance Segmentation[​](#instance-segmentation "Direct link to Instance Segmentation")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)note

Data presented in the following sections is based on inference with `forward_640` method.

| Model / Device                | iPhone 17 Pro \[MB] | OnePlus 12 \[MB] |
| ----------------------------- | ------------------- | ---------------- |
| YOLO26N\_SEG (XNNPACK)        | 668                 | 92               |
| YOLO26S\_SEG (XNNPACK)        | 712                 | 220              |
| YOLO26M\_SEG (XNNPACK)        | 815                 | 570              |
| YOLO26L\_SEG (XNNPACK)        | 1024                | 680              |
| YOLO26X\_SEG (XNNPACK)        | 1450                | 1410             |
| RF\_DETR\_NANO\_SEG (XNNPACK) | 603                 | 620              |

## Text to Image[​](#text-to-image "Direct link to Text to Image")

| Model / Device                      | iPhone 17 Pro \[MB] | OnePlus 12 \[MB] |
| ----------------------------------- | ------------------- | ---------------- |
| BK\_SDM\_TINY\_VPRED\_256 (XNNPACK) | 2400                | 2400             |
| BK\_SDM\_TINY\_VPRED (XNNPACK)      | 6050                | 6210             |
