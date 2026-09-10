---
title: Overview
slug: /benchmarks/overview
description: 'On-device latency, memory and download size for every published React Native ExecuTorch model variant, measured on four phones.'
keywords:
  [
    react native executorch,
    benchmark,
    performance,
    on-device ai,
    latency,
    xnnpack,
    core ml,
    vulkan,
    mlx,
  ]
---

# Benchmarks

Every model variant the library publishes, measured end to end on real phones.
This is the data we use to pick the defaults, and it is here so you can check
whether a default suits your app.

The figures come from the `v0.10.0` model registry.

## Devices

| Device | SoC | Backends measured | Variants |
|---|---|---|---|
| Samsung Galaxy S26 Ultra (SM-S948B) | Snapdragon SM8850, 8 cores, 11 GB, Android 16 | XNNPACK (100), Vulkan (24) | 124 |
| Google Pixel 10 | Tensor G5 | XNNPACK (74), Vulkan (15) | 89 |
| iPhone 17 | A19 | XNNPACK (60), Core ML (58), MLX (6) | 124 |
| iPhone SE (3rd gen) | A15 Bionic | XNNPACK (60), Core ML (58), MLX (6) | 124 |

The Galaxy S26 Ultra ran the **complete** Android registry, so it is the
reference column throughout. The other three ran the subset that matters for
their platform.

## What each task was given

Every task runs one fixed, synthetic input, identical on all four devices. The
inputs are synthetic so that two devices are fed byte-identical data; they are
not photographs or recordings, and that shapes some of the numbers.

| Task | Input |
|---|---|
| Image classification, style transfer, semantic segmentation, pose & keypoints, image embeddings | 512x512 RGBA frame |
| Object detection, instance segmentation, OCR | 640x640 RGBA frame |
| Speech to text | 10 s of mono audio at 16 kHz |
| Voice activity detection | 10 s of mono audio at 16 kHz |
| Text embeddings | one fixed 4-sentence English paragraph |
| Privacy filter | one fixed 3-sentence paragraph seeded with a name, an email, a phone number, an address and an account number |
| Text to speech | one fixed 2-sentence English paragraph |
| Text to image | the prompt `a small wooden sailboat on a calm lake at sunrise`, fixed seed |
| LLMs | the prompt `List three uses for a paperclip.`, 64 tokens decoded, temperature 0 |

The frame is a vertical gradient with three solid ellipses on it, not noise.
Noise drives detectors into candidate counts unlike any real workload, and a
detector's post-processing cost scales with how many candidates survive, so a
noisy frame would inflate every detection row.

:::warning
**The audio is voice-shaped but it is not speech.** No recognizer transcribes
meaning from it. Whisper therefore emits far fewer tokens than it would on a
real clip, and its decoder does correspondingly less work, so the speech-to-text
figures are dominated by the encoder and are **optimistic** against real audio.
Read `share` on those rows and expect a real clip to cost more.
:::

Cost scales with the input for several tasks. OCR runs its recognizer once per
region the detector finds, text to speech scales with sentence length, and
speech to text scales with decode length. Those rows move with your data.

## Reading the columns

| Column | Meaning |
|---|---|
| `median ms` | Whole pipeline: pre-processing, `execute`, and post-processing, which is what your UI waits for |
| `ET ms` | Time ExecuTorch itself spent inside the pipeline |
| `share` | `ET ms` as a fraction of the pipeline. A low share means your time is going to pre/post-processing, not the model |
| `peak MB` | Peak process memory during the run, including the app itself |
| `load ms` | Cold load of the model |
| `size MB` | Download size of the variant |

`share` is the column to read before optimizing anything. `selfie-segmentation`
spends 73% of its 5.6 ms in ExecuTorch and the rest in JavaScript; `fcn-resnet101
fp32` spends 99% of its 670 ms in ExecuTorch. Only one of those is worth a faster
model.

## What the data says

### Core ML is not a small win on iOS

Across 58 model families measured on both backends, Core ML beat XNNPACK in
**57 of 58** on iPhone 17 and **58 of 58** on iPhone SE (3rd gen). The median
gap is **14.7x** and **16.8x** respectively.

| | iPhone 17 | iPhone SE (3rd gen) |
|---|---|---|
| Families where Core ML wins | 57 / 58 | 58 / 58 |
| Median speedup | 14.7x | 16.8x |
| Best case | 41.3x (`fastsam-x`) | 92.2x (`fastsam-x`) |
| Worst case | 0.98x (`deeplab-v3-mobilenet-v3-large`) | 1.36x (`deeplab-v3-mobilenet-v3-large`) |

Much of that headline is an unfair fight, and worth stating plainly: 44 of the 58
families have no quantized XNNPACK build, so it is fp32 on the CPU against fp16
on the Neural Engine. Restrict to the 14 families where XNNPACK does have an int8
build and the median lead falls to **5.33x**, against **17.99x** for the
fp32-only ones.

Five times is still decisive. If you ship to iOS and a Core ML variant exists for
your model, use it.

### Vulkan depends on the GPU

The same is not true of Vulkan on Android. It is a clear win on the Adreno in the
S26 Ultra and a clear loss on the Pixel 10 for the same models.

| | SM-S948B (Adreno) | Pixel 10 (Tensor G5) |
|---|---|---|
| Families where Vulkan wins | 14 / 16 | 5 / 15 |
| Median speedup | 1.41x | 0.82x |
| Best case | 4.84x (`paddle-ppocrv6-small`) | 3.56x (`whisper-small`) |
| Worst case | 0.78x (`distiluse-base-multilingual-cased-v2`) | 0.27x (`paraphrase-multilingual-minilm-l12-v2`) |

Whisper and OCR win on both. The text embedders invert completely: on the S26
Ultra `paraphrase-multilingual-minilm-l12-v2` runs 1.21x faster on Vulkan, and on
the Pixel 10 it runs **3.7x slower**. Vulkan is worth measuring on your target
hardware rather than assuming.

### Quantizing usually pays, and never costs size

Of the 17 XNNPACK families that publish both an fp32 and a quantized build, the
quantized one was faster in **all 17**, median **1.74x**, while also being
smaller in every case. The segmentation family is the extreme: `fcn-resnet50`
goes from 500 ms and 132 MB to 118 ms and 36 MB.

The counterpoint is that no accuracy comparison has been run for any of those
pairs. See the [XNNPACK fp32 deprecation
tracker](https://github.com/software-mansion/react-native-executorch/issues/1456)
for where that work stands.

### Model size is not download size

`peak MB` routinely exceeds `size MB` by a wide margin, because activations
dominate for convolutional models. The four style-transfer variants download at
2 MB each and peak at **1.1 GB**. Budget from `peak MB`, not from the file size.

## What these numbers are not

- **Not accuracy.** Nothing here says a quantized variant produces the same output
  as its `fp32` twin. A model that is 4x faster and 4x smaller may also be worse,
  and no accuracy comparison has been run yet.
- **Not your workload.** See [What each task was given](#what-each-task-was-given).
  The inputs are fixed and synthetic, and the speech figures in particular are
  optimistic.
- **Not a device ranking.** The four devices ran on different days under different
  ambient conditions. Compare variants within a column, not columns against each
  other.
- **Not precise.** Treat any two rows within about 30% of each other as tied.

## Where to go next

- [Android](./02-android.md) — the full 124-variant registry on the S26 Ultra, with Pixel 10 alongside
- [iOS](./03-ios.md) — XNNPACK against Core ML and MLX on two generations of hardware
- [LLMs](./04-llms.md) — decode throughput, measured separately
