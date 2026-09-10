---
title: LLMs
slug: /benchmarks/llms
description: 'Decode throughput, time to first token and peak memory for 23 quantized LLM variants on a Galaxy S26 Ultra.'
keywords:
  [
    react native executorch,
    llm benchmark,
    tokens per second,
    on-device llm,
    quantization,
    8da4w,
    qwen,
    llama,
    phi,
  ]
---

# LLMs

23 LLM variants on a **Galaxy S26 Ultra** (Snapdragon SM8850, 11 GB), driven
through the [LLM extension](../02-extensions/natural-language/02-llm-chat-and-generation.md).

## Input

| | |
|---|---|
| Prompt | `List three uses for a paperclip.` |
| Tokens decoded | 64, with EOS ignored |
| Temperature | 0 |

The prompt is short on purpose. Prefill scales with prompt length, and a long one
would bury the decode rate these numbers are about.

:::warning
These figures are **provisional** and are not comparable to the other benchmark
pages, where one measurement is a single `execute` rather than a whole
generation. Read them as an ordering, not as absolute numbers.
:::

## Results

| variant | precision | median ms | tok/s | TTFT ms | peak MB | load ms | size MB |
|---|---|---|---|---|---|---|---|
| `smollm2-135-m-xnnpack-8-da8-w` | `8da8w` | 1127 | 55.9 | 10 | 597 | 754 | 168 |
| `lfm2-5-350-m-xnnpack-8-da4-w` | `8da4w` | 1202 | 52.4 | 7 | 777 | 587 | 282 |
| `lfm2-5-vl-450-m-xnnpack-8-da4-w` | `8da4w` | 1692 | 37.2 | 11 | 1767 | 1125 | 654 |
| `lfm2-5-vl-1-6-b-xnnpack-8-da4-w` | `8da4w` | 1932 | 32.6 | 19 | 3082 | 2177 | 2432 |
| `hammer2-1-0-5-b-xnnpack-8-da4-w` | `8da4w` | 2272 | 27.7 | 16 | 944 | 1170 | 429 |
| `qwen2-5-0-5-b-xnnpack-8-da4-w` | `8da4w` | 2328 | 27.1 | 14 | 945 | 1031 | 425 |
| `smollm2-360-m-xnnpack-8-da8-w` | `8da8w` | 2428 | 25.9 | 20 | 1045 | 722 | 415 |
| `llama3-2-1-b-xnnpack-spinquant` | `spinquant` | 2538 | 24.8 | 26 | 1382 | 1070 | 1146 |
| `lfm2-5-350-m-xnnpack-fp16` | `fp16` | 2664 | 23.6 | 21 | 1212 | 585 | 849 |
| `qwen2-5-1-5-b-xnnpack-8-da4-w` | `8da4w` | 3177 | 19.8 | 29 | 1489 | 1120 | 1143 |
| `hammer2-1-1-5-b-xnnpack-8-da4-w` | `8da4w` | 3299 | 19.1 | 45 | 1523 | 1140 | 1147 |
| `smollm2-1-7-b-xnnpack-8-da8-w` | `8da8w` | 3624 | 17.4 | 52 | 2865 | 1802 | 1819 |
| `qwen3-1-7-b-xnnpack-8-da4-w` | `8da4w` | 3954 | 15.9 | 56 | 1876 | 1263 | 1315 |
| `qwen3-0-6-b-xnnpack-8-da4-w` | `8da4w` | 4151 | 15.2 | 33 | 1806 | 1372 | 517 |
| `lfm2-5-1-2-b-xnnpack-8-da4-w` | `8da4w` | 4366 | 14.4 | 26 | 1484 | 1429 | 801 |
| `hammer2-1-3-b-xnnpack-8-da4-w` | `8da4w` | 5342 | 11.8 | 47 | 2450 | 2013 | 2064 |
| `qwen2-5-3-b-xnnpack-8-da4-w` | `8da4w` | 5492 | 11.5 | 52 | 2454 | 2031 | 2099 |
| `phi4-mini-xnnpack-8-da4-w` | `8da4w` | 6277 | 10.0 | 56 | 3134 | 3221 | 2831 |
| `llama3-2-3-b-xnnpack-spinquant` | `spinquant` | 6305 | 10.0 | 63 | 2832 | 2566 | 2563 |
| `qwen3-4-b-xnnpack-8-da4-w` | `8da4w` | 8460 | 7.4 | 89 | 3374 | 3001 | 2693 |
| `bielik-v3-1-5-b-xnnpack-8-da4-w` | `8da4w` | 13788 | 4.6 | 89 | 2184 | 2009 | 925 |
| `gemma4-e2-b-xnnpack-8-da4-w` | `8da4w` | 14047 | 4.5 | 180 | 3428 | 3089 | 2667 |
| `qwen2-5-0-5-b-xnnpack-bf16` | `bf16` | 135431 | 0.5 | 321 | 1536 | 500 | 996 |

`median ms` is a full 64-token generation, `tok/s` is 63 tokens over that median,
and `TTFT ms` is time to first token.

## What to take from it

- **Peak memory is the constraint, not speed.** Every model above 2 GB of
  download peaks over 2.4 GB of process memory, and `gemma4-e2-b` peaks at
  3.4 GB. On an 11 GB phone that is fine; on a 4 GB phone it is not. Size your
  model from `peak MB`.
- **`8da4w` is the format that works.** 16 of the 23 rows are `8da4w`, and they
  cover the whole usable range from 52 tok/s down to 4.5.
- **Sub-1B models are interactive**, at 15 to 56 tok/s. `lfm2-5-350-m` reaches
  52 tok/s on a 282 MB download, and `smollm2-135-m` 56 tok/s on 168 MB.
- **`bf16` is broken, not merely slow.** `qwen2-5-0-5-b-xnnpack-bf16` ran at
  **0.5 tok/s**, 58x slower than its own `8da4w` twin on the same device. The one
  fp16 pair, `lfm2-5-350-m`, costs only 2.2x its `8da4w`, so 58x is not the price
  of precision. Do not ship `bf16`.

Vulkan LLM variants are not in the table: all three published ones currently fail
to prefill. Measured in isolation the Vulkan build of `lfm2-5-vl-450-m` ran
505 ms against XNNPACK's 1692 ms for the same 64 tokens, a 3.3x win, so the
backend is worth having once that is fixed.
