# Development Skills Directory

This directory contains specialized skills (recipes) to guide contributors and AI coding assistants in extending the codebase cleanly and consistently.

Start with [the repository contributor entry point](../../AGENTS.md) for setup and task routing.
Load only the relevant skills. Package-relative `src/` and `cpp/` paths refer to
`packages/react-native-executorch/`; metadata scopes describe relevance and do not automatically load
instructions. Run `yarn check:guidance` from the repository root after edits.

## Available Skills

- [Core Guidelines](./core-guidelines/SKILL.md) — Symmetrical architecture, conventions, and model rules.
- [Add Native Extension](./add-native-extension/SKILL.md) — C++ operations and JSI bindings.
- [Add Task Pipeline](./add-task-pipeline/SKILL.md) — TypeScript task pipelines and React hooks.
- [Model Schema Validation](./model-schema-validation/SKILL.md) — Model specs, dynamic shapes, and schema validation.
- [Error Handling](./error-handling/SKILL.md) — Error codes, throwing across worklet and JSI boundaries, and catching.
- [Add API Tests](./add-api-tests/SKILL.md) — TypeScript API test suites and the fake native runtime.
- [Verify and Build](./verify-and-build/SKILL.md) — TypeScript typechecking, native rebuilding, and troubleshooting.
- [Skills Maintenance](./skills-maintenance/SKILL.md) — Keeping skills synchronized with core primitives.
