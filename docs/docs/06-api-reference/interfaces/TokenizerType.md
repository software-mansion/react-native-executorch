# Interface: TokenizerType

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:8](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/tokenizer.ts#L8)

React hook state and methods for managing a Tokenizer instance.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:27](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/tokenizer.ts#L27)

Tracks the progress of the tokenizer download process (value between 0 and 1).

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:12](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/tokenizer.ts#L12)

Contains the error message if the tokenizer failed to load or during processing.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:22](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/tokenizer.ts#L22)

Indicates whether the tokenizer is currently processing data.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:17](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/tokenizer.ts#L17)

Indicates whether the tokenizer has successfully loaded and is ready for use.

## Methods

### decode()

> **decode**(`tokens`, `skipSpecialTokens`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:35](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/tokenizer.ts#L35)

Converts an array of token IDs into a string.

#### Parameters

##### tokens

`number`[]

An array or `number[]` of token IDs to decode.

##### skipSpecialTokens

Optional boolean to indicate whether special tokens should be skipped during decoding.

`boolean` | `undefined`

#### Returns

`Promise`\<`string`\>

A promise resolving to the decoded text string.

***

### encode()

> **encode**(`text`): `Promise`\<`number`[]\>

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:42](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/tokenizer.ts#L42)

Converts a string into an array of token IDs.

#### Parameters

##### text

`string`

The input text string to tokenize.

#### Returns

`Promise`\<`number`[]\>

A promise resolving to an array `number[]` containing the encoded token IDs.

***

### getVocabSize()

> **getVocabSize**(): `Promise`\<`number`\>

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:48](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/tokenizer.ts#L48)

Returns the size of the tokenizer's vocabulary.

#### Returns

`Promise`\<`number`\>

A promise resolving to the vocabulary size.

***

### idToToken()

> **idToToken**(`id`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:55](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/tokenizer.ts#L55)

Returns the token associated to the ID.

#### Parameters

##### id

`number`

The numeric token ID.

#### Returns

`Promise`\<`string`\>

A promise resolving to the token string representation.

***

### tokenToId()

> **tokenToId**(`token`): `Promise`\<`number`\>

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:62](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/tokenizer.ts#L62)

Returns the ID associated to the token.

#### Parameters

##### token

`string`

The token string.

#### Returns

`Promise`\<`number`\>

A promise resolving to the token ID.
