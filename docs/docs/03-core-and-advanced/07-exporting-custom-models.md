---
title: Exporting Custom Models
slug: /core-and-advanced/exporting-custom-models
description: 'Bring your own .pte model and make it fit a pipeline — inspecting schemas, matching the contract, and declaring dynamic shapes with get_model_schema.'
keywords:
  [
    react native executorch,
    custom model,
    pte export,
    get_model_schema,
    inspectModel,
    model schema,
    executorch export,
  ]
---

# Exporting Custom Models

React Native ExecuTorch runs any ExecuTorch `.pte` file, not just the models in
our [HuggingFace collection](https://huggingface.co/software-mansion/collections).
Getting your own model running takes two things:

1. **Export it to `.pte`** with a hardware backend — the standard ExecuTorch
   workflow.
2. **Integrate it** — either feed it into a built-in pipeline by matching that
   pipeline's contract, or build your own pipeline around it, where you define the
   contract. Both come down to the model's schema.

The export step is plain ExecuTorch and is documented thoroughly upstream, so this
page links out for it and focuses on the second part — integrating a custom model,
into a built-in pipeline or one you build yourself — which is where the
library-specific work lives.

## Exporting to `.pte`

Producing the `.pte` is the standard PyTorch → ExecuTorch path: `torch.export`,
then lowering to a backend (XNNPACK, Core ML, Vulkan, …) with
`to_edge_transform_and_lower`. It is not specific to this library, so follow the
official [ExecuTorch documentation](https://pytorch.org/executorch/main/) for the
details, including which backend to target for your model and platform.

What matters here is the **contract** the resulting `.pte` exposes: the input and
output shapes, data types, and any dynamic dimensions or dimension relationships.
That contract is what a pipeline validates against.

## Inspect what your model exports

Whichever way you integrate the model, start by seeing what it actually exports.
[`inspectModel`](../06-api-reference/functions/inspectModel.md) loads a `.pte`
(from a URL or local path) and returns its
[schema](./03-schema-validation.md) and backends without wiring up a whole
pipeline:

```typescript
import { inspectModel } from 'react-native-executorch';

const { schema, backends } = await inspectModel('https://.../my-model.pte');
console.log(schema); // per-method inputs/outputs: shapes, data types, constraints
console.log(backends); // e.g. { forward: ['XnnpackBackend'] }
```

## Using a built-in pipeline

Every built-in pipeline accepts any model whose schema satisfies its contract —
that is what [Schema Validation](./03-schema-validation.md) checks at load time. To
fit one, learn its contract and reconcile it with your model's schema. Three
practical ways to learn the contract:

- **Read the mismatch.** Point the pipeline at your model; if it doesn't fit,
  [`validateSpec`](./03-schema-validation.md) throws
  [`SCHEMA_MISMATCH`](./05-error-handling.md#error-codes-reference) with a per-variant
  explanation of exactly which shape, dtype, or dimension didn't line up. The
  error message _is_ the spec.
- **Inspect a reference model.** Run
  [`inspectModel`](../06-api-reference/functions/inspectModel.md) on the
  pre-exported model that pipeline uses from our HuggingFace collection. Whatever
  shapes it exports are, by definition, shapes the pipeline accepts — match them.
- **Read the pipeline source.** Each pipeline's allowed spec is a few lines of
  [`validateSpec`](../06-api-reference/react-native-executorch/namespaces/schema/functions/validateSpec.md)
  in its task file, readable in TypeScript.

Then line the two up: the data type and rank must match, each dimension must fall
in the allowed
[domain](./03-schema-validation.md#dimension-domains), and any
[runtime constraints](./03-schema-validation.md#runtime-constraints) must be
declared. A fully static model just needs matching constants; a model with
variable dimensions needs the companion schema below.

## Building a custom pipeline

If no built-in pipeline fits your model, build your own on the primitives, where you
define the contract. Load the model, declare the schema you expect with
[`validateSpec`](./03-schema-validation.md) (this documents the contract and guards
against loading the wrong or a changed `.pte`), read the bound dimensions back to
size your tensors, and wire preprocessing, execution, and postprocessing yourself:

```typescript
import { loadModel, wrapAsync, schema } from 'react-native-executorch';

const { validateSpec, method, f32 } = schema;

const model = await wrapAsync(loadModel)('/path/to/model.pte');

// Declare and assert the contract this pipeline needs, then size tensors from it
const { dims } = validateSpec(model.schema, {
  default: method('forward', [f32(1, 3, 'H', 'W')], [f32(1, 'N')]),
});
const [N, H, W] = dims.constant('N', 'H', 'W');
// ...allocate tensors of these shapes, then build the classify/execute closure
```

Wrap that construction in a
[resource scope](./02-models-and-tensors.md#failure-safe-construction-with-a-resource-scope)
so a failure part-way through — a `validateSpec` mismatch, say — releases the model
already loaded instead of leaking it.

From here the rest of the section covers each piece:
[Models & Tensors](./02-models-and-tensors.md) for execution and tensor lifetime,
[Operations & Utilities](./04-operations-and-utilities.md) for the preprocessing
and postprocessing ops, [Schema Validation](./03-schema-validation.md) for the
contract DSL, and [Worklets & Threading](./06-worklets-and-threading.md) for
running it off the JS thread.

## Declaring dynamic shapes with `get_model_schema`

When a `.pte` carries only static metadata, every dimension is read as a fixed
constant. That is enough for fixed-shape models, but a model with a variable
dimension (a sequence length, a dynamic batch) or a relationship between
dimensions needs to say so explicitly — otherwise validation sees only the static
upper bounds and rejects the model.

The mechanism is a companion method named `get_model_schema` that returns the
model's schema as a JSON string. The native loader calls it at load time and
overlays the precise [`range`](../06-api-reference/react-native-executorch/namespaces/schema/functions/RangeDim.md),
[`enum`](../06-api-reference/react-native-executorch/namespaces/schema/functions/EnumDim.md),
and constraint information onto the base metadata. See
[Where the exported spec comes from](./03-schema-validation.md#where-the-exported-spec-comes-from)
for how it's consumed.

You embed it during export by passing it as a constant method:

```python
to_edge_transform_and_lower(
    exported_program,
    # ...
    constant_methods={"get_model_schema": schema_json},
)
```

`schema_json` is a JSON encoding of the model's schema — a map from method name to
its inputs, outputs, and runtime constraints, with each dimension given a concrete
domain. For a text model with a dynamic sequence length `L` from 1 to 512:

```json
{
  "forward": {
    "inputs": [
      {
        "kind": "Tensor",
        "dtype": "int64",
        "shape": [
          { "kind": "constant", "value": 1 },
          { "kind": "range", "range": { "min": 1, "max": 512, "step": 1 } }
        ]
      }
    ],
    "outputs": [
      {
        "kind": "Tensor",
        "dtype": "float32",
        "shape": [
          { "kind": "constant", "value": 1 },
          { "kind": "constant", "value": 768 }
        ]
      }
    ],
    "runtimeConstraints": []
  }
}
```

### Validate against the schema

The payload is a
[`ModelSpec`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/ModelSpec.md)
over [`ConcreteDim`](../06-api-reference/react-native-executorch/namespaces/schema/type-aliases/ConcreteDim.md)
dimensions — the same structure the native loader parses. Its format is the JSON
Schema below: validate your generated JSON against it in your export pipeline so a
malformed contract is caught at export time instead of on device, and register it
in your editor for autocompletion and inline validation while authoring the JSON.

<details>
<summary>View the JSON Schema</summary>

```json title="model.schema.json"
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ModelSpec<ConcreteDim>",
  "description": "Schema definition for ExecuTorch ModelSpec<ConcreteDim> describing exported model methods, parameters, dimension domains, and runtime constraints.",
  "type": "object",
  "additionalProperties": { "$ref": "#/definitions/MethodSpec" },
  "definitions": {
    "MethodSpec": {
      "type": "object",
      "properties": {
        "inputs": { "type": "array", "items": { "$ref": "#/definitions/ParamSpec" } },
        "outputs": { "type": "array", "items": { "$ref": "#/definitions/ParamSpec" } },
        "runtimeConstraints": {
          "type": "array",
          "items": { "$ref": "#/definitions/RuntimeConstraint" }
        }
      },
      "required": ["inputs", "outputs", "runtimeConstraints"],
      "additionalProperties": false
    },
    "ParamSpec": {
      "oneOf": [
        { "$ref": "#/definitions/TensorParamSpec" },
        { "$ref": "#/definitions/PrimitiveParamSpec" }
      ]
    },
    "TensorParamSpec": {
      "type": "object",
      "properties": {
        "kind": { "const": "Tensor" },
        "dtype": { "$ref": "#/definitions/DType" },
        "shape": { "type": "array", "items": { "$ref": "#/definitions/ConcreteDim" } }
      },
      "required": ["kind", "dtype", "shape"],
      "additionalProperties": false
    },
    "PrimitiveParamSpec": {
      "type": "object",
      "properties": {
        "kind": {
          "enum": [
            "None",
            "Int",
            "Double",
            "Bool",
            "String",
            "ListBool",
            "ListDouble",
            "ListInt",
            "ListTensor"
          ]
        }
      },
      "required": ["kind"],
      "additionalProperties": false
    },
    "DType": { "type": "string", "enum": ["float32", "uint8", "int32", "int64"] },
    "ConcreteDim": {
      "oneOf": [
        { "$ref": "#/definitions/ConstantDim" },
        { "$ref": "#/definitions/RangeDim" },
        { "$ref": "#/definitions/EnumDim" }
      ]
    },
    "ConstantDim": {
      "type": "object",
      "properties": {
        "kind": { "const": "constant" },
        "value": { "type": "integer", "minimum": 1 }
      },
      "required": ["kind", "value"],
      "additionalProperties": false
    },
    "RangeDim": {
      "type": "object",
      "properties": {
        "kind": { "const": "range" },
        "range": {
          "type": "object",
          "properties": {
            "min": { "type": "integer", "minimum": 1 },
            "max": { "type": "integer", "minimum": 1 },
            "step": { "type": "integer", "minimum": 1 }
          },
          "required": ["min", "max", "step"],
          "additionalProperties": false
        }
      },
      "required": ["kind", "range"],
      "additionalProperties": false
    },
    "EnumDim": {
      "type": "object",
      "properties": {
        "kind": { "const": "enum" },
        "choices": { "type": "array", "items": { "type": "integer", "minimum": 1 }, "minItems": 1 }
      },
      "required": ["kind", "choices"],
      "additionalProperties": false
    },
    "RuntimeConstraint": {
      "oneOf": [
        { "$ref": "#/definitions/EqualityConstraint" },
        { "$ref": "#/definitions/LinearConstraint" }
      ]
    },
    "EqualityConstraint": {
      "type": "object",
      "properties": {
        "kind": { "const": "equality" },
        "dims": { "type": "array", "items": { "$ref": "#/definitions/DimRef" }, "minItems": 2 }
      },
      "required": ["kind", "dims"],
      "additionalProperties": false
    },
    "LinearConstraint": {
      "type": "object",
      "properties": {
        "kind": { "const": "linear" },
        "dimLhs": { "$ref": "#/definitions/DimRef" },
        "dimRhs": { "$ref": "#/definitions/DimRef" },
        "coefficients": {
          "type": "array",
          "items": { "type": "integer" },
          "minItems": 2,
          "maxItems": 2
        }
      },
      "required": ["kind", "dimLhs", "dimRhs", "coefficients"],
      "additionalProperties": false
    },
    "DimRef": {
      "type": "object",
      "properties": {
        "paramSide": { "type": "string", "enum": ["input", "output"] },
        "tensorIdx": { "type": "integer", "minimum": 0 },
        "dimIdx": { "type": "integer", "minimum": 0 }
      },
      "required": ["paramSide", "tensorIdx", "dimIdx"],
      "additionalProperties": false
    }
  }
}
```

</details>

## Verify on device

Before wiring a custom model into a screen, confirm two things on the device:

- **The schema is what you expect** — run
  [`inspectModel`](../06-api-reference/functions/inspectModel.md) on the exported
  `.pte` and check the shapes, data types, and any dynamic dimensions resolved from your
  `get_model_schema`.
- **The backend is registered** —
  [`getRegisteredBackends`](../06-api-reference/functions/getRegisteredBackends.md)
  lists the backends compiled into the app. If the backend your model was lowered
  to is missing, execution fails with
  [`EXECUTION_FAILED`](./05-error-handling.md#error-codes-reference); enable it via the
  [native library configuration](./08-native-libraries.md).

Once both check out, load the model into the target pipeline and run it.

## Where to go next

- [Schema Validation](./03-schema-validation.md) — the contract a custom model must satisfy, in depth.
- [Native Libraries](./08-native-libraries.md) — enabling the hardware backend your model needs.
- [Models & Tensors](./02-models-and-tensors.md) — running a `.pte` directly, without a pipeline.

### API reference

- [`inspectModel()`](../06-api-reference/functions/inspectModel.md) · [`ModelInspection`](../06-api-reference/type-aliases/ModelInspection.md) · [`getRegisteredBackends()`](../06-api-reference/functions/getRegisteredBackends.md)
