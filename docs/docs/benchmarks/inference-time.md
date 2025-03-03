---
title: Inference Time
sidebar_position: 3
---

:::warning warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

## Classification

| Model             | iPhone 16 Pro (Core ML) [ms] | iPhone 13 Pro (Core ML) [ms] | iPhone SE 3 (Core ML) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ----------------- | ---------------------------- | ---------------------------- | -------------------------- | --------------------------------- | ------------------------- |
| EFFICIENTNET_V2_S | 100                          | 120                          | 130                        | 180                               | 170                       |

## Object Detection

| Model                          | iPhone 16 Pro (XNNPACK) [ms] | iPhone 13 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------------------------ | ---------------------------- | ---------------------------- | -------------------------- | --------------------------------- | ------------------------- |
| SSDLITE_320_MOBILENET_V3_LARGE | 190                          | 260                          | 280                        | 100                               | 90                        |

## Style Transfer

| Model                        | iPhone 16 Pro (Core ML) [ms] | iPhone 13 Pro (Core ML) [ms] | iPhone SE 3 (Core ML) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ---------------------------- | ---------------------------- | ---------------------------- | -------------------------- | --------------------------------- | ------------------------- |
| STYLE_TRANSFER_CANDY         | 450                          | 600                          | 750                        | 1650                              | 1800                      |
| STYLE_TRANSFER_MOSAIC        | 450                          | 600                          | 750                        | 1650                              | 1800                      |
| STYLE_TRANSFER_UDNIE         | 450                          | 600                          | 750                        | 1650                              | 1800                      |
| STYLE_TRANSFER_RAIN_PRINCESS | 450                          | 600                          | 750                        | 1650                              | 1800                      |

## OCR

| Model       | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro Max (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | Samsung Galaxy S21 (XNNPACK) [ms] |
| ----------- | ---------------------------- | -------------------------------- | -------------------------- | --------------------------------- | --------------------------------- |
| CRAFT_800   | 2099                         | 2227                             | ❌                         | 2245                              | 7108                              |
| CRNN_EN_512 | 70                           | 252                              | ❌                         | 54                                | 151                               |
| CRNN_EN_256 | 39                           | 123                              | ❌                         | 24                                | 78                                |
| CRNN_EN_128 | 17                           | 83                               | ❌                         | 14                                | 39                                |

## Vertical OCR

| Model       | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro Max (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | Samsung Galaxy S21 (XNNPACK) [ms] |
| ----------- | ---------------------------- | -------------------------------- | -------------------------- | --------------------------------- | --------------------------------- |
| CRAFT_1280  | 5457                         | 5833                             | ❌                         | 6296                              | 14053                             |
| CRAFT_320   | 1351                         | 1460                             | ❌                         | 1485                              | 3101                              |
| CRNN_EN_512 | 39                           | 123                              | ❌                         | 24                                | 78                                |
| CRNN_EN_64  | 10                           | 33                               | ❌                         | 7                                 | 18                                |

## LLMs

| Model                 | iPhone 16 Pro (XNNPACK) [tokens/s] | iPhone 13 Pro (XNNPACK) [tokens/s] | iPhone SE 3 (XNNPACK) [tokens/s] | Samsung Galaxy S24 (XNNPACK) [tokens/s] | OnePlus 12 (XNNPACK) [tokens/s] |
| --------------------- | ---------------------------------- | ---------------------------------- | -------------------------------- | --------------------------------------- | ------------------------------- |
| LLAMA3_2_1B           | 16.1                               | 11.4                               | ❌                               | 15.6                                    | 19.3                            |
| LLAMA3_2_1B_SPINQUANT | 40.6                               | 16.7                               | 16.5                             | 40.3                                    | 48.2                            |
| LLAMA3_2_1B_QLORA     | 31.8                               | 11.4                               | 11.2                             | 37.3                                    | 44.4                            |
| LLAMA3_2_3B           | ❌                                 | ❌                                 | ❌                               | ❌                                      | 7.1                             |
| LLAMA3_2_3B_SPINQUANT | 17.2                               | 8.2                                | ❌                               | 16.2                                    | 19.4                            |
| LLAMA3_2_3B_QLORA     | 14.5                               | ❌                                 | ❌                               | 14.8                                    | 18.1                            |

❌ - Insufficient RAM.
