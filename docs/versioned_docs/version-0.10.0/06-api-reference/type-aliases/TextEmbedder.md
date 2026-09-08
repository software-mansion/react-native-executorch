# Type Alias: TextEmbedder

> **TextEmbedder** = `object`

Defined in: [extensions/nlp/tasks/textEmbedding.ts:40](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/textEmbedding.ts#L40)

Text embedding task runner.

## Properties

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/nlp/tasks/textEmbedding.ts:44](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/textEmbedding.ts#L44)

Releases all allocated native resources.

#### Returns

`void`

---

### embed()

> `readonly` **embed**: (`input`, `prompt?`) => `Promise`\<`Float32Array`\>

Defined in: [extensions/nlp/tasks/textEmbedding.ts:57](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/textEmbedding.ts#L57)

Asynchronously computes the embedding vector for the given input text.
Inputs longer than the model's maximum sequence length are truncated.

#### Parameters

##### input

`string`

The input text to embed.

##### prompt?

`string`

Optional prompt prefix overriding the model's configured
[TextEmbedderModel.defaultPrompt](TextEmbedderModel.md#defaultprompt) for this call.

#### Returns

`Promise`\<`Float32Array`\>

A promise resolving to the embedding vector.

#### Throws

With code `INVALID_ARGUMENT` if the input text
tokenizes to zero tokens, `RESOURCE_BUSY` if the model is in use, or
`RESOURCE_DISPOSED` if disposed.

---

### embedWorklet()

> `readonly` **embedWorklet**: (`input`, `prompt?`) => `Float32Array`

Defined in: [extensions/nlp/tasks/textEmbedding.ts:63](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/textEmbedding.ts#L63)

Synchronous version of [embed](#embed) to be executed directly on the
caller or worklet thread.

#### Parameters

##### input

`string`

##### prompt?

`string`

#### Returns

`Float32Array`
