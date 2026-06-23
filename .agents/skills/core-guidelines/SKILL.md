---
name: core-guidelines
description: Use when learning the codebase architecture, design patterns, core/extension symmetry, file structure, or general coding standards.
metadata:
  id: core_guidelines
  scope: general
---

# React Native ExecuTorch Architecture Guide

Welcome! This directory contains specialized "skills" (recipes) designed to help you extend this codebase in an idiomatic, clean, and consistent manner.

Before implementing any feature or modifying code, please find the corresponding skill folder in `.agents/skills/` and review its `SKILL.md` to ensure you follow the correct patterns.

---

## 🎯 Design Philosophy

The library is designed around the separation of responsibilities into two distinct layers:

1. **Lower-Level API (Flexible & Domain-Agnostic)**: Exposes raw bindings to native ExecuTorch capabilities (tensors, models, runtime execution, and basic math/CV operations) in C++ without task-specific code. This layer is designed to be highly flexible, allowing developer customization directly in TypeScript.
2. **Higher-Level API (Transparent & Orchestrated)**: Built as orchestration layers **entirely in TypeScript** on top of the lower-level native bindings. Preprocessing, running model inference, and output postprocessing are composed dynamically in TS.

- **Why this matters**: In contrast to opaque native pipelines, implementing pipelines in TypeScript makes them transparent, easy to debug, highly customizable, and easy to extend without writing complex native C++ code.

---

## 🏛️ Symmetrical Architecture (Core vs. Extensions)

This library is strictly structured using a symmetrical layout between the native C++ layer (`cpp/`) and the TypeScript layer (`src/`). When adding a new capability, you will typically need to modify or add files in both layers under their respective subfolders:

```text
cpp/                                    │ src/
├── core/                               │ ├── core/
│   ├── install.h                       │ │   ├── model.ts
│   ├── tensor.h                        │ │   ├── tensor.ts
│   └── ...                             │ │   └── ...
└── extensions/                         │ ├── extensions/
    ├── math/                           │ │   ├── math.ts
    │   ├── install.h                   │ │   └── cv/
    │   └── operations.h                │ │       ├── image.ts
    └── cv/                             │ │       └── tasks/
        ├── install.h                   │ │           └── classification.ts
        └── image_ops.h                 │ └── hooks/
                                        │     └── useClassifier.ts
```

### 1. Core (`cpp/core/` and `src/core/`)

- **Purpose**: Implements the absolute bare minimum required for the lower-level API.
- **Responsibilities**: Primitives for `Tensor` and `Model` management, JSI bindings, and the ExecuTorch runtime execution logic.
- **Rule**: Core is domain-agnostic. **Do not** add task-specific or domain-specific code (like computer vision ops, tokenizers, or speech preprocessing) here.

### 2. Extensions (`cpp/extensions/` and `src/extensions/`)

- **Purpose**: Contains all domain-specific logic, organized by domain (e.g., `cv`, `math`, `llm`, `speech`).
- **Symmetry Rules**:
  - **Native operations** (e.g. image transformations, box math) go under `cpp/extensions/<domain>/`.
  - **JSI Installation** is registered via `cpp/extensions/<domain>/install.cpp` and exposed on the global JSI object under `__rnexecutorch_jsi__.<domain>`.
  - **TypeScript wrappers** for these native operations go in `src/extensions/<domain>.ts` or `src/extensions/<domain>/`.
  - **Higher-level task pipelines** (orchestration of model loading, input pre-processing, running inference, and output post-processing) are written entirely in TypeScript under `src/extensions/<domain>/tasks/`.
  - **React Hooks** (lightweight state/lifecycle wrappers around task pipelines) go in `src/hooks/`.

---

## 📂 Skills Index

Use the following index to locate the specific procedural guides for your task:

| I want to...                                 | Use this Skill File                             | Description                                                                                                    |
| :------------------------------------------- | :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| **Add a new native operator or C++ binding** | [SKILL.md](../add-native-extension/SKILL.md)    | Procedural guide to implementing C++ functions, exposing them via JSI, and writing TypeScript bridge wrappers. |
| **Create a task pipeline or hook**           | [SKILL.md](../add-task-pipeline/SKILL.md)       | Guide to building end-to-end TS pipelines (e.g. object detection) and exposing them via React hooks.           |
| **Verify, rebuild, or troubleshoot changes** | [SKILL.md](../verify-and-build/SKILL.md)        | Workflows for rebuilding TS/C++ and resolving common JSI runtime errors.                                       |
| **Validate model constraints & schemas**     | [SKILL.md](../model-schema-validation/SKILL.md) | Guide on specifying SymbolicTensor constraints and shapes for model signature validation.                      |

---

## 💡 Key Coding Conventions

- **Worklets**: Ensure all TypeScript functions directly wrapping native JSI calls start with the `"worklet";` directive so they are compatible with worklet-based libraries (e.g., React Native Reanimated).
- **Memory Management**: When writing native C++ code with JSI, pay close attention to JSI reference management and handle ExecuTorch lifecycle states safely.
- **Keep Core Clean**: Always build on top of core primitives. Do not modify files in `cpp/core/` or `src/core/` unless you are fixing a bug in the foundational runtime.

---

## 📢 Package Registration & Exports

Whenever you add a new extension, task pipeline, or hook, you **must** register and export them at the package level to make them accessible to users:

1. **TypeScript Exports** ([src/index.ts](../../../packages/react-native-executorch/src/index.ts)): Export the new task pipelines (e.g. `export * from './extensions/cv/tasks/myTask'`) and hooks (e.g. `export * from './hooks/useMyTask'`).
2. **Model Configurations** ([src/models.ts](../../../packages/react-native-executorch/src/models.ts)) & **Constants** ([src/constants.ts](../../../packages/react-native-executorch/src/constants.ts)):
   - These **two files are the sole source of truth** for defining pre-exported models, their options, and their label structures. Do not define models or options ad-hoc anywhere else.
   - **Model Registry Rule**: You must **only export the single `models` object registry** from `models.ts`. Do not export individual model configuration constants. Define them as internal (private) `const` variables inside `models.ts` and register them under the appropriate category nested inside the exported `models` registry object.
   - If you are introducing a standard pre-configured model, add its metadata config and HuggingFace/local URI endpoint mapping here.

---

## 🔍 Model Inspection & Testing via Example Apps

The workspace uses a monorepo structure with domain-specific example apps under `apps/` (e.g., `apps/computer-vision`, `apps/nlp`). These are the primary playgrounds for inspecting models and testing your pipelines on-device:

1. **Inspect Screen** (e.g., `apps/computer-vision/app/inspect/index.tsx`): Paste any arbitrary `.pte` model URL to load and print its metadata, inputs, and outputs dynamically.
2. **Interactive Testing Screens** (e.g., `apps/nlp/app/tokenizer/index.tsx`): Test task pipelines interactively. When adding a new task, you should add a corresponding interactive testing card/flow in the appropriate domain's app.
3. **Camera Screen** (e.g., `apps/computer-vision/app/camera/index.tsx`): Run real-time camera-based inferences using the task pipelines.

---

## 🛠️ Verification & Rebuilding

Please refer to the [Verify & Build Skill](../verify-and-build/SKILL.md) for the complete checklist on compiling TS/C++, rebuilding iOS pods, and troubleshooting native changes.
