# Class: TokenizerModule

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TokenizerModule.ts:6](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L6)

## Constructors

### Constructor

> **new TokenizerModule**(): `TokenizerModule`

#### Returns

`TokenizerModule`

## Properties

### nativeModule

> **nativeModule**: `any`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TokenizerModule.ts:7](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L7)

## Methods

### decode()

> **decode**(`tokens`, `skipSpecialTokens`): `Promise`\<`any`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TokenizerModule.ts:31](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L31)

#### Parameters

##### tokens

`number`[]

##### skipSpecialTokens

`boolean` = `true`

#### Returns

`Promise`\<`any`\>

***

### encode()

> **encode**(`s`): `Promise`\<`any`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TokenizerModule.ts:27](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L27)

#### Parameters

##### s

`string`

#### Returns

`Promise`\<`any`\>

***

### getVocabSize()

> **getVocabSize**(): `Promise`\<`number`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TokenizerModule.ts:38](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L38)

#### Returns

`Promise`\<`number`\>

***

### idToToken()

> **idToToken**(`tokenId`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TokenizerModule.ts:42](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L42)

#### Parameters

##### tokenId

`number`

#### Returns

`Promise`\<`string`\>

***

### load()

> **load**(`tokenizer`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TokenizerModule.ts:9](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L9)

#### Parameters

##### tokenizer

###### tokenizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### onDownloadProgressCallback

(`progress`) => `void`

#### Returns

`Promise`\<`void`\>

***

### tokenToId()

> **tokenToId**(`token`): `Promise`\<`number`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TokenizerModule.ts:46](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/natural_language_processing/TokenizerModule.ts#L46)

#### Parameters

##### token

`string`

#### Returns

`Promise`\<`number`\>
