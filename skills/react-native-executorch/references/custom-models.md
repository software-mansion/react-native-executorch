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

Use the inspection API documented in
[Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models)
to inspect exported methods, tensor schemas and required backends. Compare these with the app's
registered backends and shipped runtime. Inspection can succeed even when delegated execution cannot run.

## Reuse an existing task when the contract fits

Find the task's allowed schema and configuration type in its versioned API reference or readable
TypeScript source. Supply a custom config to the hook/factory, including **all** required assets and
preprocessing options. Do not assume that replacing a `.pte` path leaves tokenizer or normalization
settings correct.

For classification, for example, the label count must agree with the output dimension. Match the full
task contract or adapt the export; a schema mismatch identifies a disagreement rather than a check
to disable.

## Build a custom TypeScript pipeline

Use [Models & Tensors](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/models-and-tensors)
for loading, allocation and execution, and
[Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading)
for moving inference off the JavaScript thread. Follow the API reference for exact helper signatures.

- Define the expected method/input/output contract and validate it when loading the model.
- Track native allocations in a resource scope, release partial allocations on construction failure,
  and expose explicit disposal for imperative callers.
- Keep preprocessing, inference and postprocessing consistent with the PyTorch reference.
- Reuse scratch buffers where practical, serialize access to shared tensors and copy results into
  ordinary JavaScript data before releasing native resources.
- In React, use the documented download and model lifecycle hooks rather than constructing a pipeline
  on every render. Wait for active execution to finish before cleanup.
- Prefer existing domain operations for preprocessing and postprocessing before adding native code.

## Dynamic shapes

Read [Schema Validation](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/schema-validation)
and the custom export guide before handling variable dimensions. Distinguish an unknown static shape
from dimensions that change between runs. Carry dynamic bounds and runtime constraints from export
into schema validation and buffer allocation; do not infer them from symbolic names alone.

## Verify the complete handoff

Check schema/backend inspection, one known input, expected output within tolerance, repeated execution,
construction-failure cleanup, disposal and the actual target platform/backend. For images/audio/text,
compare preprocessing/tokenizer behavior as well as output numbers. Distinguish successful export,
successful inspection and successful device inference in the result you report.

- [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models)
- [Models & Tensors](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/models-and-tensors)
- [Schema Validation](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/schema-validation)
- [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading)
