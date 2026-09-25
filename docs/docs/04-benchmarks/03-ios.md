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

All 191 published iOS variants on an **iPhone 17** (A19), and the 124 of them
that also ran on an **iPhone SE (3rd gen)** (A15 Bionic). The SE is here on
purpose: it is the slowest device the library currently supports, so it sets the
floor.

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
`mlx` `int4` failed to load on the published build; it has since been re-exported
and will be measured on the next sweep.
:::

## [Image Classification](../02-extensions/computer-vision/02-image-classification.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `efficientnet-v2-s` | coreml | `fp16` | 4.3 | 6.0 | 77% | 132 | 41 | 42 |
| `efficientnet-v2-s` | xnnpack | `int8` | 36.2 | 53.3 | 97% | 137 | 21 | 22 |
| `efficientnet-v2-s` | xnnpack | `fp32` | 68.8 | - | 98% | 223 | 26 | 82 |

## [Object Detection](../02-extensions/computer-vision/03-object-detection.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `yolo26-nano-size-384` | coreml | `fp16` | 1.2 | 1.8 | 74% | 105 | 29 | 5 |
| `yolo26-small-size-384` | coreml | `fp16` | 2.2 | 3.5 | 86% | 125 | 34 | 19 |
| `yolo26-nano-size-512` | coreml | `fp16` | 2.3 | 3.5 | 75% | 113 | 32 | 5 |
| `yolo26-nano-size-640` | coreml | `fp16` | 3.3 | 4.6 | 84% | 129 | 32 | 5 |
| `yolo26-small-size-512` | coreml | `fp16` | 3.8 | 4.6 | 83% | 133 | 40 | 19 |
| `yolo26-medium-size-384` | coreml | `fp16` | 4.2 | 5.6 | 92% | 159 | 46 | 40 |
| `yolo26-large-size-384` | coreml | `fp16` | 4.7 | 6.2 | 93% | 171 | 55 | 49 |
| `ssdlite320-mobilenet-v3-large` | coreml | `fp16` | 5.2 | 5.9 | 95% | 127 | 84 | 8 |
| `yolo26-small-size-640` | coreml | `fp16` | 5.2 | 5.9 | 89% | 144 | 43 | 19 |
| `yolo26-medium-size-512` | coreml | `fp16` | 6.7 | 9.8 | 91% | 165 | 50 | 40 |
| `yolo26-large-size-512` | coreml | `fp16` | 7.9 | 10.2 | 92% | 173 | 62 | 49 |
| `rfdetr-nano` | coreml | `fp16` | 8.3 | 17.4 | 96% | 163 | 58 | 52 |
| `yolo26-xlarge-size-384` | coreml | `fp16` | 8.6 | 12.7 | 96% | 273 | 66 | 108 |
| `yolo26-medium-size-640` | coreml | `fp16` | 11.3 | 13.9 | 94% | 178 | 58 | 40 |
| `yolo26-large-size-640` | coreml | `fp16` | 12.9 | 16.0 | 95% | 174 | 67 | 49 |
| `ssdlite320-mobilenet-v3-large` | xnnpack | `fp32` | 14.7 | 18.7 | 98% | 122 | 13 | 13 |
| `yolo26-xlarge-size-512` | coreml | `fp16` | 15.4 | 19.0 | 96% | 272 | 73 | 108 |
| `yolo26-nano-size-384` | xnnpack | `fp32` | 18.2 | 22.3 | 96% | 117 | 16 | 9 |
| `yolo26-xlarge-size-640` | coreml | `fp16` | 26.5 | 32.6 | 97% | 280 | 90 | 108 |
| `yolo26-nano-size-512` | xnnpack | `fp32` | 27.1 | 39.3 | 97% | 135 | 16 | 9 |
| `yolo26-nano-size-640` | xnnpack | `fp32` | 37.1 | 60.7 | 98% | 158 | 17 | 9 |
| `yolo26-small-size-384` | xnnpack | `fp32` | 38.4 | 71.4 | 98% | 162 | 25 | 36 |
| `yolo26-small-size-512` | xnnpack | `fp32` | 64.5 | 130.2 | 99% | 193 | 25 | 36 |
| `yolo26-small-size-640` | xnnpack | `fp32` | 95.3 | 214.4 | 99% | 224 | 26 | 36 |
| `yolo26-medium-size-384` | xnnpack | `fp32` | 102.9 | 246.5 | 100% | 236 | 40 | 78 |
| `yolo26-large-size-384` | xnnpack | `fp32` | 137.8 | 314.4 | 100% | 254 | 50 | 95 |
| `rfdetr-nano` | xnnpack | `fp32` | 165.4 | 345.9 | 100% | 244 | 26 | 106 |
| `yolo26-medium-size-512` | xnnpack | `fp32` | 181.9 | 468.2 | 100% | 279 | 41 | 78 |
| `yolo26-large-size-512` | xnnpack | `fp32` | 262.4 | 595.8 | 100% | 296 | 50 | 95 |
| `yolo26-xlarge-size-384` | xnnpack | `fp32` | 339.6 | 734.3 | 100% | 403 | 116 | 213 |
| `yolo26-medium-size-640` | xnnpack | `fp32` | 350.9 | 750.7 | 100% | 334 | 44 | 78 |
| `yolo26-large-size-640` | xnnpack | `fp32` | 444.4 | 968.1 | 100% | 351 | 50 | 95 |
| `yolo26-xlarge-size-512` | xnnpack | `fp32` | 519.5 | 1,382.9 | 100% | 469 | 111 | 213 |
| `yolo26-xlarge-size-640` | xnnpack | `fp32` | 1,350.1 | 2,253.4 | 100% | 546 | 111 | 213 |

## [Instance Segmentation](../02-extensions/computer-vision/07-instance-segmentation.md)

_Post-processing is mask-bound, so a large share of the pipeline sits outside ExecuTorch. Read `share` before blaming the model._

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `yolo26-nano-size-384` | coreml | `fp16` | 3.0 | 4.2 | 73% | 155 | 35 | 6 |
| `yolo26-small-size-384` | coreml | `fp16` | 3.8 | 6.2 | 80% | 165 | 41 | 21 |
| `yolo26-nano-size-512` | coreml | `fp16` | 5.1 | 7.5 | 68% | 210 | 39 | 6 |
| `yolo26-small-size-512` | coreml | `fp16` | 6.3 | 8.7 | 78% | 195 | 45 | 21 |
| `yolo26-medium-size-384` | coreml | `fp16` | 6.8 | 10.7 | 85% | 215 | 53 | 46 |
| `yolo26-nano-size-640` | coreml | `fp16` | 7.1 | 10.9 | 71% | 237 | 39 | 6 |
| `yolo26-large-size-384` | coreml | `fp16` | 7.2 | 10.3 | 86% | 225 | 61 | 55 |
| `fastsam-s` | coreml | `fp16` | 9.6 | 14.3 | 66% | 254 | 42 | 23 |
| `yolo26-small-size-640` | coreml | `fp16` | 9.8 | 15.5 | 79% | 246 | 54 | 21 |
| `yolo26-medium-size-512` | coreml | `fp16` | 10.9 | 14.9 | 86% | 252 | 64 | 46 |
| `yolo26-large-size-512` | coreml | `fp16` | 11.7 | 17.4 | 87% | 258 | 71 | 55 |
| `yolo26-xlarge-size-384` | coreml | `fp16` | 13.0 | 19.4 | 91% | 308 | 79 | 121 |
| `rfdetr-nano` | coreml | `fp16` | 14.7 | 71.2 | 96% | 292 | 132 | 59 |
| `yolo26-medium-size-640` | coreml | `fp16` | 17.8 | 26.0 | 88% | 274 | 70 | 46 |
| `yolo26-large-size-640` | coreml | `fp16` | 20.0 | 27.6 | 89% | 285 | 85 | 55 |
| `yolo26-xlarge-size-512` | coreml | `fp16` | 23.6 | 28.6 | 92% | 365 | 86 | 121 |
| `yolo26-nano-size-384` | xnnpack | `fp32` | 26.3 | 37.3 | 96% | 169 | 18 | 11 |
| `fastsam-x` | coreml | `fp16` | 37.1 | 41.7 | 89% | 371 | 83 | 139 |
| `yolo26-nano-size-512` | xnnpack | `fp32` | 40.6 | 68.7 | 96% | 221 | 19 | 11 |
| `yolo26-xlarge-size-640` | coreml | `fp16` | 43.8 | 50.8 | 91% | 415 | 109 | 121 |
| `yolo26-nano-size-640` | xnnpack | `fp32` | 58.5 | 107.6 | 96% | 279 | 18 | 11 |
| `yolo26-small-size-384` | xnnpack | `fp32` | 59.3 | 123.0 | 98% | 201 | 26 | 40 |
| `yolo26-small-size-512` | xnnpack | `fp32` | 102.7 | 231.7 | 99% | 247 | 26 | 40 |
| `yolo26-small-size-640` | xnnpack | `fp32` | 153.9 | 380.2 | 99% | 303 | 28 | 40 |
| `fastsam-s` | xnnpack | `fp32` | 170.1 | 449.9 | 98% | 312 | 30 | 45 |
| `yolo26-medium-size-384` | xnnpack | `fp32` | 189.8 | 463.6 | 99% | 285 | 50 | 90 |
| `yolo26-large-size-384` | xnnpack | `fp32` | 211.1 | 535.0 | 99% | 299 | 58 | 107 |
| `yolo26-medium-size-512` | xnnpack | `fp32` | 329.1 | 870.2 | 100% | 338 | 51 | 90 |
| `rfdetr-nano` | xnnpack | `fp32` | 329.9 | 618.9 | 100% | 295 | 30 | 118 |
| `yolo26-large-size-512` | xnnpack | `fp32` | 451.5 | 1,000.2 | 100% | 356 | 63 | 107 |
| `yolo26-xlarge-size-384` | xnnpack | `fp32` | 524.1 | 1,242.7 | 100% | 462 | 135 | 240 |
| `yolo26-medium-size-640` | xnnpack | `fp32` | 626.1 | 1,434.0 | 100% | 411 | 50 | 90 |
| `yolo26-large-size-640` | xnnpack | `fp32` | 702.0 | 1,634.1 | 100% | 431 | 63 | 107 |
| `yolo26-xlarge-size-512` | xnnpack | `fp32` | 952.1 | 2,323.7 | 100% | 531 | 130 | 240 |
| `fastsam-x` | xnnpack | `fp32` | 1,500.4 | 3,846.1 | 100% | 633 | 192 | 276 |
| `yolo26-xlarge-size-640` | xnnpack | `fp32` | 1,555.9 | 3,805.6 | 100% | 615 | 131 | 240 |

## [Semantic Segmentation](../02-extensions/computer-vision/06-semantic-segmentation.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `selfie-segmentation-landscape` | coreml | `fp16` | 1.1 | 1.9 | 21% | 86 | 18 | 1 |
| `selfie-segmentation` | coreml | `fp16` | 1.4 | 2.3 | 22% | 86 | 20 | 1 |
| `selfie-segmentation-landscape` | xnnpack | `fp32` | 3.1 | 3.1 | 68% | 88 | 2 | 0 |
| `selfie-segmentation` | xnnpack | `fp32` | 4.7 | 5.0 | 76% | 96 | 2 | 0 |
| `lraspp-mobilenet-v3-large` | coreml | `fp16` | 10.8 | 16.9 | 42% | 248 | 29 | 7 |
| `lraspp-mobilenet-v3-large` | xnnpack | `int8` | 18.1 | 27.2 | 62% | 242 | 13 | 3 |
| `lraspp-mobilenet-v3-large` | xnnpack | `fp32` | 28.7 | - | 74% | 250 | 13 | 12 |
| `deeplab-v3-mobilenet-v3-large` | coreml | `fp16` | 31.2 | 41.4 | 78% | 246 | 61 | 21 |
| `deeplab-v3-mobilenet-v3-large` | xnnpack | `int8` | 32.3 | 56.5 | 75% | 259 | 18 | 11 |
| `fcn-resnet50` | coreml | `fp16` | 51.1 | 67.0 | 84% | 264 | 82 | 63 |
| `fcn-resnet101` | coreml | `fp16` | 69.7 | 86.0 | 87% | 258 | 117 | 100 |
| `deeplab-v3-mobilenet-v3-large` | xnnpack | `fp32` | 89.6 | - | 90% | 289 | 29 | 42 |
| `deeplab-v3-resnet50` | coreml | `fp16` | 105.5 | 119.1 | 91% | 246 | 154 | 76 |
| `deeplab-v3-resnet101` | coreml | `fp16` | 126.5 | 137.9 | 92% | 245 | 194 | 112 |
| `fcn-resnet50` | xnnpack | `int8` | 273.6 | 656.4 | 97% | 331 | 23 | 34 |
| `deeplab-v3-resnet50` | xnnpack | `int8` | 294.3 | 748.1 | 97% | 326 | 25 | 40 |
| `fcn-resnet101` | xnnpack | `int8` | 425.9 | 1,067.3 | 98% | 423 | 26 | 52 |
| `deeplab-v3-resnet101` | xnnpack | `int8` | 521.2 | 1,200.0 | 98% | 423 | 28 | 59 |
| `fcn-resnet50` | xnnpack | `fp32` | 1,424.9 | - | 99% | 551 | 73 | 126 |
| `deeplab-v3-resnet50` | xnnpack | `fp32` | 1,456.2 | - | 99% | 523 | 92 | 151 |
| `fcn-resnet101` | xnnpack | `fp32` | 2,258.0 | - | 99% | 778 | 111 | 198 |
| `deeplab-v3-resnet101` | xnnpack | `fp32` | 2,523.8 | - | 99% | 897 | 125 | 224 |

## [Pose & Keypoints](../02-extensions/computer-vision/04-pose-and-keypoints.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `yolo26-pose-size-384` | coreml | `fp16` | 1.2 | 1.9 | 75% | 112 | 30 | 6 |
| `yolo26-pose-size-512` | coreml | `fp16` | 2.1 | 2.6 | 85% | 120 | 32 | 6 |
| `yolo26-pose-size-640` | coreml | `fp16` | 3.9 | 5.2 | 82% | 133 | 38 | 6 |
| `blazeface` | xnnpack | `fp32` | 6.6 | 6.9 | 97% | 130 | 2 | 1 |
| `yolo26-pose-size-384` | xnnpack | `fp32` | 20.2 | 28.2 | 98% | 123 | 18 | 11 |
| `yolo26-pose-size-512` | xnnpack | `fp32` | 30.3 | 49.8 | 99% | 143 | 18 | 11 |
| `yolo26-pose-size-640` | xnnpack | `fp32` | 42.1 | 78.7 | 98% | 159 | 18 | 11 |
| `rfdetr-keypoint` | coreml | `fp16` | 55.4 | 204.0 | 98% | 353 | 202 | 72 |
| `rfdetr-keypoint` | xnnpack | `fp32` | 1,360.4 | 2,972.6 | 100% | 775 | 33 | 139 |

## [Style Transfer](../02-extensions/computer-vision/08-style-transfer.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `candy` | coreml | `fp16` | 63.0 | 184.4 | 96% | 255 | 90 | 4 |
| `rain-princess` | coreml | `fp16` | 63.2 | 184.4 | 96% | 255 | 91 | 4 |
| `mosaic` | coreml | `fp16` | 63.3 | 185.2 | 96% | 253 | 90 | 4 |
| `udnie` | coreml | `fp16` | 70.4 | 184.3 | 94% | 256 | 90 | 4 |
| `candy` | xnnpack | `int8` | 349.7 | 611.9 | 99% | 989 | 15 | 2 |
| `mosaic` | xnnpack | `int8` | 394.1 | 644.4 | 99% | 991 | 15 | 2 |
| `rain-princess` | xnnpack | `int8` | 401.8 | 650.4 | 99% | 993 | 15 | 2 |
| `udnie` | xnnpack | `int8` | 404.8 | 634.3 | 99% | 994 | 16 | 2 |
| `candy` | xnnpack | `fp32` | 746.0 | - | 100% | 1,205 | 18 | 6 |
| `mosaic` | xnnpack | `fp32` | 787.6 | - | 99% | 1,149 | 19 | 6 |
| `rain-princess` | xnnpack | `fp32` | 810.2 | - | 99% | 1,151 | 22 | 6 |
| `udnie` | xnnpack | `fp32` | 811.9 | - | 99% | 1,152 | 21 | 6 |

## [Image Embeddings](../02-extensions/computer-vision/09-image-embeddings.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `clip-vit-base-patch32` | coreml | `fp16` | 3.1 | - | 95% | 621 | 50 | 168 |
| `clip-vit-base-patch32` | mlx | `int8` | 10.2 | - | 98% | 570 | 20 | 94 |
| `clip-vit-base-patch32` | xnnpack | `fp32` | 38.4 | - | 99% | 790 | 62 | 335 |

## [OCR](../02-extensions/computer-vision/05-optical-character-recognition.md)

_The recognizer runs once per region the detector finds, so cost scales with how much text is in the image. `default` is the registry variant that carries no precision suffix (`paddle-ppocrv6-small-coreml`, `-xnnpack`); it is quantized, and the `fp32` row is the unmodified build._

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `paddle-ppocrv6-small` | coreml | `default` | 6.7 | - | 74% | 710 | 116 | 8 |
| `paddle-ppocrv6-small` | xnnpack | `default` | 107.3 | - | 98% | 777 | 27 | 23 |
| `paddle-ppocrv6-small` | xnnpack | `fp32` | 117.2 | - | 98% | 854 | 25 | 30 |

## [Text to Image](../02-extensions/computer-vision/10-text-to-image.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `sdxs-512-dreamshaper` | coreml | `fp16` | 108.1 | - | 95% | 1,523 | 1,436 | 843 |
| `sdxs-512-dreamshaper` | xnnpack | `fp32` | 2,792.7 | - | 100% | 2,859 | 1,264 | 1,682 |

## [Text Embeddings](../02-extensions/natural-language/03-text-embeddings.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `multi-qa-minilm-l6-cos-v1` | coreml | `fp16` | 1.3 | - | 95% | 425 | 30 | 44 |
| `all-minilm-l6-v2` | coreml | `fp16` | 1.3 | - | 95% | 425 | 31 | 44 |
| `paraphrase-multilingual-minilm-l12-v2` | coreml | `fp16` | 3.0 | - | 97% | 741 | 255 | 241 |
| `clip-vit-base-patch32-text` | coreml | `fp16` | 5.1 | - | 95% | 473 | 76 | 124 |
| `distiluse-base-multilingual-cased-v2` | mlx | `int8` | 5.8 | - | 99% | 521 | 68 | 136 |
| `distiluse-base-multilingual-cased-v2` | coreml | `fp16` | 7.2 | - | 99% | 674 | 97 | 261 |
| `multi-qa-minilm-l6-cos-v1` | xnnpack | `fp32` | 8.7 | - | 99% | 519 | 25 | 87 |
| `all-minilm-l6-v2` | xnnpack | `fp32` | 8.8 | - | 99% | 480 | 25 | 87 |
| `distiluse-base-multilingual-cased-v2` | xnnpack | `8da4w` | 11.9 | - | 100% | 799 | 103 | 378 |
| `paraphrase-multilingual-minilm-l12-v2` | xnnpack | `8da4w` | 13.2 | - | 99% | 899 | 260 | 395 |
| `paraphrase-multilingual-minilm-l12-v2` | xnnpack | `fp32` | 20.1 | - | 99% | 978 | 363 | 465 |
| `distiluse-base-multilingual-cased-v2` | xnnpack | `fp32` | 23.8 | - | 100% | 944 | 114 | 518 |
| `clip-vit-base-patch32-text` | xnnpack | `fp32` | 28.4 | - | 99% | 594 | 74 | 244 |
| `multi-qa-mpnet-base-dot-v1` | xnnpack | `fp32` | 42.0 | - | 100% | 887 | 78 | 416 |
| `all-mpnet-base-v2` | xnnpack | `fp32` | 42.1 | - | 100% | 853 | 79 | 416 |
| `lfm2-5-embedding-350-m` | xnnpack | `8da4w` | 66.8 | - | 100% | 1,029 | 264 | 553 |
| `lfm2-5-embedding-350-m` | mlx | `int4` | ??? | - | ??? | ??? | ??? | ??? |

## [Privacy Filter](../02-extensions/natural-language/04-privacy-filter.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `openai` | mlx | `int4` | 141.6 | - | 99% | 1,793 | 554 | 861 |
| `nemotron` | mlx | `int8` | 168.4 | - | 98% | 2,411 | 762 | 1,527 |
| `openai` | xnnpack | `8da4w` | 496.2 | - | 100% | 2,073 | 1,279 | 1,211 |
| `nemotron` | xnnpack | `8da4w` | 497.6 | - | 99% | 2,133 | 1,108 | 1,211 |

## [Speech to Text](../02-extensions/speech/03-speech-to-text.md)

_Decode length follows the audio. This is 10 s of synthetic voice-shaped audio, not speech, so these are optimistic against a real clip._

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `whisper-en-tiny` | coreml | `fp16` | 30.9 | 75.3 | 98% | 488 | 149 | 77 |
| `whisper-tiny` | coreml | `fp16` | 34.1 | 83.6 | 98% | 174 | 150 | 77 |
| `whisper-en-tiny` | mlx | `int8` | 57.1 | 203.9 | 99% | 780 | 57 | 61 |
| `whisper-tiny` | mlx | `int8` | 64.7 | 241.4 | 99% | 706 | 55 | 61 |
| `whisper-en-tiny` | mlx | `bf16` | 68.0 | - | 99% | 1,042 | 56 | 77 |
| `whisper-tiny` | mlx | `bf16` | 76.0 | - | 99% | 990 | 60 | 77 |
| `whisper-en-base` | coreml | `fp16` | 81.7 | 177.7 | 99% | 519 | 196 | 144 |
| `whisper-base` | coreml | `fp16` | 101.5 | 194.7 | 99% | 479 | 226 | 144 |
| `whisper-en-base` | mlx | `int8` | 110.6 | 420.6 | 99% | 975 | 63 | 102 |
| `whisper-en-base` | mlx | `bf16` | 137.5 | - | 99% | 1,879 | 64 | 143 |
| `whisper-base` | mlx | `int8` | 167.7 | 747.7 | 99% | 1,310 | 63 | 102 |
| `whisper-base` | mlx | `bf16` | 181.8 | - | 99% | 1,871 | 65 | 143 |
| `whisper-en-small` | coreml | `fp16` | 247.5 | 632.7 | 100% | 706 | 440 | 467 |
| `whisper-en-tiny` | xnnpack | `int8` | 266.5 | 378.6 | 99% | 684 | 75 | 172 |
| `whisper-en-tiny` | xnnpack | `fp32` | 270.1 | - | 100% | 741 | 80 | 226 |
| `whisper-en-small` | mlx | `int8` | 336.9 | 1,367.2 | 100% | 1,265 | 87 | 280 |
| `whisper-tiny` | xnnpack | `fp32` | 371.8 | 754.8 | 100% | 472 | 82 | 226 |
| `whisper-en-base` | xnnpack | `int8` | 393.1 | 876.6 | 100% | 845 | 95 | 240 |
| `whisper-small` | coreml | `fp16` | 446.0 | 700.4 | 100% | 706 | 470 | 467 |
| `whisper-small` | mlx | `int8` | 467.9 | 1,725.5 | 100% | 1,279 | 90 | 280 |
| `whisper-base` | xnnpack | `fp32` | 911.7 | 2,072.7 | 100% | 939 | 131 | 384 |
| `whisper-en-base` | xnnpack | `fp32` | 1,079.8 | - | 100% | 982 | 110 | 384 |
| `whisper-en-small` | xnnpack | `int8` | 1,645.5 | 4,354.9 | 100% | 1,118 | 172 | 431 |
| `whisper-small` | xnnpack | `fp32` | 4,020.3 | 12,858.4 | 100% | 1,772 | 456 | 1,081 |
| `whisper-en-small` | xnnpack | `fp32` | 4,723.0 | - | 100% | 1,779 | 291 | 1,080 |

## [Text to Speech](../02-extensions/speech/02-text-to-speech.md)

_Cost scales with sentence length. This is one fixed 2-sentence paragraph._

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `supertonic` | mlx | `fp32` | 609.8 | - | 98% | 1,188 | 65 | 382 |
| `kokoro-pt` | coreml | `fp32` | 1,276.8 | - | 98% | 577 | 769 | 355 |
| `kokoro-fr` | coreml | `fp32` | 1,330.9 | - | 98% | 598 | 682 | 355 |
| `kokoro-it` | coreml | `fp32` | 1,456.6 | - | 98% | 588 | 764 | 355 |
| `kokoro-de` | coreml | `fp32` | 1,601.9 | - | 98% | 580 | 759 | 355 |
| `kokoro-en-us` | coreml | `fp32` | 1,632.8 | - | 99% | 588 | 1,203 | 365 |
| `kokoro-pl` | coreml | `fp32` | 1,766.4 | - | 98% | 591 | 836 | 355 |
| `kokoro-es` | coreml | `fp32` | 1,785.4 | - | 99% | 580 | 759 | 355 |
| `kokoro-hi` | coreml | `fp32` | 1,896.9 | - | 99% | 642 | 799 | 358 |
| `kokoro-en-gb` | coreml | `fp32` | 1,959.1 | - | 99% | 583 | 914 | 364 |
| `supertonic` | xnnpack | `fp32` | 2,086.3 | - | 100% | 1,294 | 103 | 382 |
| `kokoro-pt` | xnnpack | `fp32` | 2,822.3 | - | 99% | 1,226 | 360 | 324 |
| `kokoro-en-us` | xnnpack | `fp32` | 2,841.9 | - | 100% | 1,243 | 677 | 334 |
| `kokoro-it` | xnnpack | `fp32` | 2,856.6 | - | 99% | 1,235 | 369 | 324 |
| `kokoro-en-gb` | xnnpack | `fp32` | 3,266.1 | - | 99% | 1,226 | 505 | 333 |
| `kokoro-pl` | xnnpack | `fp32` | 3,432.3 | - | 99% | 1,247 | 297 | 324 |
| `kokoro-es` | xnnpack | `fp32` | 3,447.9 | - | 99% | 1,205 | 358 | 324 |
| `kokoro-fr` | xnnpack | `fp32` | 3,584.2 | - | 99% | 1,208 | 316 | 324 |
| `kokoro-de` | xnnpack | `fp32` | 3,698.1 | - | 99% | 1,268 | 312 | 324 |
| `kokoro-hi` | xnnpack | `fp32` | 3,836.1 | - | 99% | 1,249 | 408 | 327 |

## [Voice Activity Detection](../02-extensions/speech/04-voice-activity-detection.md)

| model | backend | precision | iPhone 17 ms | iPhone SE 3 ms | share | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|---|
| `fsmn-vad` | xnnpack | `fp32` | 9.2 | 12.8 | 92% | 116 | 2 | 2 |

## Core ML against XNNPACK

Fastest published Core ML variant against the fastest published XNNPACK variant
of the same model. Above `1.00x` means Core ML is faster.

| model | iPhone 17 | iPhone SE (3rd gen) |
|---|---|---|
| `classification/efficientnet-v2-s` | 8.34x | 8.87x |
| `image-embeddings/clip-vit-base-patch32` | 12.46x | - |
| `instance-segmentation/fastsam-s` | 17.74x | 31.35x |
| `instance-segmentation/fastsam-x` | 40.49x | 92.23x |
| `instance-segmentation/rfdetr-nano` | 22.43x | 8.70x |
| `instance-segmentation/yolo26-large-size-384` | 29.32x | 52.05x |
| `instance-segmentation/yolo26-large-size-512` | 38.76x | 57.65x |
| `instance-segmentation/yolo26-large-size-640` | 35.05x | 59.12x |
| `instance-segmentation/yolo26-medium-size-384` | 28.12x | 43.33x |
| `instance-segmentation/yolo26-medium-size-512` | 30.28x | 58.52x |
| `instance-segmentation/yolo26-medium-size-640` | 35.14x | 55.17x |
| `instance-segmentation/yolo26-nano-size-384` | 8.91x | 8.91x |
| `instance-segmentation/yolo26-nano-size-512` | 8.03x | 9.22x |
| `instance-segmentation/yolo26-nano-size-640` | 8.19x | 9.87x |
| `instance-segmentation/yolo26-small-size-384` | 15.61x | 19.70x |
| `instance-segmentation/yolo26-small-size-512` | 16.30x | 26.57x |
| `instance-segmentation/yolo26-small-size-640` | 15.77x | 24.49x |
| `instance-segmentation/yolo26-xlarge-size-384` | 40.32x | 64.12x |
| `instance-segmentation/yolo26-xlarge-size-512` | 40.38x | 81.11x |
| `instance-segmentation/yolo26-xlarge-size-640` | 35.51x | 74.90x |
| `keypoint-detection/rfdetr-keypoint` | 24.58x | 14.57x |
| `keypoint-detection/yolo26-pose-size-384` | 16.15x | 15.23x |
| `keypoint-detection/yolo26-pose-size-512` | 14.23x | 19.37x |
| `keypoint-detection/yolo26-pose-size-640` | 10.93x | 15.04x |
| `object-detection/rfdetr-nano` | 19.98x | 19.89x |
| `object-detection/ssdlite320-mobilenet-v3-large` | 2.84x | 3.17x |
| `object-detection/yolo26-large-size-384` | 29.19x | 51.05x |
| `object-detection/yolo26-large-size-512` | 33.17x | 58.24x |
| `object-detection/yolo26-large-size-640` | 34.40x | 60.55x |
| `object-detection/yolo26-medium-size-384` | 24.68x | 43.71x |
| `object-detection/yolo26-medium-size-512` | 27.27x | 47.72x |
| `object-detection/yolo26-medium-size-640` | 31.03x | 54.16x |
| `object-detection/yolo26-nano-size-384` | 14.59x | 12.60x |
| `object-detection/yolo26-nano-size-512` | 11.62x | 11.22x |
| `object-detection/yolo26-nano-size-640` | 11.12x | 13.10x |
| `object-detection/yolo26-small-size-384` | 17.38x | 20.34x |
| `object-detection/yolo26-small-size-512` | 17.16x | 28.06x |
| `object-detection/yolo26-small-size-640` | 18.26x | 36.35x |
| `object-detection/yolo26-xlarge-size-384` | 39.39x | 57.95x |
| `object-detection/yolo26-xlarge-size-512` | 33.74x | 72.94x |
| `object-detection/yolo26-xlarge-size-640` | 50.87x | 69.02x |
| `ocr/paddle-ppocrv6-small` | 16.09x | - |
| `semantic-segmentation/deeplab-v3-mobilenet-v3-large` | 1.04x | 1.36x |
| `semantic-segmentation/deeplab-v3-resnet101` | 4.12x | 8.70x |
| `semantic-segmentation/deeplab-v3-resnet50` | 2.79x | 6.28x |
| `semantic-segmentation/fcn-resnet101` | 6.11x | 12.42x |
| `semantic-segmentation/fcn-resnet50` | 5.36x | 9.80x |
| `semantic-segmentation/lraspp-mobilenet-v3-large` | 1.67x | 1.61x |
| `semantic-segmentation/selfie-segmentation` | 3.25x | 2.15x |
| `semantic-segmentation/selfie-segmentation-landscape` | 2.88x | 1.60x |
| `speech-to-text/whisper-base` | 8.98x | 10.64x |
| `speech-to-text/whisper-en-base` | 4.81x | 4.93x |
| `speech-to-text/whisper-en-small` | 6.65x | 6.88x |
| `speech-to-text/whisper-en-tiny` | 8.64x | 5.03x |
| `speech-to-text/whisper-small` | 9.01x | 18.36x |
| `speech-to-text/whisper-tiny` | 10.91x | 9.03x |
| `style-transfer/candy` | 5.55x | 3.32x |
| `style-transfer/mosaic` | 6.23x | 3.48x |
| `style-transfer/rain-princess` | 6.36x | 3.53x |
| `style-transfer/udnie` | 5.75x | 3.44x |
| `text-embeddings/all-minilm-l6-v2` | 6.77x | - |
| `text-embeddings/clip-vit-base-patch32-text` | 5.58x | - |
| `text-embeddings/distiluse-base-multilingual-cased-v2` | 1.66x | - |
| `text-embeddings/multi-qa-minilm-l6-cos-v1` | 6.69x | - |
| `text-embeddings/paraphrase-multilingual-minilm-l12-v2` | 4.34x | - |
| `text-to-image/sdxs-512-dreamshaper` | 25.84x | - |
| `text-to-speech/kokoro-de` | 2.31x | - |
| `text-to-speech/kokoro-en-gb` | 1.67x | - |
| `text-to-speech/kokoro-en-us` | 1.74x | - |
| `text-to-speech/kokoro-es` | 1.93x | - |
| `text-to-speech/kokoro-fr` | 2.69x | - |
| `text-to-speech/kokoro-hi` | 2.02x | - |
| `text-to-speech/kokoro-it` | 1.96x | - |
| `text-to-speech/kokoro-pl` | 1.94x | - |
| `text-to-speech/kokoro-pt` | 2.21x | - |

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
XNNPACK is a median 2.15x slower on the A15 than on the A19, while Core ML is
only 1.46x slower. Choosing Core ML matters more for users on old hardware, not
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
