# Class: TokenizerModule

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TokenizerModule.ts:6](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L6)

## Constructors

### Constructor

> **new TokenizerModule**(): `TokenizerModule`

#### Returns

`TokenizerModule`

## Properties

### nativeModule

> **nativeModule**: `any`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TokenizerModule.ts:10](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L10)

Native module instance

## Methods

### decode()

> **decode**(`tokens`, `skipSpecialTokens`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TokenizerModule.ts:54](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L54)

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

***

### encode()

> **encode**(`input`): `Promise`\<`number`[]\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TokenizerModule.ts:43](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L43)

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

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TokenizerModule.ts:66](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L66)

Returns the size of the tokenizer's vocabulary.

#### Returns

`Promise`\<`number`\>

The vocabulary size.

***

### idToToken()

> **idToToken**(`tokenId`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TokenizerModule.ts:76](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L76)

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

> **load**(`tokenizer`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TokenizerModule.ts:19](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L19)

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

***

### tokenToId()

> **tokenToId**(`token`): `Promise`\<`number`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TokenizerModule.ts:86](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L86)

Returns the ID associated to the token.

#### Parameters

##### token

`string`

The token string.

#### Returns

`Promise`\<`number`\>

The ID associated to the token.
