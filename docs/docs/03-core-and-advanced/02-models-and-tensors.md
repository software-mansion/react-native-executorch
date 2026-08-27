---
title: Models & Tensors
slug: /core-and-advanced/models-and-tensors
description: 'Direct model execution, tensor allocation, and the explicit memory model behind the core primitives of React Native ExecuTorch.'
keywords:
  [
    react native executorch,
    executorch model,
    tensor,
    loadModel,
    execute,
    memory management,
    dispose,
    jsi,
    in-place execution,
    worklets,
  ]
---

# Models & Tensors

The entire library is built on two domain-agnostic primitives:
**[`Model`](../06-api-reference/type-aliases/Model.md)** and
**[`Tensor`](../06-api-reference/type-aliases/Tensor.md)**. Every high-level task
pipeline — object detection, LLM chat, text-to-speech — is written in TypeScript
on top of them.

This is the lower-level API. It gives you direct access to native ExecuTorch:
load any `.pte` file, inspect its schema and hardware backends, execute any
exported method, and manipulate raw tensor buffers — all from TypeScript, without
writing native C++. These are the primitives you drop down to when a built-in
pipeline doesn't fit your model, and they are the exact primitives every built-in
pipeline is written with.

## The memory model

Tensors and models allocate memory in native C++ heaps rather than the
JavaScript garbage-collected heap. This has a few consequences that shape every
signature in the lower-level API.

### Primitives live in native memory

A [`Tensor`](../06-api-reference/type-aliases/Tensor.md) and a
[`Model`](../06-api-reference/type-aliases/Model.md) are lightweight JavaScript
handles to native C++ objects. The actual bytes — the contiguous tensor buffer,
the compiled ExecuTorch module — live on the native heap, outside the JavaScript
engine's memory. The JS runtime holds only a reference.

This lets the hardware backends (XNNPACK, Core ML, Vulkan) operate directly on
native buffers with no copies, while you orchestrate them in readable TypeScript.
The trade-off is that the garbage collector cannot see the memory that matters,
so you must release it yourself.

:::warning You own the memory
JSI host objects are nominally tracked by the JS garbage collector, but relying
on automatic cleanup is strongly discouraged. The GC has no insight into how much
native memory a handle pins, so it collects late or not at all. Always release
tensors and models explicitly with [`dispose()`](#lifecycle-and-disposal).
:::

### Operations write into destinations you provide

Operations in the lower-level API do not allocate and return new tensors. They
take the destination as an explicit argument and write into it in place. Nearly
every operation — [native CV and math ops](./04-operations-and-utilities.md), model
execution, tensor copies — follows the same `fn(src, dst, ...options)` shape and
returns `dst`.

```typescript
import { tensor, cv } from 'react-native-executorch';

const src = tensor('uint8', [480, 640, 3]);
const dst = tensor('uint8', [224, 224, 3]);

// resize does not return a new tensor — it fills `dst` and returns it
cv.resize(src, dst);
```

Model execution works the same way: you pre-allocate the output tensors and pass
them to [`execute`](#executing-inference), which writes the results into them
rather than handing back new tensors. Because you own every destination — inputs,
outputs, and scratch buffers alike — you can allocate them once and reuse them
across runs instead of allocating on every iteration.

## The `Tensor` primitive

A [`Tensor`](../06-api-reference/type-aliases/Tensor.md) is a multidimensional
typed array in native memory. Two immutable properties define it: its element
data type ([`DType`](../06-api-reference/type-aliases/DType.md)) and its `shape`.
A read-only `numel` property reports the total element count, derived from the
shape.

### Data types

| `DType`     | Element type       | TypedArray for transfers | Bytes / element |
| :---------- | :----------------- | :----------------------- | :-------------- |
| `'float32'` | 32-bit float       | `Float32Array`           | 4               |
| `'int32'`   | 32-bit signed int  | `Int32Array`             | 4               |
| `'int64'`   | 64-bit signed int  | `BigInt64Array`          | 8               |
| `'uint8'`   | 8-bit unsigned int | `Uint8Array`             | 1               |
| `'bool'`    | boolean            | `Uint8Array` (`0` / `1`) | 1               |

### Allocating

Create tensors with the [`tensor()`](../06-api-reference/functions/tensor.md)
factory. Pass an optional typed array to initialize the buffer; omit it to
allocate uninitialized memory.

```typescript
import { tensor } from 'react-native-executorch';

// Uninitialized — contents are undefined until written
const tInput = tensor('float32', [1, 3, 224, 224]);

// Initialized from a JS typed array (byte length must match the shape)
const tWeights = tensor('float32', [1, 4], new Float32Array([1, 2, 3, 4]));
```

### Moving data across the JS and native boundary

Two methods copy bytes between a JS typed array and the native buffer:

- **[`setData(src)`](../06-api-reference/type-aliases/Tensor.md#setdata)** copies
  a typed array into the tensor and returns the tensor.
- **[`getData(dst)`](../06-api-reference/type-aliases/Tensor.md#getdata)** copies
  the tensor out into a typed array and returns that array.

```typescript
const t = tensor('float32', [2, 2]);
try {
  t.setData(new Float32Array([10, 20, 30, 40]));

  const out = t.getData(new Float32Array(t.numel));
  console.log(out); // Float32Array [10, 20, 30, 40]
} finally {
  t.dispose();
}
```

### Copying between tensors

To move data between two native buffers without a round trip through JavaScript,
use [`copyTo`](../06-api-reference/type-aliases/Tensor.md#copyto), a direct C++
`memcpy` that returns the destination.

```typescript
tSource.copyTo(tDest);

// Copy a sub-slice: `length` elements starting at `offset`
tSource.copyTo(tDest, { offset: 10, length: 50 });
```

### Chaining transformations with `through`

Since every operation takes `src` first and returns `dst`, composing them
directly means nested calls.
[`through`](../06-api-reference/type-aliases/Tensor.md#through) and
[`throughIf`](../06-api-reference/type-aliases/Tensor.md#throughif) turn that into
a readable left-to-right pipeline:

- **[`through(fn, ...args)`](../06-api-reference/type-aliases/Tensor.md#through)**
  calls `fn(this, ...args)` and returns the result.
- **[`throughIf(pred, fn, ...args)`](../06-api-reference/type-aliases/Tensor.md#throughif)**
  applies `fn` only when `pred` is `true`, otherwise passes `this` through
  unchanged.

Because operations return their destination and `through` forwards that return
value, the destination of one step becomes the source of the next. You pass the
operation itself, with its destination and options as trailing arguments:

```typescript
import { tensor, cv } from 'react-native-executorch';

// Pre-allocated scratch buffers for an image preprocessing chain
const tensors = [
  tensor('uint8', [480, 640, 4]), // tImage: RGBA source, HWC
  tensor('uint8', [480, 640, 3]), // tRgb: drop alpha
  tensor('uint8', [224, 224, 3]), // tResized: spatial resize, HWC
  tensor('uint8', [3, 224, 224]), // tChwU8: channels-first, still uint8
  tensor('float32', [3, 224, 224]), // tChw: normalized float32
] as const;

const [tImage, tRgb, tResized, tChwU8, tChw] = tensors;

const chw = tImage
  .through(cv.cvtColor, tRgb, 'RGBA2RGB')
  .through(cv.resize, tResized, { mode: 'stretch' })
  .through(cv.toChannelsFirst, tChwU8)
  .through(cv.normalize, tChw, { alpha: 1 / 255 }); // uint8 → float32 cast
// `chw` is `tChw`, ready to feed straight into a model
```

The operations chained here come from the
[`cv`](../06-api-reference/react-native-executorch/namespaces/cv/index.md)
namespace. They, and the full set of
[`math`](../06-api-reference/react-native-executorch/namespaces/math/index.md) and
[`speech`](../06-api-reference/react-native-executorch/namespaces/speech/index.md)
operations you can compose the same way, are documented in
[Operations & Utilities](./04-operations-and-utilities.md).

`throughIf` applies a step only when a condition holds and passes the tensor
through untouched otherwise. Since both branches feed whatever comes next, use it
for transforms that leave shape and dtype unchanged — for example, reordering to
BGR only when the model expects it:

```typescript
// tResized and tBgr are both uint8 [224, 224, 3], so either branch is valid input downstream
tResized.throughIf(wantsBgr, cv.cvtColor, tBgr, 'RGB2BGR');
```

## The `Model` primitive

A [`Model`](../06-api-reference/type-aliases/Model.md) is a compiled ExecuTorch
program (`.pte`) loaded into native memory.

### Loading

[`loadModel()`](../06-api-reference/functions/loadModel.md) loads and compiles a
`.pte` file synchronously. Compilation is heavy, so on the JS thread you should
run it off the main thread with
[`wrapAsync()`](../06-api-reference/functions/wrapAsync.md); inside a worklet
runtime or background worker you can call it directly.

```typescript
import { loadModel, wrapAsync } from 'react-native-executorch';

// On the JS thread — offload to a background thread so the UI stays responsive
const model = await wrapAsync(loadModel)('/path/to/model.pte');

// Inside a worklet runtime, the synchronous call is fine
const model = loadModel('/path/to/model.pte');
```

See [Worklets & Threading](./06-worklets-and-threading.md) for how `wrapAsync`
and worklet runtimes fit together.

### Inspecting metadata

A loaded model exposes its file path, the schema of its exported methods, and the
hardware backends each method was delegated to:

```typescript
console.log(model.path); // '/path/to/model.pte'
console.log(model.schema); // inputs/outputs, shapes, data types, constraints
console.log(model.backends); // e.g. { forward: ['xnnpack'] }
```

The schema is what lets a custom model plug into a pipeline without guesswork.
[Schema Validation](./03-schema-validation.md) covers how these contracts are
declared and checked.

### Executing inference

[`execute(methodName, inputs, outputTensors)`](../06-api-reference/type-aliases/Model.md#execute)
runs one exported method. Inputs are
supplied in slot order and may be tensors, numbers, booleans, or `null`. Output
tensors must be pre-allocated and passed in; the runtime writes the results into
them.

```typescript
const tInput = tensor('float32', [1, 3, 224, 224]);
const tOutput = tensor('float32', [1, 1000]);

try {
  tInput.setData(imageData);

  const outputs = model.execute('forward', [tInput], [tOutput]);
  // outputs[0] is tOutput, now filled with logits.
  // Any non-tensor return values (numbers, booleans, strings) appear here too.

  const logits = tOutput.getData(new Float32Array(tOutput.numel));
} finally {
  tInput.dispose();
  tOutput.dispose();
}
```

The returned array references the same output tensors you passed in, alongside
any primitive values the method returns.

## Lifecycle and disposal

Because native memory is invisible to the garbage collector, every tensor and
model must be explicitly released with `dispose()` once you are done with it:

```typescript
model.dispose();
tInput.dispose();
tOutput.dispose();
```

Using an object after disposal throws an
[`RnExecuTorchError`](../06-api-reference/functions/RnExecuTorchError.md) with
code [`RESOURCE_DISPOSED`](./05-error-handling.md#the-code-set). A few patterns
cover the common cases.

### Static pre-allocation for repeated runs

For a pipeline that runs many times over the same shapes, allocate everything
once at construction, capture it in a closure, and expose a single `dispose` that
tears it all down. The tensors are reused on every run rather than reallocated.

```typescript
import { loadModel, tensor, wrapAsync } from 'react-native-executorch';

export async function createSimpleClassifier(modelPath: string) {
  const model = await wrapAsync(loadModel)(modelPath);

  const tensors = [
    tensor('float32', [1, 3, 224, 224]), // tInput
    tensor('float32', [1, 1000]), // tOutput
  ] as const;

  const [tInput, tOutput] = tensors;

  const classify = (imageData: Float32Array) => {
    'worklet';
    tInput.setData(imageData);
    model.execute('forward', [tInput], [tOutput]);
    return tOutput.getData(new Float32Array(tOutput.numel));
  };

  const dispose = () => {
    tensors.forEach((t) => t.dispose());
    model.dispose();
  };

  return { classify, dispose };
}
```

This closure-bundle shape — a factory returning the operations plus a `dispose` —
is how the library's own task pipelines encapsulate their internal tensors.

### Dynamic allocation with `try / finally`

When a tensor's shape depends on a runtime value you cannot pre-allocate for,
such as a variable input resolution, allocate on demand and guarantee release in
a `finally` block:

```typescript
function processImage(model: Model, width: number, height: number, pixels: Uint8Array) {
  const tInput = tensor('uint8', [1, height, width, 4], pixels);
  const tOutput = tensor('float32', [1, 10]);
  try {
    model.execute('forward', [tInput], [tOutput]);
    return tOutput.getData(new Float32Array(tOutput.numel));
  } finally {
    tInput.dispose();
    tOutput.dispose();
  }
}
```

### Failure-safe construction with a resource scope

The static pattern has a gap: if construction throws _after_ some resources are
allocated — a failed [`validateSpec`](./03-schema-validation.md), a second model
that won't load — the caller never receives a `dispose`, and the memory allocated
so far leaks for the rest of the process. `createResourceScope` closes that window.
Track each resource as you allocate it, wrap the body in `try` / `catch`, and reuse
the scope's `dispose` as the pipeline's own, so one teardown path covers both a
mid-construction failure and normal disposal:

```typescript
import { createResourceScope, loadModel, tensor, wrapAsync } from 'react-native-executorch';

export async function createClassifier(modelPath: string) {
  const scope = createResourceScope();
  const dispose = scope.dispose;

  try {
    const model = scope.track(await wrapAsync(loadModel)(modelPath));
    const tInput = scope.track(tensor('float32', [1, 3, 224, 224]));
    const tOutput = scope.track(tensor('float32', [1, 1000]));

    const classify = (imageData: Float32Array) => {
      'worklet';
      tInput.setData(imageData);
      model.execute('forward', [tInput], [tOutput]);
      return tOutput.getData(new Float32Array(tOutput.numel));
    };

    return { classify, dispose };
  } catch (error) {
    dispose(); // release whatever was tracked before the failure
    throw error;
  }
}
```

`scope.track(resource)` returns the resource unchanged, so you wrap it in place.
`dispose` releases everything tracked so far, most-recently-allocated first, and is
safe to call more than once. This is how the library's own pipelines manage their
resources.

## Thread safety

Tensors and models are safe to use across threads. You can create one on one
thread and use it on another — for example, load a model on the JS thread and run
inference from a worklet — without adding any locking of your own. The native
layer guards every operation:

- **One execution at a time** — a model runs a single `execute` at a time. If you
  call `execute` while that model is already running on another thread, the
  second call fails immediately with
  [`RESOURCE_BUSY`](./05-error-handling.md#the-code-set) instead of waiting or
  corrupting state.
- **Tensor locking** — while `execute` runs, it holds an exclusive lock on every
  tensor it reads or writes. If another thread tries to touch one of those
  tensors at the same time, that call fails with `RESOURCE_BUSY`.
- **Aliasing detection** — passing the same tensor more than once within a single
  `execute` call (across its inputs and outputs) throws
  [`INVALID_ARGUMENT`](./05-error-handling.md#the-code-set), since
  writing a result into a tensor that is also an input would corrupt the data
  mid-run.

[Error Handling](./05-error-handling.md) covers the full error-code set and how
to narrow on it.

## Example: a two-stage pipeline

This example chains two independent models — a feature-extractor backbone and a
classification head — and finishes with native
[`softmax`](../06-api-reference/react-native-executorch/namespaces/math/functions/softmax.md).
It combines async
loading, static pre-allocation, feeding one model's output into the next, and
in-place native math.

```typescript
import { loadModel, tensor, wrapAsync, math } from 'react-native-executorch';

export async function createTwoStagePipeline(backbonePath: string, headPath: string) {
  const load = wrapAsync(loadModel);
  const [backbone, head] = await Promise.all([load(backbonePath), load(headPath)]);

  // Allocate every buffer once, up front
  const tensors = [
    tensor('float32', [1, 3, 224, 224]), // tInput
    tensor('float32', [1, 512]), // tEmbedding
    tensor('float32', [1, 1000]), // tLogits
    tensor('float32', [1, 1000]), // tProbs
  ] as const;

  const [tInput, tEmbedding, tLogits, tProbs] = tensors;

  const run = (inputData: Float32Array): Float32Array => {
    'worklet';
    tInput.setData(inputData);

    // Stage 1: backbone writes its embedding into tEmbedding
    backbone.execute('forward', [tInput], [tEmbedding]);

    // Stage 2: the head consumes that embedding directly, no copy back to JS
    head.execute('forward', [tEmbedding], [tLogits]);

    // Postprocess with a native C++ op and read the result out, in one chain
    return tLogits.through(math.softmax, tProbs).getData(new Float32Array(tProbs.numel));
  };

  const dispose = () => {
    tensors.forEach((t) => t.dispose());
    backbone.dispose();
    head.dispose();
  };

  return { run, dispose };
}
```

The intermediate `tEmbedding` is written by the backbone and read by the head
without crossing back into JavaScript. The only JS and native transfers are the
single `setData` at the top and the single `getData` at the end.

## Where to go next

- [Schema Validation](./03-schema-validation.md) — declare and verify the input/output contract of a `.pte`.
- [Operations & Utilities](./04-operations-and-utilities.md) — the native [`math`](../06-api-reference/react-native-executorch/namespaces/math/index.md), [`cv`](../06-api-reference/react-native-executorch/namespaces/cv/index.md), and [`speech`](../06-api-reference/react-native-executorch/namespaces/speech/index.md) operations you chain with `through`, plus tokenizers and the LLM runner.
- [Worklets & Threading](./06-worklets-and-threading.md) — run these primitives on background and UI threads.
- [Error Handling](./05-error-handling.md) — the error-code set and how to handle failures.

### API reference

- [`Model`](../06-api-reference/type-aliases/Model.md) · [`Tensor`](../06-api-reference/type-aliases/Tensor.md) · [`DType`](../06-api-reference/type-aliases/DType.md)
- [`loadModel()`](../06-api-reference/functions/loadModel.md) · [`tensor()`](../06-api-reference/functions/tensor.md) · [`wrapAsync()`](../06-api-reference/functions/wrapAsync.md)
- Namespaces: [`math`](../06-api-reference/react-native-executorch/namespaces/math/index.md) · [`cv`](../06-api-reference/react-native-executorch/namespaces/cv/index.md) · [`speech`](../06-api-reference/react-native-executorch/namespaces/speech/index.md)
