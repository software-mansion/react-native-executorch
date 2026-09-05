---
title: Migrating from v0.9.x
slug: /fundamentals/migrating-from-v0-9
description: 'Step-by-step migration guide from legacy v0.9.x to the new v0.10.0 architecture in React Native ExecuTorch.'
keywords:
  [
    react native,
    react native ai,
    executorch,
    migration guide,
    v0.10,
    legacy api,
    react-native-executorch/legacy,
  ]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Migrating from v0.9.x

React Native ExecuTorch v0.10.0 is a complete, ground-up rewrite of the library.
It replaces monolithic native modules with a two-layer architecture: a flexible,
lower-level Core API for raw model execution and tensor operations, and
transparent, end-to-end pipeline implementations in TypeScript topped with declarative React hooks.

While the new API is not backwards-compatible with v0.9.x, the library provides
**100% functional parity**: every single task, model, and capability supported in
v0.9.x is supported in v0.10.0, alongside numerous new models and features.

To ensure your existing applications continue to function without requiring an
immediate code overhaul, v0.10.0 ships the complete pre-0.10 implementation under
a dedicated legacy entry point: `'react-native-executorch/legacy'`.

## Upgrading Paths

When updating to `0.10.x`, you have two ways forward:

### Option A: The Legacy Compatibility Module (`/legacy`)

We did not want to break existing applications overnight with an abrupt, all-or-nothing
upgrade. To support a **gradual refactoring process**, we preserved the entire v0.9.x API
under a dedicated legacy subpath. You can update your package version right away and
transition individual screens or pipelines to the new v0.10 architecture at your own pace.

To keep existing code working, simply update your imports to point to `'react-native-executorch/legacy'`:

```typescript
// Before (v0.9.x)
import { initExecutorch, useClassification, models } from 'react-native-executorch';

// After (v0.10.0 legacy compatibility)
import { initExecutorch, useClassification, models } from 'react-native-executorch/legacy';
```

All previous hooks, modules (`ClassificationModule`, `LLMModule`, etc.), options,
and types will continue to function exactly as they did in v0.9.x. Both the legacy and
new APIs can even coexist in the same project while you migrate component by component.

:::caution Legacy Deprecation
The legacy API is deprecated and will be removed in a future release. We
recommend using this entry point as a temporary stepping stone to migrate to the
new v0.10 API incrementally. Refer to the [v0.10.0-legacy archived documentation](/react-native-executorch/docs/0.10.0-legacy/fundamentals/getting-started)
for legacy reference.
:::

### Option B: Migrating to the New v0.10 Architecture

Migrating to the new v0.10 API gives you access to transparent pipelines,
deterministic memory management, worklet-safe thread dispatch, and lower-level
runtime primitives.

## Dependencies

The peer dependencies required by your application depend on which API you use:

### For the New v0.10 API

In v0.10, resource fetching and threading have been built directly into the core
runtime:

- **Satellite fetcher packages are removed**: You no longer need
  `@software-mansion/react-native-executorch-bare-resource-fetcher` or
  `expo-resource-fetcher`. Download management is powered directly by
  [`react-native-blob-util`](https://github.com/RonRadtke/react-native-blob-util).
- **Manual initialization is gone**: You no longer call `initExecutorch(...)`.
  The runtime and fetcher initialize on demand.
- **Worklet threading**: Added
  [`react-native-worklets`](https://github.com/software-mansion/react-native-worklets)
  as a core peer dependency to allow synchronous native operations to run
  smoothly off the JavaScript thread.

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm">

```bash
# 1. Uninstall legacy fetcher adapters if present
npm uninstall @software-mansion/react-native-executorch-bare-resource-fetcher @software-mansion/react-native-executorch-expo-resource-fetcher

# 2. Install v0.10 and peer dependencies
npm install react-native-executorch react-native-worklets react-native-blob-util
```

  </TabItem>
  <TabItem value="yarn" label="yarn">

```bash
# 1. Uninstall legacy fetcher adapters if present
yarn remove @software-mansion/react-native-executorch-bare-resource-fetcher @software-mansion/react-native-executorch-expo-resource-fetcher

# 2. Install v0.10 and peer dependencies
yarn add react-native-executorch react-native-worklets react-native-blob-util
```

  </TabItem>
  <TabItem value="pnpm" label="pnpm">

```bash
# 1. Uninstall legacy fetcher adapters if present
pnpm remove @software-mansion/react-native-executorch-bare-resource-fetcher @software-mansion/react-native-executorch-expo-resource-fetcher

# 2. Install v0.10 and peer dependencies
pnpm add react-native-executorch react-native-worklets react-native-blob-util
```

  </TabItem>
</Tabs>

### For the Legacy API (`react-native-executorch/legacy`)

If you remain on `'react-native-executorch/legacy'`, you must keep your existing
fetcher adapter package:

- Bare React Native: `@software-mansion/react-native-executorch-bare-resource-fetcher`
- Expo: `@software-mansion/react-native-executorch-expo-resource-fetcher`

You must also continue calling `initExecutorch({ resourceFetcher: ... })` at the
root of your application before using any legacy modules.

## Old vs. New: What Changed and Why

React Native ExecuTorch v0.10 achieves **100% functional parity** with v0.9: every computer
vision model, speech model, tokenizer, and LLM supported in v0.9 is supported in v0.10 with
matching or better performance.

However, the internal mechanics and Developer Experience have been fundamentally redesigned:

### Modular TypeScript Building Blocks vs. Opaque C++ Modules

- **In v0.9 (Legacy)**: Each task was an opaque, tightly coupled native C++ module
  (`ClassificationModule`, `OCRModule`, `LLMRunner`). Preprocessing, inference, and postprocessing
  were buried in native code with rigid boundaries. If your model or workflow didn't fit a
  pre-packaged module, reverse-engineering its contracts required digging through multiple native
  abstraction layers, and customizing it was practically impossible without modifying C++ source code.
- **In v0.10 (New)**: Pipelines are **composed from modular building blocks entirely in TypeScript**.
  Users and library maintainers build with the exact same tools: the native layer provides only fast
  operator primitives ([`cv`, `math`, `nlp`, `speech`](../03-core-and-advanced/04-operations-and-utilities.md)),
  while task orchestration is plain, readable TypeScript built on top of the
  [lower-level Core API](../category/core--advanced).
  - **Inspectability**: You can navigate into any pipeline with your IDE's 'Go to Definition'
    and read every transformation step directly in TypeScript — no hidden native logic.
  - **Developer Freedom**: You can swap, tweak, or reorder any step (e.g. adjust normalization,
    custom non-maximum suppression, or multi-model chaining) without writing a single line of C++.
  - **Maintainability & Loose Coupling**: Decoupling the orchestration layer from the native runtime
    removes the friction of tight coupling. Adding new features, maintaining existing pipelines,
    and contributing custom architectures is vastly simpler for both library maintainers and users alike.

### Deterministic Native Memory vs. Implicit Cleanup

- **In v0.9 (Legacy)**: Memory allocation was implicit and tied to native module handles. If
  model construction failed midway or references lingered across component remounts, native memory
  could leak silently.
- **In v0.10 (New)**: Native tensors and models follow an explicit lifecycle contract. Resources
  provide an explicit `.dispose()` method, and higher-level utilities like
  [`createResourceScope()`](../06-api-reference/functions/createResourceScope.md)
  ensure all intermediate tensors allocated during preprocessing and inference are automatically
  reclaimed, even if execution throws.

### Universal Worklet & Multi-Threading Support

- **In v0.9 (Legacy)**: Worklet execution was restricted to a few ad-hoc methods
  (such as `generateFromFrame` on vision modules), while general model loading and
  inference were bound to their respective module implementations.
- **In v0.10 (New)**: Every native JSI function and core primitive carries the
  `"worklet";` directive by default. You can dispatch any operation — from model
  compilation via [`loadModel()`](../06-api-reference/functions/loadModel.md) to
  inference and image processing — to background threads using
  [`wrapAsync()`](../06-api-reference/functions/wrapAsync.md), or execute them
  synchronously within UI worklets and camera frame processors.

### Arbitrary Model Execution vs. Rigid Forward Callers

- **In v0.9 (Legacy)**: Running custom models was severely constrained. The native wrapper
  for user `.pte` files (`ExecutorchModule`) only exposed a single rigid `forward` method with
  no way to execute arbitrary exported methods, inspect method signatures, or manipulate model
  inputs and outputs as native tensors.
- **In v0.10 (New)**: The [`Model`](../06-api-reference/type-aliases/Model.md) primitive exposes
  the full native ExecuTorch runtime. You can inspect exported methods and delegate backends,
  execute any method by name, provide pre-allocated output buffers, and compose arbitrary multi-step
  model workflows directly in TypeScript.

### On-Demand Native Binaries vs. Monolithic Packaging

- **In v0.9**: All hardware backends and third-party binaries were bundled statically into
  the app binary, inflating application size regardless of which tasks were used.
- **In v0.10**: Native libraries and hardware backends are now downloaded on demand at install
  time and can be selectively filtered through the `react-native-executorch` block in your
  `package.json`. This optimization benefits all applications upgrading to v0.10, even those
  temporarily using the legacy compatibility entry point (`react-native-executorch/legacy`).
  See [Native Libraries](../03-core-and-advanced/08-native-libraries.md).

## Next Steps

- Check out the [Getting Started guide](./01-getting-started.md) for quick installation and setup.
- Explore the [Extensions documentation](../category/extensions) for ready-to-use task hooks and pipelines.
- Read [Models & Tensors](../03-core-and-advanced/02-models-and-tensors.md) if you are bringing custom `.pte` models into your project.
