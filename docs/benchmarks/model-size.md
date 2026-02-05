# Model Size

## Classification[​](#classification "Direct link to Classification")

| Model               | XNNPACK \[MB] | Core ML \[MB] |
| ------------------- | ------------- | ------------- |
| EFFICIENTNET\_V2\_S | 85.6          | 43.9          |

## Object Detection[​](#object-detection "Direct link to Object Detection")

| Model                              | XNNPACK \[MB] |
| ---------------------------------- | ------------- |
| SSDLITE\_320\_MOBILENET\_V3\_LARGE | 13.9          |

## Style Transfer[​](#style-transfer "Direct link to Style Transfer")

| Model                           | XNNPACK \[MB] | Core ML \[MB] |
| ------------------------------- | ------------- | ------------- |
| STYLE\_TRANSFER\_CANDY          | 6.78          | 5.22          |
| STYLE\_TRANSFER\_MOSAIC         | 6.78          | 5.22          |
| STYLE\_TRANSFER\_UDNIE          | 6.78          | 5.22          |
| STYLE\_TRANSFER\_RAIN\_PRINCESS | 6.78          | 5.22          |

## OCR[​](#ocr "Direct link to OCR")

| Model                       | XNNPACK \[MB] |
| --------------------------- | ------------- |
| Detector (CRAFT\_QUANTIZED) | 20.9          |
| Recognizer (CRNN)           | 18.5 - 25.2\* |

\* - The model weights vary depending on the language.

## Vertical OCR[​](#vertical-ocr "Direct link to Vertical OCR")

| Model                       | XNNPACK \[MB] |
| --------------------------- | ------------- |
| Detector (CRAFT\_QUANTIZED) | 20.9          |
| Recognizer (CRNN)           | 18.5 - 25.2\* |

\* - The model weights vary depending on the language.

## LLMs[​](#llms "Direct link to LLMs")

| Model                    | XNNPACK \[GB] |
| ------------------------ | ------------- |
| LLAMA3\_2\_1B            | 2.47          |
| LLAMA3\_2\_1B\_SPINQUANT | 1.14          |
| LLAMA3\_2\_1B\_QLORA     | 1.18          |
| LLAMA3\_2\_3B            | 6.43          |
| LLAMA3\_2\_3B\_SPINQUANT | 2.55          |
| LLAMA3\_2\_3B\_QLORA     | 2.65          |

## Speech to text[​](#speech-to-text "Direct link to Speech to text")

| Model              | XNNPACK \[MB] |
| ------------------ | ------------- |
| WHISPER\_TINY\_EN  | 151           |
| WHISPER\_TINY      | 151           |
| WHISPER\_BASE\_EN  | 290.6         |
| WHISPER\_BASE      | 290.6         |
| WHISPER\_SMALL\_EN | 968           |
| WHISPER\_SMALL     | 968           |

## Text to speech[​](#text-to-speech "Direct link to Text to speech")

| Model          | XNNPACK \[MB] |
| -------------- | ------------- |
| KOKORO\_SMALL  | 329.6         |
| KOKORO\_MEDIUM | 334.4         |

## Text Embeddings[​](#text-embeddings "Direct link to Text Embeddings")

| Model                           | XNNPACK \[MB] |
| ------------------------------- | ------------- |
| ALL\_MINILM\_L6\_V2             | 91            |
| ALL\_MPNET\_BASE\_V2            | 438           |
| MULTI\_QA\_MINILM\_L6\_COS\_V1  | 91            |
| MULTI\_QA\_MPNET\_BASE\_DOT\_V1 | 438           |
| CLIP\_VIT\_BASE\_PATCH32\_TEXT  | 254           |

## Image Embeddings[​](#image-embeddings "Direct link to Image Embeddings")

| Model                           | XNNPACK \[MB] |
| ------------------------------- | ------------- |
| CLIP\_VIT\_BASE\_PATCH32\_IMAGE | 352           |

## Image Segmentation[​](#image-segmentation "Direct link to Image Segmentation")

| Model              | XNNPACK \[MB] |
| ------------------ | ------------- |
| DEELABV3\_RESNET50 | 168           |

## Text to image[​](#text-to-image "Direct link to Text to image")

| Model                | Text encoder (XNNPACK) \[MB] | UNet (XNNPACK) \[MB] | VAE decoder (XNNPACK) \[MB] |
| -------------------- | ---------------------------- | -------------------- | --------------------------- |
| BK\_SDM\_TINY\_VPRED | 492                          | 1290                 | 198                         |

## Voice Activity Detection (VAD)[​](#voice-activity-detection-vad "Direct link to Voice Activity Detection (VAD)")

| Model     | XNNPACK \[MB] |
| --------- | ------------- |
| FSMN\_VAD | 1.83          |
