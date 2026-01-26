# Class: VerticalOCRModule

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/VerticalOCRModule.ts:5](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L5)

## Constructors

### Constructor

> **new VerticalOCRModule**(): `VerticalOCRModule`

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/VerticalOCRModule.ts:8](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L8)

#### Returns

`VerticalOCRModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/VerticalOCRModule.ts:34](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L34)

#### Returns

`void`

***

### forward()

> **forward**(`imageSource`): `Promise`\<`any`\>

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/VerticalOCRModule.ts:30](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L30)

#### Parameters

##### imageSource

`string`

#### Returns

`Promise`\<`any`\>

***

### load()

> **load**(`model`, `independentCharacters`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/VerticalOCRModule.ts:12](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L12)

#### Parameters

##### model

###### detectorSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

###### language

`"abq"` \| `"ady"` \| `"af"` \| `"ava"` \| `"az"` \| `"be"` \| `"bg"` \| `"bs"` \| `"chSim"` \| `"che"` \| `"cs"` \| `"cy"` \| `"da"` \| `"dar"` \| `"de"` \| `"en"` \| `"es"` \| `"et"` \| `"fr"` \| `"ga"` \| `"hr"` \| `"hu"` \| `"id"` \| `"inh"` \| `"ic"` \| `"it"` \| `"ja"` \| `"kbd"` \| `"kn"` \| `"ko"` \| `"ku"` \| `"la"` \| `"lbe"` \| `"lez"` \| `"lt"` \| `"lv"` \| `"mi"` \| `"mn"` \| `"ms"` \| `"mt"` \| `"nl"` \| `"no"` \| `"oc"` \| `"pi"` \| `"pl"` \| `"pt"` \| `"ro"` \| `"ru"` \| `"rsCyrillic"` \| `"rsLatin"` \| `"sk"` \| `"sl"` \| `"sq"` \| `"sv"` \| `"sw"` \| `"tab"` \| `"te"` \| `"tjk"` \| `"tl"` \| `"tr"` \| `"uk"` \| `"uz"` \| `"vi"`

###### recognizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### independentCharacters

`boolean`

##### onDownloadProgressCallback

(`progress`) => `void`

#### Returns

`Promise`\<`void`\>
