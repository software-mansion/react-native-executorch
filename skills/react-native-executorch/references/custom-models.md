# Bring your own model and pipeline

Use this path when the user has PyTorch weights, a fine-tuned architecture, a custom `.pte`, or a task
outside the ready-made catalog. The library can orchestrate compatible ExecuTorch models entirely in
TypeScript; contributing a new model to the library registry is optional.

## Preserve the contract from PyTorch to mobile

Before exporting, collect:

- The model definition, weights, evaluation mode and representative inputs/expected outputs.
- Method names, input/output ordering, data types, shapes, layouts and dynamic shape bounds.
- Normalization, resize/padding, tokenization, sampling rate, labels and output decoding requirements.
- Target devices/backends and the ExecuTorch runtime version used by the installed library's native
  artifacts. The JavaScript package version is not the ExecuTorch version.

## Export with ExecuTorch Export Recipes

Use [ExecuTorch Export Recipes](https://github.com/software-mansion-labs/executorch-export-recipes),
Software Mansion's export harness, model recipes and agent skills. Follow its
[README](https://github.com/software-mansion-labs/executorch-export-recipes/blob/docs/public-repo-foundations/README.md),
`AGENTS.md` and relevant skills for setup, adding or adapting recipes, backend selection and validation.
Check export/runtime compatibility with the app's installed React Native ExecuTorch version.

Hand off the `.pte`, auxiliary assets, schema/method contract, preprocessing metadata,
runtime/backend requirements and reference inputs/outputs to the app integration. Compare exported
outputs against the PyTorch reference before moving to mobile.

## Inspect before integrating

`inspectModel` accepts a URL or absolute local path, resolves the model and returns its schema/backends.
For local inputs, use readable filesystem paths, not URI schemes.

```typescript
import { inspectModel, getRegisteredBackends } from 'react-native-executorch';

export async function inspectCustomModel(modelPath: string) {
  const inspection = await inspectModel(modelPath);
  return { ...inspection, registeredBackends: getRegisteredBackends() };
}
```

Verify the required backend is enabled in the app and that the export matches the shipped runtime.
Inspection can succeed even when delegated execution cannot run. Some model types also need tokenizer,
vocabulary, chat-template, label or phonemizer assets.

## Reuse an existing task when the contract fits

Find the task's allowed schema and configuration type in its versioned API reference or readable
TypeScript source. Supply a custom config to the hook/factory, including **all** required assets and
preprocessing options. Do not assume that replacing a `.pte` path leaves tokenizer or normalization
settings correct.

For example, a classifier config contains `modelPath` and `modelOpts` with preprocessing and labels.
The label count must agree with the output dimension. Match the full task contract or adapt the export;
`SCHEMA_MISMATCH` identifies a disagreement rather than a check to disable.

## Build a custom TypeScript pipeline

This complete 0.11.x example assumes a user-supplied model with `forward(float32[1,4]) → float32[1,2]`.
The dimensions are an example contract, not a universal model format. It accepts already-prepared
features; add the user's preprocessing and output interpretation explicitly for a real model.

```typescript
import {
  createResourceScope,
  loadModel,
  RnExecuTorchError,
  schema,
  tensor,
  wrapAsync,
} from 'react-native-executorch';

export async function createFeaturePipeline(config: { modelPath: string }) {
  const scope = createResourceScope();
  const dispose = scope.dispose;
  try {
    const model = scope.track(await wrapAsync(loadModel)(config.modelPath));
    schema.validateSpec(model.schema, {
      features: schema.method('forward', [schema.f32(1, 4)], [schema.f32(1, 2)]),
    });
    const input = scope.track(tensor('float32', [1, 4]));
    const output = scope.track(tensor('float32', [1, 2]));

    const runWorklet = (features: Float32Array) => {
      'worklet';
      if (features.length !== 4) {
        throw RnExecuTorchError('INVALID_ARGUMENT', 'Expected four input features');
      }
      input.setData(features);
      model.execute('forward', [input], [output]);
      return output.getData(new Float32Array(output.numel));
    };

    return { run: wrapAsync(runWorklet), dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
```

The factory loads a **local** path. For a remote model, call `download({ modelPath: url })` first.
Imperative callers `await pipeline.run(features)` and dispose in `finally` after execution settles.
Calls share scratch tensors, so serialize them. Reuse the allocated tensors across runs; copy results
into ordinary JS typed arrays rather than leaking native resource handles.

Inside React, the same factory can use the library's download/lifecycle hooks:

```typescript
import { useModel, useResourceDownload } from 'react-native-executorch';
import { createFeaturePipeline } from './createFeaturePipeline';

export function useFeaturePipeline(config: { modelPath: string }) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config);
  const { model: pipeline, error } = useModel(createFeaturePipeline, resource);
  return {
    isReady: !!pipeline,
    downloadProgress,
    error: downloadError ?? error,
    run: pipeline?.run,
  };
}
```

Do not call the factory on every render. Keep heavy execution on the worklet runtime and reusable
helpers worklet-compatible. Most custom models need no new native operator; use existing CV/math/domain
ops for preprocessing and postprocessing before considering native extensions.

## Dynamic shapes

Plain strings such as `'H'` in `schema.f32(1, 3, 'H', 'W')` bind unknown-at-authoring-time **static**
dimensions. Runtime-varying dimensions use `schema.DynamicDim('L')`, with supported range/enum domains.
Repeated dynamic symbols constrain domains, not equality of runtime values; declare required runtime
constraints separately.

A dynamic export needs a `get_model_schema` companion method containing the concrete domain and
constraint information; plain ExecuTorch method metadata can expose only fixed bounds. Follow the
library's JSON schema and validate the payload during export. Allocate buffers according to the task's
validated domains; do not silently substitute symbolic names for dynamic allocation logic.

## Verify the complete handoff

Check schema/backend inspection, one known input, expected output within tolerance, repeated execution,
construction-failure cleanup, disposal and the actual target platform/backend. For images/audio/text,
compare preprocessing/tokenizer behavior as well as output numbers. Distinguish successful export,
successful inspection and successful device inference in the result you report.

- [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models)
- [Models & Tensors](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/models-and-tensors)
- [Schema Validation](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/schema-validation)
- [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading)
