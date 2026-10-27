# Type Alias: ColbertEmbedder

> **ColbertEmbedder** = `object`

Defined in: [extensions/nlp/tasks/colbertEmbedding.ts:100](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts#L100)

ColBERT embedding task runner.

## Properties

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/nlp/tasks/colbertEmbedding.ts:104](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts#L104)

Releases all allocated native resources.

#### Returns

`void`

---

### embed()

> `readonly` **embed**: (`input`, `kind`) => `Promise`\<[`ColbertTokenEmbeddings`](ColbertTokenEmbeddings.md)\>

Defined in: [extensions/nlp/tasks/colbertEmbedding.ts:120](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts#L120)

Asynchronously computes the per-token embeddings of the given text.

A query yields exactly [ColbertEmbedderOptions.queryLength](ColbertEmbedderOptions.md#querylength) vectors.
A document yields one vector per token, minus the skiplisted ones, and is
truncated to the model's maximum sequence length. Score a query against a
document with [ColbertEmbedder.maxSim](#maxsim).

#### Parameters

##### input

`string`

The text to embed.

##### kind

[`ColbertInputKind`](ColbertInputKind.md)

Whether `input` is a search query or a document to search.

#### Returns

`Promise`\<[`ColbertTokenEmbeddings`](ColbertTokenEmbeddings.md)\>

A promise resolving to the token embeddings.

#### Throws

With code `INVALID_ARGUMENT` if the text
tokenizes to zero tokens or `kind` is unknown, `RESOURCE_BUSY` if the model
is in use, or `RESOURCE_DISPOSED` if disposed.

---

### embedWorklet()

> `readonly` **embedWorklet**: (`input`, `kind`) => [`ColbertTokenEmbeddings`](ColbertTokenEmbeddings.md)

Defined in: [extensions/nlp/tasks/colbertEmbedding.ts:126](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts#L126)

Synchronous version of [embed](#embed) to be executed directly on the
caller or worklet thread.

#### Parameters

##### input

`string`

##### kind

[`ColbertInputKind`](ColbertInputKind.md)

#### Returns

[`ColbertTokenEmbeddings`](ColbertTokenEmbeddings.md)

---

### maxSim()

> `readonly` **maxSim**: (`query`, `document`) => `number`

Defined in: [extensions/nlp/tasks/colbertEmbedding.ts:141](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts#L141)

Computes the late-interaction (MaxSim) relevance of a document to a query:
for every query vector, the highest dot product with any document vector,
summed over the query. With L2-normalized vectors each term is a cosine
similarity, so the score lies in `[-numTokens, numTokens]` of the query.
It does not run the model, so it also works on stored embeddings.

#### Parameters

##### query

[`ColbertTokenEmbeddings`](ColbertTokenEmbeddings.md)

The query token embeddings.

##### document

[`ColbertTokenEmbeddings`](ColbertTokenEmbeddings.md)

The document token embeddings.

#### Returns

`number`

The MaxSim score; higher is more relevant. A document with no
vectors scores 0.

#### Throws

With code `INVALID_ARGUMENT` if the two
embeddings have different vector dimensions.
