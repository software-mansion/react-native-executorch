# Function: createColbertEmbedder()

> **createColbertEmbedder**(`config`, `runtime?`): `Promise`\<[`ColbertEmbedder`](../type-aliases/ColbertEmbedder.md)\>

Defined in: [extensions/nlp/tasks/colbertEmbedding.ts:235](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts#L235)

Creates a ColBERT (late-interaction) embedder, which maps a text to one
vector per token rather than a single pooled vector. Relevance is then scored
with [ColbertEmbedder.maxSim](../type-aliases/ColbertEmbedder.md#maxsim) instead of a cosine.

Inputs are built the way [PyLate](https://github.com/lightonai/pylate)
builds them: `[BOS, prefix, ...tokens]`,
with queries padded to a fixed length by expansion tokens and documents fed
at their exact length. The per-token projection and L2 normalization are
baked into the exported `.pte`.

## Parameters

### config

[`ColbertEmbedderModel`](../type-aliases/ColbertEmbedderModel.md)

ColBERT embedder configuration containing the model and
tokenizer paths and the tokenization settings. See [ColbertEmbedderModel](../type-aliases/ColbertEmbedderModel.md).

### runtime?

`WorkletRuntime`

Optional worklet runtime thread on which to run the model
execution.

## Returns

`Promise`\<[`ColbertEmbedder`](../type-aliases/ColbertEmbedder.md)\>

A promise resolving to the instantiated [ColbertEmbedder](../type-aliases/ColbertEmbedder.md).

## Throws

With code `LOAD_FAILED` if the model or tokenizer
fails to load, `SCHEMA_MISMATCH` if the model schema does not match the
ColBERT specification, or `INVALID_ARGUMENT` if a configured token is not in
the vocabulary or `queryLength` does not fit the model.
