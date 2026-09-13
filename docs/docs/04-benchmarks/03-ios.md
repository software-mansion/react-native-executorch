---
title: iOS
slug: /benchmarks/ios
description: 'XNNPACK against Core ML and MLX on iPhone 17 and iPhone SE (3rd gen), for all 124 published iOS model variants.'
keywords:
  [
    react native executorch,
    ios benchmark,
    core ml,
    neural engine,
    mlx,
    xnnpack,
    iphone,
    on-device ai performance,
  ]
---

# iOS

All 124 published iOS variants on an **iPhone 17** (A19) and an **iPhone SE (3rd
gen)** (A15 Bionic). The SE is here on purpose: it is the slowest device the
library currently supports, so it sets the floor.

`share` and `peak MB` are the iPhone 17's. Times are the median of the whole
pipeline in milliseconds; lower is better.

:::tip
Core ML beat XNNPACK in 57 of 58 model families on iPhone 17 and 58 of 58 on the
SE, median 14.7x and 16.8x. If a Core ML variant exists for your model, that is
the one to ship on iOS.
:::

## [Image Classification](../02-extensions/computer-vision/02-image-classification.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `efficientnet-v2-s` | coreml | `fp16` | 4.3 | 6.0 | 76% | 156 | 41 | 44 |
| `efficientnet-v2-s` | xnnpack | `int8` | 35.4 | 53.3 | 97% | 144 | 20 | 23 |

## [Object Detection](../02-extensions/computer-vision/03-object-detection.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `yolo26-nano-size-384` | coreml | `fp16` | 1.2 | 1.8 | 73% | 109 | 28 | 6 |
| `yolo26-nano-size-512` | coreml | `fp16` | 2.1 | 3.5 | 79% | 122 | 28 | 6 |
| `yolo26-small-size-384` | coreml | `fp16` | 2.1 | 3.5 | 87% | 131 | 30 | 20 |
| `yolo26-nano-size-640` | coreml | `fp16` | 3.4 | 4.6 | 85% | 135 | 31 | 6 |
| `yolo26-small-size-512` | coreml | `fp16` | 3.8 | 4.6 | 86% | 144 | 33 | 20 |
| `yolo26-medium-size-384` | coreml | `fp16` | 3.9 | 5.6 | 92% | 175 | 41 | 42 |
| `yolo26-large-size-384` | coreml | `fp16` | 4.4 | 6.2 | 93% | 197 | 51 | 51 |
| `ssdlite320-mobilenet-v3-large` | coreml | `fp16` | 4.5 | 5.9 | 95% | 130 | 66 | 8 |
| `yolo26-small-size-640` | coreml | `fp16` | 4.9 | 5.9 | 89% | 153 | 41 | 20 |
| `yolo26-medium-size-512` | coreml | `fp16` | 6.2 | 9.8 | 91% | 183 | 46 | 42 |
| `yolo26-large-size-512` | coreml | `fp16` | 7.3 | 10.2 | 93% | 203 | 57 | 51 |
| `rfdetr-nano` | coreml | `fp16` | 8.2 | 17.4 | 96% | 162 | 51 | 55 |
| `yolo26-xlarge-size-384` | coreml | `fp16` | 8.5 | 12.7 | 96% | 308 | 63 | 113 |
| `yolo26-medium-size-640` | coreml | `fp16` | 10.5 | 13.9 | 94% | 198 | 55 | 42 |
| `yolo26-large-size-640` | coreml | `fp16` | 12.2 | 16.0 | 95% | 215 | 64 | 51 |
| `ssdlite320-mobilenet-v3-large` | xnnpack | `fp32` | 13.2 | 18.7 | 98% | 125 | 11 | 14 |
| `yolo26-xlarge-size-512` | coreml | `fp16` | 13.9 | 19.0 | 96% | 307 | 71 | 113 |
| `yolo26-nano-size-384` | xnnpack | `fp32` | 16.6 | 22.3 | 98% | 121 | 16 | 10 |
| `yolo26-xlarge-size-640` | coreml | `fp16` | 23.9 | 32.6 | 97% | 312 | 83 | 113 |
| `yolo26-nano-size-512` | xnnpack | `fp32` | 24.9 | 39.3 | 98% | 140 | 16 | 10 |
| `yolo26-nano-size-640` | xnnpack | `fp32` | 34.8 | 60.7 | 98% | 166 | 16 | 10 |
| `yolo26-small-size-384` | xnnpack | `fp32` | 36.2 | 71.4 | 99% | 170 | 26 | 38 |
| `yolo26-small-size-512` | xnnpack | `fp32` | 58.6 | 130.2 | 99% | 199 | 25 | 38 |
| `yolo26-small-size-640` | xnnpack | `fp32` | 90.2 | 214.4 | 99% | 231 | 26 | 38 |
| `yolo26-medium-size-384` | xnnpack | `fp32` | 93.4 | 246.5 | 100% | 248 | 44 | 82 |
| `yolo26-large-size-384` | xnnpack | `fp32` | 119.4 | 314.4 | 100% | 274 | 52 | 100 |
| `rfdetr-nano` | xnnpack | `fp32` | 146.3 | 345.9 | 100% | 247 | 23 | 112 |
| `yolo26-medium-size-512` | xnnpack | `fp32` | 165.7 | 468.2 | 100% | 293 | 42 | 82 |
| `yolo26-large-size-512` | xnnpack | `fp32` | 208.8 | 595.8 | 100% | 323 | 52 | 100 |
| `yolo26-xlarge-size-384` | xnnpack | `fp32` | 259.0 | 734.3 | 100% | 431 | 120 | 223 |
| `yolo26-medium-size-640` | xnnpack | `fp32` | 261.9 | 750.7 | 100% | 366 | 45 | 82 |
| `yolo26-large-size-640` | xnnpack | `fp32` | 329.6 | 968.1 | 100% | 400 | 51 | 100 |
| `yolo26-xlarge-size-512` | xnnpack | `fp32` | 466.1 | 1,382.9 | 100% | 495 | 114 | 223 |
| `yolo26-xlarge-size-640` | xnnpack | `fp32` | 746.9 | 2,253.4 | 100% | 590 | 117 | 223 |

## [Instance Segmentation](../02-extensions/computer-vision/07-instance-segmentation.md)

_Post-processing is mask-bound, so a large share of the pipeline sits outside ExecuTorch. Read `share` before blaming the model._

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `yolo26-nano-size-384` | coreml | `fp16` | 2.7 | 4.2 | 73% | 172 | 32 | 6 |
| `yolo26-small-size-384` | coreml | `fp16` | 4.0 | 6.2 | 81% | 181 | 37 | 22 |
| `yolo26-nano-size-512` | coreml | `fp16` | 5.0 | 7.5 | 70% | 210 | 34 | 6 |
| `yolo26-small-size-512` | coreml | `fp16` | 6.0 | 8.7 | 79% | 212 | 40 | 22 |
| `yolo26-medium-size-384` | coreml | `fp16` | 6.2 | 10.7 | 87% | 232 | 51 | 48 |
| `yolo26-nano-size-640` | coreml | `fp16` | 6.7 | 10.9 | 72% | 252 | 38 | 6 |
| `yolo26-large-size-384` | coreml | `fp16` | 6.8 | 10.3 | 87% | 242 | 61 | 57 |
| `yolo26-small-size-640` | coreml | `fp16` | 8.5 | 15.5 | 81% | 263 | 48 | 22 |
| `fastsam-s` | coreml | `fp16` | 8.6 | 14.3 | 69% | 286 | 37 | 24 |
| `yolo26-medium-size-512` | coreml | `fp16` | 9.8 | 14.9 | 87% | 265 | 55 | 48 |
| `yolo26-large-size-512` | coreml | `fp16` | 11.1 | 17.4 | 86% | 274 | 67 | 57 |
| `yolo26-xlarge-size-384` | coreml | `fp16` | 11.8 | 19.4 | 92% | 321 | 74 | 127 |
| `rfdetr-nano` | coreml | `fp16` | 14.6 | 71.2 | 97% | 306 | 123 | 62 |
| `yolo26-medium-size-640` | coreml | `fp16` | 16.5 | 26.0 | 88% | 291 | 67 | 48 |
| `yolo26-large-size-640` | coreml | `fp16` | 18.0 | 27.6 | 89% | 298 | 76 | 57 |
| `yolo26-xlarge-size-512` | coreml | `fp16` | 20.3 | 28.6 | 92% | 379 | 83 | 127 |
| `yolo26-nano-size-384` | xnnpack | `fp32` | 24.3 | 37.3 | 96% | 186 | 17 | 11 |
| `fastsam-x` | coreml | `fp16` | 29.0 | 41.7 | 89% | 387 | 90 | 145 |
| `yolo26-xlarge-size-640` | coreml | `fp16` | 36.5 | 50.8 | 90% | 412 | 100 | 127 |
| `yolo26-nano-size-512` | xnnpack | `fp32` | 37.6 | 68.7 | 96% | 236 | 19 | 11 |
| `yolo26-nano-size-640` | xnnpack | `fp32` | 53.9 | 107.6 | 96% | 295 | 20 | 11 |
| `yolo26-small-size-384` | xnnpack | `fp32` | 55.2 | 123.0 | 98% | 217 | 26 | 42 |
| `yolo26-small-size-512` | xnnpack | `fp32` | 92.4 | 231.7 | 98% | 260 | 27 | 42 |
| `yolo26-small-size-640` | xnnpack | `fp32` | 141.0 | 380.2 | 99% | 320 | 29 | 42 |
| `fastsam-s` | xnnpack | `fp32` | 153.0 | 449.9 | 98% | 334 | 31 | 47 |
| `yolo26-medium-size-384` | xnnpack | `fp32` | 163.5 | 463.6 | 99% | 287 | 52 | 95 |
| `yolo26-large-size-384` | xnnpack | `fp32` | 193.1 | 535.0 | 99% | 316 | 59 | 112 |
| `rfdetr-nano` | xnnpack | `fp32` | 264.9 | 618.9 | 100% | 312 | 25 | 124 |
| `yolo26-medium-size-512` | xnnpack | `fp32` | 294.6 | 870.2 | 99% | 352 | 52 | 95 |
| `yolo26-large-size-512` | xnnpack | `fp32` | 337.1 | 1,000.2 | 100% | 367 | 60 | 112 |
| `yolo26-xlarge-size-384` | xnnpack | `fp32` | 419.1 | 1,242.7 | 100% | 477 | 147 | 252 |
| `yolo26-medium-size-640` | xnnpack | `fp32` | 467.9 | 1,434.0 | 100% | 423 | 54 | 95 |
| `yolo26-large-size-640` | xnnpack | `fp32` | 535.8 | 1,634.1 | 100% | 442 | 65 | 112 |
| `yolo26-xlarge-size-512` | xnnpack | `fp32` | 756.9 | 2,323.7 | 100% | 543 | 135 | 252 |
| `fastsam-x` | xnnpack | `fp32` | 1,196.3 | 3,846.1 | 100% | 643 | 202 | 289 |
| `yolo26-xlarge-size-640` | xnnpack | `fp32` | 1,214.8 | 3,805.6 | 100% | 634 | 140 | 252 |

## [Semantic Segmentation](../02-extensions/computer-vision/06-semantic-segmentation.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `selfie-segmentation-landscape` | coreml | `fp16` | 1.1 | 1.9 | 22% | 88 | 18 | 1 |
| `selfie-segmentation` | coreml | `fp16` | 1.4 | 2.3 | 22% | 88 | 18 | 1 |
| `selfie-segmentation-landscape` | xnnpack | `fp32` | 3.0 | 3.1 | 68% | 90 | 2 | 0 |
| `selfie-segmentation` | xnnpack | `fp32` | 4.6 | 5.0 | 75% | 96 | 2 | 0 |
| `lraspp-mobilenet-v3-large` | coreml | `fp16` | 10.7 | 16.9 | 41% | 250 | 29 | 7 |
| `lraspp-mobilenet-v3-large` | xnnpack | `int8` | 16.8 | 27.2 | 63% | 245 | 12 | 4 |
| `deeplab-v3-mobilenet-v3-large` | xnnpack | `int8` | 29.4 | 56.5 | 76% | 260 | 16 | 11 |
| `deeplab-v3-mobilenet-v3-large` | coreml | `fp16` | 30.1 | 41.4 | 78% | 269 | 60 | 23 |
| `fcn-resnet50` | coreml | `fp16` | 49.4 | 67.0 | 85% | 338 | 82 | 66 |
| `fcn-resnet101` | coreml | `fp16` | 65.2 | 86.0 | 89% | 255 | 117 | 104 |
| `deeplab-v3-resnet50` | coreml | `fp16` | 103.1 | 119.1 | 91% | 252 | 147 | 80 |
| `deeplab-v3-resnet101` | coreml | `fp16` | 126.2 | 137.9 | 89% | 246 | 173 | 118 |
| `fcn-resnet50` | xnnpack | `int8` | 237.1 | 656.4 | 97% | 333 | 22 | 36 |
| `deeplab-v3-resnet50` | xnnpack | `int8` | 274.0 | 748.1 | 97% | 332 | 24 | 42 |
| `fcn-resnet101` | xnnpack | `int8` | 373.0 | 1,067.3 | 98% | 425 | 27 | 55 |
| `deeplab-v3-resnet101` | xnnpack | `int8` | 415.0 | 1,200.0 | 98% | 426 | 28 | 62 |

## [Pose & Keypoints](../02-extensions/computer-vision/04-pose-and-keypoints.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `yolo26-pose-size-384` | coreml | `fp16` | 1.3 | 1.9 | 76% | 141 | 29 | 7 |
| `yolo26-pose-size-512` | coreml | `fp16` | 1.9 | 2.6 | 85% | 148 | 30 | 7 |
| `yolo26-pose-size-640` | coreml | `fp16` | 3.9 | 5.2 | 83% | 161 | 33 | 7 |
| `blazeface` | xnnpack | `fp32` | 6.5 | 6.9 | 97% | 162 | 2 | 1 |
| `yolo26-pose-size-384` | xnnpack | `fp32` | 18.8 | 28.2 | 98% | 154 | 17 | 12 |
| `yolo26-pose-size-512` | xnnpack | `fp32` | 28.4 | 49.8 | 99% | 173 | 17 | 12 |
| `yolo26-pose-size-640` | xnnpack | `fp32` | 39.9 | 78.7 | 98% | 188 | 18 | 12 |
| `rfdetr-keypoint` | coreml | `fp16` | 40.5 | 204.0 | 99% | 377 | 195 | 75 |
| `rfdetr-keypoint` | xnnpack | `fp32` | 1,202.8 | 2,972.6 | 100% | 803 | 34 | 146 |

## [Style Transfer](../02-extensions/computer-vision/08-style-transfer.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `rain-princess` | coreml | `fp16` | 63.0 | 184.4 | 96% | 255 | 91 | 4 |
| `mosaic` | coreml | `fp16` | 63.0 | 185.2 | 96% | 252 | 90 | 4 |
| `udnie` | coreml | `fp16` | 63.1 | 184.3 | 96% | 437 | 90 | 4 |
| `candy` | coreml | `fp16` | 63.2 | 184.4 | 96% | 256 | 89 | 4 |
| `mosaic` | xnnpack | `int8` | 342.9 | 644.4 | 99% | 1,004 | 12 | 2 |
| `rain-princess` | xnnpack | `int8` | 344.6 | 650.4 | 99% | 994 | 12 | 2 |
| `udnie` | xnnpack | `int8` | 346.6 | 634.3 | 99% | 998 | 13 | 2 |
| `candy` | xnnpack | `int8` | 346.6 | 611.9 | 99% | 997 | 15 | 2 |

## [Speech to Text](../02-extensions/speech/03-speech-to-text.md)

_Decode length follows the audio. This is 10 s of synthetic voice-shaped audio, not speech, so these are optimistic against a real clip._

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `whisper-en-tiny` | coreml | `fp16` | 27.0 | 75.3 | 98% | 610 | 126 | 81 |
| `whisper-tiny` | coreml | `fp16` | 32.6 | 83.6 | 98% | 189 | 124 | 81 |
| `whisper-en-tiny` | mlx | `int8` | 57.1 | 203.9 | 99% | 768 | 57 | 64 |
| `whisper-tiny` | mlx | `int8` | 62.8 | 241.4 | 99% | 720 | 58 | 64 |
| `whisper-en-base` | coreml | `fp16` | 68.6 | 177.7 | 99% | 805 | 174 | 151 |
| `whisper-base` | coreml | `fp16` | 94.0 | 194.7 | 99% | 489 | 179 | 151 |
| `whisper-en-base` | mlx | `int8` | 110.4 | 420.6 | 99% | 1,014 | 63 | 107 |
| `whisper-en-tiny` | xnnpack | `int8` | 162.2 | 378.6 | 99% | 387 | 74 | 180 |
| `whisper-base` | mlx | `int8` | 166.2 | 747.7 | 99% | 1,280 | 64 | 107 |
| `whisper-en-small` | coreml | `fp16` | 228.9 | 632.7 | 100% | 817 | 368 | 489 |
| `whisper-small` | coreml | `fp16` | 276.4 | 700.4 | 100% | 786 | 391 | 489 |
| `whisper-tiny` | xnnpack | `fp32` | 284.2 | 754.8 | 100% | 492 | 81 | 237 |
| `whisper-en-small` | mlx | `int8` | 308.8 | 1,367.2 | 100% | 1,383 | 91 | 294 |
| `whisper-en-base` | xnnpack | `int8` | 355.4 | 876.6 | 100% | 497 | 93 | 252 |
| `whisper-small` | mlx | `int8` | 363.0 | 1,725.5 | 100% | 1,356 | 92 | 294 |
| `whisper-base` | xnnpack | `fp32` | 712.0 | 2,072.7 | 100% | 951 | 145 | 403 |
| `whisper-en-small` | xnnpack | `int8` | 1,192.2 | 4,354.9 | 100% | 793 | 173 | 452 |
| `whisper-small` | xnnpack | `fp32` | 3,274.6 | 12,858.4 | 100% | 1,847 | 254 | 1,133 |

## [Voice Activity Detection](../02-extensions/speech/04-voice-activity-detection.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `fsmn-vad` | xnnpack | `fp32` | 8.4 | 12.8 | 93% | 130 | 2 | 2 |

## Core ML against XNNPACK

Fastest published Core ML variant against the fastest published XNNPACK variant
of the same model. Above `1.00x` means Core ML is faster.

| model | iPhone 17 | iPhone SE (3rd gen) |
|---|---|---|
| `classification/efficientnet-v2-s` | 8.16x | 8.87x |
| `instance-segmentation/fastsam-s` | 17.74x | 31.35x |
| `instance-segmentation/fastsam-x` | 41.28x | 92.23x |
| `instance-segmentation/rfdetr-nano` | 18.15x | 8.70x |
| `instance-segmentation/yolo26-large-size-384` | 28.27x | 52.05x |
| `instance-segmentation/yolo26-large-size-512` | 30.26x | 57.65x |
| `instance-segmentation/yolo26-large-size-640` | 29.70x | 59.12x |
| `instance-segmentation/yolo26-medium-size-384` | 26.45x | 43.33x |
| `instance-segmentation/yolo26-medium-size-512` | 30.12x | 58.52x |
| `instance-segmentation/yolo26-medium-size-640` | 28.29x | 55.17x |
| `instance-segmentation/yolo26-nano-size-384` | 8.90x | 8.91x |
| `instance-segmentation/yolo26-nano-size-512` | 7.46x | 9.22x |
| `instance-segmentation/yolo26-nano-size-640` | 8.06x | 9.87x |
| `instance-segmentation/yolo26-small-size-384` | 13.81x | 19.70x |
| `instance-segmentation/yolo26-small-size-512` | 15.53x | 26.57x |
| `instance-segmentation/yolo26-small-size-640` | 16.53x | 24.49x |
| `instance-segmentation/yolo26-xlarge-size-384` | 35.67x | 64.12x |
| `instance-segmentation/yolo26-xlarge-size-512` | 37.28x | 81.11x |
| `instance-segmentation/yolo26-xlarge-size-640` | 33.28x | 74.90x |
| `keypoint-detection/rfdetr-keypoint` | 29.71x | 14.57x |
| `keypoint-detection/yolo26-pose-size-384` | 14.83x | 15.23x |
| `keypoint-detection/yolo26-pose-size-512` | 14.58x | 19.37x |
| `keypoint-detection/yolo26-pose-size-640` | 10.23x | 15.04x |
| `object-detection/rfdetr-nano` | 17.84x | 19.89x |
| `object-detection/ssdlite320-mobilenet-v3-large` | 2.94x | 3.17x |
| `object-detection/yolo26-large-size-384` | 27.38x | 51.05x |
| `object-detection/yolo26-large-size-512` | 28.68x | 58.24x |
| `object-detection/yolo26-large-size-640` | 27.12x | 60.55x |
| `object-detection/yolo26-medium-size-384` | 24.00x | 43.71x |
| `object-detection/yolo26-medium-size-512` | 26.64x | 47.72x |
| `object-detection/yolo26-medium-size-640` | 24.87x | 54.16x |
| `object-detection/yolo26-nano-size-384` | 13.41x | 12.60x |
| `object-detection/yolo26-nano-size-512` | 12.00x | 11.22x |
| `object-detection/yolo26-nano-size-640` | 10.10x | 13.10x |
| `object-detection/yolo26-small-size-384` | 17.48x | 20.34x |
| `object-detection/yolo26-small-size-512` | 15.35x | 28.06x |
| `object-detection/yolo26-small-size-640` | 18.45x | 36.35x |
| `object-detection/yolo26-xlarge-size-384` | 30.47x | 57.95x |
| `object-detection/yolo26-xlarge-size-512` | 33.48x | 72.94x |
| `object-detection/yolo26-xlarge-size-640` | 31.18x | 69.02x |
| `semantic-segmentation/deeplab-v3-mobilenet-v3-large` | 0.98x | 1.36x |
| `semantic-segmentation/deeplab-v3-resnet101` | 3.29x | 8.70x |
| `semantic-segmentation/deeplab-v3-resnet50` | 2.66x | 6.28x |
| `semantic-segmentation/fcn-resnet101` | 5.72x | 12.42x |
| `semantic-segmentation/fcn-resnet50` | 4.80x | 9.80x |
| `semantic-segmentation/lraspp-mobilenet-v3-large` | 1.56x | 1.61x |
| `semantic-segmentation/selfie-segmentation` | 3.36x | 2.15x |
| `semantic-segmentation/selfie-segmentation-landscape` | 2.84x | 1.60x |
| `speech-to-text/whisper-base` | 7.57x | 10.64x |
| `speech-to-text/whisper-en-base` | 5.18x | 4.93x |
| `speech-to-text/whisper-en-small` | 5.21x | 6.88x |
| `speech-to-text/whisper-en-tiny` | 6.01x | 5.03x |
| `speech-to-text/whisper-small` | 11.85x | 18.36x |
| `speech-to-text/whisper-tiny` | 8.71x | 9.03x |
| `style-transfer/candy` | 5.49x | 3.32x |
| `style-transfer/mosaic` | 5.44x | 3.48x |
| `style-transfer/rain-princess` | 5.47x | 3.53x |
| `style-transfer/udnie` | 5.49x | 3.44x |

Most of the spread is explained by what XNNPACK had to work with. Split the 58
families by whether their fastest XNNPACK build is quantized:

| Fastest XNNPACK build | Families | Median Core ML lead (iPhone 17) |
|---|---|---|
| int8 | 14 | 5.33x |
| fp32 only | 44 | 17.99x |

So a large part of the 14.7x headline is fp32 XNNPACK against fp16 Core ML, not
CPU against Neural Engine. Where XNNPACK has an int8 build the gap narrows to
roughly 5x, and in the single case where Core ML loses,
`deeplab-v3-mobilenet-v3-large` at 0.98x, it is close enough to call a tie.

The lead is *larger* on the older phone. Across the families measured on both,
XNNPACK is a median 2.49x slower on the A15 than on the A19, while Core ML is
only 1.53x slower. Choosing Core ML matters more for users on old hardware, not
less.

## MLX

MLX is published for the six Whisper variants only.

| model | MLX iPhone 17 ms | MLX iPhone SE 3 ms | Core ML iPhone 17 ms | Core ML iPhone SE 3 ms | MLX size MB |
|---|---|---|---|---|---|
| `whisper-base` | 166.2 | 747.7 | 94.0 | 194.7 | 107 |
| `whisper-en-base` | 110.4 | 420.6 | 68.6 | 177.7 | 107 |
| `whisper-en-small` | 308.8 | 1,367.2 | 228.9 | 632.7 | 294 |
| `whisper-en-tiny` | 57.1 | 203.9 | 27.0 | 75.3 | 64 |
| `whisper-small` | 363.0 | 1,725.5 | 276.4 | 700.4 | 294 |
| `whisper-tiny` | 62.8 | 241.4 | 32.6 | 83.6 | 64 |

MLX is consistently faster than XNNPACK and consistently slower than Core ML on
both phones, at 60% to 79% of the Core ML download. It is the right pick
when the 81 MB to 489 MB Core ML download is the binding constraint rather than
latency.
