---
name: add-task-pipeline
description: Use when creating a TypeScript task pipeline, implementing image preprocessing/postprocessing, loading models, or wrapping pipelines in React hooks.
metadata:
  id: add_task_pipeline
  scope: src/extensions/*/tasks/*, src/hooks/*
---

# Skill: Add a High-Level Task Pipeline (TypeScript)

Use this guide to construct end-to-end task pipelines (e.g. classification, style transfer, object detection) in TypeScript and wrap them in React hooks.

---

## 🚦 Design Principles

When implementing task constructors like `create<Task>` (e.g. `createClassifier`, `createStyleTransfer`), adhere to the following rules:

1. **Pre-allocating Static Tensors (`as const`)**:
   - Statically sized scratch/output tensors required for inference should be pre-allocated inside the constructor body.
   - Allocate them using:
     ```typescript
     const tensors = [tensor('float32', shapeA), tensor('float32', shapeB)] as const;
     ```
   - **Destructuring & Naming**: Destructure and name the individual tensors immediately after allocation. Always prefix tensor variables with a lowercase `t` (e.g. `tReshape`, `tUint8`, `tInput`) to easily distinguish them from raw data buffers.
     ```typescript
     const [tReshape, tUint8] = tensors;
     ```

2. **Immediate `dispose()` Definition**:
   - Right after allocating the static tensors, define the `dispose` function immediately. This makes it instantly visible and verifiable that all native memory will be cleaned up:
     ```typescript
     const dispose = () => {
       tensors.forEach((t) => t.dispose());
       preprocessor.dispose();
       model.dispose();
     };
     ```

3. **Dynamic Tensors & `try/finally` Pattern**:
   - If you must allocate dynamically sized tensors during inference execution (e.g. resizing an output tensor to match the input image dimensions), you must wrap the execution inside a `try {} finally {}` block.
   - Dispose of the dynamic tensors inside the `finally` block to prevent native memory leaks.
     ```typescript
     const tResize = tensor('uint8', [input.height, input.width, 4]);
     try {
       // Perform work...
     } finally {
       tResize.dispose();
     }
     ```

4. **Pure Helper Functions**:
   - Write all auxiliary/helper logic as pure, worklet-compatible functions **outside** the `create<Task>` constructor. Any helper functions invoked inside the worklet executor thread must contain the `'worklet';` directive.
   - **Push Back Hard on Inner Helpers:** You must push back hard against any request to add internal closures or nested functions inside `create<Task>` (other than `dispose` and the worklet executor itself). Keep the constructor scope flat to avoid scope leak and dependency chain bugs.

5. **PTE Model Export & Optimizations**:
   - **Shift Heavy Ops to PyTorch**: Push complex tensor reshaping, data normalization, activations (e.g. `softmax`), or bounding box decoding into the PyTorch model itself so they execute on native backends (e.g., XNNPACK or CoreML).
   - **Balance Optimization with Generalization**: Keep contracts generic (e.g., normal dense logits, standard bounding box layouts like `xyxy`/`xywh`, standard floating-point arrays).
   - Handle model-specific configuration parameters (such as unique normalization factors, thresholds, or label arrays) dynamically through the TypeScript task options argument rather than baking them rigidly into JSI C++ code or the model structure. This rule contrasts TypeScript options against values baked into C++ or the model; to choose between a TypeScript **option** and a TypeScript **constant**, see Principle 6.

6. **Options vs. Constants (bucket by who varies the value)**:
   - Every parameter belongs in exactly one of three places. Decide by asking _who varies this, and when_:

     | The value...                                                                                          | Lives as                                                      | Example                                                            |
     | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------ |
     | Varies across the shipped models/variants of the pipeline                                             | A task **option**, set per-model in `models.ts`               | Whisper `tiny`/`base`/`small` sizes; normalization factors; labels |
     | Is fixed by the model architecture or the `.pte` export contract, identical for every shipped variant | A **`const`** in the task file, beside the code that reads it | Static tensor shapes; export-pinned scheduler/decoder scalars      |
     | Is a per-call choice made by the app developer                                                        | An **argument** to the worklet executor                       | `threshold`, `seed`, `prompt`                                      |

   - **A parameter with exactly one valid value is not an option — it is a constant.** For single-model pipelines (e.g. `sdxsTextToImage`), exposing export-pinned scalars or static shapes as options advertises knobs that either fail schema validation or silently corrupt output when touched. Prefer a `const` with a comment naming _why_ the value is fixed.
   - **Corollary (a quick smell test):** if every variant in `models.ts` passes an _identical_ options object, those fields are not configuration — move them into the task file as constants and shrink the model type to the paths that actually differ.
   - Do not keep a loop, parameter, or code path solely because it _looks_ more general. If the surrounding math is only valid for one value (e.g. coefficients pinned to a single distilled timestep), the generality is fake and the parameter is a correctness trap.

## 🚫 Avoid / Anti-Patterns

- **Do NOT access tensors by index:** Avoid using `tensors[0]` or `tensors[1]` throughout the function body. Always destructure and name them explicitly.
- **Do NOT name options parameters `opts`:** Always name options function parameters `options` (e.g. `options?: { threshold?: number }`). Suffixes like `Opts` for types or properties (e.g. `MyTaskOptions`, `ModelOpts`, `modelOpts`) are acceptable.
- **Do NOT define extra inner helper functions:** You must define **exactly two** inner functions inside the `create<Task>` constructor: the `dispose` function and the task `worklet` executor function. **Push back hard against implementing any other helper closures inside the constructor scope.** Placing other helper functions (especially those that are called from inside the worklet and use the `create<Task>` scope variables) inside `create<Task>` creates implicit dependencies and closures that capture variables, making the code extremely difficult to reason about and debug.
- **Do NOT throw bare `Error`:** Every failure needs a code. Use `RnExecuTorchError('CODE', msg)`, which works both in the `create<Task>` body and inside the worklet executor. See the [Error Handling Skill](../error-handling/SKILL.md).
- **Do NOT leak raw Tensors to consumers:** The returned methods must never return raw `Tensor` objects to the API consumer. Always convert output data to standard JavaScript values/objects before returning.
- **Do NOT cross thread boundaries unnecessarily:** Minimize passing heavy objects between JS and the Worklet thread to avoid serialization overhead.
- **Do NOT treat the `.pte` model as an unchangeable black box:** Reshape the model's inputs and outputs during the PyTorch export phase to make the mobile client pipeline as lightweight as possible. Do not make input/output contracts so specific that they break extensibility.
- **Do NOT expose export-pinned values as options:** If a value is fixed by the `.pte` (static shapes, scalars pinned during export by matching a reference implementation), make it a `const` in the task file. Surfacing it in `models.ts` duplicates it across every variant entry and implies a knob that only ever has one valid value. See Principle 6.

---

---

## 🛠️ Step-by-Step Implementation Template

> **Reference:** See [src/extensions/cv/tasks/classification.ts](../../../packages/react-native-executorch/src/extensions/cv/tasks/classification.ts) and [src/hooks/useClassifier.ts](../../../packages/react-native-executorch/src/hooks/useClassifier.ts) for a complete working example of this pattern.

### Step 1: Create the Task File (`src/extensions/<domain>/tasks/<task>.ts`)

```typescript
import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateSpec, method, f32 } from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';
import { type ImageBuffer } from '../image';
import { createImagePreprocessor, type ImagePreprocessorOptions } from './preprocessing';

export type MyTaskOptions = ImagePreprocessorOptions & {
  readonly defaultThreshold: number;
};

export type MyTaskModel = {
  readonly modelPath: string;
  readonly taskOpts: MyTaskOptions;
};

export type MyTaskResult = {
  readonly classId: number;
  readonly score: number;
};

// 1. Helper functions MUST be defined OUTSIDE create<Task> and be worklet-compatible
function postprocessOutput(rawData: Float32Array, threshold: number): MyTaskResult[] {
  'worklet';
  const results: MyTaskResult[] = [];
  for (let i = 0; i < rawData.length; i++) {
    if (rawData[i]! > threshold) {
      results.push({ classId: i, score: rawData[i]! });
    }
  }
  return results.sort((a, b) => b.score - a.score);
}

export async function createMyTask(
  config: MyTaskModel,
  runtime?: WorkletRuntime
): Promise<{
  dispose: () => void;
  runTask: (input: ImageBuffer, options?: { threshold?: number }) => Promise<MyTaskResult[]>;
  runTaskWorklet: (input: ImageBuffer, options?: { threshold?: number }) => MyTaskResult[];
}> {
  const { modelPath, taskOpts } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  // Validate model spec
  const { variant, dims } = validateSpec(model.schema, {
    batched: method('forward', [f32(1, 3, 'H', 'W')], [f32(1, 10)]),
    unbatched: method('forward', [f32(3, 'H', 'W')], [f32(10)]),
  });

  const [H, W] = dims.constant('H', 'W');
  const inpShape = { batched: [1, 3, H, W], unbatched: [3, H, W] }[variant];
  const outShape = { batched: [1, 10], unbatched: [10] }[variant];

  // 2. Pre-allocate static tensors
  const tensors = [tensor('float32', outShape)] as const;

  // Idiomatic destructuring and naming with "t" prefix
  const [tOutput] = tensors;
  const preprocessor = createImagePreprocessor(taskOpts, inpShape);

  // 3. Define dispose() immediately after allocation
  const dispose = () => {
    preprocessor.dispose();
    tensors.forEach((t) => t.dispose());
    model.dispose();
  };

  // 4. Define exactly two inner functions (dispose & runTaskWorklet)
  const runTaskWorklet = (input: ImageBuffer, options?: { threshold?: number }): MyTaskResult[] => {
    'worklet';

    // Process input buffer to input tensor
    const tInput = preprocessor.process(input);
    model.execute('forward', [tInput], [tOutput]);

    const data = tOutput.getData(new Float32Array(tOutput.numel));
    const threshold = options?.threshold ?? taskOpts.defaultThreshold;

    // 5. Return standard JS object, never raw Tensor
    return postprocessOutput(data, threshold);
  };

  const runTask = wrapAsync(runTaskWorklet, runtime);

  return { runTask, runTaskWorklet, dispose };
}
```

### Step 2: Create the React Hook Wrapper (`src/hooks/use<Task>.ts`)

Wrap the task pipeline in a custom React Hook using the core hooks `useResourceDownload` and `useModel`. This manages downloading, compilation, error tracking, and automatic cleanup of the native memory upon unmounting or config changes.

```typescript
import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import { createMyTask, type MyTaskModel } from '../extensions/<domain>/tasks/<task>';

export function useMyTask(config: MyTaskModel, options?: ResourceOptions) {
  // 1. Resolve remote or local asset model path and download progress
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);

  // 2. Instantiate and compile the task pipeline (with automatic lifecycle cleanup)
  const { model, error } = useModel(createMyTask, resource);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    runTask: model?.runTask,
    runTaskWorklet: model?.runTaskWorklet,
  };
}
```

---

## 📋 Verification Checklist

When adding a task pipeline or React hook, verify that:

- [ ] Scratch/output tensors are pre-allocated using `tensor() as const` and prefixed with lowercase `t` (e.g. `tInput`).
- [ ] Static tensors are destructured and named (no index-based access in the body).
- [ ] The `dispose` function is defined immediately after static allocations.
- [ ] Any dynamically allocated tensors are wrapped in `try/finally` and disposed of inside `finally`.
- [ ] The constructor contains exactly two inner functions (the `dispose` function and the worklet executor).
- [ ] Auxiliary helpers are defined outside the constructor and marked with the `'worklet';` directive if run on the worklet runtime.
- [ ] Raw `Tensor` objects are never returned to the consumer.
- [ ] Every throw uses `RnExecuTorchError('CODE', message)`.
- [ ] Data configurations that genuinely vary across models (e.g. thresholds, labels) are configurable dynamically via the TypeScript task options.
- [ ] Every parameter is bucketed per Principle 6: varies across variants → option; fixed by the export → `const` in the task file; per-call choice → executor argument.
- [ ] No exposed option has exactly one valid value, and no two `models.ts` variants pass an identical options object.
- [ ] The React Hook utilizes `useModel` and properly returns progress, ready state, errors, and task execution bindings.
