# Function: createTokenizer()

> **createTokenizer**(`tokenizerPath`, `runtime?`): `Promise`\<\{ `decode`: (...`args`) => `Promise`\<`string`\>; `dispose`: () => `void`; `encode`: (...`args`) => `Promise`\<`Int32Array`\<`ArrayBufferLike`\>\>; `getVocabSize`: () => `number`; `idToToken`: (`id`) => `string`; `tokenToId`: (`token`) => `number`; \}\>

Defined in: [extensions/nlp/tasks/tokenization.ts:19](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/tokenization.ts#L19)

Loads a tokenizer and exposes its operations with lifetime management for the
`useTokenizer` hook.

## Parameters

### tokenizerPath

`string`

Absolute local path to a `tokenizer.json` file.

### runtime?

`WorkletRuntime`

Optional worklet runtime thread to run the tokenizer on.

## Returns

`Promise`\<\{ `decode`: (...`args`) => `Promise`\<`string`\>; `dispose`: () => `void`; `encode`: (...`args`) => `Promise`\<`Int32Array`\<`ArrayBufferLike`\>\>; `getVocabSize`: () => `number`; `idToToken`: (`id`) => `string`; `tokenToId`: (`token`) => `number`; \}\>

A promise resolving to the instantiated tokenizer operations
and disposal controls.
