# Contributing with an agent

This repository develops React Native ExecuTorch. These instructions cover library contributions;
application integration guidance lives in the documentation.

## Workspace and setup

- `packages/react-native-executorch/`: published library; TypeScript in `src/`, native code in `cpp/`,
  API tests in `__tests__/`, host C++ tests in `cpp/tests/`.
- `apps/computer-vision/`, `apps/nlp/`, `apps/speech/`: Expo development apps for device verification.
- `docs/`: Docusaurus site with its own package and build scripts.
- `.agents/skills/`: contributor procedures. Paths starting with `src/` or `cpp/` inside skills are
  relative to `packages/react-native-executorch/` unless stated otherwise. `metadata.scope` describes
  relevant paths; it is not an automatic instruction-loading mechanism.

Use the Node version in `.nvmrc` and Yarn version in root `package.json`. Run `yarn install --immutable`
from the repository root. The install normally provisions native binaries; for TypeScript-only work,
`RNET_SKIP_DOWNLOAD=1 yarn install --immutable` skips that download. Native builds need matching
headers/binaries and platform toolchains; see the verification skill before provisioning them.

## Load guidance for the task

Read only relevant skills. Start with core guidelines when learning the architecture.

| Task                                                         | Skill                                                                      |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Architecture, package boundaries, exports and model registry | [Core guidelines](.agents/skills/core-guidelines/SKILL.md)                 |
| TypeScript task pipeline or React hook                       | [Add task pipeline](.agents/skills/add-task-pipeline/SKILL.md)             |
| C++ operation, JSI host function or native registration      | [Add native extension](.agents/skills/add-native-extension/SKILL.md)       |
| Model schemas, method signatures and dimension constraints   | [Model schema validation](.agents/skills/model-schema-validation/SKILL.md) |
| Throwing, catching or adding error codes                     | [Error handling](.agents/skills/error-handling/SKILL.md)                   |
| TypeScript behavior and fake-runtime tests                   | [Add API tests](.agents/skills/add-api-tests/SKILL.md)                     |
| Selecting checks, native builds or runtime debugging         | [Verify and build](.agents/skills/verify-and-build/SKILL.md)               |
| Changing established APIs, helpers, conventions or skills    | [Skills maintenance](.agents/skills/skills-maintenance/SKILL.md)           |
| Documentation source, generation or versioning               | [Documentation README](docs/README.md)                                     |

## Working rules

- Match existing code before inventing a new pattern. Core stays domain-agnostic; task orchestration
  belongs in TypeScript extensions. TypeScript-only changes do not require a C++ counterpart.
- Update public exports deliberately. Model configurations come from `src/models.ts`; shared labels
  and constants come from `src/constants.ts`.
- Follow the task skill for native resource ownership and the error skill for coded failures across
  JSI/worklet boundaries.
- Update affected skills alongside API or convention changes. Link to the owning skill instead of
  copying its rules into other files.

## Verification

Choose checks using the [verification matrix](.agents/skills/verify-and-build/SKILL.md#verification-matrix).
Commands below run from the repository root unless stated otherwise:

- `yarn check:guidance`: contributor metadata and local link validation.
- `yarn workspace react-native-executorch typecheck`: package types, including API tests.
- `yarn workspace react-native-executorch test`: TypeScript API tests against a fake native runtime.
- `yarn workspace react-native-executorch prepare`: build published JS and declaration outputs.
- `yarn typecheck`: broader workspace verification; runs `yarn prepare` first.
- `yarn build` from `docs/`: generated documentation and site validation.

Report checks actually run and missing prerequisites or skipped suites. Fake-runtime tests and host C++
tests do not prove device inference works. Documentation/skill-only changes need no native rebuild.
