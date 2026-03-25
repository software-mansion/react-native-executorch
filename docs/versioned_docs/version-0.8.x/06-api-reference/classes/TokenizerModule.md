# Class: TokenizerModule

Defined in: [modules/natural\_language\_processing/TokenizerModule.ts:11](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L11)

Module for Tokenizer functionalities.

## Constructors

### Constructor

> **new TokenizerModule**(): `TokenizerModule`

#### Returns

`TokenizerModule`

## Properties

### nativeModule

> **nativeModule**: `any`

Defined in: [modules/natural\_language\_processing/TokenizerModule.ts:15](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L15)

Native module instance

## Methods

### decode()

> **decode**(`tokens`, `skipSpecialTokens?`): `Promise`\<`string`\>

Defined in: [modules/natural\_language\_processing/TokenizerModule.ts:61](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L61)

Converts an array of token IDs into a string.

#### Parameters

##### tokens

`number`[]

Array of token IDs to be decoded.

##### skipSpecialTokens?

`boolean` = `true`

Whether to skip special tokens during decoding (default: true).

#### Returns

`Promise`\<`string`\>

The decoded string.

***

### encode()

> **encode**(`input`): `Promise`\<`number`[]\>

Defined in: [modules/natural\_language\_processing/TokenizerModule.ts:51](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L51)

Converts a string into an array of token IDs.

#### Parameters

##### input

`string`

The input string to be tokenized.

#### Returns

`Promise`\<`number`[]\>

An array of token IDs.

***

### getVocabSize()

> **getVocabSize**(): `Promise`\<`number`\>

Defined in: [modules/natural\_language\_processing/TokenizerModule.ts:75](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L75)

Returns the size of the tokenizer's vocabulary.

#### Returns

`Promise`\<`number`\>

The vocabulary size.

***

### idToToken()

> **idToToken**(`tokenId`): `Promise`\<`string`\>

Defined in: [modules/natural\_language\_processing/TokenizerModule.ts:84](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L84)

Returns the token associated to the ID.

#### Parameters

##### tokenId

`number`

ID of the token.

#### Returns

`Promise`\<`string`\>

The token string associated to ID.

***

### load()

> **load**(`tokenizer`, `onDownloadProgressCallback?`): `Promise`\<`void`\>

Defined in: [modules/natural\_language\_processing/TokenizerModule.ts:23](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L23)

Loads the tokenizer from the specified source.
`tokenizerSource` is a string that points to the location of the tokenizer JSON file.

#### Parameters

##### tokenizer

Object containing `tokenizerSource`.

###### tokenizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### onDownloadProgressCallback?

(`progress`) => `void`

Optional callback to monitor download progress.

#### Returns

`Promise`\<`void`\>

***

### tokenToId()

> **tokenToId**(`token`): `Promise`\<`number`\>

Defined in: [modules/natural\_language\_processing/TokenizerModule.ts:93](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L93)

Returns the ID associated to the token.

#### Parameters

##### token

`string`

The token string.

#### Returns

`Promise`\<`number`\>

The ID associated to the token.
