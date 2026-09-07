# Schema Validation

A pipeline only works if the model it's handed has the shapes and data types it expects. Rather than discover a mismatch as a native crash or garbage output mid-inference, you declare the contract you need and check any `.pte` against it up front. That is what schema validation does, and it is what lets a user drop their own model into a built-in pipeline: the pipeline states exactly what it accepts, and the model either satisfies it or fails loudly at load time.

Every loaded [`Model`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Model) exposes its [`schema`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Model#schema) — the exported contract of each method's inputs, outputs, and dimension constraints. You compare that against one or more **allowed** specs you declare, using [`validateSpec`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/validateSpec). Everything here lives in the [`schema`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema) namespace:

```typescript
import { schema } from 'react-native-executorch';

const { validateSpec, method, f32, i64, DynamicDim, constraint } = schema;

```

## What a schema describes[​](#what-a-schema-describes "Direct link to What a schema describes")

A schema is a [`ModelSpec`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/ModelSpec): a map from method name to that method's signature. Each method's [`MethodSpec`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/MethodSpec) has three parts — an ordered list of **inputs**, an ordered list of **outputs**, and any **runtime constraints** relating their dimensions.

Every input and output is one [`ParamSpec`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/ParamSpec): either a [`TensorSpec`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/TensorSpec) — a data type plus a shape, one entry per dimension — or a primitive value tag such as an int or a boolean. Most of this page is about tensor parameters, since that is where matching gets interesting; [primitives](#primitive-parameters) and [multiple methods](#multi-method-models) are covered further down.

The one distinction to carry through everything below is between a dimension's **domain** and its **runtime value**. The domain is the set of sizes a dimension is allowed to take (a fixed constant, a range, or an enum); the runtime value is the single size it actually has in one execution. Validation works entirely on domains — it never sees runtime values — which is why relating actual sizes needs a separate runtime constraint.

## Two kinds of spec[​](#two-kinds-of-spec "Direct link to Two kinds of spec")

The distinction to hold onto is between the spec a model **exports** and the spec a pipeline **allows**.

* An **exported spec** describes what a model actually provides. It uses [`ConcreteDim`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/ConcreteDim) dimensions — every dimension has a fully known domain (a constant, a range, or an enum). This is what [`model.schema`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Model#schema) gives you; you never write it by hand.
* An **allowed spec** describes what a pipeline can work with. It uses [`SymbolicDim`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/SymbolicDim) dimensions, which add named symbols on top of concrete domains. You write these to state your requirements, and you can offer several as variants — matching any one is enough.

[`validateSpec`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/validateSpec) checks an exported spec against your allowed specs and, on success, tells you which variant matched and what its symbols bound to.

## Declaring an allowed spec[​](#declaring-an-allowed-spec "Direct link to Declaring an allowed spec")

Build a method spec with [`method(name, inputs, outputs, constraints?)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/method). Inputs and outputs are ordered lists of parameter specs; for tensors, use the dtype shorthands — [`f32`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/f32), [`i64`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/i64), [`i32`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/i32), [`ui8`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/ui8), [`bool`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/bool) — each taking a shape.

Within a shape, each dimension is written one of three ways:

| Written as           | Means                      | Binds to an exported dimension that is     |
| -------------------- | -------------------------- | ------------------------------------------ |
| a number, e.g. `3`   | an exact constant          | that same constant                         |
| a string, e.g. `'H'` | a static symbol (wildcard) | any constant; repeats must agree           |
| `DynamicDim('L')`    | a dynamic symbol           | a range or enum domain; repeats must agree |

```typescript
// "forward takes one float32 image [1, 3, H, W] and returns logits [1, N]",
// where H, W, and N are whatever constants the model was exported with
method('forward', [f32(1, 3, 'H', 'W')], [f32(1, 'N')]);

```

Use a plain integer when a dimension is genuinely fixed (batch size `1`, `3` color channels), a string symbol when the value is fixed at export but you don't want to hard-code it (input resolution, class count), and [`DynamicDim`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/DynamicDim) only when the dimension truly varies per execution (a sequence length).

## Validating and reading back symbols[​](#validating-and-reading-back-symbols "Direct link to Validating and reading back symbols")

Pass the exported schema and a set of named variants to [`validateSpec`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/validateSpec). Variants are tried in order; the first to match wins. The returned [`SpecMatch`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/SpecMatch) carries the matched [`variant`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/SpecMatch#variant) key and accessors for the values each symbol bound to.

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

This is the standard opening of a pipeline: validate first, then use the bound symbols to allocate the exact tensors the model needs. If nothing matches, [`validateSpec`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/validateSpec) throws [`SCHEMA_MISMATCH`](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/error-handling.md#error-codes-reference) with a per-variant explanation of why each one failed — so validation doubles as the pipeline's precondition check.

The [`dims`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/SpecMatch#dims) accessors are typed to the domain you ask for:

* [`dims.constant(...)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/SpecMatch#constant) returns numbers (from static symbols).
* [`dims.range(...)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/SpecMatch#range) returns [`Range`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/Range) objects `{ min, max, step }`.
* [`dims.enum(...)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/SpecMatch#enum) returns `readonly number[]` choice lists.
* [`dims.dynamic(...)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/SpecMatch#dynamic) returns the raw dynamic domain (range or enum).

There is also a single-symbol [`dim(name, kind?)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/SpecMatch#dim) accessor for one-off reads.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Validate before you allocate

Run [`validateSpec`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/validateSpec) immediately after [`loadModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/loadModel), before allocating any tensors. The bound symbols give you the exact shapes to allocate, and a mismatch is caught before you commit any native memory.

## Dimension domains[​](#dimension-domains "Direct link to Dimension domains")

Every concrete dimension has one of three domains, and your symbols bind to them:

* **constant** — a single fixed value. Static string symbols (and plain integers) match these.
* **range** — values from [`min`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/Range#min) to [`max`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/Range#max) in steps of [`step`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/Range#step), via [`RangeDim`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/RangeDim).
* **enum** — an explicit set of choices, via [`EnumDim`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/EnumDim).

A [`DynamicDim`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/DynamicDim) binds to a range or an enum. Reusing the same symbol across several dimensions requires every occurrence to bind to the **same domain**.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Same domain is not the same value

Binding a symbol to a domain says nothing about runtime values. Two dimensions that both bind `DynamicDim('L')` to the range `1..512` may still take *different* sizes in a single execution — say `10` and `25`. If you need two dimensions to be equal at runtime, that is a runtime constraint, not a shared symbol.

## Runtime constraints[​](#runtime-constraints "Direct link to Runtime constraints")

Where domains describe the set of allowed values, **runtime constraints** describe relationships the actual values must satisfy in any single execution. Declare them as the fourth argument to [`method`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/method), using the [`constraint`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/variables/constraint) helpers.

A dimension is referenced by a [`DimRef`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/DimRef) — `{` [`paramSide`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/DimRef#paramside), [`tensorIdx`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/DimRef#tensoridx), [`dimIdx`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/DimRef#dimidx) `}`, where [`tensorIdx`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/DimRef#tensoridx) counts only tensor parameters, skipping any primitives.

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

* [`constraint.equality(...dims)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/variables/constraint) — all referenced dimensions must take the same value.
* [`constraint.linear(lhs, rhs, a, b?)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/variables/constraint) — two dimensions must satisfy `lhs = a * rhs + b`.

Constraints are matched as **declarations**: for a variant to validate, the exported spec must declare exactly the same constraints, one-to-one — no missing ones and no extras. [`validateSpec`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/validateSpec) compares the declarations; it does not evaluate whether they hold. Enforcement against the tensors you actually pass happens later, inside the native runtime.

## Primitive parameters[​](#primitive-parameters "Direct link to Primitive parameters")

Not every input or output is a tensor — a method can also take or return primitives: integers, doubles, booleans, strings, and their list forms. A primitive parameter has no shape or dtype, so instead of a tensor shorthand you write its [`ExecuTorchTag`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/ExecuTorchTag) directly as `{ kind: 'Int' }` in the appropriate input or output slot.

```typescript
// forward(image, topK) -> (logits, elapsedMs)
method(
  'forward',
  [f32(1, 3, 'H', 'W'), { kind: 'Int' }], // second input is a plain int
  [f32(1, 'N'), { kind: 'Double' }] // second output is a plain double
);

```

Primitives are skipped when counting tensors for a [`DimRef`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/DimRef): [`tensorIdx`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/DimRef#tensoridx) indexes only tensor parameters. In `[f32(1, 'N'), { kind: 'Int' }, i64(1, 'L')]`, the `i64` tensor is `tensorIdx: 1`, not `2`.

## Multi-method models[​](#multi-method-models "Direct link to Multi-method models")

A variant is not limited to a single method. Because [`method`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/method) returns a one-method spec object, you merge several into one variant with object spread. [`validateSpec`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/validateSpec) requires every method you declare to be present and to match (the model may export additional methods you don't mention). Symbols bind across the **whole** variant, so a symbol reused between methods must resolve consistently — which is exactly how you assert that two methods share a dimension.

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

## Where the exported spec comes from[​](#where-the-exported-spec-comes-from "Direct link to Where the exported spec comes from")

A model's exported schema is populated at load time from one of two sources:

1. **ExecuTorch metadata (default).** When the `.pte` carries only static metadata, every dimension domain is a constant. This is enough for models whose shapes are fully fixed at export.
2. **A `get_model_schema` companion method.** For models with dynamic or enumerated dimensions, or that declare runtime constraints, the `.pte` must export a method named `get_model_schema` returning a JSON-encoded spec. The loader calls it and overlays precise range, enum, and constraint information onto the base metadata. Only methods that need overrides have to appear in it.

You embed the companion method during export in Python by passing it as a constant method when lowering:

```python
to_edge_transform_and_lower(
    exported_program,
    # ...
    constant_methods={"get_model_schema": schema_json},
)

```

where `schema_json` is the JSON string encoding the model's spec. See [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md) for the full export workflow.

## Where to go next[​](#where-to-go-next "Direct link to Where to go next")

* [Models & Tensors](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/models-and-tensors.md) — the [`Model`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Model) and [`Tensor`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Tensor) primitives that a validated spec lets you allocate correctly.
* [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md) — how to emit a `get_model_schema` companion during export.
* [Error Handling](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/error-handling.md) — narrowing on `SCHEMA_MISMATCH` and `INVALID_ARGUMENT`.

### API reference[​](#api-reference "Direct link to API reference")

* [`validateSpec()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/validateSpec) · [`method()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/method) · [`constraint`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/variables/constraint)
* Dtype shorthands: [`f32`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/f32) · [`i64`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/i64) · [`i32`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/i32) · [`ui8`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/ui8) · [`bool`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/bool)
* Dimensions: [`DynamicDim`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/DynamicDim) · [`StaticDim`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/StaticDim) · [`ConstantDim`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/ConstantDim) · [`RangeDim`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/RangeDim) · [`EnumDim`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/functions/EnumDim)
* Types: [`SpecMatch`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/SpecMatch) · [`SymbolicDim`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/SymbolicDim) · [`ConcreteDim`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/ConcreteDim) · [`DimRef`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/schema/type-aliases/DimRef)
