---
name: skills-maintenance
description: Use when APIs, build/test commands, shared helpers, architecture or contributor instructions change and affected skills need review or updates.
metadata:
  id: skills_maintenance
  scope: AGENTS.md, .agents, packages/react-native-executorch
---

# Skill: Skills Maintenance & Documentation Integrity

Use this guide when you introduce, modify, or deprecate core codebase patterns, helpers, utilities, or design decisions. This skill ensures that the agent keeps workspace skills in sync with the codebase state to prevent documentation decay and outdated copy-pasting.

---

## 🚦 Core Guidelines

1. **Detect Pattern Shifts**:
   - Whenever you implement a new utility, helper class, or conversion method (e.g., in `core/conversions` or `core/tensor_helpers`), or change how native bindings are structured:
     - Check if these new primitives replace older manual patterns (e.g., replacing manual locking/extraction with helper library calls).
     - Identify which existing skills (in `.agents/skills/`) contain code examples, templates, or instructions that are affected by this shift.

2. **Proactively Update Affected Skills**:
   - Do not wait for the user to explicitly ask to update the skills. When a core API or idiom changes, update the relevant `SKILL.md` files as part of the implementation or refactoring task.
   - Specifically inspect:
     - [add-native-extension](../add-native-extension/SKILL.md) for C++ JSI & locking idioms.
     - [add-task-pipeline](../add-task-pipeline/SKILL.md) for TypeScript pipeline orchestration, pre-allocation, and lifecycle hooks.
     - [model-schema-validation](../model-schema-validation/SKILL.md) for schema verification constraints.
     - [verify-and-build](../verify-and-build/SKILL.md) for compilation and troubleshooting steps.
     - [add-api-tests](../add-api-tests/SKILL.md) for the TypeScript test suites and the fake native runtime.

3. **Verify Example Correctness**:
   - Ensure all code blocks and examples in updated skills compile/work and match actual usage in the repository.
   - Do not leave references to deprecated fields, functions, or old workflows.

4. **Keep Each Rule in One Place**:
   - Architecture and exports belong in [core guidelines](../core-guidelines/SKILL.md), resource
     ownership in [task pipelines](../add-task-pipeline/SKILL.md), coded errors in
     [error handling](../error-handling/SKILL.md), and check selection in
     [verify and build](../verify-and-build/SKILL.md). Link to the owning skill from related procedures.
   - Keep [AGENTS.md](../../../AGENTS.md) as the short contributor entry point. Add routing when a task
     needs different guidance; do not copy every skill into the root file.
   - Retain concrete invariants and their reasons. Remove outdated examples or conflicting checklists;
     avoid turning a single failure into an unrelated universal restriction.

5. **Validate the Changed Guidance**:
   - Run `yarn check:guidance` from the repository root. It checks YAML, required names/descriptions,
     directory/name agreement, metadata value types and local file links in `AGENTS.md` and skill
     Markdown. It ignores fenced examples and does not fetch external URLs or validate anchors.
   - Format changed files with the repository's Prettier. Typecheck complete TypeScript templates
     against their intended package paths; distinguish those from schematic snippets containing
     placeholders. Review shell commands and source references against current scripts.
   - The validator cannot establish semantic correctness or agent behavior. For substantial workflow
     changes, try representative contributor requests (a TS-only task, a native op, and a prose-only
     edit) and inspect whether routing and verification choices are appropriate. Keep these checks
     scoped to available prerequisites; do not provision a device merely to validate prose.

---

## 📋 Verification Checklist

When introducing or refactoring a pattern, verify that:

- [ ] You identified all workspace skills containing code snippets or instructions affected by the change.
- [ ] You updated all examples and templates to reflect the new, correct APIs and idioms.
- [ ] You updated the corresponding checklists to enforce the new conventions.
- [ ] The updated skill files are valid markdown and keep lines reasonably short.
- [ ] Root routing still reaches the relevant skills without loading unrelated procedures.
- [ ] `yarn check:guidance` passes, and changed complete examples were checked against actual APIs.
- [ ] The PR identifies verification performed and any remaining limitations.
