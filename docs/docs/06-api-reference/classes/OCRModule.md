# Class: OCRModule

Defined in: [packages/react-native-executorch/src/modules/computer_vision/OCRModule.ts:5](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/modules/computer_vision/OCRModule.ts#L5)

## Constructors

### Constructor

> **new OCRModule**(): `OCRModule`

Defined in: [packages/react-native-executorch/src/modules/computer_vision/OCRModule.ts:8](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/modules/computer_vision/OCRModule.ts#L8)

#### Returns

`OCRModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/computer_vision/OCRModule.ts:32](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/modules/computer_vision/OCRModule.ts#L32)

#### Returns

`void`

---

### forward()

> **forward**(`imageSource`): `Promise`\<`any`\>

Defined in: [packages/react-native-executorch/src/modules/computer_vision/OCRModule.ts:28](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/modules/computer_vision/OCRModule.ts#L28)

#### Parameters

##### imageSource

`string`

#### Returns

`Promise`\<`any`\>

---

### load()

> **load**(`model`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/computer_vision/OCRModule.ts:12](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/modules/computer_vision/OCRModule.ts#L12)

#### Parameters

##### model

###### detectorSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

###### language

`"abq"` \| `"ady"` \| `"af"` \| `"ava"` \| `"az"` \| `"be"` \| `"bg"` \| `"bs"` \| `"chSim"` \| `"che"` \| `"cs"` \| `"cy"` \| `"da"` \| `"dar"` \| `"de"` \| `"en"` \| `"es"` \| `"et"` \| `"fr"` \| `"ga"` \| `"hr"` \| `"hu"` \| `"id"` \| `"inh"` \| `"ic"` \| `"it"` \| `"ja"` \| `"kbd"` \| `"kn"` \| `"ko"` \| `"ku"` \| `"la"` \| `"lbe"` \| `"lez"` \| `"lt"` \| `"lv"` \| `"mi"` \| `"mn"` \| `"ms"` \| `"mt"` \| `"nl"` \| `"no"` \| `"oc"` \| `"pi"` \| `"pl"` \| `"pt"` \| `"ro"` \| `"ru"` \| `"rsCyrillic"` \| `"rsLatin"` \| `"sk"` \| `"sl"` \| `"sq"` \| `"sv"` \| `"sw"` \| `"tab"` \| `"te"` \| `"tjk"` \| `"tl"` \| `"tr"` \| `"uk"` \| `"uz"` \| `"vi"`

###### recognizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### onDownloadProgressCallback

(`progress`) => `void`

#### Returns

`Promise`\<`void`\>
