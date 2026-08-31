---
title: Worklets & Threading
slug: /core-and-advanced/worklets-and-threading
description: 'Execute native model loading and inference off the React Native JavaScript thread using worklet runtimes, wrapAsync, and thread-safe native tensors.'
keywords:
  [
    react native executorch,
    worklets,
    threading,
    wrapAsync,
    worklet runtime,
    background thread,
    frame processor,
  ]
---

# Worklets & Threading

Model compilation, tensor allocation, and neural network inference are synchronous, compute-intensive native operations. Running them directly on the React Native JavaScript thread blocks UI rendering and touch handling.

To keep the UI responsive, React Native ExecuTorch integrates with [`react-native-worklets`](https://www.npmjs.com/package/react-native-worklets), allowing synchronous native code to execute across secondary threads and worklet runtimes.

## The `'worklet'` Directive

A worklet runtime is an isolated JavaScript environment running on a dedicated thread. Adding the `'worklet'` directive at the top of a function marks it as dispatchable to any worklet runtime.

All core primitives, methods, and native operations in this library include the `'worklet'` directive out of the box — including [`loadModel`](../06-api-reference/functions/loadModel.md), [`model.execute`](../06-api-reference/type-aliases/Model.md#execute), [`tensor`](../06-api-reference/functions/tensor.md), and namespaces like [`math`](../06-api-reference/react-native-executorch/namespaces/math/index.md) and [`cv`](../06-api-reference/react-native-executorch/namespaces/cv/index.md). When creating custom preprocessing or pipeline helpers, add the `'worklet'` directive so they can run off-thread without additional wrappers.

## Execution Contexts

In a React Native app with ExecuTorch, code executes across three distinct environments:

| Context                        | Role                                                                                             | How to Call ExecuTorch                                                                                                                                        |
| :----------------------------- | :----------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Main JS Thread**             | React component rendering, state management, and business logic.                                 | Offload synchronous operations using [`wrapAsync`](#offloading-work-with-wrapasync).                                                                          |
| **Background Worklet Runtime** | Asynchronous model loading and background inference.                                             | Targets the library's pre-configured [`defaultWorkletRuntime`](../06-api-reference/variables/defaultWorkletRuntime.md) (or a custom runtime) via `wrapAsync`. |
| **UI Worklet Runtime**         | Per-frame video processing (e.g. VisionCamera frame processors) running on the UI/render thread. | Invoke synchronous `'worklet'` functions directly without `await` or promise overhead.                                                                        |

## Offloading Work with `wrapAsync`

[`wrapAsync(fn, runtime?)`](../06-api-reference/functions/wrapAsync.md) converts a synchronous worklet function into a Promise-based asynchronous function. Calling the wrapped function dispatches `fn` to the target runtime, executes it, and resolves on the JS thread with the returned value.

```typescript
import { loadModel, wrapAsync } from 'react-native-executorch';

// loadModel is synchronous; wrapAsync dispatches it to a background thread
const model = await wrapAsync(loadModel)('/path/to/model.pte');
```

If the `runtime` parameter is omitted, `wrapAsync` targets [`defaultWorkletRuntime`](../06-api-reference/variables/defaultWorkletRuntime.md) — a background thread created automatically by the library. You can also pass a custom runtime created with `createWorkletRuntime` from `react-native-worklets` for isolated workloads.

### Error Propagation Across Runtimes

When a function running inside a worklet throws an error, `wrapAsync` intercepts the serialized exception and reconstructs it on the JS thread as an [`RnExecuTorchError`](../06-api-reference/functions/RnExecuTorchError.md). This preserves the original error `code` and diagnostics across the thread boundary. See [Error Handling](./05-error-handling.md) for details on narrowing these errors.

## Sharing Models and Tensors Across Threads

[`Tensor`](../06-api-reference/type-aliases/Tensor.md) and [`Model`](../06-api-reference/type-aliases/Model.md) are JSI host objects holding pointers to native C++ allocations. Because their underlying data resides in native memory rather than the JS garbage collector heap, handles can be passed across runtimes with zero copying:

- You can load a model once on a background runtime via `wrapAsync(loadModel)`, and immediately pass the handle to a UI worklet.
- Native mutexes ensure safety: executing a model from multiple threads concurrently fails immediately with `RESOURCE_BUSY` rather than corrupting memory.

For complete guarantees, see [Thread Safety](./02-models-and-tensors.md#thread-safety).

## The Dual-API Pattern

High-level pipelines often need to support both async calls from React components (on the JS thread) and synchronous execution in high-throughput loops (like camera frame processors on a UI worklet). To accommodate both, pipelines expose dual interfaces:

```typescript
import { loadModel, tensor, wrapAsync } from 'react-native-executorch';
import type { WorkletRuntime } from 'react-native-worklets';

export async function createClassifier(modelPath: string, runtime?: WorkletRuntime) {
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  const tInput = tensor('float32', [1, 3, 224, 224]);
  const tOutput = tensor('float32', [1, 1000]);

  // Synchronous worklet: call directly inside frame processors / worklet runtimes
  const classifyWorklet = (input: Float32Array) => {
    'worklet';
    tInput.setData(input);
    model.execute('forward', [tInput], [tOutput]);
    return tOutput.getData(new Float32Array(tOutput.numel));
  };

  return {
    // 1. Synchronous execution for worklets (zero promise overhead)
    classifyWorklet,
    // 2. Async execution for the JS thread
    classify: wrapAsync(classifyWorklet, runtime),
    // Resource cleanup
    dispose: () => {
      tInput.dispose();
      tOutput.dispose();
      model.dispose();
    },
  };
}
```

## Next Steps

- [Models & Tensors](./02-models-and-tensors.md) — Memory model, lifecycle management, and native tensor operations.
- [Operations & Utilities](./04-operations-and-utilities.md) — Native preprocessing (`cv`, `math`, `speech`) compatible with worklets.
- [Error Handling](./05-error-handling.md) — Safe error handling across runtime boundaries.

### API Reference

- [`wrapAsync()`](../06-api-reference/functions/wrapAsync.md) · [`defaultWorkletRuntime`](../06-api-reference/variables/defaultWorkletRuntime.md)
- [`loadModel()`](../06-api-reference/functions/loadModel.md) · [`Model`](../06-api-reference/type-aliases/Model.md) · [`Tensor`](../06-api-reference/type-aliases/Tensor.md)
