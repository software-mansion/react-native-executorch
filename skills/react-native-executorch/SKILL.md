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

For a new app, use the latest stable release and its matching documentation. For an existing app,
inspect its installed version, lockfile, React Native/Expo setup, target platforms and relevant peers.
Preserve the existing release unless an upgrade is needed for the user's task.

Use the [documentation site's](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/getting-started)
version menu to select the matching release line. Default `/docs/...` links serve released docs;
`/docs/next/...` describes unreleased development, and `/docs/<release-line>/...` serves older snapshots.
Use Markdown where available, preserving the version segment; otherwise read the HTML page.

This skill provides integration guidance. Look up exact API signatures, model identifiers, platform
requirements and dependency ranges in the matching docs and installed declarations. Consult migration
guides for older apps rather than combining APIs from different releases.

## Load references for the selected path

| Task                                                                                | Read                                                  |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Set up Expo/bare RN, install dependencies, provision binaries or manage downloads   | [setup.md](references/setup.md)                       |
| Select pre-exported models and use hooks for chat, vision, speech or retrieval      | [ready-made-tasks.md](references/ready-made-tasks.md) |
| Export a PyTorch model, inspect a `.pte`, reuse a task, or implement a new pipeline | [custom-models.md](references/custom-models.md)       |
| Diagnose setup, schema, execution, memory or output problems                        | [troubleshooting.md](references/troubleshooting.md)   |

For installation or native setup, start with `setup.md`. For custom models, read `custom-models.md`
before selecting an integration. Fetch the relevant version's detailed schema/backend/task docs as
needed; do not load every API page or model catalog.

## Working approach

- Start by identifying the task and input/output contract. The ready-made catalog covers language
  models, vision-language chat, OCR, detection, segmentation, classification, depth, speech, embeddings,
  retrieval and more. Consult the version's Supported Models page for exact available configurations.
- Prefer a hook inside React components. Use `download` plus `create<Task>` when manual lifetime or
  execution outside React is needed. Use primitives when the task contract does not fit.
- Select model configuration objects from the documented registry. Verify identifiers and backends
  rather than guessing names or assuming every model has the same variants.
- Handle readiness, download progress and async errors before invoking inference. Serialize conflicting
  runs and stop work before disposing resources. Hooks manage React lifecycle; imperative pipelines
  require explicit disposal. Read the selected hook or factory documentation for its exact interface.
- A `.pte` alone may be insufficient. Tokenizers, chat templates, labels, normalization, audio formats,
  tensor layouts and preprocessing/postprocessing are part of the model's contract.
- Match the exported ExecuTorch format/operators and backend to the runtime shipped in the installed
  library. Inspect registered backends on the device; a successful download or schema inspection does
  not establish executable inference.
- For PyTorch → `.pte`, use [ExecuTorch Export Recipes](https://github.com/software-mansion-labs/executorch-export-recipes).
  Follow its repository instructions, relevant export/backend skills and per-model dependency pins;
  see `custom-models.md` for the workflow. Validate outputs before integrating the artifact in the app.

## Finish with evidence

Typecheck the app and run its relevant checks. For native changes, build a development app. Validate a
representative inference on the target device and compare custom-model outputs with a PyTorch reference
using appropriate tolerances. Report which checks ran; compilation, fake-runtime tests and schema
inspection are distinct from actual inference. Do not claim a model works on a platform merely because
its export or TypeScript code succeeded.
