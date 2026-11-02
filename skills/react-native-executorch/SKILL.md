---
name: react-native-executorch
description: >-
  Build React Native apps with react-native-executorch: use pre-exported AI models and task hooks,
  integrate custom ExecuTorch .pte models, or build TypeScript inference pipelines from PyTorch model
  contracts. Use for setup, model selection, inference, export integration and troubleshooting;
  repository contribution workflows use the library's internal skills.
---

# React Native ExecuTorch

Run AI on-device in React Native with a choice of integration levels:

1. **Ready-made task and model:** choose a pre-exported configuration from `models` and a `use<Task>`
   hook. Downloads, preprocessing, inference, postprocessing and React resource lifecycle are handled.
2. **Custom model, existing task:** supply your own `.pte` and associated assets to a task whose
   input/output contract matches. A model need not be added to the shipped registry to use it in an app.
3. **Custom model and pipeline:** use `Model`, `Tensor`, `schema`, domain operations and worklets to
   build the pipeline in TypeScript. Most integrations need no app-specific C++ code.

Treat custom models as a first-class path. Choose based on the user's model, inputs/outputs and desired
control; do not restrict a custom architecture to the shipped task catalog or reimplement a supported
task unnecessarily.

## Version and environment first

The examples in this skill target **0.11.x**. Inspect the app's installed version and lockfile,
React Native/Expo version, target platforms, architecture, and relevant peers before choosing APIs.
Do not upgrade the app solely to fit these examples.

Use the [documentation index](https://docs.swmansion.com/react-native-executorch/llms.txt) to select the
matching release line. Docusaurus routes have specific meanings:

- `/react-native-executorch/docs/...` is the default **released** line; check its version badge because
  that line changes as releases advance.
- `/react-native-executorch/docs/next/...` is **unreleased development** documentation.
- `/react-native-executorch/docs/<line>/...` contains older snapshots, such as `0.10.x`.

Append `.md` to a page URL after removing any trailing slash, preserving its version segment. Read the
matching API reference or installed declarations for exact signatures. For older versions, consult their
migration docs before applying examples. Older `useLLM` examples and model constants may use a different
API; do not combine them with `useLLMChatSession` or the nested registry shown here.

## Load references for the selected path

| Task                                                                                | Read                                                  |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Install, configure Expo/bare RN, resolve downloads or manage lifecycle              | [setup.md](references/setup.md)                       |
| Select pre-exported models and use hooks for chat, vision, speech or retrieval      | [ready-made-tasks.md](references/ready-made-tasks.md) |
| Export a PyTorch model, inspect a `.pte`, reuse a task, or implement a new pipeline | [custom-models.md](references/custom-models.md)       |
| Diagnose setup, schema, execution, memory or output problems                        | [troubleshooting.md](references/troubleshooting.md)   |

For custom models, read `custom-models.md` before selecting an integration. Fetch the relevant
version's detailed schema/backend/task docs as needed; do not load every API page or model catalog.

## Working approach

- Start by identifying the task and input/output contract. The ready-made catalog covers language
  models, vision-language chat, OCR, detection, segmentation, classification, depth, speech, embeddings,
  retrieval and more. Consult the version's Supported Models page for exact available configurations.
- Prefer a hook inside React components. Use `download` plus `create<Task>` when manual lifetime or
  execution outside React is needed. Use primitives when the task contract does not fit.
- Model configurations are objects: `models.llm.LFM2_5_1_2B.DEFAULT`, not accessor calls. Nested model
  families have additional keys. Verify identifiers and backends rather than guessing names.
- Hooks expose `isReady`, `error`, `downloadProgress` (0–100), and methods that are undefined before
  loading finishes. Handle readiness and async errors, serialize conflicting runs, and stop work before
  disposing resources. Imperative pipelines require explicit `dispose()`.
- A `.pte` alone may be insufficient. Tokenizers, chat templates, labels, normalization, audio formats,
  tensor layouts and preprocessing/postprocessing are part of the model's contract.
- Match the exported ExecuTorch format/operators and backend to the runtime shipped in the installed
  library. Inspect registered backends on the device; a successful download or schema inspection does
  not establish executable inference.
- For a supplied export harness, inspect its actual documentation and version pins before running it.
  No automatic exporter command is assumed by this skill. Preserve the contract between export and app
  integration so a published harness can later provide the `.pte`, assets and schema directly.

## Finish with evidence

Typecheck the app and run its relevant checks. For native changes, build a development app. Validate a
representative inference on the target device and compare custom-model outputs with a PyTorch reference
using appropriate tolerances. Report which checks ran; compilation, fake-runtime tests and schema
inspection are distinct from actual inference. Do not claim a model works on a platform merely because
its export or TypeScript code succeeded.
