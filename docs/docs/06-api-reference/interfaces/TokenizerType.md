# Interface: TokenizerType

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:6](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/tokenizer.ts#L6)

React hook state and methods for managing a Tokenizer instance.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:25](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/tokenizer.ts#L25)

Tracks the progress of the tokenizer download process (value between 0 and 1).

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:10](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/tokenizer.ts#L10)

Contains the error message if the tokenizer failed to load or during processing.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:20](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/tokenizer.ts#L20)

Indicates whether the tokenizer is currently processing data.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:15](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/tokenizer.ts#L15)

Indicates whether the tokenizer has successfully loaded and is ready for use.

## Methods

### decode()

> **decode**(`tokens`, `skipSpecialTokens`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:32](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/tokenizer.ts#L32)

Converts an array of token IDs into a string.

#### Parameters

##### tokens

`number`[]

An array or `number[]` of token IDs to decode.

##### skipSpecialTokens

`boolean` | `undefined`

#### Returns

`Promise`\<`string`\>

A promise resolving to the decoded text string.

***

### encode()

> **encode**(`text`): `Promise`\<`number`[]\>

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:39](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/tokenizer.ts#L39)

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

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:45](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/tokenizer.ts#L45)

Returns the size of the tokenizer's vocabulary.

#### Returns

`Promise`\<`number`\>

A promise resolving to the vocabulary size.

***

### idToToken()

> **idToToken**(`id`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:52](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/tokenizer.ts#L52)

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

Defined in: [packages/react-native-executorch/src/types/tokenizer.ts:59](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/tokenizer.ts#L59)

Returns the ID associated to the token.

#### Parameters

##### token

`string`

The token string.

#### Returns

`Promise`\<`number`\>

A promise resolving to the token ID.
