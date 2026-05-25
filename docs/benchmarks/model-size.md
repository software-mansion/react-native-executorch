# Model Size

## Classification[​](#classification "Direct link to Classification")

| Model               | XNNPACK FP32 \[MB] | XNNPACK INT8 \[MB] | Core ML FP32 \[MB] | Core ML FP16 \[MB] |
| ------------------- | ------------------ | ------------------ | ------------------ | ------------------ |
| EFFICIENTNET\_V2\_S | 85.7               | 22.9               | 86.5               | 43.9               |

## Object Detection[​](#object-detection "Direct link to Object Detection")

| Model                              | XNNPACK FP32 \[MB] | Core ML FP32 \[MB] | Core ML FP16 \[MB] |
| ---------------------------------- | ------------------ | ------------------ | ------------------ |
| SSDLITE\_320\_MOBILENET\_V3\_LARGE | 13.9               | 15.6               | 8.46               |
| RF\_DETR\_NANO                     | 112                | -                  | -                  |
| YOLO26N                            | 10.3               | -                  | -                  |
| YOLO26S                            | 38.6               | -                  | -                  |
| YOLO26M                            | 82.3               | -                  | -                  |
| YOLO26L                            | 100                | -                  | -                  |
| YOLO26X                            | 224                | -                  | -                  |

## Instance Segmentation[​](#instance-segmentation "Direct link to Instance Segmentation")

| Model               | XNNPACK \[MB] | Core ML FP32 \[MB] | Core ML FP16 \[MB] |
| ------------------- | ------------- | ------------------ | ------------------ |
| YOLO26N\_SEG        | 11.6          | -                  | -                  |
| YOLO26S\_SEG        | 42.3          | -                  | -                  |
| YOLO26M\_SEG        | 95.4          | -                  | -                  |
| YOLO26L\_SEG        | 113           | -                  | -                  |
| YOLO26X\_SEG        | 252           | -                  | -                  |
| RF\_DETR\_NANO\_SEG | 124           | -                  | -                  |
| FASTSAM\_S          | 47.3          | 47.8               | 24.2               |
| FASTSAM\_X          | 289           | 290                | 145                |

## Style Transfer[​](#style-transfer "Direct link to Style Transfer")

| Model                           | XNNPACK FP32 \[MB] | XNNPACK INT8 \[MB] | Core ML FP32 \[MB] | Core ML FP16 \[MB] |
| ------------------------------- | ------------------ | ------------------ | ------------------ | ------------------ |
| STYLE\_TRANSFER\_CANDY          | 6.82               | 1.84               | 7.12               | 3.79               |
| STYLE\_TRANSFER\_MOSAIC         | 6.82               | 1.84               | 7.12               | 3.79               |
| STYLE\_TRANSFER\_UDNIE          | 6.82               | 1.84               | 7.12               | 3.79               |
| STYLE\_TRANSFER\_RAIN\_PRINCESS | 6.82               | 1.84               | 7.12               | 3.79               |

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

| Model                              | XNNPACK \[GB] |
| ---------------------------------- | ------------- |
| LLAMA3\_2\_1B                      | 2.47          |
| LLAMA3\_2\_1B\_SPINQUANT           | 1.14          |
| LLAMA3\_2\_1B\_QLORA               | 1.18          |
| LLAMA3\_2\_3B                      | 6.43          |
| LLAMA3\_2\_3B\_SPINQUANT           | 2.55          |
| LLAMA3\_2\_3B\_QLORA               | 2.65          |
| QWEN3\_0.6B                        | 1.11          |
| QWEN3\_0.6B\_QUANTIZED             | 0.47          |
| QWEN3\_1.7B                        | 3.21          |
| QWEN3\_1.7B\_QUANTIZED             | 1.21          |
| QWEN3\_4B                          | 7.49          |
| QWEN3\_4B\_QUANTIZED               | 2.50          |
| QWEN2\_5\_0.5B                     | 0.92          |
| QWEN2\_5\_0.5B\_QUANTIZED          | 0.39          |
| QWEN2\_5\_1.5B                     | 2.88          |
| QWEN2\_5\_1.5B\_QUANTIZED          | 1.06          |
| QWEN2\_5\_3B                       | 5.75          |
| QWEN2\_5\_3B\_QUANTIZED            | 1.95          |
| HAMMER2\_1\_0.5B                   | 0.92          |
| HAMMER2\_1\_0.5B\_QUANTIZED        | 0.39          |
| HAMMER2\_1\_1.5B                   | 2.88          |
| HAMMER2\_1\_1.5B\_QUANTIZED        | 1.06          |
| HAMMER2\_1\_3B                     | 5.75          |
| HAMMER2\_1\_3B\_QUANTIZED          | 1.91          |
| PHI4\_MINI                         | 7.15          |
| PHI4\_MINI\_QUANTIZED              | 2.62          |
| SMOLLM2\_135M                      | 0.25          |
| SMOLLM2\_135M\_QUANTIZED           | 0.52          |
| SMOLLM2\_360M                      | 0.67          |
| SMOLLM2\_360M\_QUANTIZED           | 1.27          |
| SMOLLM2\_1.7B                      | 3.19          |
| SMOLLM2\_1.7B\_QUANTIZED           | 0.95          |
| LFM2\_5\_1.2B\_INSTRUCT            | 2.43          |
| LFM2\_5\_1.2B\_INSTRUCT\_QUANTIZED | 0.74          |
| LFM2\_5\_350M\_FP16                | 0.79          |
| LFM2\_5\_350M\_QUANTIZED           | 0.26          |

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

| Model                                                | Size \[MB] |
| ---------------------------------------------------- | ---------- |
| ALL\_MINILM\_L6\_V2                                  | 91         |
| ALL\_MPNET\_BASE\_V2                                 | 438        |
| MULTI\_QA\_MINILM\_L6\_COS\_V1                       | 91         |
| MULTI\_QA\_MPNET\_BASE\_DOT\_V1                      | 438        |
| CLIP\_VIT\_BASE\_PATCH32\_TEXT                       | 254        |
| DISTILUSE\_BASE\_MULTILINGUAL\_CASED\_V2\_8DA4W      | 393        |
| PARAPHRASE\_MULTILINGUAL\_MINILM\_L12\_V2\_QUANTIZED | 397        |

## Image Embeddings[​](#image-embeddings "Direct link to Image Embeddings")

| Model                           | XNNPACK FP32 \[MB] | XNNPACK INT8 \[MB] |
| ------------------------------- | ------------------ | ------------------ |
| CLIP\_VIT\_BASE\_PATCH32\_IMAGE | 352                | 96.4               |

## Semantic Segmentation[​](#semantic-segmentation "Direct link to Semantic Segmentation")

| Model                             | XNNPACK FP32 \[MB] | XNNPACK INT8 \[MB] |
| --------------------------------- | ------------------ | ------------------ |
| DEEPLAB\_V3\_RESNET50             | 168                | 42.4               |
| DEEPLAB\_V3\_RESNET101            | 244                | 61.7               |
| DEEPLAB\_V3\_MOBILENET\_V3\_LARGE | 44.1               | 11.4               |
| LRASPP\_MOBILENET\_V3\_LARGE      | 12.9               | 3.53               |
| FCN\_RESNET50                     | 141                | 35.7               |
| FCN\_RESNET101                    | 217                | 55                 |

## Text to image[​](#text-to-image "Direct link to Text to image")

| Model                | Text encoder (XNNPACK) \[MB] | UNet (XNNPACK) \[MB] | VAE decoder (XNNPACK) \[MB] |
| -------------------- | ---------------------------- | -------------------- | --------------------------- |
| BK\_SDM\_TINY\_VPRED | 492                          | 1290                 | 198                         |

## Voice Activity Detection (VAD)[​](#voice-activity-detection-vad "Direct link to Voice Activity Detection (VAD)")

| Model     | XNNPACK \[MB] |
| --------- | ------------- |
| FSMN\_VAD | 1.83          |
