# Function: createSemanticSegmenter()

> **createSemanticSegmenter**\<`L`\>(`config`, `runtime?`): `Promise`\<[`SemanticSegmenter`](../type-aliases/SemanticSegmenter.md)\<`L`\>\>

Defined in: [extensions/cv/tasks/semanticSegmentation.ts:149](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/semanticSegmentation.ts#L149)

Creates a semantic segmenter runner for executing local Semantic Segmentation
models.

It validates the model inputs and outputs, asserts that the labels array
length matches the model's output vocabulary size, pre-allocates the
necessary static execution tensors, sets up an image preprocessor, and
registers clean disposal hooks to clear all native memory.

## Type Parameters

### L

`L` _extends_ `PropertyKey` = `string`

The type representing the segmentation labels.

## Parameters

### config

[`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`L`\>

Segmenter task configuration containing path and options.
See [SemanticSegmenterModel](../type-aliases/SemanticSegmenterModel.md).

### runtime?

`WorkletRuntime`

Optional worklet runtime thread environment context.

## Returns

`Promise`\<[`SemanticSegmenter`](../type-aliases/SemanticSegmenter.md)\<`L`\>\>

A promise resolving to the instantiated [SemanticSegmenter](../type-aliases/SemanticSegmenter.md) runner.

## Throws

With code `LOAD_FAILED` if model fails to load,
`SCHEMA_MISMATCH` if model schema does not match segmentation spec, or
`INVALID_ARGUMENT` if labels length does not match model output classes.
