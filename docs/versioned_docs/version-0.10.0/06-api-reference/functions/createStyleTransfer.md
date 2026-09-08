# Function: createStyleTransfer()

> **createStyleTransfer**(`config`, `runtime?`): `Promise`\<[`StyleTransfer`](../type-aliases/StyleTransfer.md)\>

Defined in: [extensions/cv/tasks/styleTransfer.ts:93](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/styleTransfer.ts#L93)

Creates an image style transfer runner for executing local style transfer models.

It validates the model inputs and outputs requirements, pre-allocates
the necessary static execution tensors, sets up an image preprocessor, and
registers clean disposal hooks to clear all native memory.

## Parameters

### config

[`StyleTransferModel`](../type-aliases/StyleTransferModel.md)

Style transfer task configuration containing path and options.
See [StyleTransferModel](../type-aliases/StyleTransferModel.md).

### runtime?

`WorkletRuntime`

Optional worklet runtime thread on which to run the model execution.

## Returns

`Promise`\<[`StyleTransfer`](../type-aliases/StyleTransfer.md)\>

A promise resolving to the instantiated [StyleTransfer](../type-aliases/StyleTransfer.md) runner.

## Throws

With code `LOAD_FAILED` if model fails to load,
or `SCHEMA_MISMATCH` if model schema does not match style transfer spec.
