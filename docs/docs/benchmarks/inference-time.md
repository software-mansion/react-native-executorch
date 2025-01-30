---
title: Inference Time
sidebar_position: 3
---

## Classification

<table>
  <tr><th>Model</th> <th>Inference Type</th> <th>iPhone 16 Pro (CoreML) [ms]</th> <th>iPhone 13 Pro (CoreML) [ms]</th> <th>iPhone SE 3 (CoreML) [ms]</th> <th>Samsung Galaxy S24 (XNNPack) [ms]</th><th>OnePlus 12 (XNNPack) [ms]</th></tr>
  <tr><td rowspan="2">EFFICIENTNET_V2_S</td><td>First</td><td>140</td><td>180</td><td>210</td><td>220</td><td>230</td></tr>
  <tr><td>Consecutive</td><td>100</td><td>120</td><td>130</td><td>180</td><td>170</td></tr>
</table>

## Object Detection

<table>
  <tr><th>Model</th><th>Inference Type</th><th>iPhone 16 Pro (XNNPack) [ms]</th><th>iPhone 13 Pro (XNNPack) [ms]</th><th>iPhone SE 3 (XNNPack) [ms]</th><th>Samsung Galaxy S24 (XNNPack) [ms]</th><th>OnePlus 12 (XNNPack) [ms]</th></tr>
  <tr><td rowspan="2">SSDLITE_320_MOBILENET_V3_LARGE</td><td>First</td><td>200</td><td>280</td><td>300</td><td>120</td><td>140</td></tr>
  <tr><td>Consecutive</td><td>190</td><td>260</td><td>280</td><td>100</td><td>90</td></tr>
</table>

## Style Transfer

<table>
  <tr><th>Model</th><th>Inference Type</th><th>iPhone 16 Pro (CoreML) [ms]</th><th>iPhone 13 Pro (CoreML) [ms]</th><th>iPhone SE 3 (CoreML) [ms]</th><th>Samsung Galaxy S24 (XNNPack) [ms]</th><th>OnePlus 12 (XNNPack) [ms]</th></tr>
  <tr><td rowspan="2">STYLE_TRANSFER_CANDY, STYLE_TRANSFER_MOSAIC, STYLE_TRANSFER_UDNIE, STYLE_TRANSFER_RAIN_PRINCESS</td><td>First</td><td>850</td><td>1150</td><td>1400</td><td>1800</td><td>1950</td></tr>
  <tr><td>Consecutive</td><td>450</td><td>600</td><td>750</td><td>1650</td><td>1800</td></tr>
</table>

## LLMs

| Model                 | iPhone 16 Pro (XNNPack) [tokens/s] | iPhone 13 Pro (XNNPack) [tokens/s] | iPhone SE 3 (XNNPack) [tokens/s] | Samsung Galaxy S24 (XNNPack) [tokens/s] | OnePlus 12 (XNNPack) [tokens/s] |
| --------------------- | ---------------------------------- | ---------------------------------- | -------------------------------- | --------------------------------------- | ------------------------------- |
| LLAMA3_2_1B           | 16.1                               | 11.4                               | ❌                               | 15.6                                    | 19.3                            |
| LLAMA3_2_1B_SPINQUANT | 40.6                               | 16.7                               | 16.5                             | 40.3                                    | 48.2                            |
| LLAMA3_2_1B_QLORA     | 31.8                               | 11.4                               | 11.2                             | 37.3                                    | 44.4                            |
| LLAMA3_2_3B           | ❌                                 | ❌                                 | ❌                               | ❌                                      | 7.1                             |
| LLAMA3_2_3B_SPINQUANT | 17.2                               | 8.2                                | ❌                               | 16.2                                    | 19.4                            |
| LLAMA3_2_3B_QLORA     | 14.5                               | ❌                                 | ❌                               | 14.8                                    | 18.1                            |
