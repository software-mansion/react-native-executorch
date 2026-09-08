# Type Alias: Model

> **Model** = `object`

Defined in: [core/model.ts:38](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/model.ts#L38)

A compiled, ready-to-run ExecuTorch model loaded into native memory.

A `Model` exposes the raw ExecuTorch execution interface. It is intentionally
low-level and domain-agnostic; higher-level task pipelines build on top of
this interface.

Obtain a `Model` instance via the [loadModel](../functions/loadModel.md) function. When the model
is no longer needed, call [Model.dispose](#dispose) to release native memory.

## Properties

### backends

> `readonly` **backends**: `Record`\<`string`, readonly `string`[]\>

Defined in: [core/model.ts:44](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/model.ts#L44)

ExecuTorch backends used by a given method.

---

### path

> `readonly` **path**: `string`

Defined in: [core/model.ts:40](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/model.ts#L40)

The local filesystem path of the `.pte` model file.

---

### schema

> `readonly` **schema**: [`ModelSpec`](../react-native-executorch/namespaces/schema/type-aliases/ModelSpec.md)\<[`ConcreteDim`](../react-native-executorch/namespaces/schema/type-aliases/ConcreteDim.md)\>

Defined in: [core/model.ts:42](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/model.ts#L42)

The exported schema of this model.

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [core/model.ts:70](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/model.ts#L70)

Releases the native ExecuTorch model and frees all associated resources.

After calling `dispose`, this model instance must not be used again.

#### Returns

`void`

---

### execute()

> **execute**(`methodName`, `inputs`, `outputTensors`): [`ModelOutput`](ModelOutput.md)[]

Defined in: [core/model.ts:63](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/model.ts#L63)

Executes a named model method synchronously.

Inputs are provided in the same order as the method's input slots. Output
tensors must be pre-allocated and passed in `outputTensors`; the runtime
writes results into them in-place and also returns them as the function
result.

#### Parameters

##### methodName

`string`

The exported method to run (e.g. `'forward'`).

##### inputs

[`ModelInput`](ModelInput.md)[]

The list of input values to pass to the method, in order.

##### outputTensors

[`Tensor`](Tensor.md)[]

Pre-allocated tensors for the method to write outputs
into, in order.

#### Returns

[`ModelOutput`](ModelOutput.md)[]

#### Throws

Thrown with code `EXECUTION_FAILED` if
inference fails, `SCHEMA_MISMATCH` if runtime constraints fail,
`RESOURCE_BUSY` if the model or a tensor is in use, `RESOURCE_DISPOSED` if
disposed, or `INVALID_ARGUMENT` if inputs or output placeholders are
invalid.
