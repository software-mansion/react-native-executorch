---
title: Schema Validation
slug: /core-and-advanced/schema-validation
description: 'Declare the shape and dtype contract a model must satisfy, and validate any .pte against it before allocating tensors or running inference.'
keywords:
  [
    react native executorch,
    model schema,
    validateSpec,
    dynamic shapes,
    runtime constraints,
    tensor shape validation,
    get_model_schema,
  ]
---

# Schema Validation

A pipeline only works if the model it's handed has the shapes and data types it
expects. Rather than discover a mismatch as a native crash or garbage output
mid-inference, you declare the contract you need and check any `.pte` against it
up front. That is what schema validation does, and it is what lets a user drop
their own model into a built-in pipeline: the pipeline states exactly what it
accepts, and the model either satisfies it or fails loudly at load time.

Every loaded [`Model`](../06-api-reference/type-aliases/Model.md) exposes its
[`schema`](../06-api-reference/type-aliases/Model.md#schema) — the exported
contract of each method's inputs, outputs, and dimension constraints. You compare
that against one or more **allowed** specs you declare, using
[`validateSpec`](../06-api-reference/react-native-executorch/namespaces/schema/functions/validateSpec.md).
Everything here lives in the
[`schema`](../06-api-reference/react-native-executorch/namespaces/schema/index.md)
namespace:

```typescript
import { schema } from 'react-native-executorch';

const { validateSpec, method, f32, i64, DynamicDim, constraint } = schema;
```

## What a schema describes

A schema is a
[`ModelSpec`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/ModelSpec.md):
a map from method name to that method's signature. Each method's
[`MethodSpec`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/MethodSpec.md)
has three parts — an ordered list of **inputs**, an ordered list of **outputs**,
and any **runtime constraints** relating their dimensions.

Every input and output is one
[`ParamSpec`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/ParamSpec.md):
either a
[`TensorSpec`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/TensorSpec.md)
— a data type plus a shape, one entry per dimension — or a primitive value tag
such as an int or a boolean. Most of this page is about tensor parameters, since
that is where matching gets interesting;
[primitives](#primitive-parameters) and [multiple methods](#multi-method-models)
are covered further down.

The one distinction to carry through everything below is between a dimension's
**domain** and its **runtime value**. The domain is the set of sizes a dimension
is allowed to take (a fixed constant, a range, or an enum); the runtime value is
the single size it actually has in one execution. Validation works entirely on
domains — it never sees runtime values — which is why relating actual sizes needs
a separate runtime constraint.

## Two kinds of spec

The distinction to hold onto is between the spec a model **exports** and the spec
a pipeline **allows**.

- An **exported spec** describes what a model actually provides. It uses
  [`ConcreteDim`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/ConcreteDim.md)
  dimensions — every dimension has a fully known domain (a constant, a range, or
  an enum). This is what [`model.schema`](../06-api-reference/type-aliases/Model.md#schema)
  gives you; you never write it by hand.
- An **allowed spec** describes what a pipeline can work with. It uses
  [`SymbolicDim`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/SymbolicDim.md)
  dimensions, which add named symbols on top of concrete domains. You write these
  to state your requirements, and you can offer several as variants — matching any
  one is enough.

[`validateSpec`](../06-api-reference/react-native-executorch/namespaces/schema/functions/validateSpec.md)
checks an exported spec against your allowed specs and, on success, tells you
which variant matched and what its symbols bound to.

## Declaring an allowed spec

Build a method spec with
[`method(name, inputs, outputs, constraints?)`](../06-api-reference/react-native-executorch/namespaces/schema/functions/method.md).
Inputs and outputs are ordered lists of parameter specs; for tensors, use the
dtype shorthands —
[`f32`](../06-api-reference/react-native-executorch/namespaces/schema/functions/f32.md),
[`i64`](../06-api-reference/react-native-executorch/namespaces/schema/functions/i64.md),
[`i32`](../06-api-reference/react-native-executorch/namespaces/schema/functions/i32.md),
[`ui8`](../06-api-reference/react-native-executorch/namespaces/schema/functions/ui8.md),
[`bool`](../06-api-reference/react-native-executorch/namespaces/schema/functions/bool.md)
— each taking a shape.

Within a shape, each dimension is written one of three ways:

| Written as           | Means                      | Binds to an exported dimension that is     |
| :------------------- | :------------------------- | :----------------------------------------- |
| a number, e.g. `3`   | an exact constant          | that same constant                         |
| a string, e.g. `'H'` | a static symbol (wildcard) | any constant; repeats must agree           |
| `DynamicDim('L')`    | a dynamic symbol           | a range or enum domain; repeats must agree |

```typescript
// "forward takes one float32 image [1, 3, H, W] and returns logits [1, N]",
// where H, W, and N are whatever constants the model was exported with
method('forward', [f32(1, 3, 'H', 'W')], [f32(1, 'N')]);
```

Use a plain integer when a dimension is genuinely fixed (batch size `1`, `3` color
channels), a string symbol when the value is fixed at export but you don't want to
hard-code it (input resolution, class count), and
[`DynamicDim`](../06-api-reference/react-native-executorch/namespaces/schema/functions/DynamicDim.md)
only when the dimension truly varies per execution (a sequence length).

## Validating and reading back symbols

Pass the exported schema and a set of named variants to
[`validateSpec`](../06-api-reference/react-native-executorch/namespaces/schema/functions/validateSpec.md).
Variants are tried in order; the first to match wins. The returned
[`SpecMatch`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/SpecMatch.md)
carries the matched `variant` key and accessors for the values each symbol bound
to.

```typescript
const { variant, dims } = validateSpec(model.schema, {
  batched: method('forward', [f32(1, 3, 'H', 'W')], [f32(1, 'N')]),
  unbatched: method('forward', [f32(3, 'H', 'W')], [f32('N')]),
});

// Read the bound constants back as numbers
const [N, H, W] = dims.constant('N', 'H', 'W');

const inpShape = { batched: [1, 3, H, W], unbatched: [3, H, W] }[variant];
const outShape = { batched: [1, N], unbatched: [N] }[variant];
```

This is the standard opening of a pipeline: validate first, then use the bound
symbols to allocate the exact tensors the model needs. If nothing matches,
`validateSpec` throws [`SCHEMA_MISMATCH`](./05-error-handling.md#error-codes-reference) with
a per-variant explanation of why each one failed — so validation doubles as the
pipeline's precondition check.

The [`dims`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/SpecMatch.md#dims)
accessors are typed to the domain you ask for:

- `dims.constant(...)` returns numbers (from static symbols).
- `dims.range(...)` returns [`Range`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/Range.md) objects `{ min, max, step }`.
- `dims.enum(...)` returns `readonly number[]` choice lists.
- `dims.dynamic(...)` returns the raw dynamic domain (range or enum).

There is also a single-symbol
[`dim(name, kind?)`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/SpecMatch.md#dim)
accessor for one-off reads.

:::tip Validate before you allocate
Run `validateSpec` immediately after [`loadModel`](../06-api-reference/functions/loadModel.md),
before allocating any tensors. The bound symbols give you the exact shapes to
allocate, and a mismatch is caught before you commit any native memory.
:::

## Dimension domains

Every concrete dimension has one of three domains, and your symbols bind to them:

- **constant** — a single fixed value. Static string symbols (and plain integers)
  match these.
- **range** — values from `min` to `max` in steps of `step`, via
  [`RangeDim`](../06-api-reference/react-native-executorch/namespaces/schema/functions/RangeDim.md).
- **enum** — an explicit set of choices, via
  [`EnumDim`](../06-api-reference/react-native-executorch/namespaces/schema/functions/EnumDim.md).

A [`DynamicDim`](../06-api-reference/react-native-executorch/namespaces/schema/functions/DynamicDim.md)
binds to a range or an enum. Reusing the same symbol across several dimensions
requires every occurrence to bind to the **same domain**.

:::warning Same domain is not the same value
Binding a symbol to a domain says nothing about runtime values. Two dimensions
that both bind `DynamicDim('L')` to the range `1..512` may still take _different_
sizes in a single execution — say `10` and `25`. If you need two dimensions to be
equal at runtime, that is a runtime constraint, not a shared symbol.
:::

## Runtime constraints

Where domains describe the set of allowed values, **runtime constraints** describe
relationships the actual values must satisfy in any single execution. Declare them
as the fourth argument to [`method`](../06-api-reference/react-native-executorch/namespaces/schema/functions/method.md),
using the
[`constraint`](../06-api-reference/react-native-executorch/namespaces/schema/variables/constraint.md)
helpers.

A dimension is referenced by a
[`DimRef`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/DimRef.md)
— `{ paramSide, tensorIdx, dimIdx }`, where `tensorIdx` counts only tensor
parameters, skipping any primitives.

```typescript
// Two int64 inputs [1, L1] and [1, L2] whose second dimensions must be equal
// at runtime (e.g. token ids and an attention mask of the same length)
method(
  'forward',
  [i64(1, DynamicDim('L1')), i64(1, DynamicDim('L2'))],
  [f32(1, 'D')],
  [
    constraint.equality(
      { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
      { paramSide: 'input', tensorIdx: 1, dimIdx: 1 }
    ),
  ]
);
```

Two kinds are available:

- [`constraint.equality(...dims)`](../06-api-reference/react-native-executorch/namespaces/schema/variables/constraint.md)
  — all referenced dimensions must take the same value.
- [`constraint.linear(lhs, rhs, a, b?)`](../06-api-reference/react-native-executorch/namespaces/schema/variables/constraint.md)
  — two dimensions must satisfy `lhs = a * rhs + b`.

Constraints are matched as **declarations**: for a variant to validate, the
exported spec must declare exactly the same constraints, one-to-one — no missing
ones and no extras. `validateSpec` compares the declarations; it does not evaluate
whether they hold. Enforcement against the tensors you actually pass happens later,
inside the native runtime.

## Primitive parameters

Not every input or output is a tensor — a method can also take or return
primitives: integers, doubles, booleans, strings, and their list forms. A primitive
parameter has no shape or dtype, so instead of a tensor shorthand you write its
[`ExecuTorchTag`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/ExecuTorchTag.md)
directly as `{ kind: 'Int' }` in the appropriate input or output slot.

```typescript
// forward(image, topK) -> (logits, elapsedMs)
method(
  'forward',
  [f32(1, 3, 'H', 'W'), { kind: 'Int' }], // second input is a plain int
  [f32(1, 'N'), { kind: 'Double' }] // second output is a plain double
);
```

Primitives are skipped when counting tensors for a
[`DimRef`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/DimRef.md):
`tensorIdx` indexes only tensor parameters. In
`[f32(1, 'N'), { kind: 'Int' }, i64(1, 'L')]`, the `i64` tensor is `tensorIdx: 1`,
not `2`.

## Multi-method models

A variant is not limited to a single method. Because
[`method`](../06-api-reference/react-native-executorch/namespaces/schema/functions/method.md)
returns a one-method spec object, you merge several into one variant with object
spread. `validateSpec` requires every method you declare to be present and to
match (the model may export additional methods you don't mention). Symbols bind
across the **whole** variant, so a symbol reused between methods must resolve
consistently — which is exactly how you assert that two methods share a dimension.

```typescript
// An encoder/decoder whose embedding width D is the same across both methods,
// and whose sequence length L binds to the same dynamic domain in each
const { dims } = validateSpec(model.schema, {
  default: {
    ...method('encode', [i64(1, DynamicDim('L'))], [f32(1, 'D')]),
    ...method('decode', [f32(1, 'D')], [i64(1, DynamicDim('L'))]),
  },
});

const [D] = dims.constant('D');
// Reusing L binds encode's and decode's sequence length to the same *domain*, not
// the same runtime value — the two methods may still run at different lengths.
```

## Where the exported spec comes from

A model's exported schema is populated at load time from one of two sources:

1. **ExecuTorch metadata (default).** When the `.pte` carries only static
   metadata, every dimension domain is a constant. This is enough for models whose
   shapes are fully fixed at export.
2. **A `get_model_schema` companion method.** For models with dynamic or
   enumerated dimensions, or that declare runtime constraints, the `.pte` must
   export a method named `get_model_schema` returning a JSON-encoded spec. The loader calls
   it and overlays precise range, enum, and constraint information onto the base
   metadata. Only methods that need overrides have to appear in it.

You embed the companion method during export in Python by passing it as a constant
method when lowering:

```python
to_edge_transform_and_lower(
    exported_program,
    # ...
    constant_methods={"get_model_schema": schema_json},
)
```

where `schema_json` is the JSON string encoding the model's spec. See
[Exporting Custom Models](./07-exporting-custom-models.md) for the full export
workflow.

## Where to go next

- [Models & Tensors](./02-models-and-tensors.md) — the [`Model`](../06-api-reference/type-aliases/Model.md) and [`Tensor`](../06-api-reference/type-aliases/Tensor.md) primitives that a validated spec lets you allocate correctly.
- [Exporting Custom Models](./07-exporting-custom-models.md) — how to emit a `get_model_schema` companion during export.
- [Error Handling](./05-error-handling.md) — narrowing on `SCHEMA_MISMATCH` and `INVALID_ARGUMENT`.

### API reference

- [`validateSpec()`](../06-api-reference/react-native-executorch/namespaces/schema/functions/validateSpec.md) · [`method()`](../06-api-reference/react-native-executorch/namespaces/schema/functions/method.md) · [`constraint`](../06-api-reference/react-native-executorch/namespaces/schema/variables/constraint.md)
- Dtype shorthands: [`f32`](../06-api-reference/react-native-executorch/namespaces/schema/functions/f32.md) · [`i64`](../06-api-reference/react-native-executorch/namespaces/schema/functions/i64.md) · [`i32`](../06-api-reference/react-native-executorch/namespaces/schema/functions/i32.md) · [`ui8`](../06-api-reference/react-native-executorch/namespaces/schema/functions/ui8.md) · [`bool`](../06-api-reference/react-native-executorch/namespaces/schema/functions/bool.md)
- Dimensions: [`DynamicDim`](../06-api-reference/react-native-executorch/namespaces/schema/functions/DynamicDim.md) · [`StaticDim`](../06-api-reference/react-native-executorch/namespaces/schema/functions/StaticDim.md) · [`ConstantDim`](../06-api-reference/react-native-executorch/namespaces/schema/functions/ConstantDim.md) · [`RangeDim`](../06-api-reference/react-native-executorch/namespaces/schema/functions/RangeDim.md) · [`EnumDim`](../06-api-reference/react-native-executorch/namespaces/schema/functions/EnumDim.md)
- Types: [`SpecMatch`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/SpecMatch.md) · [`SymbolicDim`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/SymbolicDim.md) · [`ConcreteDim`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/ConcreteDim.md) · [`DimRef`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/DimRef.md)
