---
title: iOS
slug: /benchmarks/ios
description: 'XNNPACK against Core ML and MLX on iPhone 17 and iPhone SE (3rd gen), for all 191 published iOS model variants.'
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

All 191 published iOS variants on an **iPhone 17** (A19), and the 187 of them
that also ran on an **iPhone SE (3rd gen)** (A15 Bionic). The SE is here on
purpose: it is the slowest device the library currently supports, so it sets the
floor. The other four crashed or timed out on the SE, most likely out of
memory.

`share`, `peak MB`, `load ms` and `size MB` are the iPhone 17's. Times are the
median of the whole pipeline in milliseconds; lower is better. See
[Overview](./01-overview.md) for what each task was given as input.

:::tip
Core ML beat XNNPACK in all 75 model families that publish both, median 10.9x on
iPhone 17. If a Core ML variant exists for your model, that is the one to ship on
iOS.
:::

:::note
`???` marks a variant whose measurement is outstanding. `text-embeddings/lfm2-5-embedding-350-m`
`mlx` `int4` failed to load on iPhone 17; it has since been re-exported
and will be measured on the next sweep.
:::

## [Image Classification](../02-extensions/computer-vision/02-image-classification.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `efficientnet-v2-s` | coreml | `fp16` | 4.3 | 5.5 | 77% | 132 | 41 | 42 |
| `efficientnet-v2-s` | xnnpack | `int8` | 36.2 | 54.0 | 97% | 137 | 21 | 22 |
| `efficientnet-v2-s` | xnnpack | `fp32` | 68.8 | 164.1 | 98% | 223 | 26 | 82 |

## [Object Detection](../02-extensions/computer-vision/03-object-detection.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `yolo26-nano-size-384` | coreml | `fp16` | 1.2 | 1.8 | 74% | 105 | 29 | 5 |
| `yolo26-small-size-384` | coreml | `fp16` | 2.2 | 3.7 | 86% | 125 | 34 | 19 |
| `yolo26-nano-size-512` | coreml | `fp16` | 2.3 | 3.1 | 75% | 113 | 32 | 5 |
| `yolo26-nano-size-640` | coreml | `fp16` | 3.3 | 4.6 | 84% | 129 | 32 | 5 |
| `yolo26-small-size-512` | coreml | `fp16` | 3.8 | 4.6 | 83% | 133 | 40 | 19 |
| `yolo26-medium-size-384` | coreml | `fp16` | 4.2 | 5.4 | 92% | 159 | 46 | 40 |
| `yolo26-large-size-384` | coreml | `fp16` | 4.7 | 6.2 | 93% | 171 | 55 | 49 |
| `ssdlite320-mobilenet-v3-large` | coreml | `fp16` | 5.2 | 5.9 | 95% | 127 | 84 | 8 |
| `yolo26-small-size-640` | coreml | `fp16` | 5.2 | 5.7 | 89% | 144 | 43 | 19 |
| `yolo26-medium-size-512` | coreml | `fp16` | 6.7 | 8.2 | 91% | 165 | 50 | 40 |
| `yolo26-large-size-512` | coreml | `fp16` | 7.9 | 11.6 | 92% | 173 | 62 | 49 |
| `rfdetr-nano` | coreml | `fp16` | 8.3 | 14.1 | 96% | 163 | 58 | 52 |
| `yolo26-xlarge-size-384` | coreml | `fp16` | 8.6 | 12.7 | 96% | 273 | 66 | 108 |
| `yolo26-medium-size-640` | coreml | `fp16` | 11.3 | 13.8 | 94% | 178 | 58 | 40 |
| `yolo26-large-size-640` | coreml | `fp16` | 12.9 | 16.1 | 95% | 174 | 67 | 49 |
| `ssdlite320-mobilenet-v3-large` | xnnpack | `fp32` | 14.7 | 22.1 | 98% | 122 | 13 | 13 |
| `yolo26-xlarge-size-512` | coreml | `fp16` | 15.4 | 19.1 | 96% | 272 | 73 | 108 |
| `yolo26-nano-size-384` | xnnpack | `fp32` | 18.2 | 22.2 | 96% | 117 | 16 | 9 |
| `yolo26-xlarge-size-640` | coreml | `fp16` | 26.5 | 32.7 | 97% | 280 | 90 | 108 |
| `yolo26-nano-size-512` | xnnpack | `fp32` | 27.1 | 38.5 | 97% | 135 | 16 | 9 |
| `yolo26-nano-size-640` | xnnpack | `fp32` | 37.1 | 61.8 | 98% | 158 | 17 | 9 |
| `yolo26-small-size-384` | xnnpack | `fp32` | 38.4 | 73.4 | 98% | 162 | 25 | 36 |
| `yolo26-small-size-512` | xnnpack | `fp32` | 64.5 | 139.9 | 99% | 193 | 25 | 36 |
| `yolo26-small-size-640` | xnnpack | `fp32` | 95.3 | 214.0 | 99% | 224 | 26 | 36 |
| `yolo26-medium-size-384` | xnnpack | `fp32` | 102.9 | 257.9 | 100% | 236 | 40 | 78 |
| `yolo26-large-size-384` | xnnpack | `fp32` | 137.8 | 333.1 | 100% | 254 | 50 | 95 |
| `rfdetr-nano` | xnnpack | `fp32` | 165.4 | 401.1 | 100% | 244 | 26 | 106 |
| `yolo26-medium-size-512` | xnnpack | `fp32` | 181.9 | 426.8 | 100% | 279 | 41 | 78 |
| `yolo26-large-size-512` | xnnpack | `fp32` | 262.4 | 630.1 | 100% | 296 | 50 | 95 |
| `yolo26-xlarge-size-384` | xnnpack | `fp32` | 339.6 | 795.8 | 100% | 403 | 116 | 213 |
| `yolo26-medium-size-640` | xnnpack | `fp32` | 350.9 | 736.0 | 100% | 334 | 44 | 78 |
| `yolo26-large-size-640` | xnnpack | `fp32` | 444.4 | 1,016.7 | 100% | 351 | 50 | 95 |
| `yolo26-xlarge-size-512` | xnnpack | `fp32` | 519.5 | 1,429.7 | 100% | 469 | 111 | 213 |
| `yolo26-xlarge-size-640` | xnnpack | `fp32` | 1,350.1 | 3,292.0 | 100% | 546 | 111 | 213 |

## [Instance Segmentation](../02-extensions/computer-vision/07-instance-segmentation.md)

_Post-processing is mask-bound, so a large share of the pipeline sits outside ExecuTorch. Read `share` before blaming the model._

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `yolo26-nano-size-384` | coreml | `fp16` | 3.0 | 4.2 | 73% | 155 | 35 | 6 |
| `yolo26-small-size-384` | coreml | `fp16` | 3.8 | 6.2 | 80% | 165 | 41 | 21 |
| `yolo26-nano-size-512` | coreml | `fp16` | 5.1 | 7.4 | 68% | 210 | 39 | 6 |
| `yolo26-small-size-512` | coreml | `fp16` | 6.3 | 8.7 | 78% | 195 | 45 | 21 |
| `yolo26-medium-size-384` | coreml | `fp16` | 6.8 | 9.6 | 85% | 215 | 53 | 46 |
| `yolo26-nano-size-640` | coreml | `fp16` | 7.1 | 11.2 | 71% | 237 | 39 | 6 |
| `yolo26-large-size-384` | coreml | `fp16` | 7.2 | 10.6 | 86% | 225 | 61 | 55 |
| `fastsam-s` | coreml | `fp16` | 9.6 | 15.0 | 66% | 254 | 42 | 23 |
| `yolo26-small-size-640` | coreml | `fp16` | 9.8 | 16.5 | 79% | 246 | 54 | 21 |
| `yolo26-medium-size-512` | coreml | `fp16` | 10.9 | 16.3 | 86% | 252 | 64 | 46 |
| `yolo26-large-size-512` | coreml | `fp16` | 11.7 | 16.6 | 87% | 258 | 71 | 55 |
| `yolo26-xlarge-size-384` | coreml | `fp16` | 13.0 | 18.1 | 91% | 308 | 79 | 121 |
| `rfdetr-nano` | coreml | `fp16` | 14.7 | 71.6 | 96% | 292 | 132 | 59 |
| `yolo26-medium-size-640` | coreml | `fp16` | 17.8 | 25.4 | 88% | 274 | 70 | 46 |
| `yolo26-large-size-640` | coreml | `fp16` | 20.0 | 28.8 | 89% | 285 | 85 | 55 |
| `yolo26-xlarge-size-512` | coreml | `fp16` | 23.6 | 28.6 | 92% | 365 | 86 | 121 |
| `yolo26-nano-size-384` | xnnpack | `fp32` | 26.3 | 55.4 | 96% | 169 | 18 | 11 |
| `fastsam-x` | coreml | `fp16` | 37.1 | 41.9 | 89% | 371 | 83 | 139 |
| `yolo26-nano-size-512` | xnnpack | `fp32` | 40.6 | 82.8 | 96% | 221 | 19 | 11 |
| `yolo26-xlarge-size-640` | coreml | `fp16` | 43.8 | 50.9 | 91% | 415 | 109 | 121 |
| `yolo26-nano-size-640` | xnnpack | `fp32` | 58.5 | 128.9 | 96% | 279 | 18 | 11 |
| `yolo26-small-size-384` | xnnpack | `fp32` | 59.3 | 146.9 | 98% | 201 | 26 | 40 |
| `yolo26-small-size-512` | xnnpack | `fp32` | 102.7 | 263.1 | 99% | 247 | 26 | 40 |
| `yolo26-small-size-640` | xnnpack | `fp32` | 153.9 | 426.9 | 99% | 303 | 28 | 40 |
| `fastsam-s` | xnnpack | `fp32` | 170.1 | 622.8 | 98% | 312 | 30 | 45 |
| `yolo26-medium-size-384` | xnnpack | `fp32` | 189.8 | 528.7 | 99% | 285 | 50 | 90 |
| `yolo26-large-size-384` | xnnpack | `fp32` | 211.1 | 639.6 | 99% | 299 | 58 | 107 |
| `yolo26-medium-size-512` | xnnpack | `fp32` | 329.1 | 1,442.0 | 100% | 338 | 51 | 90 |
| `rfdetr-nano` | xnnpack | `fp32` | 329.9 | 690.5 | 100% | 295 | 30 | 118 |
| `yolo26-large-size-512` | xnnpack | `fp32` | 451.5 | 1,655.5 | 100% | 356 | 63 | 107 |
| `yolo26-xlarge-size-384` | xnnpack | `fp32` | 524.1 | 2,030.0 | 100% | 462 | 135 | 240 |
| `yolo26-medium-size-640` | xnnpack | `fp32` | 626.1 | 2,250.1 | 100% | 411 | 50 | 90 |
| `yolo26-large-size-640` | xnnpack | `fp32` | 702.0 | 2,578.3 | 100% | 431 | 63 | 107 |
| `yolo26-xlarge-size-512` | xnnpack | `fp32` | 952.1 | 3,664.2 | 100% | 531 | 130 | 240 |
| `fastsam-x` | xnnpack | `fp32` | 1,500.4 | 5,736.9 | 100% | 633 | 192 | 276 |
| `yolo26-xlarge-size-640` | xnnpack | `fp32` | 1,555.9 | 5,635.0 | 100% | 615 | 131 | 240 |

## [Semantic Segmentation](../02-extensions/computer-vision/06-semantic-segmentation.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `selfie-segmentation-landscape` | coreml | `fp16` | 1.1 | 1.9 | 21% | 86 | 18 | 1 |
| `selfie-segmentation` | coreml | `fp16` | 1.4 | 2.3 | 22% | 86 | 20 | 1 |
| `selfie-segmentation-landscape` | xnnpack | `fp32` | 3.1 | 3.1 | 68% | 88 | 2 | 0 |
| `selfie-segmentation` | xnnpack | `fp32` | 4.7 | 5.2 | 76% | 96 | 2 | 0 |
| `lraspp-mobilenet-v3-large` | coreml | `fp16` | 10.8 | 17.0 | 42% | 248 | 29 | 7 |
| `lraspp-mobilenet-v3-large` | xnnpack | `int8` | 18.1 | 28.9 | 62% | 242 | 13 | 3 |
| `lraspp-mobilenet-v3-large` | xnnpack | `fp32` | 28.7 | 58.1 | 74% | 250 | 13 | 12 |
| `deeplab-v3-mobilenet-v3-large` | coreml | `fp16` | 31.2 | 52.1 | 78% | 246 | 61 | 21 |
| `deeplab-v3-mobilenet-v3-large` | xnnpack | `int8` | 32.3 | 80.6 | 75% | 259 | 18 | 11 |
| `fcn-resnet50` | coreml | `fp16` | 51.1 | 107.2 | 84% | 264 | 82 | 63 |
| `fcn-resnet101` | coreml | `fp16` | 69.7 | 88.5 | 87% | 258 | 117 | 100 |
| `deeplab-v3-mobilenet-v3-large` | xnnpack | `fp32` | 89.6 | 262.2 | 90% | 289 | 29 | 42 |
| `deeplab-v3-resnet50` | coreml | `fp16` | 105.5 | 197.9 | 91% | 246 | 154 | 76 |
| `deeplab-v3-resnet101` | coreml | `fp16` | 126.5 | 249.0 | 92% | 245 | 194 | 112 |
| `fcn-resnet50` | xnnpack | `int8` | 273.6 | 1,128.1 | 97% | 331 | 23 | 34 |
| `deeplab-v3-resnet50` | xnnpack | `int8` | 294.3 | 1,270.5 | 97% | 326 | 25 | 40 |
| `fcn-resnet101` | xnnpack | `int8` | 425.9 | 1,758.8 | 98% | 423 | 26 | 52 |
| `deeplab-v3-resnet101` | xnnpack | `int8` | 521.2 | 1,960.2 | 98% | 423 | 28 | 59 |
| `fcn-resnet50` | xnnpack | `fp32` | 1,424.9 | 4,865.3 | 99% | 551 | 73 | 126 |
| `deeplab-v3-resnet50` | xnnpack | `fp32` | 1,456.2 | 5,725.8 | 99% | 523 | 92 | 151 |
| `fcn-resnet101` | xnnpack | `fp32` | 2,258.0 | 7,542.9 | 99% | 778 | 111 | 198 |
| `deeplab-v3-resnet101` | xnnpack | `fp32` | 2,523.8 | 8,421.6 | 99% | 897 | 125 | 224 |

## [Pose & Keypoints](../02-extensions/computer-vision/04-pose-and-keypoints.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `yolo26-pose-size-384` | coreml | `fp16` | 1.2 | 1.9 | 75% | 112 | 30 | 6 |
| `yolo26-pose-size-512` | coreml | `fp16` | 2.1 | 2.5 | 85% | 120 | 32 | 6 |
| `yolo26-pose-size-640` | coreml | `fp16` | 3.9 | 5.7 | 82% | 133 | 38 | 6 |
| `blazeface` | xnnpack | `fp32` | 6.6 | 7.4 | 97% | 130 | 2 | 1 |
| `yolo26-pose-size-384` | xnnpack | `fp32` | 20.2 | 30.3 | 98% | 123 | 18 | 11 |
| `yolo26-pose-size-512` | xnnpack | `fp32` | 30.3 | 55.4 | 99% | 143 | 18 | 11 |
| `yolo26-pose-size-640` | xnnpack | `fp32` | 42.1 | 90.2 | 98% | 159 | 18 | 11 |
| `rfdetr-keypoint` | coreml | `fp16` | 55.4 | 346.5 | 98% | 353 | 202 | 72 |
| `rfdetr-keypoint` | xnnpack | `fp32` | 1,360.4 | 3,935.7 | 100% | 775 | 33 | 139 |

## [Style Transfer](../02-extensions/computer-vision/08-style-transfer.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `candy` | coreml | `fp16` | 63.0 | 181.8 | 96% | 255 | 90 | 4 |
| `rain-princess` | coreml | `fp16` | 63.2 | 200.3 | 96% | 255 | 91 | 4 |
| `mosaic` | coreml | `fp16` | 63.3 | 201.8 | 96% | 253 | 90 | 4 |
| `udnie` | coreml | `fp16` | 70.4 | 200.6 | 94% | 256 | 90 | 4 |
| `candy` | xnnpack | `int8` | 349.7 | 648.4 | 99% | 989 | 15 | 2 |
| `mosaic` | xnnpack | `int8` | 394.1 | 721.1 | 99% | 991 | 15 | 2 |
| `rain-princess` | xnnpack | `int8` | 401.8 | 924.6 | 99% | 993 | 15 | 2 |
| `udnie` | xnnpack | `int8` | 404.8 | 922.4 | 99% | 994 | 16 | 2 |
| `candy` | xnnpack | `fp32` | 746.0 | 1,935.0 | 100% | 1,205 | 18 | 6 |
| `mosaic` | xnnpack | `fp32` | 787.6 | 2,668.8 | 99% | 1,149 | 19 | 6 |
| `rain-princess` | xnnpack | `fp32` | 810.2 | 2,666.2 | 99% | 1,151 | 22 | 6 |
| `udnie` | xnnpack | `fp32` | 811.9 | 2,674.7 | 99% | 1,152 | 21 | 6 |

## [Image Embeddings](../02-extensions/computer-vision/09-image-embeddings.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `clip-vit-base-patch32` | coreml | `fp16` | 3.1 | 6.0 | 95% | 621 | 50 | 168 |
| `clip-vit-base-patch32` | mlx | `int8` | 10.2 | 25.0 | 98% | 570 | 20 | 94 |
| `clip-vit-base-patch32` | xnnpack | `fp32` | 38.4 | 82.3 | 99% | 790 | 62 | 335 |

## [OCR](../02-extensions/computer-vision/05-optical-character-recognition.md)

_The recognizer runs once per region the detector finds, so cost scales with how much text is in the image. `default` is the registry variant that carries no precision suffix (`paddle-ppocrv6-small-coreml`, `-xnnpack`); it is quantized, and the `fp32` row is the unmodified build._

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `paddle-ppocrv6-small` | coreml | `default` | 6.7 | 9.5 | 74% | 710 | 116 | 8 |
| `paddle-ppocrv6-small` | xnnpack | `default` | 107.3 | 167.3 | 98% | 777 | 27 | 23 |
| `paddle-ppocrv6-small` | xnnpack | `fp32` | 117.2 | 198.2 | 98% | 854 | 25 | 30 |

## [Text to Image](../02-extensions/computer-vision/10-text-to-image.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `sdxs-512-dreamshaper` | coreml | `fp16` | 108.1 | - | 95% | 1,523 | 1,436 | 843 |
| `sdxs-512-dreamshaper` | xnnpack | `fp32` | 2,792.7 | - | 100% | 2,859 | 1,264 | 1,682 |

## [Text Embeddings](../02-extensions/natural-language/03-text-embeddings.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `multi-qa-minilm-l6-cos-v1` | coreml | `fp16` | 1.3 | 1.9 | 95% | 425 | 30 | 44 |
| `all-minilm-l6-v2` | coreml | `fp16` | 1.3 | 1.9 | 95% | 425 | 31 | 44 |
| `paraphrase-multilingual-minilm-l12-v2` | coreml | `fp16` | 3.0 | 4.0 | 97% | 741 | 255 | 241 |
| `clip-vit-base-patch32-text` | coreml | `fp16` | 5.1 | 7.9 | 95% | 473 | 76 | 124 |
| `distiluse-base-multilingual-cased-v2` | mlx | `int8` | 5.8 | 19.2 | 99% | 521 | 68 | 136 |
| `distiluse-base-multilingual-cased-v2` | coreml | `fp16` | 7.2 | 8.4 | 99% | 674 | 97 | 261 |
| `multi-qa-minilm-l6-cos-v1` | xnnpack | `fp32` | 8.7 | 14.0 | 99% | 519 | 25 | 87 |
| `all-minilm-l6-v2` | xnnpack | `fp32` | 8.8 | 14.5 | 99% | 480 | 25 | 87 |
| `distiluse-base-multilingual-cased-v2` | xnnpack | `8da4w` | 11.9 | 18.5 | 100% | 799 | 103 | 378 |
| `paraphrase-multilingual-minilm-l12-v2` | xnnpack | `8da4w` | 13.2 | 15.4 | 99% | 899 | 260 | 395 |
| `paraphrase-multilingual-minilm-l12-v2` | xnnpack | `fp32` | 20.1 | 32.7 | 99% | 978 | 363 | 465 |
| `distiluse-base-multilingual-cased-v2` | xnnpack | `fp32` | 23.8 | 53.0 | 100% | 944 | 114 | 518 |
| `clip-vit-base-patch32-text` | xnnpack | `fp32` | 28.4 | 53.3 | 99% | 594 | 74 | 244 |
| `multi-qa-mpnet-base-dot-v1` | xnnpack | `fp32` | 42.0 | 98.7 | 100% | 887 | 78 | 416 |
| `all-mpnet-base-v2` | xnnpack | `fp32` | 42.1 | 104.2 | 100% | 853 | 79 | 416 |
| `lfm2-5-embedding-350-m` | xnnpack | `8da4w` | 66.8 | 134.8 | 100% | 1,029 | 264 | 553 |
| `lfm2-5-embedding-350-m` | mlx | `int4` | ??? | 81.0 | ??? | ??? | ??? | ??? |

## [Privacy Filter](../02-extensions/natural-language/04-privacy-filter.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `openai` | mlx | `int4` | 141.6 | 342.2 | 99% | 1,793 | 554 | 861 |
| `nemotron` | mlx | `int8` | 168.4 | - | 98% | 2,411 | 762 | 1,527 |
| `openai` | xnnpack | `8da4w` | 496.2 | 588.8 | 100% | 2,073 | 1,279 | 1,211 |
| `nemotron` | xnnpack | `8da4w` | 497.6 | 588.7 | 99% | 2,133 | 1,108 | 1,211 |

## [Speech to Text](../02-extensions/speech/03-speech-to-text.md)

_Decode length follows the audio. This is 10 s of synthetic voice-shaped audio, not speech, so these are optimistic against a real clip._

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `whisper-en-tiny` | coreml | `fp16` | 30.9 | 75.7 | 98% | 488 | 149 | 77 |
| `whisper-tiny` | coreml | `fp16` | 34.1 | 83.5 | 98% | 174 | 150 | 77 |
| `whisper-en-tiny` | mlx | `int8` | 57.1 | 203.4 | 99% | 780 | 57 | 61 |
| `whisper-tiny` | mlx | `int8` | 64.7 | 240.2 | 99% | 706 | 55 | 61 |
| `whisper-en-tiny` | mlx | `bf16` | 68.0 | 166.8 | 99% | 1,042 | 56 | 77 |
| `whisper-tiny` | mlx | `bf16` | 76.0 | 193.7 | 99% | 990 | 60 | 77 |
| `whisper-en-base` | coreml | `fp16` | 81.7 | 188.1 | 99% | 519 | 196 | 144 |
| `whisper-base` | coreml | `fp16` | 101.5 | 219.8 | 99% | 479 | 226 | 144 |
| `whisper-en-base` | mlx | `int8` | 110.6 | 445.9 | 99% | 975 | 63 | 102 |
| `whisper-en-base` | mlx | `bf16` | 137.5 | 345.0 | 99% | 1,879 | 64 | 143 |
| `whisper-base` | mlx | `int8` | 167.7 | 930.0 | 99% | 1,310 | 63 | 102 |
| `whisper-base` | mlx | `bf16` | 181.8 | 734.9 | 99% | 1,871 | 65 | 143 |
| `whisper-en-small` | coreml | `fp16` | 247.5 | 634.1 | 100% | 706 | 440 | 467 |
| `whisper-en-tiny` | xnnpack | `int8` | 266.5 | 497.4 | 99% | 684 | 75 | 172 |
| `whisper-en-tiny` | xnnpack | `fp32` | 270.1 | 935.0 | 100% | 741 | 80 | 226 |
| `whisper-en-small` | mlx | `int8` | 336.9 | 1,377.6 | 100% | 1,265 | 87 | 280 |
| `whisper-tiny` | xnnpack | `fp32` | 371.8 | 829.9 | 100% | 472 | 82 | 226 |
| `whisper-en-base` | xnnpack | `int8` | 393.1 | 1,309.5 | 100% | 845 | 95 | 240 |
| `whisper-small` | coreml | `fp16` | 446.0 | 701.1 | 100% | 706 | 470 | 467 |
| `whisper-small` | mlx | `int8` | 467.9 | 2,381.7 | 100% | 1,279 | 90 | 280 |
| `whisper-base` | xnnpack | `fp32` | 911.7 | 2,963.0 | 100% | 939 | 131 | 384 |
| `whisper-en-base` | xnnpack | `fp32` | 1,079.8 | 2,797.2 | 100% | 982 | 110 | 384 |
| `whisper-en-small` | xnnpack | `int8` | 1,645.5 | 4,152.3 | 100% | 1,118 | 172 | 431 |
| `whisper-small` | xnnpack | `fp32` | 4,020.3 | 12,340.4 | 100% | 1,772 | 456 | 1,081 |
| `whisper-en-small` | xnnpack | `fp32` | 4,723.0 | 10,908.0 | 100% | 1,779 | 291 | 1,080 |

## [Text to Speech](../02-extensions/speech/02-text-to-speech.md)

_Cost scales with sentence length. This is one fixed 2-sentence paragraph._

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `supertonic` | mlx | `fp32` | 609.8 | 1,208.4 | 98% | 1,188 | 65 | 382 |
| `kokoro-pt` | coreml | `fp32` | 1,276.8 | 1,434.9 | 98% | 577 | 769 | 355 |
| `kokoro-fr` | coreml | `fp32` | 1,330.9 | 1,610.9 | 98% | 598 | 682 | 355 |
| `kokoro-it` | coreml | `fp32` | 1,456.6 | 1,570.8 | 98% | 588 | 764 | 355 |
| `kokoro-de` | coreml | `fp32` | 1,601.9 | 1,280.2 | 98% | 580 | 759 | 355 |
| `kokoro-en-us` | coreml | `fp32` | 1,632.8 | 1,998.5 | 99% | 588 | 1,203 | 365 |
| `kokoro-pl` | coreml | `fp32` | 1,766.4 | - | 98% | 591 | 836 | 355 |
| `kokoro-es` | coreml | `fp32` | 1,785.4 | 1,679.3 | 99% | 580 | 759 | 355 |
| `kokoro-hi` | coreml | `fp32` | 1,896.9 | 1,770.8 | 99% | 642 | 799 | 358 |
| `kokoro-en-gb` | coreml | `fp32` | 1,959.1 | 1,900.4 | 99% | 583 | 914 | 364 |
| `supertonic` | xnnpack | `fp32` | 2,086.3 | 4,659.8 | 100% | 1,294 | 103 | 382 |
| `kokoro-pt` | xnnpack | `fp32` | 2,822.3 | 8,033.1 | 99% | 1,226 | 360 | 324 |
| `kokoro-en-us` | xnnpack | `fp32` | 2,841.9 | 7,313.0 | 100% | 1,243 | 677 | 334 |
| `kokoro-it` | xnnpack | `fp32` | 2,856.6 | 8,335.8 | 99% | 1,235 | 369 | 324 |
| `kokoro-en-gb` | xnnpack | `fp32` | 3,266.1 | 8,205.7 | 99% | 1,226 | 505 | 333 |
| `kokoro-pl` | xnnpack | `fp32` | 3,432.3 | 6,005.6 | 99% | 1,247 | 297 | 324 |
| `kokoro-es` | xnnpack | `fp32` | 3,447.9 | 8,008.3 | 99% | 1,205 | 358 | 324 |
| `kokoro-fr` | xnnpack | `fp32` | 3,584.2 | 8,115.8 | 99% | 1,208 | 316 | 324 |
| `kokoro-de` | xnnpack | `fp32` | 3,698.1 | 8,159.5 | 99% | 1,268 | 312 | 324 |
| `kokoro-hi` | xnnpack | `fp32` | 3,836.1 | 8,969.1 | 99% | 1,249 | 408 | 327 |

## [Voice Activity Detection](../02-extensions/speech/04-voice-activity-detection.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `fsmn-vad` | xnnpack | `fp32` | 9.2 | 14.0 | 92% | 116 | 2 | 2 |

## Core ML against XNNPACK

Fastest published Core ML variant against the fastest published XNNPACK variant
of the same model. Above `1.00x` means Core ML is faster.

| model | iPhone 17 | iPhone SE (3rd gen) |
|---|---|---|
| `classification/efficientnet-v2-s` | 8.34x | 9.75x |
| `image-embeddings/clip-vit-base-patch32` | 12.46x | 13.63x |
| `instance-segmentation/fastsam-s` | 17.74x | 41.60x |
| `instance-segmentation/fastsam-x` | 40.49x | 136.79x |
| `instance-segmentation/rfdetr-nano` | 22.43x | 9.64x |
| `instance-segmentation/yolo26-large-size-384` | 29.32x | 60.62x |
| `instance-segmentation/yolo26-large-size-512` | 38.76x | 99.55x |
| `instance-segmentation/yolo26-large-size-640` | 35.05x | 89.52x |
| `instance-segmentation/yolo26-medium-size-384` | 28.12x | 54.85x |
| `instance-segmentation/yolo26-medium-size-512` | 30.28x | 88.52x |
| `instance-segmentation/yolo26-medium-size-640` | 35.14x | 88.59x |
| `instance-segmentation/yolo26-nano-size-384` | 8.91x | 13.19x |
| `instance-segmentation/yolo26-nano-size-512` | 8.03x | 11.17x |
| `instance-segmentation/yolo26-nano-size-640` | 8.19x | 11.52x |
| `instance-segmentation/yolo26-small-size-384` | 15.61x | 23.62x |
| `instance-segmentation/yolo26-small-size-512` | 16.30x | 30.20x |
| `instance-segmentation/yolo26-small-size-640` | 15.77x | 25.89x |
| `instance-segmentation/yolo26-xlarge-size-384` | 40.32x | 112.15x |
| `instance-segmentation/yolo26-xlarge-size-512` | 40.38x | 128.30x |
| `instance-segmentation/yolo26-xlarge-size-640` | 35.51x | 110.82x |
| `keypoint-detection/rfdetr-keypoint` | 24.58x | 11.36x |
| `keypoint-detection/yolo26-pose-size-384` | 16.15x | 16.11x |
| `keypoint-detection/yolo26-pose-size-512` | 14.23x | 21.74x |
| `keypoint-detection/yolo26-pose-size-640` | 10.93x | 15.94x |
| `object-detection/rfdetr-nano` | 19.98x | 28.40x |
| `object-detection/ssdlite320-mobilenet-v3-large` | 2.84x | 3.74x |
| `object-detection/yolo26-large-size-384` | 29.19x | 53.91x |
| `object-detection/yolo26-large-size-512` | 33.17x | 54.41x |
| `object-detection/yolo26-large-size-640` | 34.40x | 63.23x |
| `object-detection/yolo26-medium-size-384` | 24.68x | 47.67x |
| `object-detection/yolo26-medium-size-512` | 27.27x | 51.98x |
| `object-detection/yolo26-medium-size-640` | 31.03x | 53.26x |
| `object-detection/yolo26-nano-size-384` | 14.59x | 12.14x |
| `object-detection/yolo26-nano-size-512` | 11.62x | 12.30x |
| `object-detection/yolo26-nano-size-640` | 11.12x | 13.37x |
| `object-detection/yolo26-small-size-384` | 17.38x | 19.89x |
| `object-detection/yolo26-small-size-512` | 17.16x | 30.29x |
| `object-detection/yolo26-small-size-640` | 18.26x | 37.55x |
| `object-detection/yolo26-xlarge-size-384` | 39.39x | 62.86x |
| `object-detection/yolo26-xlarge-size-512` | 33.74x | 75.01x |
| `object-detection/yolo26-xlarge-size-640` | 50.87x | 100.64x |
| `ocr/paddle-ppocrv6-small` | 16.09x | 17.54x |
| `semantic-segmentation/deeplab-v3-mobilenet-v3-large` | 1.04x | 1.55x |
| `semantic-segmentation/deeplab-v3-resnet101` | 4.12x | 7.87x |
| `semantic-segmentation/deeplab-v3-resnet50` | 2.79x | 6.42x |
| `semantic-segmentation/fcn-resnet101` | 6.11x | 19.88x |
| `semantic-segmentation/fcn-resnet50` | 5.36x | 10.52x |
| `semantic-segmentation/lraspp-mobilenet-v3-large` | 1.67x | 1.70x |
| `semantic-segmentation/selfie-segmentation` | 3.25x | 2.27x |
| `semantic-segmentation/selfie-segmentation-landscape` | 2.88x | 1.62x |
| `speech-to-text/whisper-base` | 8.98x | 13.48x |
| `speech-to-text/whisper-en-base` | 4.81x | 6.96x |
| `speech-to-text/whisper-en-small` | 6.65x | 6.55x |
| `speech-to-text/whisper-en-tiny` | 8.64x | 6.57x |
| `speech-to-text/whisper-small` | 9.01x | 17.60x |
| `speech-to-text/whisper-tiny` | 10.91x | 9.94x |
| `style-transfer/candy` | 5.55x | 3.57x |
| `style-transfer/mosaic` | 6.23x | 3.57x |
| `style-transfer/rain-princess` | 6.36x | 4.62x |
| `style-transfer/udnie` | 5.75x | 4.60x |
| `text-embeddings/all-minilm-l6-v2` | 6.77x | 7.84x |
| `text-embeddings/clip-vit-base-patch32-text` | 5.58x | 6.76x |
| `text-embeddings/distiluse-base-multilingual-cased-v2` | 1.66x | 2.19x |
| `text-embeddings/multi-qa-minilm-l6-cos-v1` | 6.69x | 7.50x |
| `text-embeddings/paraphrase-multilingual-minilm-l12-v2` | 4.34x | 3.81x |
| `text-to-image/sdxs-512-dreamshaper` | 25.84x | - |
| `text-to-speech/kokoro-de` | 2.31x | 6.37x |
| `text-to-speech/kokoro-en-gb` | 1.67x | 4.32x |
| `text-to-speech/kokoro-en-us` | 1.74x | 3.66x |
| `text-to-speech/kokoro-es` | 1.93x | 4.77x |
| `text-to-speech/kokoro-fr` | 2.69x | 5.04x |
| `text-to-speech/kokoro-hi` | 2.02x | 5.07x |
| `text-to-speech/kokoro-it` | 1.96x | 5.31x |
| `text-to-speech/kokoro-pl` | 1.94x | - |
| `text-to-speech/kokoro-pt` | 2.21x | 5.60x |

Core ML wins all 75 families, from 1.04x on `deeplab-v3-mobilenet-v3-large`,
close enough to call a tie, to 50.9x on `yolo26-xlarge-size-640`.

Most of the spread is explained by what XNNPACK had to work with. Split the 75
families by whether their fastest XNNPACK build is quantized:

| Fastest XNNPACK build | Families | Median Core ML lead (iPhone 17) |
|---|---|---|
| quantized (`int8`, `8da4w`) | 17 | 5.55x |
| fp32 only | 58 | 15.96x |

So a large part of the 10.9x headline is fp32 XNNPACK against fp16 Core ML, not
CPU against Neural Engine. Where XNNPACK has a quantized build the gap narrows to
roughly 5x.

The lead is *larger* on the older phone. Across the families measured on both,
XNNPACK is a median 2.34x slower on the A15 than on the A19, while Core ML is
only 1.44x slower. Choosing Core ML matters more for users on old hardware, not
less.

## MLX

MLX is published for 16 variants across six tasks. It is not a single verdict.

| model | MLX iPhone 17 ms | Best Core ML ms | Best XNNPACK ms |
|---|---|---|---|
| `privacy-filter/openai` `int4` | 141.6 | - | 496.2 |
| `privacy-filter/nemotron` `int8` | 168.5 | - | 497.6 |
| `text-embeddings/distiluse-base-multilingual-cased-v2` `int8` | 5.8 | 7.2 | 11.9 |
| `image-embeddings/clip-vit-base-patch32` `int8` | 10.2 | 3.1 | 38.4 |
| `text-to-speech/supertonic` `fp32` | 609.8 | - | 2,086.3 |
| `speech-to-text/whisper-*` | 57.1 - 467.9 | 30.9 - 446.0 | 266.5 - 4,723.0 |

Three things follow. For the privacy filter and for `supertonic` there is no Core
ML build, so MLX is the fastest iOS option there, at 2.9x to 3.5x XNNPACK. For
`distiluse` it beats Core ML outright. For Whisper and CLIP it sits between the
two, and its download is 56% to 79% of the Core ML one, which makes it the pick
when size is the binding constraint rather than latency.
