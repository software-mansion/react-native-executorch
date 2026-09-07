# Models & Tensors

The entire library is built on two domain-agnostic primitives: **[`Model`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Model)** and **[`Tensor`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor)**. Every high-level task pipeline — object detection, LLM chat, text-to-speech — is written in TypeScript on top of them.

This is the lower-level API. It gives you direct access to native ExecuTorch: load any `.pte` file, inspect its schema and hardware backends, execute any exported method, and manipulate raw tensor buffers — all from TypeScript, without writing native C++. These are the primitives you drop down to when a built-in pipeline doesn't fit your model, and they are the exact primitives every built-in pipeline is written with.

## The memory model[​](#the-memory-model "Direct link to The memory model")

Tensors and models allocate memory in native C++ heaps rather than the JavaScript garbage-collected heap. This has a few consequences that shape every signature in the lower-level API.

### Primitives live in native memory[​](#primitives-live-in-native-memory "Direct link to Primitives live in native memory")

A [`Tensor`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor) and a [`Model`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Model) are lightweight JavaScript handles to native C++ objects. The actual bytes — the contiguous tensor buffer, the compiled ExecuTorch module — live on the native heap, outside the JavaScript engine's memory. The JS runtime holds only a reference.

This lets the hardware backends (XNNPACK, Core ML, Vulkan) operate directly on native buffers with no copies, while you orchestrate them in readable TypeScript. The trade-off is that the garbage collector cannot see the memory that matters, so you must release it yourself.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)You own the memory

JSI host objects are nominally tracked by the JS garbage collector, but relying on automatic cleanup is strongly discouraged. The GC has no insight into how much native memory a handle pins, so it collects late or not at all. Always release tensors and models explicitly with [`dispose()`](#lifecycle-and-disposal).

### Operations write into destinations you provide[​](#operations-write-into-destinations-you-provide "Direct link to Operations write into destinations you provide")

Operations in the lower-level API do not allocate and return new tensors. They take the destination as an explicit argument and write into it in place. Nearly every operation — [native CV and math ops](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/operations-and-utilities.md), model execution, tensor copies — follows the same `fn(src, dst, ...options)` shape and returns `dst`.

```typescript
import { tensor, cv } from 'react-native-executorch';

const src = tensor('uint8', [480, 640, 3]);
const dst = tensor('uint8', [224, 224, 3]);

// resize does not return a new tensor — it fills `dst` and returns it
cv.resize(src, dst);

```

Model execution works the same way: you pre-allocate the output tensors and pass them to [`execute`](#executing-inference), which writes the results into them rather than handing back new tensors. Because you own every destination — inputs, outputs, and scratch buffers alike — you can allocate them once and reuse them across runs instead of allocating on every iteration.

## The `Tensor` primitive[​](#the-tensor-primitive "Direct link to the-tensor-primitive")

A [`Tensor`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor) is a multidimensional typed array in native memory. Two immutable properties define it: its element data type ([`DType`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DType)) and its [`shape`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor#shape). A read-only [`numel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor#numel) property reports the total element count, derived from the shape.

### Data types[​](#data-types "Direct link to Data types")

| `DType`     | Element type       | TypedArray for transfers | Bytes / element |
| ----------- | ------------------ | ------------------------ | --------------- |
| `'float32'` | 32-bit float       | `Float32Array`           | 4               |
| `'int32'`   | 32-bit signed int  | `Int32Array`             | 4               |
| `'int64'`   | 64-bit signed int  | `BigInt64Array`          | 8               |
| `'uint8'`   | 8-bit unsigned int | `Uint8Array`             | 1               |
| `'bool'`    | boolean            | `Uint8Array` (`0` / `1`) | 1               |

### Allocating[​](#allocating "Direct link to Allocating")

Create tensors with the [`tensor()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/tensor) factory. Pass an optional typed array to initialize the buffer; omit it to allocate uninitialized memory.

```typescript
import { tensor } from 'react-native-executorch';

// Uninitialized — contents are undefined until written
const tInput = tensor('float32', [1, 3, 224, 224]);

// Initialized from a JS typed array (byte length must match the shape)
const tWeights = tensor('float32', [1, 4], new Float32Array([1, 2, 3, 4]));

```

### Moving data across the JS and native boundary[​](#moving-data-across-the-js-and-native-boundary "Direct link to Moving data across the JS and native boundary")

Two methods copy bytes between a JS typed array and the native buffer:

* **[`setData(src)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor#setdata)** copies a typed array into the tensor and returns the tensor.
* **[`getData(dst)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor#getdata)** copies the tensor out into a typed array and returns that array.

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

### Copying between tensors[​](#copying-between-tensors "Direct link to Copying between tensors")

To move data between two native buffers without a round trip through JavaScript, use [`copyTo`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor#copyto), a direct C++ memcpy that returns the destination.

```typescript
tSource.copyTo(tDest);

// Copy a sub-slice: `length` elements starting at `offset`
tSource.copyTo(tDest, { offset: 10, length: 50 });

```

### Chaining transformations with `through`[​](#chaining-transformations-with-through "Direct link to chaining-transformations-with-through")

Since every operation takes `src` first and returns `dst`, composing them directly means nested calls. [`through`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor#through) and [`throughIf`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor#throughif) turn that into a readable left-to-right pipeline:

* **[`through(fn, ...args)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor#through)** calls `fn(this, ...args)` and returns the result.
* **[`throughIf(pred, fn, ...args)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor#throughif)** applies `fn` only when `pred` is `true`, otherwise passes `this` through unchanged.

Because operations return their destination and [`through`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor#through) forwards that return value, the destination of one step becomes the source of the next. You pass the operation itself, with its destination and options as trailing arguments:

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

The operations chained here come from the [`cv`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv) namespace. They, and the full set of [`math`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math) and [`speech`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/speech) operations you can compose the same way, are documented in [Operations & Utilities](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/operations-and-utilities.md).

[`throughIf`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor#throughif) applies a step only when a condition holds and passes the tensor through untouched otherwise. Since both branches feed whatever comes next, use it for transforms that leave shape and dtype unchanged — for example, reordering to BGR only when the model expects it:

```typescript
// tResized and tBgr are both uint8 [224, 224, 3], so either branch is valid input downstream
tResized.throughIf(wantsBgr, cv.cvtColor, tBgr, 'RGB2BGR');

```

## The `Model` primitive[​](#the-model-primitive "Direct link to the-model-primitive")

A [`Model`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Model) is a compiled ExecuTorch program (`.pte`) loaded into native memory.

### Loading[​](#loading "Direct link to Loading")

[`loadModel()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/loadModel) loads and compiles a `.pte` file synchronously. Compilation is heavy, so on the JS thread you should run it off the main thread with [`wrapAsync()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/wrapAsync); inside a worklet runtime or background worker you can call it directly.

```typescript
import { loadModel, wrapAsync } from 'react-native-executorch';

// On the JS thread — offload to a background thread so the UI stays responsive
const model = await wrapAsync(loadModel)('/path/to/model.pte');

// Inside a worklet runtime, the synchronous call is fine
const model = loadModel('/path/to/model.pte');

```

By default, [`loadModel()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/loadModel) eagerly loads and compiles all exported methods and backend delegates (such as CoreML or Vulkan) into memory upfront. This guarantees instantaneous first-inference latency without cold-start warmup spikes. To lazily compile methods on their first execution instead, pass [`LoadModelOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/LoadModelOptions) with [`eagerLoadMethods: false`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/LoadModelOptions#eagerloadmethods):

```typescript
const model = await wrapAsync(loadModel)('/path/to/model.pte', {
  eagerLoadMethods: false,
});

```

See [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) for how [`wrapAsync`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/wrapAsync) and worklet runtimes fit together.

### Inspecting metadata[​](#inspecting-metadata "Direct link to Inspecting metadata")

A loaded model exposes its file path, the schema of its exported methods, and the hardware backends each method was delegated to:

```typescript
console.log(model.path); // '/path/to/model.pte'
console.log(model.schema); // inputs/outputs, shapes, data types, constraints
console.log(model.backends); // e.g. { forward: ['xnnpack'] }

```

The schema is what lets a custom model plug into a pipeline without guesswork. [Schema Validation](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/schema-validation.md) covers how these contracts are declared and checked.

### Executing inference[​](#executing-inference "Direct link to Executing inference")

[`execute(methodName, inputs, outputTensors)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Model#execute) runs one exported method. Inputs are supplied in slot order and may be tensors, numbers, booleans, or `null`. Output tensors must be pre-allocated and passed in; the runtime writes the results into them.

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

The returned array references the same output tensors you passed in, alongside any primitive values the method returns.

## Lifecycle and disposal[​](#lifecycle-and-disposal "Direct link to Lifecycle and disposal")

Because native memory is invisible to the garbage collector, every tensor and model must be explicitly released with dispose once you are done with it:

```typescript
model.dispose();
tInput.dispose();
tOutput.dispose();

```

Using an object after disposal throws an [`RnExecuTorchError`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/RnExecuTorchError) with code [`RESOURCE_DISPOSED`](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/error-handling.md#error-codes-reference). A few patterns cover the common cases.

### Static pre-allocation for repeated runs[​](#static-pre-allocation-for-repeated-runs "Direct link to Static pre-allocation for repeated runs")

For a pipeline that runs many times over the same shapes, allocate everything once at construction, capture it in a closure, and expose a single dispose that tears it all down. The tensors are reused on every run rather than reallocated.

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

This closure-bundle shape — a factory returning the operations plus a dispose — is how the library's own task pipelines encapsulate their internal tensors.

### Dynamic allocation with `try / finally`[​](#dynamic-allocation-with-try--finally "Direct link to dynamic-allocation-with-try--finally")

When a tensor's shape depends on a runtime value you cannot pre-allocate for, such as a variable input resolution, allocate on demand and guarantee release in a `finally` block:

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

### Failure-safe construction with a resource scope[​](#failure-safe-construction-with-a-resource-scope "Direct link to Failure-safe construction with a resource scope")

The static pattern has a gap: if construction throws *after* some resources are allocated — a failed [`validateSpec`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/validateSpec) (see [Schema Validation](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/schema-validation.md)), a second model that won't load — the caller never receives a dispose, and the memory allocated so far leaks for the rest of the process. [`createResourceScope`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createResourceScope) closes that window. Track each resource as you allocate it, wrap the body in `try` / `catch`, and reuse the scope's [`dispose`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ResourceScope#dispose) as the pipeline's own, so one teardown path covers both a mid-construction failure and normal disposal:

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

[`scope.track(resource)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ResourceScope#track) returns the resource unchanged, so you wrap it in place. [`dispose`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ResourceScope#dispose) releases everything tracked so far, most-recently-allocated first, and is safe to call more than once. This is how the library's own pipelines manage their resources.

## Thread safety[​](#thread-safety "Direct link to Thread safety")

Tensors and models are safe to use across threads. You can create one on one thread and use it on another — for example, load a model on the JS thread and run inference from a worklet — without adding any locking of your own. The native layer guards every operation:

* **One execution at a time** — a model runs a single [`execute`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Model#execute) at a time. If you call [`execute`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Model#execute) while that model is already running on another thread, the second call fails immediately with [`RESOURCE_BUSY`](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/error-handling.md#error-codes-reference) instead of waiting or corrupting state.
* **Tensor locking** — while [`execute`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Model#execute) runs, it holds an exclusive lock on every tensor it reads or writes. If another thread tries to touch one of those tensors at the same time, that call fails with [`RESOURCE_BUSY`](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/error-handling.md#error-codes-reference).
* **Aliasing detection** — passing the same tensor more than once within a single [`execute`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Model#execute) call (across its inputs and outputs) throws [`INVALID_ARGUMENT`](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/error-handling.md#error-codes-reference), since writing a result into a tensor that is also an input would corrupt the data mid-run.

[Error Handling](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/error-handling.md) covers the full error-code set and how to narrow on it.

## Example: a two-stage pipeline[​](#example-a-two-stage-pipeline "Direct link to Example: a two-stage pipeline")

This example chains two independent models — a feature-extractor backbone and a classification head — and finishes with native [`softmax`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/softmax). It combines async loading, static pre-allocation, feeding one model's output into the next, and in-place native math.

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

The intermediate `tEmbedding` is written by the backbone and read by the head without crossing back into JavaScript. The only JS and native transfers are the single [`setData`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor#setdata) at the top and the single [`getData`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor#getdata) at the end.

## Where to go next[​](#where-to-go-next "Direct link to Where to go next")

* [Schema Validation](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/schema-validation.md) — declare and verify the input/output contract of a `.pte`.
* [Operations & Utilities](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/operations-and-utilities.md) — the native [`math`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math), [`cv`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv), and [`speech`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/speech) operations you chain with `through`, plus tokenizers and the LLM runner.
* [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) — run these primitives on background and UI threads.
* [Error Handling](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/error-handling.md) — the error-code set and how to handle failures.

### API reference[​](#api-reference "Direct link to API reference")

* [`Model`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Model) · [`LoadModelOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/LoadModelOptions) · [`Tensor`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor) · [`DType`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DType)
* [`loadModel()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/loadModel) · [`tensor()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/tensor) · [`wrapAsync()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/wrapAsync)
* [`createResourceScope()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createResourceScope) · [`ResourceScope`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ResourceScope) · [`NativeResource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/NativeResource)
* Namespaces: [`math`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math) · [`cv`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv) · [`speech`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/speech)
