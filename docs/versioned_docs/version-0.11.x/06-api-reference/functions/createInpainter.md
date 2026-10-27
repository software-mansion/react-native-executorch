# Function: createInpainter()

> **createInpainter**(`config`, `runtime?`): `Promise`\<[`Inpainter`](../type-aliases/Inpainter.md)\>

Defined in: [extensions/cv/tasks/inpainting.ts:126](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/inpainting.ts#L126)

Creates an image inpainting runner for executing local inpainting models.

It validates the model inputs and outputs requirements, pre-allocates the
necessary static execution tensors, and registers clean disposal hooks to
clear all native memory. The model is expected to take an RGB image in
`[0, 1]` and a mask with `1` for known pixels and `0` for the hole, and to
return the filled RGB image in `[0, 1]`, all at a fixed resolution.

## Parameters

### config

[`InpainterModel`](../type-aliases/InpainterModel.md)

Inpainting task configuration containing path and options.
See [InpainterModel](../type-aliases/InpainterModel.md).

### runtime?

`WorkletRuntime`

Optional worklet runtime thread on which to run the model execution.

## Returns

`Promise`\<[`Inpainter`](../type-aliases/Inpainter.md)\>

A promise resolving to the instantiated [Inpainter](../type-aliases/Inpainter.md) runner.

## Throws

With code `LOAD_FAILED` if model fails to load,
or `SCHEMA_MISMATCH` if model schema does not match the inpainting spec.
