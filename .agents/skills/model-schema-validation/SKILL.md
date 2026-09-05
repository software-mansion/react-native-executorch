---
name: model-schema-validation
description: Use when defining model spec constraints, validating ExecuTorch model shapes, checking method signatures, or resolving dimension symbols.
metadata:
  id: model_schema_validation
  scope: src/core/schema.ts, src/extensions/*/tasks/*
---

# Skill: Model Schema Validation Guide

Use this guide to define and enforce structural constraints (shapes, data types, runtime constraints) on loaded ExecuTorch `.pte` models using `validateSpec`.

---

## 🔍 Why Validate Model Specs?

Every ExecuTorch model exposes a `schema` (`ModelSpec<ConcreteDim>`), derived either from standard ExecuTorch `MethodMeta` at load time or from an exported `get_model_schema` companion method returning a JSON model spec.

To prevent runtime crashes, type mismatches, and memory allocation errors in C++, TypeScript task pipelines validate the loaded model's exported schema against allowed spec variants using `validateSpec` _before_ allocating static tensors or executing inference.

---

## 🛠️ Validation API Reference

```typescript
import {
  validateSpec,
  method,
  f32,
  i64,
  i32,
  DynamicDim as Dyn,
  constraint,
} from '../../../core/schema';

const { variant, dims } = validateSpec(model.schema, {
  batched: method(
    'forward',
    [i64(1, Dyn('L')), i64(1, Dyn('L'))],
    [f32(1, 'D')],
    [
      constraint.equality(
        { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
        { paramSide: 'input', tensorIdx: 1, dimIdx: 1 }
      ),
    ]
  ),
  unbatched: method(
    'forward',
    [i64(Dyn('L')), i64(Dyn('L'))],
    [f32('D')],
    [
      constraint.equality(
        { paramSide: 'input', tensorIdx: 0, dimIdx: 0 },
        { paramSide: 'input', tensorIdx: 1, dimIdx: 0 }
      ),
    ]
  ),
});

const [D] = dims.constant('D');
const L = dims.range('L');
```

### Key Schema Utilities from `src/core/schema.ts`:

- **`method(name, inputs, outputs, runtimeConstraints?)`**: Constructs a method specification.
- **`f32(...)` / `i64(...)` / `i32(...)` / `ui8(...)`**: Shorthand helpers for tensor parameter specs.
- **`StaticDim('symbol')` / String Literals**: Strings passed to shape helpers (e.g. `'H'`, `'W'`) automatically map to `StaticDim`, acting as **static dimension wildcards**. They bind strictly to `constant` positive integer dimensions in the exported spec.
- **`DynamicDim('symbol')` (or `Dyn('symbol')`)**: Creates a dynamic dimension symbol. Must be used when a dimension genuinely varies at runtime and binds to a `range` or `enum` domain in the exported spec.
- **Constraint Helpers (`constraint`)**:
  - **`DimRef` Object Literal (`{ paramSide: 'input' | 'output', tensorIdx, dimIdx }`)**: Explicit reference to a tensor's dimension.
  - **`constraint.equality(...dims)`**: Creates an equality constraint requiring the referenced dimensions to take the exact same value at runtime.
  - **`constraint.linear(lhs, rhs, a, b?)`**: Creates a linear constraint `lhs = a * rhs + b`.
- **`validateSpec(exportedSchema, allowedVariants)`**: Compares the model's exported schema against named variants and returns `{ variant, dim, dims }`.
- **Symbol Accessors (`dims` & `dim`)**:
  - `dims.constant('N', 'H')`: Extracts constant values for symbols as numbers.
  - `dims.range('S')`: Extracts range domains `{ min, max, step }`.
  - `dims.enum('E')`: Extracts enum choices `readonly number[]`.
  - `dims.dynamic('L')`: Extracts dynamic `range` or `enum` as raw `ConcreteDim`.
  - `dims.any('D')`: Extracts raw dimension value (`number`, `Range`, `readonly number[]`, or `ConcreteDim`).
  - `dim('N')`: Extracts value for a single symbol.

---

## 📏 Symbolic Dimensions & Dynamic Shapes

Tensors can have static dimensions (integers), static symbol wildcards (strings), or dynamic symbols (`DynamicDim`).
The `validateSpec` utility matches allowed variants in order:

1. **Numbers (Static Match)**:
   Must match the exact static integer in the exported spec.

2. **Strings / `StaticDim` (Static Wildcard Match)**:
   Binds string symbol names (e.g. `'H'`) to static constant integers in the exported spec. Repeated occurrences of the same static symbol must bind to the same constant value.

3. **`DynamicDim` (Dynamic Domain Match)**:
   Binds dynamic symbol names to `range` or `enum` domains in the exported spec.

4. **Variant Selection**:
   Specify multiple variant keys in `validateSpec` (e.g. `batched` vs `unbatched`). The validator tests variants sequentially and returns the first matching key and bound symbols.

---

## 🔀 Dimension Domains vs. Runtime Constraints

Understanding the distinction between a dimension's **domain** and its **runtime value** is central to schema design and validation:

### 1. Dimension Domains & Domain Matching

- **Dimension Domain**: The set of values a dimension may take:
  - `constant`: Exactly `value` (a singleton integer).
  - `range`: Any value between `min` and `max` stepping by `step`.
  - `enum`: Any value listed in `choices`.
- **Runtime Value**: The concrete integer size of a tensor's dimension in a specific execution call.
- **Domain Matching (`validateSpec`)**:
  - `validateSpec` performs static, load-time domain matching.
  - Dynamic symbols (`DynamicDim('S')`) bind to exported dimension domains. Reusing a symbol (`'S'`) across tensor inputs or outputs requires every occurrence to bind to the **exact same domain**.
  - ⚠️ **Key Rule**: Binding to the same domain does **NOT** mean runtime values coincide! Two dimensions bound to the same domain (e.g., both having range `1..512`) may take _different_ runtime values in a single execution (e.g. length 10 and length 25).

### 2. Runtime Constraints (`constraint.equality` & `constraint.linear`)

- **Runtime Constraints**: Declarations about the **runtime values** of tensor dimensions during execution:
  - **Equality Constraint (`constraint.equality(...)`)**: Requires all referenced dimensions to take the exact same runtime value in any execution call.
    ```typescript
    method(
      'forward',
      [f32('B', Dyn('S1')), f32('B', Dyn('S2'))],
      [f32('B', Dyn('S1'))],
      [
        constraint.equality(
          { paramSide: 'input', tensorIdx: 0, dimIdx: 0 },
          { paramSide: 'input', tensorIdx: 1, dimIdx: 0 }
        ),
      ]
    );
    ```
  - **Linear Constraint (`constraint.linear(...)`)**: Requires two dimensions to satisfy `dimLhs = a * dimRhs + b` at runtime.
- **Validation & Enforcement**:
  - `validateSpec` verifies that the exported model spec declares the exact same runtime constraints (1-to-1 declaration match).
  - Native C++ validates input runtime constraints before invoking `model.execute()`.

---

## ⚙️ Companion JSON Spec (`get_model_schema`)

For models with runtime dynamic dimensions or runtime constraints (equality/linear relations between dimensions), the `.pte` model exports a companion method named `get_model_schema` returning a JSON string representation of `ModelSpec<ConcreteDim>`.

When `get_model_schema` is present, the C++ loader parses it to populate `model.schema` with exact `RangeDim` / `EnumDim` domains and runtime constraints. Without it, `model.schema` is populated strictly from static ExecuTorch `MethodMeta`.

---

## 📋 Common Validation Recipes

### 1. Classification (Batched vs Unbatched)

Accepts an image tensor and outputs class probabilities:

```typescript
const { variant, dims } = validateSpec(model.schema, {
  batched: method('forward', [f32(1, 3, 'H', 'W')], [f32(1, 'N')]),
  unbatched: method('forward', [f32(3, 'H', 'W')], [f32('N')]),
});

const [N, H, W] = dims.constant('N', 'H', 'W');
const inpShape = { batched: [1, 3, H, W], unbatched: [3, H, W] }[variant];
const outShape = { batched: [1, N], unbatched: [N] }[variant];
```

### 2. Image-to-Image / Style Transfer

Accepts an image tensor and returns a modified image tensor with identical dimensions:

```typescript
const { dims } = validateSpec(model.schema, {
  default: method('forward', [f32(1, 3, 'H', 'W')], [f32(1, 3, 'H', 'W')]),
});

const [H, W] = dims.constant('H', 'W');
```

### 3. Object Detection (Dynamic Box Count)

Accepts an image tensor, and outputs boxes, scores, and class labels for `N` detections:

```typescript
const { dims } = validateSpec(model.schema, {
  default: method('forward', [f32(1, 3, 'H', 'W')], [f32('N', 4), f32('N'), f32('N')]),
});

const [N, H, W] = dims.constant('N', 'H', 'W');
```

### 4. Single-Model Pipeline (Fully Static Export)

Assert exact shape constants from the task file:

```typescript
const { dims } = validateSpec(model.schema, {
  default: method(
    'denoise',
    [
      f32(1, LATENT_CHANNELS, LATENT_SIZE, LATENT_SIZE),
      i64(1),
      f32(1, CLIP_MAX_TOKENS, CLIP_HIDDEN_SIZE),
    ],
    [f32(1, LATENT_CHANNELS, LATENT_SIZE, LATENT_SIZE)]
  ),
});
```

---

## 🚫 Avoid / Anti-Patterns

- **Do NOT write manual imperative shape/type checks:** Always use declarative `validateSpec` variants which report unified, readable mismatch errors.
- **Do NOT use hardcoded integers for dynamic dimensions:** Use string symbols (like `'H'`, `'W'`, `'N'`) for dynamic dimensions. Conversely, fixed export dimensions should be integers.
- **Do NOT skip validation at startup:** Validate `model.schema` before allocating static tensors.
- **Do NOT skip validation for single-model pipelines:** Single-model pipelines should still validate against task shape constants.

---

## ⚠️ Failure Codes

`validateSpec` and the native spec validation raise `SCHEMA_MISMATCH` (the spec-builder
helpers `ConstantDim` / `RangeDim` / `EnumDim` raise `INVALID_ARGUMENT` for their own
arguments). A runtime constraint violated by the tensors actually passed to `execute`
raises `INVALID_ARGUMENT`, not `SCHEMA_MISMATCH`: the model is fine, the call is not. See the [Error Handling Skill](../error-handling/SKILL.md).

---

## 📋 Verification Checklist

When specifying model schema validations, verify that:

- [ ] Schema validation is performed immediately after model loading and before tensor initialization using `validateSpec(model.schema, { ... })`.
- [ ] Dynamic dimensions are defined as string symbols, while fixed dimensions are plain integers.
- [ ] Symbol values are extracted using `dims.constant(...)`, `dims.range(...)`, or `dims.enum(...)`.
- [ ] Multiple shape variants (e.g. `batched` vs `unbatched`) are provided when supported.
- [ ] Input and output constraints map accurately to model specifications.
- [ ] New validation failures throw `SCHEMA_MISMATCH` (or `INVALID_ARGUMENT` when the caller's own arguments are at fault), never a bare `Error`.
