---
name: skills-maintenance
description: Use when introducing new patterns, refactoring core primitives, adding helper utilities, or changing standard idioms to ensure the workspace skills remain up-to-date.
metadata:
  id: skills_maintenance
  scope: general development
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

3. **Verify Example Correctness**:
   - Ensure all code blocks and examples in updated skills compile/work and match actual usage in the repository.
   - Do not leave references to deprecated fields, functions, or old workflows.

4. **Update the Checklist**:
   - If a new verification rule is introduced (e.g., "must use helper X instead of manual code Y"), update the **Verification Checklist** section at the bottom of the relevant skill's `SKILL.md`.

---

## 📋 Verification Checklist

When introducing or refactoring a pattern, verify that:

- [ ] You identified all workspace skills containing code snippets or instructions affected by the change.
- [ ] You updated all examples and templates to reflect the new, correct APIs and idioms.
- [ ] You updated the corresponding checklists to enforce the new conventions.
- [ ] The updated skill files are valid markdown and keep lines reasonably short.
