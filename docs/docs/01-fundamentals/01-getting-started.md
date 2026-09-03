---
title: Getting Started
slug: /fundamentals/getting-started
keywords:
  [
    react native,
    react native ai,
    react native llm,
    on-device ai,
    executorch,
    pytorch mobile,
    mobile ml,
    vision,
    speech,
  ]
description: 'Get started with React Native ExecuTorch — high-performance, privacy-first on-device AI inference for React Native.'
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Getting Started

React Native ExecuTorch is an on-device AI inference library for React Native,
powered by [ExecuTorch](https://executorch.ai) — Meta's on-device inference
runtime and a project under the PyTorch Foundation. It lets you run machine
learning models directly on the user's phone with zero network calls, full offline
capability, and guaranteed privacy. No data ever leaves the device.

The library ships with a curated set of pre-exported models covering
computer vision, language models, text-to-speech, transcription, and more — all available in our
[HuggingFace collection](https://huggingface.co/software-mansion/collections)
and ready to use out of the box. You can also bring your own `.pte` models and
plug them into existing pipelines or build entirely custom ones from scratch.

## What is ExecuTorch?

[ExecuTorch](https://executorch.ai) is a PyTorch Core project — Meta's on-device
inference runtime for deploying PyTorch models on edge devices. It takes standard
PyTorch models and compiles them into an optimized `.pte` format that runs
natively on mobile phones, AR/VR headsets, embedded systems, and custom
accelerators.

The runtime supports hardware-accelerated backends for every major platform:
XNNPACK for CPU acceleration across all platforms, Core ML and MLX on Apple
devices, Vulkan for GPU, and more. It's a core part of the PyTorch ecosystem,
with full support for the standard PyTorch model export workflow.

ExecuTorch handles the hard parts: memory planning, operator dispatch, and
hardware delegate selection — so you don't have to. To learn more about the
underlying runtime, check out the
[ExecuTorch documentation](https://docs.pytorch.org/executorch/stable/index.html).

## Installation

Install [`react-native-executorch`](https://www.npmjs.com/package/react-native-executorch)
alongside its peer dependencies:

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm">

```bash
npm install react-native-executorch react-native-worklets react-native-blob-util
```

  </TabItem>
  <TabItem value="yarn" label="yarn">

```bash
yarn add react-native-executorch react-native-worklets react-native-blob-util
```

  </TabItem>
  <TabItem value="pnpm" label="pnpm">

```bash
pnpm add react-native-executorch react-native-worklets react-native-blob-util
```

  </TabItem>
</Tabs>

:::info Requirements
React Native ExecuTorch requires:

- **New Architecture** enabled
- **React Native 0.81+** or **Expo SDK 54+** with [Development Builds](https://docs.expo.dev/develop/development-builds/introduction/) (**Expo Go is not supported** due to custom C++ native libraries)
- **iOS 17.0+** / **Android 13+**

For supported React Native versions, see the [Compatibility
table](../05-other/01-compatibility.mdx).
:::

### Selecting native libraries

The native binaries — the ExecuTorch hardware backends (XNNPACK, Core ML, MLX,
Vulkan), and third-party binaries — are downloaded on demand at install time. By
default, **everything is downloaded and enabled**, so no configuration is
required to get started.

If you want a smaller app or faster installs, declare what you use in a
`react-native-executorch` block in your `package.json`, e.g.:

```json
{
  "react-native-executorch": {
    "features": ["classification", "styleTransfer"]
  }
}
```

The available options are:

- **`features`** — high-level task names. Each one expands to the backends and
  native libs it needs.
- **`backends`** — hardware backends directly, e.g. `xnnpack`, `coreml`,
  `vulkan`.
- **`libs`** — extra native libraries, see
  [options](../03-core-and-advanced/08-native-libraries.md#options).

The three lists are merged, so you can pair a `features` set with extra
`backends` / `libs` entries. Re-run your package manager's install after
editing. See [Native Libraries](../03-core-and-advanced/08-native-libraries.md)
for details.

## Choose Your Path

Most mobile ML libraries force you into one of two extremes: opaque native
black boxes that implement a fixed set of pipelines with no room for
customization, or raw low-level bindings that leave you to wire up everything
from preprocessing to memory management yourself.

What if you need a bit of both? Ready-to-use pipelines for common tasks, but
also the freedom to drop down and build something custom when the out-of-the-box
solution doesn't quite fit.
That's exactly how React Native ExecuTorch is designed. The library is built
around a clean **two-layer architecture** where the higher-level layer is
implemented entirely on top of the lower-level one — not as separate C++ code
hidden behind abstractions. This means:

- **Pipelines are transparent.** Every task pipeline (computer vision,
  LLM chat, etc.) is written in a few hundred lines of TypeScript — often
  less. You can read the full input/output contracts, preprocessing, and
  postprocessing logic in one place — no native code required.

- **Custom models just work.** Plug your own `.pte` into any existing pipeline —
  computer vision, LLM, whatever. The schema DSL declares exactly what each
  pipeline expects (tensor shapes, data types, preprocessing), so there's no
  guessing. Everything is in one place, readable in TypeScript.

- **You can always drop down.** When built-in pipelines don't fit your use
  case, the lower-level API gives you direct access to ExecuTorch model
  execution, native tensor operations, high-performance math/vision operators,
  and worklet threading. You build custom orchestration pipelines entirely in
  TypeScript — no C++ required — with complete control over preprocessing,
  inference, postprocessing, and memory.

### High-Level Task Pipelines

Have a specific problem to solve — computer vision, LLM chat, speech
transcription? Each task has a ready-made pipeline you can drop into your app.
Hooks handle downloading, caching, and memory disposal automatically. Imperative
APIs give you manual control. Both work with pre-exported models from our
[HuggingFace collection](https://huggingface.co/software-mansion/collections) or
your own `.pte` files — as long as they match the pipeline's schema.

[Explore High-Level Pipelines →](../category/extensions)

### Lower-Level Runtime & Custom Pipelines

Working with a custom model or chaining multiple models together into a custom
workflow? The lower-level API gives you direct access to ExecuTorch model
execution, native tensor operations, native operators for vision, math, NLP, and
audio, plus worklet-based multi-threading. You write the entire pipeline in
TypeScript using the exact same building blocks and primitives we use to build
the library's built-in extensions — no native C++ required.

[Explore Lower-Level API →](../category/core--advanced)
