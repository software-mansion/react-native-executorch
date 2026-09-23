---
title: Overview
slug: /benchmarks/overview
description: 'On-device latency, memory and download size for every published React Native ExecuTorch model variant, measured on five phones.'
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
| Samsung Galaxy S20+ (SM-G986B) | Exynos 990, Mali-G77 MP11, 8 cores, 11 GB, Android 13 | XNNPACK (100), Vulkan (24) | 124 |
| Google Pixel 10 | Tensor G5 | XNNPACK (74), Vulkan (15) | 89 |
| iPhone 17 | A19 | XNNPACK (100), Core ML (75), MLX (16) | 191 |
| iPhone SE (3rd gen) | A15 Bionic | XNNPACK (60), Core ML (58), MLX (6) | 124 |

The Galaxy S26 Ultra and the S20+ each ran the **complete** Android registry, and
the iPhone 17 the complete iOS one, so those are the reference columns. The Pixel
10 and the SE ran subsets.

The S20+ is a 2020 flagship, six model generations behind the S26 Ultra, and it is
here to show the floor on Android the way the SE does on iOS. One iOS variant
(`text-embeddings/lfm2-5-embedding-350-m` `mlx` `int4`) failed to load and is
marked `???`; it has been re-exported and will be measured on the next sweep.

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

Across the 75 model families that publish both backends, Core ML beat XNNPACK in
**all 75** on iPhone 17, median **10.9x**. On the 58 of those also measured on
the iPhone SE (3rd gen) it won **58 of 58**, median **16.8x**.

| | iPhone 17 | iPhone SE (3rd gen) |
|---|---|---|
| Families where Core ML wins | 75 / 75 | 58 / 58 |
| Median speedup | 10.9x | 16.8x |
| Best case | 50.9x (`yolo26-xlarge-size-640`) | 92.2x (`fastsam-x`) |
| Worst case | 1.04x (`deeplab-v3-mobilenet-v3-large`) | 1.36x (`deeplab-v3-mobilenet-v3-large`) |

Much of that headline is an unfair fight, and worth stating plainly: 58 of the 75
families have no quantized XNNPACK build, so it is fp32 on the CPU against fp16
on the Neural Engine. Restrict to the 17 families where XNNPACK does have a
quantized build and the median lead falls to **5.55x**, against **15.96x** for
the fp32-only ones.

Five times is still decisive. If you ship to iOS and a Core ML variant exists for
your model, use it.

### Vulkan depends on the GPU

The same is not true of Vulkan on Android. It is a clear win on the Adreno in the
S26 Ultra and a clear loss on both of the other two GPUs for the same models.

| | SM-S948B (Adreno) | Pixel 10 (Tensor G5) | S20+ (Mali-G77) |
|---|---|---|---|
| Families where Vulkan wins | 14 / 16 | 5 / 15 | 4 / 16 |
| Median speedup | 1.41x | 0.82x | 0.69x |
| Best case | 4.84x (`paddle-ppocrv6-small`) | 3.56x (`whisper-small`) | 1.95x (`whisper-tiny`) |
| Worst case | 0.78x (`distiluse-base-multilingual-cased-v2`) | 0.27x (`paraphrase-multilingual-minilm-l12-v2`) | 0.31x (`paraphrase-multilingual-minilm-l12-v2`) |

OCR is the only family that wins on all three GPUs. The text embedders invert
completely: on the S26 Ultra `paraphrase-multilingual-minilm-l12-v2` runs 1.21x
faster on Vulkan, and on the Pixel 10 and the S20+ it runs **3.2x to 3.7x
slower**. Vulkan is worth measuring on your target hardware rather than
assuming.

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
- **Not a device ranking.** The five devices ran on different days under different
  ambient conditions. Compare variants within a column, not columns against each
  other.
- **Not precise.** Treat any two rows within about 30% of each other as tied.

## Where to go next

- [Android](./02-android.md) — the full 124-variant registry on the S26 Ultra and the S20+, with Pixel 10 alongside
- [iOS](./03-ios.md) — the full 191-variant registry on iPhone 17, with iPhone SE (3rd gen) alongside
- [LLMs](./04-llms.md) — decode throughput, measured separately
