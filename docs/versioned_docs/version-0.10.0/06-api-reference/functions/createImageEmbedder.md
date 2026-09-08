# Function: createImageEmbedder()

> **createImageEmbedder**(`config`, `runtime?`): `Promise`\<[`ImageEmbedder`](../type-aliases/ImageEmbedder.md)\>

Defined in: [extensions/cv/tasks/imageEmbedding.ts:75](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/imageEmbedding.ts#L75)

Creates an image embedder for executing local Image Embedding
models (e.g. the image encoder of a CLIP model).

It validates the model input and output requirements, pre-allocates the
static execution tensors, sets up an image preprocessor, and registers clean
disposal hooks to clear all native memory. Pooling and normalization (if any)
are baked into the exported `.pte`; this runner simply preprocesses the image,
runs the forward pass, and returns the raw embedding vector.

## Parameters

### config

[`ImageEmbedderModel`](../type-aliases/ImageEmbedderModel.md)

Image embedder task configuration containing path and options.
See [ImageEmbedderModel](../type-aliases/ImageEmbedderModel.md).

### runtime?

`WorkletRuntime`

Optional worklet runtime thread on which to run the model
execution.

## Returns

`Promise`\<[`ImageEmbedder`](../type-aliases/ImageEmbedder.md)\>

A promise resolving to the instantiated [ImageEmbedder](../type-aliases/ImageEmbedder.md) runner.

## Throws

With code `LOAD_FAILED` if model fails to load,
or `SCHEMA_MISMATCH` if model schema does not match embedding spec.
