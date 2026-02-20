# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Native ExecuTorch — a React Native library for running AI models on-device using Meta's ExecuTorch framework. Bridges React Native (TypeScript) with native C++/iOS/Android to run local inference for LLMs, computer vision, speech, and more.

**Requirements**: iOS 17.0+, Android 13+, React Native 0.81+, New Architecture only.

## Monorepo Structure

Yarn 4.1.1 workspaces:

- `packages/react-native-executorch/` — the library (published to npm)
- `apps/` — demo apps (computer-vision, llm, speech, text-embeddings, etc.)
- `docs/` — documentation site
- `scripts/` — build utilities

## Commands

```bash
# Root level
yarn lint                  # ESLint across all packages
yarn typecheck             # TypeScript checking across all packages

# Library (packages/react-native-executorch/)
yarn typecheck
yarn lint
yarn clean
yarn prepare               # Build with react-native-builder-bob
```

No unit test suite — testing is done by building and running the demo apps on device.

## Architecture

### TypeScript → C++ Bridge

The bridge uses JSI (JavaScript Interface) with global loader functions:

1. **App startup**: `ETInstallerNativeModule.install()` (TurboModule, synchronous) calls C++ `RnExecutorchInstaller::injectJSIBindings()`
2. **Binding injection**: C++ template `loadModel<ModelT>()` registers global functions like `global.loadLLM()`, `global.loadImageSegmentation()`, etc.
3. **Model loading**: JS calls global function → C++ constructs model → returns `ModelHostObject` (JSI HostObject wrapping C++ model)
4. **Inference**: JS calls methods on the host object (e.g., `.generate()`, `.forward()`) → C++ executes ExecuTorch model → returns results as JSI TypedArrays

Global loader declarations are in `src/index.ts`.

### C++ Model Registration

Models use the `REGISTER_CONSTRUCTOR` macro (in their header) to declare their constructor signature for JSI binding:

```cpp
REGISTER_CONSTRUCTOR(models::image_segmentation::ImageSegmentation,
                     std::string, std::vector<float>, std::vector<float>,
                     std::shared_ptr<react::CallInvoker>);
```

The `CallInvoker` argument is always last and injected automatically — not passed from JS.

### TypeScript Layers

- **Modules** (`src/modules/`): Classes wrapping native host objects. Each has static factory methods or a `load()` method. Extend `BaseModule`.
- **Hooks** (`src/hooks/`): React hooks that manage module lifecycle (load, forward, delete, error/progress state). Two patterns:
  - `useModule` — for constructor-based modules (`new Module()` + `load()`)
  - `useModuleFactory` — for factory-based modules (async static factory)
- **Types** (`src/types/`): Shared type definitions per domain.
- **Controllers** (`src/controllers/`): Business logic layer (used by LLM).

### C++ Side (`common/`)

- `rnexecutorch/` — project C++ code (~16k lines)
  - `models/` — model implementations, each with a `BaseModel` subclass
  - `data_processing/` — image processing (OpenCV), numerical utils
  - `host_objects/` — JSI interop (`ModelHostObject`, `JsiConversions`)
  - `RnExecutorchInstaller.h` — JSI binding registration (template metaprogramming)
  - `jsi/OwningArrayBuffer.h` — owns data returned to JS as ArrayBuffer
- `ada/` — vendored URL parser (~28k lines, don't modify)
- `runner/` — ExecuTorch runner utilities

### Native Platform Code

- **iOS** (`ios/`): `ETInstaller.mm` — ObjC++ TurboModule, loads frameworks, calls C++ installer
- **Android** (`android/`): `ETInstaller.kt` — Kotlin TurboModule + JNI bridge to C++ installer

## Key Patterns

- Models return TypedArrays (Int32Array, Float32Array) to JS, not plain arrays
- `ResourceFetcher.ts` handles model binary downloads with progress callbacks
- `OwningArrayBuffer` in C++ owns data that gets exposed as JS ArrayBuffer
- Image processing uses OpenCV (`cv::Mat` ↔ tensor conversions)
- Error handling: C++ `RnExecutorchError` → JS `RnExecutorchError` with error codes
- Cross-platform logging: `#include <rnexecutorch/Log.h>`, use `rnexecutorch::log(LOG_LEVEL::Info, ...)`

## Formatting

- **TypeScript**: Prettier (single quotes, 2-space indent, trailing commas) + ESLint with `@react-native` config
- **C++**: clang-format, C++20 standard
- **Kotlin**: ktlint
- Pre-commit hooks via lefthook enforce all of the above
