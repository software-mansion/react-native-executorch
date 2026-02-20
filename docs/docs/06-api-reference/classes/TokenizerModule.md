# Class: TokenizerModule

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts:12](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L12)

Module for Tokenizer functionalities.

## Constructors

### Constructor

> **new TokenizerModule**(): `TokenizerModule`

#### Returns

`TokenizerModule`

## Properties

### nativeModule

> **nativeModule**: `any`

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts:16](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L16)

Native module instance

## Methods

### decode()

> **decode**(`tokens`, `skipSpecialTokens`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts:65](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L65)

Converts an array of token IDs into a string.

#### Parameters

##### tokens

`number`[]

Array of token IDs to be decoded.

##### skipSpecialTokens

`boolean` = `true`

Whether to skip special tokens during decoding (default: true).

#### Returns

`Promise`\<`string`\>

The decoded string.

---

### encode()

> **encode**(`input`): `Promise`\<`number`[]\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts:54](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L54)

Converts a string into an array of token IDs.

#### Parameters

##### input

`string`

The input string to be tokenized.

#### Returns

`Promise`\<`number`[]\>

An array of token IDs.

---

### getVocabSize()

> **getVocabSize**(): `Promise`\<`number`\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts:80](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L80)

Returns the size of the tokenizer's vocabulary.

#### Returns

`Promise`\<`number`\>

The vocabulary size.

---

### idToToken()

> **idToToken**(`tokenId`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts:90](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L90)

Returns the token associated to the ID.

#### Parameters

##### tokenId

`number`

ID of the token.

#### Returns

`Promise`\<`string`\>

The token string associated to ID.

---

### load()

> **load**(`tokenizer`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts:25](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L25)

Loads the tokenizer from the specified source.
`tokenizerSource` is a string that points to the location of the tokenizer JSON file.

#### Parameters

##### tokenizer

Object containing `tokenizerSource`.

###### tokenizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### onDownloadProgressCallback

(`progress`) => `void`

Optional callback to monitor download progress.

#### Returns

`Promise`\<`void`\>

---

### tokenToId()

> **tokenToId**(`token`): `Promise`\<`number`\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts:100](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L100)

Returns the ID associated to the token.

#### Parameters

##### token

`string`

The token string.

#### Returns

`Promise`\<`number`\>

The ID associated to the token.
