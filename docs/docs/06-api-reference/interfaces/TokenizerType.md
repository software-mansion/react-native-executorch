# Interface: TokenizerType

Defined in: [types/tokenizer.ts:26](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tokenizer.ts#L26)

React hook state and methods for managing a Tokenizer instance.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/tokenizer.ts:45](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tokenizer.ts#L45)

Tracks the progress of the tokenizer download process (value between 0 and 1).

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/tokenizer.ts:30](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tokenizer.ts#L30)

Contains the error message if the tokenizer failed to load or during processing.

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/tokenizer.ts:40](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tokenizer.ts#L40)

Indicates whether the tokenizer is currently processing data.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/tokenizer.ts:35](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tokenizer.ts#L35)

Indicates whether the tokenizer has successfully loaded and is ready for use.

## Methods

### decode()

> **decode**(`tokens`, `skipSpecialTokens`): `Promise`\<`string`\>

Defined in: [types/tokenizer.ts:53](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tokenizer.ts#L53)

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

---

### encode()

> **encode**(`text`): `Promise`\<`number`[]\>

Defined in: [types/tokenizer.ts:63](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tokenizer.ts#L63)

Converts a string into an array of token IDs.

#### Parameters

##### text

`string`

The input text string to tokenize.

#### Returns

`Promise`\<`number`[]\>

A promise resolving to an array `number[]` containing the encoded token IDs.

---

### getVocabSize()

> **getVocabSize**(): `Promise`\<`number`\>

Defined in: [types/tokenizer.ts:69](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tokenizer.ts#L69)

Returns the size of the tokenizer's vocabulary.

#### Returns

`Promise`\<`number`\>

A promise resolving to the vocabulary size.

---

### idToToken()

> **idToToken**(`id`): `Promise`\<`string`\>

Defined in: [types/tokenizer.ts:76](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tokenizer.ts#L76)

Returns the token associated to the ID.

#### Parameters

##### id

`number`

The numeric token ID.

#### Returns

`Promise`\<`string`\>

A promise resolving to the token string representation.

---

### tokenToId()

> **tokenToId**(`token`): `Promise`\<`number`\>

Defined in: [types/tokenizer.ts:83](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tokenizer.ts#L83)

Returns the ID associated to the token.

#### Parameters

##### token

`string`

The token string.

#### Returns

`Promise`\<`number`\>

A promise resolving to the token ID.
