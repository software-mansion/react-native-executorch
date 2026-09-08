# Function: createSdxsTextToImage()

> **createSdxsTextToImage**(`config`, `runtime?`): `Promise`\<[`SdxsTextToImage`](../type-aliases/SdxsTextToImage.md)\>

Defined in: [extensions/cv/tasks/sdxsTextToImage.ts:94](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/sdxsTextToImage.ts#L94)

Creates an SDXS text-to-image runner.

It validates the exported method schemas, pre-allocates the static execution
tensors, and registers disposal hooks that release all native memory.

## Parameters

### config

[`SdxsTextToImageModel`](../type-aliases/SdxsTextToImageModel.md)

SDXS pipeline configuration containing the model and tokenizer paths.
See [SdxsTextToImageModel](../type-aliases/SdxsTextToImageModel.md).

### runtime?

`WorkletRuntime`

Optional worklet runtime thread on which to run generation.

## Returns

`Promise`\<[`SdxsTextToImage`](../type-aliases/SdxsTextToImage.md)\>

A promise resolving to the instantiated [SdxsTextToImage](../type-aliases/SdxsTextToImage.md) runner.

## Throws

With code `LOAD_FAILED` if model or tokenizer
fails to load, or `SCHEMA_MISMATCH` if model schema does not match SDXS spec.
