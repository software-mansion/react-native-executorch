---
title: Android
slug: /benchmarks/android
description: 'Latency, memory and download size for all 124 published Android model variants, measured on a Galaxy S26 Ultra and a Pixel 10.'
keywords:
  [
    react native executorch,
    android benchmark,
    xnnpack,
    vulkan,
    adreno,
    tensor g5,
    on-device ai performance,
  ]
---

# Android

All 124 published Android variants on a **Galaxy S26 Ultra** (Snapdragon SM8850),
plus the 89 of them that also ran on a **Pixel 10** (Tensor G5).

`peak MB`, `load ms` and `share` are the S26 Ultra's. Times are the median of the
whole pipeline in milliseconds; lower is better. See
[Overview](./01-overview.md) for what each task was given as input.

:::note
The two columns are different phones measured on different days. Read down a
column to choose a variant; do not read across to rank the devices.
:::

## [Image Classification](../02-extensions/computer-vision/02-image-classification.md)

| model | backend | precision | S26 Ultra ms | Pixel 10 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `efficientnet-v2-s` | xnnpack | `int8` | 53.5 | 143.9 | 97% | 250 | 29 | 23 |
| `efficientnet-v2-s` | xnnpack | `fp32` | 73.9 | - | 98% | 316 | 55 | 86 |

## [Object Detection](../02-extensions/computer-vision/03-object-detection.md)

| model | backend | precision | S26 Ultra ms | Pixel 10 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `ssdlite320-mobilenet-v3-large` | xnnpack | `fp32` | 22.3 | 52.6 | 96% | 230 | 10 | 14 |
| `yolo26-nano-size-384` | xnnpack | `fp32` | 39.3 | 66.8 | 98% | 224 | 7 | 10 |
| `yolo26-nano-size-512` | xnnpack | `fp32` | 40.0 | 109.3 | 98% | 247 | 13 | 10 |
| `yolo26-small-size-384` | xnnpack | `fp32` | 42.1 | 171.9 | 98% | 283 | 31 | 38 |
| `yolo26-small-size-512` | xnnpack | `fp32` | 63.1 | 209.4 | 98% | 309 | 42 | 38 |
| `yolo26-nano-size-640` | xnnpack | `fp32` | 75.8 | 163.2 | 99% | 275 | 18 | 10 |
| `yolo26-medium-size-384` | xnnpack | `fp32` | 86.7 | 246.9 | 99% | 358 | 72 | 82 |
| `yolo26-small-size-640` | xnnpack | `fp32` | 92.0 | 244.1 | 99% | 349 | 34 | 38 |
| `yolo26-large-size-384` | xnnpack | `fp32` | 115.6 | 276.5 | 99% | 388 | 87 | 100 |
| `yolo26-medium-size-512` | xnnpack | `fp32` | 151.4 | 347.3 | 99% | 411 | 67 | 82 |
| `rfdetr-nano` | xnnpack | `fp32` | 153.4 | 318.8 | 99% | 335 | 72 | 112 |
| `yolo26-large-size-512` | xnnpack | `fp32` | 189.0 | 404.0 | 100% | 427 | 90 | 100 |
| `yolo26-xlarge-size-384` | xnnpack | `fp32` | 202.3 | 453.2 | 100% | 557 | 179 | 223 |
| `yolo26-medium-size-640` | xnnpack | `fp32` | 208.3 | 592.4 | 100% | 478 | 77 | 82 |
| `yolo26-large-size-640` | xnnpack | `fp32` | 253.3 | 590.1 | 100% | 500 | 85 | 100 |
| `yolo26-xlarge-size-512` | xnnpack | `fp32` | 293.8 | 735.5 | 100% | 629 | 174 | 223 |
| `yolo26-xlarge-size-640` | xnnpack | `fp32` | 398.0 | 1,123.3 | 100% | 699 | 175 | 223 |

## [Instance Segmentation](../02-extensions/computer-vision/07-instance-segmentation.md)

_Post-processing is mask-bound, so a large share of the pipeline sits outside ExecuTorch. Read `share` before blaming the model._

| model | backend | precision | S26 Ultra ms | Pixel 10 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `yolo26-nano-size-384` | xnnpack | `fp32` | 25.7 | 100.5 | 96% | 372 | 18 | 11 |
| `yolo26-nano-size-512` | xnnpack | `fp32` | 44.2 | 157.7 | 96% | 397 | 20 | 11 |
| `yolo26-small-size-384` | xnnpack | `fp32` | 56.4 | 219.2 | 98% | 394 | 44 | 42 |
| `yolo26-nano-size-640` | xnnpack | `fp32` | 73.5 | 214.6 | 97% | 458 | 28 | 11 |
| `yolo26-small-size-512` | xnnpack | `fp32` | 96.0 | 314.2 | 98% | 436 | 49 | 42 |
| `fastsam-s` | xnnpack | `fp32` | 132.0 | 327.2 | 98% | 468 | 62 | 47 |
| `yolo26-medium-size-384` | xnnpack | `fp32` | 143.0 | 430.1 | 99% | 460 | 89 | 95 |
| `yolo26-small-size-640` | xnnpack | `fp32` | 143.4 | 390.8 | 99% | 499 | 47 | 42 |
| `yolo26-large-size-384` | xnnpack | `fp32` | 158.6 | 364.3 | 99% | 403 | 85 | 112 |
| `rfdetr-nano` | xnnpack | `fp32` | 161.7 | 322.9 | 99% | 494 | 78 | 124 |
| `yolo26-medium-size-512` | xnnpack | `fp32` | 231.9 | 675.1 | 99% | 523 | 89 | 95 |
| `yolo26-large-size-512` | xnnpack | `fp32` | 235.3 | 561.2 | 99% | 464 | 78 | 112 |
| `yolo26-xlarge-size-384` | xnnpack | `fp32` | 251.3 | 633.8 | 100% | 574 | 157 | 252 |
| `yolo26-medium-size-640` | xnnpack | `fp32` | 282.6 | 732.3 | 99% | 531 | 75 | 95 |
| `yolo26-large-size-640` | xnnpack | `fp32` | 320.9 | 821.5 | 99% | 548 | 85 | 112 |
| `yolo26-xlarge-size-512` | xnnpack | `fp32` | 384.1 | 1,054.2 | 100% | 660 | 158 | 252 |
| `fastsam-x` | xnnpack | `fp32` | 548.3 | 1,650.3 | 99% | 824 | 271 | 289 |
| `yolo26-xlarge-size-640` | xnnpack | `fp32` | 558.0 | 1,600.3 | 100% | 752 | 189 | 252 |

## [Semantic Segmentation](../02-extensions/computer-vision/06-semantic-segmentation.md)

| model | backend | precision | S26 Ultra ms | Pixel 10 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `selfie-segmentation-landscape` | xnnpack | `fp32` | 5.5 | 10.6 | 80% | 215 | 1 | 0 |
| `selfie-segmentation` | xnnpack | `fp32` | 5.6 | 15.9 | 73% | 224 | 2 | 0 |
| `lraspp-mobilenet-v3-large` | xnnpack | `int8` | 29.1 | 103.8 | 74% | 379 | 46 | 4 |
| `lraspp-mobilenet-v3-large` | xnnpack | `fp32` | 33.5 | - | 79% | 415 | 35 | 13 |
| `deeplab-v3-mobilenet-v3-large` | xnnpack | `int8` | 41.1 | 153.0 | 70% | 368 | 62 | 11 |
| `deeplab-v3-mobilenet-v3-large` | xnnpack | `fp32` | 92.4 | - | 84% | 393 | 91 | 44 |
| `fcn-resnet50` | xnnpack | `int8` | 117.9 | 507.8 | 91% | 421 | 138 | 36 |
| `deeplab-v3-resnet50` | xnnpack | `int8` | 161.9 | 543.0 | 92% | 473 | 106 | 42 |
| `fcn-resnet101` | xnnpack | `int8` | 203.3 | 732.4 | 94% | 521 | 179 | 55 |
| `deeplab-v3-resnet101` | xnnpack | `int8` | 242.4 | 753.4 | 96% | 603 | 110 | 62 |
| `fcn-resnet50` | xnnpack | `fp32` | 500.2 | - | 98% | 612 | 227 | 132 |
| `deeplab-v3-resnet50` | xnnpack | `fp32` | 522.3 | - | 98% | 637 | 240 | 159 |
| `fcn-resnet101` | xnnpack | `fp32` | 669.6 | - | 99% | 687 | 186 | 208 |
| `deeplab-v3-resnet101` | xnnpack | `fp32` | 791.0 | - | 99% | 761 | 294 | 234 |

## [Pose & Keypoints](../02-extensions/computer-vision/04-pose-and-keypoints.md)

| model | backend | precision | S26 Ultra ms | Pixel 10 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `blazeface` | xnnpack | `fp32` | 9.3 | 7.2 | 95% | 238 | 2 | 1 |
| `yolo26-pose-size-384` | xnnpack | `fp32` | 19.0 | 82.4 | 97% | 255 | 21 | 12 |
| `yolo26-pose-size-640` | xnnpack | `fp32` | 52.5 | 188.2 | 98% | 293 | 20 | 12 |
| `yolo26-pose-size-512` | xnnpack | `fp32` | 53.5 | 131.1 | 99% | 271 | 24 | 12 |
| `rfdetr-keypoint` | xnnpack | `fp32` | 789.0 | 1,952.9 | 100% | 1,017 | 134 | 146 |

## [Style Transfer](../02-extensions/computer-vision/08-style-transfer.md)

| model | backend | precision | S26 Ultra ms | Pixel 10 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `mosaic` | xnnpack | `int8` | 357.7 | 518.9 | 99% | 1,116 | 53 | 2 |
| `candy` | xnnpack | `int8` | 364.8 | 512.3 | 99% | 1,105 | 32 | 2 |
| `udnie` | xnnpack | `int8` | 436.1 | 540.8 | 99% | 1,139 | 42 | 2 |
| `rain-princess` | xnnpack | `int8` | 557.5 | 510.7 | 99% | 1,103 | 53 | 2 |
| `mosaic` | xnnpack | `fp32` | 700.4 | - | 99% | 1,256 | 46 | 7 |
| `udnie` | xnnpack | `fp32` | 799.2 | - | 99% | 1,259 | 57 | 7 |
| `candy` | xnnpack | `fp32` | 864.8 | - | 99% | 1,249 | 47 | 7 |
| `rain-princess` | xnnpack | `fp32` | 897.2 | - | 99% | 1,256 | 79 | 7 |

## [Image Embeddings](../02-extensions/computer-vision/09-image-embeddings.md)

| model | backend | precision | S26 Ultra ms | Pixel 10 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `clip-vit-base-patch32` | vulkan | `fp16` | 17.4 | 56.8 | 99% | 516 | 108 | 176 |
| `clip-vit-base-patch32` | xnnpack | `fp32` | 24.6 | 55.1 | 98% | 673 | 248 | 352 |

## [OCR](../02-extensions/computer-vision/05-optical-character-recognition.md)

_The recognizer runs once per region the detector finds, so cost scales with how much text is in the image. `default` is the registry variant that carries no precision suffix (`paddle-ppocrv6-small-xnnpack`, `-vulkan`); it is quantized, and the `fp32` row is the unmodified build._

| model | backend | precision | S26 Ultra ms | Pixel 10 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `paddle-ppocrv6-small` | vulkan | `default` | 38.8 | 136.6 | 88% | 583 | 45 | 26 |
| `paddle-ppocrv6-small` | xnnpack | `default` | 187.7 | - | 97% | 569 | 74 | 24 |
| `paddle-ppocrv6-small` | xnnpack | `fp32` | 239.7 | 337.9 | 98% | 690 | 65 | 31 |

## [Text to Image](../02-extensions/computer-vision/10-text-to-image.md)

| model | backend | precision | S26 Ultra ms | Pixel 10 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `sdxs-512-dreamshaper` | xnnpack | `fp32` | 1,216.5 | 2,702.0 | 99% | 2,559 | 1,509 | 1,764 |

## [Text Embeddings](../02-extensions/natural-language/03-text-embeddings.md)

| model | backend | precision | S26 Ultra ms | Pixel 10 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `all-minilm-l6-v2` | vulkan | `fp16` | 3.8 | 19.0 | 98% | 337 | 79 | 46 |
| `multi-qa-minilm-l6-cos-v1` | vulkan | `fp16` | 3.9 | 21.4 | 97% | 368 | 92 | 46 |
| `multi-qa-minilm-l6-cos-v1` | xnnpack | `fp32` | 5.5 | 8.8 | 97% | 408 | 75 | 91 |
| `all-minilm-l6-v2` | xnnpack | `fp32` | 6.6 | 8.3 | 97% | 349 | 101 | 91 |
| `paraphrase-multilingual-minilm-l12-v2` | vulkan | `fp16` | 7.4 | 39.0 | 99% | 686 | 918 | 252 |
| `distiluse-base-multilingual-cased-v2` | xnnpack | `8da4w` | 7.9 | 10.2 | 98% | 691 | 351 | 396 |
| `paraphrase-multilingual-minilm-l12-v2` | xnnpack | `8da4w` | 8.9 | 10.5 | 98% | 827 | 949 | 414 |
| `distiluse-base-multilingual-cased-v2` | vulkan | `fp16` | 10.1 | 36.8 | 99% | 586 | 382 | 273 |
| `clip-vit-base-patch32-text` | vulkan | `fp16` | 12.3 | 49.0 | 96% | 456 | 239 | 129 |
| `paraphrase-multilingual-minilm-l12-v2` | xnnpack | `fp32` | 13.2 | - | 97% | 893 | 1,052 | 487 |
| `distiluse-base-multilingual-cased-v2` | xnnpack | `fp32` | 13.8 | - | 98% | 820 | 487 | 544 |
| `clip-vit-base-patch32-text` | xnnpack | `fp32` | 16.8 | 30.9 | 96% | 560 | 252 | 256 |
| `multi-qa-mpnet-base-dot-v1` | xnnpack | `fp32` | 17.3 | 57.9 | 99% | 758 | 320 | 437 |
| `all-mpnet-base-v2` | vulkan | `fp16` | 17.4 | - | 99% | 553 | 246 | 219 |
| `all-mpnet-base-v2` | xnnpack | `fp32` | 17.4 | 59.1 | 99% | 725 | 394 | 437 |
| `multi-qa-mpnet-base-dot-v1` | vulkan | `fp16` | 17.6 | - | 99% | 587 | 226 | 219 |
| `all-mpnet-base-v2` | vulkan | `int8` | 22.3 | 105.6 | 100% | 460 | 180 | 134 |
| `multi-qa-mpnet-base-dot-v1` | vulkan | `int8` | 22.6 | 106.0 | 100% | 491 | 151 | 134 |
| `lfm2-5-embedding-350-m` | xnnpack | `8da4w` | 37.7 | 71.8 | 99% | 943 | 871 | 580 |

## [Privacy Filter](../02-extensions/natural-language/04-privacy-filter.md)

| model | backend | precision | S26 Ultra ms | Pixel 10 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `openai` | xnnpack | `8da4w` | 255.3 | 329.2 | 99% | 2,151 | 2,395 | 1,270 |
| `nemotron` | xnnpack | `8da4w` | 258.7 | 331.8 | 98% | 2,047 | 2,182 | 1,270 |

## [Speech to Text](../02-extensions/speech/03-speech-to-text.md)

_Decode length follows the audio. This is 10 s of synthetic voice-shaped audio, not speech, so these are optimistic against a real clip._

| model | backend | precision | S26 Ultra ms | Pixel 10 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `whisper-en-tiny` | vulkan | `int8` | 74.0 | 259.7 | 98% | 639 | 142 | 134 |
| `whisper-tiny` | vulkan | `int8` | 79.4 | 271.4 | 98% | 621 | 137 | 134 |
| `whisper-en-tiny` | vulkan | `fp16` | 81.1 | - | 98% | 716 | 146 | 218 |
| `whisper-tiny` | vulkan | `fp16` | 91.3 | - | 98% | 698 | 158 | 218 |
| `whisper-en-tiny` | xnnpack | `int8` | 118.5 | 212.9 | 99% | 536 | 159 | 180 |
| `whisper-en-tiny` | xnnpack | `fp32` | 143.7 | - | 99% | 700 | 143 | 237 |
| `whisper-tiny` | xnnpack | `fp32` | 170.1 | 397.0 | 99% | 659 | 176 | 237 |
| `whisper-base` | vulkan | `int8` | 178.6 | 521.6 | 99% | 821 | 206 | 210 |
| `whisper-en-base` | vulkan | `fp16` | 188.9 | - | 99% | 987 | 204 | 355 |
| `whisper-en-base` | vulkan | `int8` | 202.9 | 513.1 | 98% | 858 | 216 | 210 |
| `whisper-base` | vulkan | `fp16` | 207.8 | - | 99% | 963 | 249 | 355 |
| `whisper-en-base` | xnnpack | `int8` | 256.9 | 459.6 | 99% | 676 | 192 | 252 |
| `whisper-en-base` | xnnpack | `fp32` | 397.6 | - | 100% | 930 | 223 | 403 |
| `whisper-base` | xnnpack | `fp32` | 400.5 | 1,076.9 | 99% | 917 | 234 | 403 |
| `whisper-en-small` | vulkan | `int8` | 619.1 | 1,574.0 | 99% | 1,589 | 470 | 512 |
| `whisper-small` | vulkan | `int8` | 647.8 | 1,641.1 | 99% | 1,577 | 415 | 512 |
| `whisper-small` | vulkan | `fp16` | 751.6 | - | 99% | 1,971 | 682 | 928 |
| `whisper-en-small` | vulkan | `fp16` | 873.2 | - | 99% | 1,944 | 846 | 928 |
| `whisper-en-small` | xnnpack | `int8` | 1,034.1 | 1,610.3 | 100% | 971 | 349 | 452 |
| `whisper-en-small` | xnnpack | `fp32` | 1,732.6 | - | 100% | 1,761 | 619 | 1,133 |
| `whisper-small` | xnnpack | `fp32` | 2,121.5 | 5,848.2 | 100% | 1,744 | 868 | 1,133 |

## [Text to Speech](../02-extensions/speech/02-text-to-speech.md)

_Cost scales with sentence length. This is one fixed 2-sentence paragraph._

| model | backend | precision | S26 Ultra ms | Pixel 10 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `supertonic` | vulkan | `fp16` | 660.5 | - | 98% | 1,586 | 317 | 202 |
| `supertonic` | xnnpack | `fp32` | 904.8 | 2,584.4 | 99% | 1,154 | 344 | 401 |
| `kokoro-en-us` | xnnpack | `fp32` | 1,339.1 | - | 99% | 1,234 | 798 | 350 |
| `kokoro-fr` | xnnpack | `fp32` | 1,841.5 | - | 99% | 1,181 | 453 | 339 |
| `kokoro-de` | xnnpack | `fp32` | 1,859.6 | - | 99% | 1,180 | 439 | 339 |
| `kokoro-en-gb` | xnnpack | `fp32` | 1,873.3 | - | 99% | 1,257 | 667 | 349 |
| `kokoro-it` | xnnpack | `fp32` | 1,895.4 | - | 99% | 1,133 | 488 | 340 |
| `kokoro-es` | xnnpack | `fp32` | 1,935.6 | - | 99% | 1,118 | 493 | 340 |
| `kokoro-pl` | xnnpack | `fp32` | 1,963.2 | - | 99% | 1,111 | 453 | 339 |
| `kokoro-hi` | xnnpack | `fp32` | 2,173.6 | - | 99% | 1,178 | 806 | 343 |
| `kokoro-pt` | xnnpack | `fp32` | 2,658.0 | - | 100% | 1,079 | 476 | 340 |

The nine Kokoro rows are three networks, not nine. `en-us`, `en-gb`, `es`, `fr`,
`it`, `pt` and `hi` all resolve to the same `standard` bundle, `pl` to `polish`
and `de` to `german`. What differs between rows of one bundle is the phonemizer
and the length of that language's test sentence, so the spread is input cost, not
model cost.

## [Voice Activity Detection](../02-extensions/speech/04-voice-activity-detection.md)

| model | backend | precision | S26 Ultra ms | Pixel 10 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `fsmn-vad` | xnnpack | `fp32` | 9.0 | 9.6 | 86% | 244 | 3 | 2 |

## Vulkan

Vulkan is published for 16 model families. It is not uniformly better, and which
way it goes depends on the GPU.

| model | S26 Ultra (Adreno) | Pixel 10 (Tensor G5) |
|---|---|---|
| `image-embeddings/clip-vit-base-patch32` | 1.42x | 0.97x |
| `ocr/paddle-ppocrv6-small` | 4.84x | 2.47x |
| `speech-to-text/whisper-base` | 2.24x | 2.06x |
| `speech-to-text/whisper-en-base` | 1.36x | 0.90x |
| `speech-to-text/whisper-en-small` | 1.67x | 1.02x |
| `speech-to-text/whisper-en-tiny` | 1.60x | 0.82x |
| `speech-to-text/whisper-small` | 3.27x | 3.56x |
| `speech-to-text/whisper-tiny` | 2.14x | 1.46x |
| `text-embeddings/all-minilm-l6-v2` | 1.72x | 0.44x |
| `text-embeddings/all-mpnet-base-v2` | 1.00x | 0.56x |
| `text-embeddings/clip-vit-base-patch32-text` | 1.36x | 0.63x |
| `text-embeddings/distiluse-base-multilingual-cased-v2` | 0.78x | 0.28x |
| `text-embeddings/multi-qa-minilm-l6-cos-v1` | 1.41x | 0.41x |
| `text-embeddings/multi-qa-mpnet-base-dot-v1` | 0.98x | 0.55x |
| `text-embeddings/paraphrase-multilingual-minilm-l12-v2` | 1.21x | 0.27x |
| `text-to-speech/supertonic` | 1.37x | - |

Above `1.00x` means Vulkan is faster than the fastest XNNPACK variant of the same
model. Whisper and OCR win on both GPUs. The text embedders win on the Adreno and
lose badly on the Tensor G5, which is why they are worth measuring on the
hardware you actually ship to.
