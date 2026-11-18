---
name: core-guidelines
description: Use when learning or changing the library architecture, package boundaries, public exports, model registry, or shared coding conventions.
metadata:
  id: core_guidelines
  scope: packages/react-native-executorch/src, packages/react-native-executorch/cpp
---

# Library architecture and conventions

Paths below are relative to `packages/react-native-executorch/`. Use the repository
[AGENTS.md](../../../AGENTS.md) to select task-specific skills and verification.

## Core and extensions

The library has two layers:

- `cpp/core/` and `src/core/` implement domain-agnostic tensors, models, schemas, runtime execution and
  resource ownership. Extend core when a foundational capability is needed; keep task-specific behavior
  out of it and verify affected callers.
- `cpp/extensions/<domain>/` implements native domain operations. `src/extensions/<domain>/` contains
  wrappers, utilities and TypeScript task pipelines; `src/hooks/` manages React loading and lifecycle.

Native and TypeScript domains mirror each other where bindings are needed. A task built from existing
operations can be entirely TypeScript. Add C++ when the operation needs a new native capability or
measurements justify it; see [native extension guidance](../add-native-extension/SKILL.md).

Task orchestration, preprocessing and postprocessing normally live in TypeScript so they can be
inspected and customized. Model export can perform expensive transformations when that improves
execution without hiding necessary configuration; see [task pipelines](../add-task-pipeline/SKILL.md).

## Sources of truth

| Concern                                    | Source                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| Root exports                               | [src/index.ts](../../../packages/react-native-executorch/src/index.ts)                 |
| Public subpaths and published files        | [package.json](../../../packages/react-native-executorch/package.json)                 |
| Model configurations and hosted asset URLs | [src/models.ts](../../../packages/react-native-executorch/src/models.ts)               |
| Shared labels and constants                | [src/constants.ts](../../../packages/react-native-executorch/src/constants.ts)         |
| Native domain installation                 | [cpp/RnExecutorch.cpp](../../../packages/react-native-executorch/cpp/RnExecutorch.cpp) |
| JSI access from TypeScript                 | [src/native/bridge.ts](../../../packages/react-native-executorch/src/native/bridge.ts) |

Export new public tasks/hooks through the root entry point and domain utilities through the appropriate
domain entry point. Inspect `package.json` exports before adding a subpath. Avoid exposing internal
helpers accidentally; export changes are checked by the API surface tests.

`models.ts` exports the single `models` registry. Keep individual configurations private and register
them under the appropriate task/model/variant. Reuse task types and `constants.ts` for shared labels.
Export-pinned shapes or scalar values belong beside task code; model-varying configuration belongs in
registry options. The [task skill](../add-task-pipeline/SKILL.md) owns that distinction.

## Shared conventions

- Name options parameters `options`. Existing suffixes such as `ModelOpts` or `modelOpts` are allowed.
- Native JSI wrappers use `rnexecutorchJsi` from the bridge and start with `'worklet';`. Helpers called
  from worklets must also be compatible with that runtime. See the native extension skill for bindings.
- The [error skill](../error-handling/SKILL.md) owns coded factories, catch behavior and C++ guards.
- The [task skill](../add-task-pipeline/SKILL.md) owns construction failure cleanup and resource scopes.
- The [schema skill](../model-schema-validation/SKILL.md) owns load-time shape/domain validation.

## Inspecting and verifying behavior

Use the domain apps under `apps/` for model inspection and device inference. Inspect their current
screens before choosing an example to extend. For a new task, add an appropriate demonstration when
needed to exercise inputs, outputs or device-only behavior. Do not commit downloaded model binaries.

Use [API tests](../add-api-tests/SKILL.md) for TypeScript behavior and
[verify and build](../verify-and-build/SKILL.md) to select host/native/device checks. When conventions
change, update affected guidance following [skills maintenance](../skills-maintenance/SKILL.md).
