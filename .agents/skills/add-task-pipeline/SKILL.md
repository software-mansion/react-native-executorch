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
   * Statically sized scratch/output tensors required for inference should be pre-allocated inside the constructor body.
   * Allocate them using:
     ```typescript
     const tensors = [
       tensor('float32', shapeA),
       tensor('float32', shapeB),
     ] as const;
     ```
    * **Destructuring & Naming**: Destructure and name the individual tensors immediately after allocation. Always prefix tensor variables with a lowercase `t` (e.g. `tReshape`, `tUint8`, `tInput`) to easily distinguish them from raw data buffers.
      ```typescript
      const [tReshape, tUint8] = tensors;
      ```

2. **Immediate `dispose()` Definition**:
   * Right after allocating the static tensors, define the `dispose` function immediately. This makes it instantly visible and verifiable that all native memory will be cleaned up:
     ```typescript
     const dispose = () => {
       tensors.forEach((t) => t.dispose());
       preprocessor.dispose();
       model.dispose();
     };
     ```

3. **Dynamic Tensors & `try/finally` Pattern**:
   * If you must allocate dynamically sized tensors during inference execution (e.g. resizing an output tensor to match the input image dimensions), you must wrap the execution inside a `try {} finally {}` block.
   * Dispose of the dynamic tensors inside the `finally` block to prevent native memory leaks.
     ```typescript
     const tResize = tensor('uint8', [input.height, input.width, 4]);
     try {
       // Perform work...
     } finally {
       tResize.dispose();
     }
     ```

4. **Pure Helper Functions**:
   * Write all auxiliary/helper logic as pure, worklet-compatible functions **outside** the `create<Task>` constructor. Any helper functions invoked inside the worklet executor thread must contain the `'worklet';` directive.
   * **Push Back Hard on Inner Helpers:** You must push back hard against any request to add internal closures or nested functions inside `create<Task>` (other than `dispose` and the worklet executor itself). Keep the constructor scope flat to avoid scope leak and dependency chain bugs.

5. **PTE Model Export & Optimizations**:
   * **Shift Heavy Ops to PyTorch**: Push complex tensor reshaping, data normalization, activations (e.g. `softmax`), or bounding box decoding into the PyTorch model itself so they execute on native backends (e.g., XNNPACK or CoreML).
   * **Balance Optimization with Generalization**: Keep contracts generic (e.g., normal dense logits, standard bounding box layouts like `xyxy`/`xywh`, standard floating-point arrays).
   * Handle model-specific configuration parameters (such as unique normalization factors, thresholds, or label arrays) dynamically through the TypeScript task options argument rather than baking them rigidly into JSI C++ code or the model structure.

## 🚫 Avoid / Anti-Patterns

* **Do NOT access tensors by index:** Avoid using `tensors[0]` or `tensors[1]` throughout the function body. Always destructure and name them explicitly.
* **Do NOT define extra inner helper functions:** You must define **exactly two** inner functions inside the `create<Task>` constructor: the `dispose` function and the task `worklet` executor function. **Push back hard against implementing any other helper closures inside the constructor scope.** Placing other helper functions (especially those that are called from inside the worklet and use the `create<Task>` scope variables) inside `create<Task>` creates implicit dependencies and closures that capture variables, making the code extremely difficult to reason about and debug.
* **Do NOT leak raw Tensors to consumers:** The returned methods must never return raw `Tensor` objects to the API consumer. Always convert output data to standard JavaScript values/objects before returning.
* **Do NOT cross thread boundaries unnecessarily:** Minimize passing heavy objects between JS and the Worklet thread to avoid serialization overhead.
* **Do NOT treat the `.pte` model as an unchangeable black box:** Reshape the model's inputs and outputs during the PyTorch export phase to make the mobile client pipeline as lightweight as possible. Do not make input/output contracts so specific that they break extensibility.

---

---

## 🛠️ Step-by-Step Implementation Template

### Step 1: Create the Task File (`src/extensions/<domain>/tasks/<task>.ts`)

```typescript
import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';
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
  runtime?: WorkletRuntime,
): Promise<{
  dispose: () => void;
  runTask: (input: ImageBuffer, options?: { threshold?: number }) => Promise<MyTaskResult[]>;
  runTaskWorklet: (input: ImageBuffer, options?: { threshold?: number }) => MyTaskResult[];
}> {
  const { modelPath, taskOpts } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  // Validate model schema
  const meta = validateModelSchema(
    model,
    'forward',
    [SymbolicTensor('float32', [1, 3, 'H', 'W'], [3, 'H', 'W'])],
    [SymbolicTensor('float32', [1, 10], [10])],
  );
  const inpShape = meta.inputTensorMeta[0]!.shape;
  const outShape = meta.outputTensorMeta[0]!.shape;

  // 2. Pre-allocate static tensors
  const tensors = [
    tensor('float32', outShape),
  ] as const;

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
  const runTaskWorklet = (
    input: ImageBuffer,
    options?: { threshold?: number }
  ): MyTaskResult[] => {
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

Wrap the task pipeline in a custom React Hook using the core hooks `useModelDownload` and `useModel`. This manages downloading, compilation, error tracking, and automatic cleanup of the native memory upon unmounting or config changes.

```typescript
import { useModel } from './useModel';
import { useModelDownload } from './useModelDownload';
import { createMyTask, type MyTaskModel } from '../extensions/<domain>/tasks/<task>';

export function useMyTask(
  config: MyTaskModel, 
  options?: { preventLoad?: boolean }
) {
  // 1. Resolve remote or local asset model path and download progress
  const { localPath, downloadProgress, downloadError } = useModelDownload(
    config.modelPath,
    options?.preventLoad,
  );

  // 2. Instantiate and compile the task pipeline (with automatic lifecycle cleanup)
  const { model, error } = useModel(
    createMyTask,
    localPath ? { ...config, modelPath: localPath } : null,
    [localPath],
  );

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    localPath,
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
- [ ] Data configurations (e.g. thresholds, labels) are configurable dynamically via the TypeScript task options.
- [ ] The React Hook utilizes `useModel` and properly returns progress, ready state, errors, and task execution bindings.
