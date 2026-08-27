---
title: Worklets & Threading
slug: /core-and-advanced/worklets-and-threading
description: 'Run synchronous native model loading and inference off the React Native JS thread using worklet runtimes, wrapAsync, and thread-safe tensors.'
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

Model loading and inference are synchronous, heavy native calls. Run them on the
React Native JS thread and the UI freezes for their whole duration — hundreds of
milliseconds for a load, tens per inference. React Native ExecuTorch avoids this by
integrating with
[`react-native-worklets`](https://www.npmjs.com/package/react-native-worklets)
(installed [alongside the library](../01-fundamentals/01-getting-started.md)), so
the same code can run on a separate thread.

## The `'worklet'` directive

A worklet runtime is a separate JavaScript runtime running on its own thread. A
function marked with the `'worklet'` directive can be shipped to one and run there.

Every core function, method, and native operation in the library carries this
directive — [`loadModel`](../06-api-reference/functions/loadModel.md),
[`model.execute`](../06-api-reference/type-aliases/Model.md#execute),
[`tensor`](../06-api-reference/functions/tensor.md), the
[`math`](../06-api-reference/react-native-executorch/namespaces/math/index.md) and
[`cv`](../06-api-reference/react-native-executorch/namespaces/cv/index.md)
operations, and so on. That is what lets you run the entire lower-level API off the
JS thread without any wrapping of your own; when you compose your own pipeline
steps, mark them `'worklet'` too so they stay dispatchable.

## Three execution contexts

Code in a React Native ExecuTorch app runs in one of three places, and where a
piece of work belongs determines how you call it.

| Context                        | What runs here                                                              | How you call native work                                                                                                                   |
| :----------------------------- | :-------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| **JS (main) thread**           | React rendering and app logic.                                              | Never run heavy synchronous ops here — offload them with [`wrapAsync`](#running-work-off-the-js-thread).                                   |
| **Background worklet runtime** | Model loading and inference, off the UI path.                               | The default target of `wrapAsync`; the library provides [`defaultWorkletRuntime`](../06-api-reference/variables/defaultWorkletRuntime.md). |
| **UI worklet runtime**         | Real-time, per-frame work (e.g. a camera frame processor) on the UI thread. | Call the synchronous `'worklet'` functions directly, no `await`.                                                                           |

The distinction that matters: on the JS thread you must push synchronous native
work onto another runtime, while inside a worklet runtime you call the same
functions directly, synchronously, with no promises in the hot path.

## Running work off the JS thread

[`wrapAsync(fn, runtime?)`](../06-api-reference/functions/wrapAsync.md) turns a
synchronous worklet function into an async one: it dispatches `fn` to a background
worklet runtime, awaits the result, and returns a `Promise`. This is how you keep
model loading and inference from blocking the UI.

```typescript
import { loadModel, wrapAsync } from 'react-native-executorch';

// loadModel is synchronous; run it on the background runtime instead of the JS thread
const model = await wrapAsync(loadModel)('/path/to/model.pte');
```

It defaults to
[`defaultWorkletRuntime`](../06-api-reference/variables/defaultWorkletRuntime.md),
a dedicated background thread the library creates for exactly this. Pass your own
`WorkletRuntime` (from `createWorkletRuntime` in `react-native-worklets`) as the
second argument to isolate work on a separate thread.

`wrapAsync` also handles the error boundary: only plain data survives the hop back
from a worklet runtime, so it rebuilds anything thrown inside `fn` as an
[`RnExecuTorchError`](../06-api-reference/functions/RnExecuTorchError.md) on the JS
side. This is why the library's errors are a factory over plain fields rather than
a class — see [Error Handling](./05-error-handling.md).

## Sharing tensors and models across threads

[`Tensor`](../06-api-reference/type-aliases/Tensor.md) and
[`Model`](../06-api-reference/type-aliases/Model.md) are native host objects, not
JavaScript-heap values, so they are safe to share across runtimes with no copying.
You can load a model on the background runtime and then use it from the UI runtime,
handing the same handle to both.

The native layer keeps this safe: a model serializes its own execution, and a
concurrent [`execute`](../06-api-reference/type-aliases/Model.md#execute) from
another thread fails fast with
[`RESOURCE_BUSY`](./05-error-handling.md#the-code-set) rather than corrupting
state. See [Thread safety](./02-models-and-tensors.md#thread-safety) in Models &
Tensors for the full guarantees.

## The dual-API pattern

Because a pipeline step may be called from the JS thread (with `await`) or from
inside another worklet (synchronously, in a frame processor), pipelines expose it
both ways: a synchronous `'worklet'` function, and an async wrapper built with
[`wrapAsync`](../06-api-reference/functions/wrapAsync.md). This is exactly how the
built-in pipelines are structured.

```typescript
import { loadModel, tensor, wrapAsync } from 'react-native-executorch';
import type { WorkletRuntime } from 'react-native-worklets';

export async function createClassifier(modelPath: string, runtime?: WorkletRuntime) {
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  const tInput = tensor('float32', [1, 3, 224, 224]);
  const tOutput = tensor('float32', [1, 1000]);

  // The synchronous worklet function — call it directly inside a worklet runtime
  const classifyWorklet = (input: Float32Array) => {
    'worklet';
    tInput.setData(input);
    model.execute('forward', [tInput], [tOutput]);
    return tOutput.getData(new Float32Array(tOutput.numel));
  };

  return {
    classifyWorklet, // run synchronously on a UI/background runtime
    classify: wrapAsync(classifyWorklet, runtime), // await from the JS thread
    dispose: () => {
      tInput.dispose();
      tOutput.dispose();
      model.dispose();
    },
  };
}
```

A caller on the JS thread `await`s `classify`; a real-time frame processor running
on the UI runtime calls `classifyWorklet` directly, keeping per-frame latency free
of promise scheduling.

## Where to go next

- [Models & Tensors](./02-models-and-tensors.md) — the primitives you dispatch to worklet runtimes, and their thread-safety guarantees.
- [Operations & Utilities](./04-operations-and-utilities.md) — the `'worklet'`-marked operations you compose on any runtime.
- [Error Handling](./05-error-handling.md) — why errors are built to survive the worklet boundary.

### API reference

- [`wrapAsync()`](../06-api-reference/functions/wrapAsync.md) · [`defaultWorkletRuntime`](../06-api-reference/variables/defaultWorkletRuntime.md)
- [`loadModel()`](../06-api-reference/functions/loadModel.md) · [`Model`](../06-api-reference/type-aliases/Model.md) · [`Tensor`](../06-api-reference/type-aliases/Tensor.md)
