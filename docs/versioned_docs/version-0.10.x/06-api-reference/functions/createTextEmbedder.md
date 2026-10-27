# Function: createTextEmbedder()

> **createTextEmbedder**(`config`, `runtime?`): `Promise`\<[`TextEmbedder`](../type-aliases/TextEmbedder.md)\>

Defined in: [extensions/nlp/tasks/textEmbedding.ts:87](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/textEmbedding.ts#L87)

Creates a text embedder for executing local Text Embedding models
(e.g. sentence-transformers like all-MiniLM-L6-v2).

It loads the tokenizer and model, validates the model input and output
requirements, pre-allocates the static execution tensors, and registers clean
disposal hooks to clear all native memory. The input text is tokenized and fed
at its exact token length (no padding), truncated only when it exceeds the
model's maximum sequence length; the attention mask is all ones. Pooling and
normalization are baked into the exported `.pte`; this runner runs the forward
pass and returns the raw embedding vector.

## Parameters

### config

[`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md)

Text embedder task configuration containing the model and
tokenizer paths. See [TextEmbedderModel](../type-aliases/TextEmbedderModel.md).

### runtime?

`WorkletRuntime`

Optional worklet runtime thread on which to run the model
execution.

## Returns

`Promise`\<[`TextEmbedder`](../type-aliases/TextEmbedder.md)\>

A promise resolving to the instantiated [TextEmbedder](../type-aliases/TextEmbedder.md) runner.

## Throws

With code `LOAD_FAILED` if the model or tokenizer
fails to load, or `SCHEMA_MISMATCH` if the model schema does not match the
text embedding specification.
