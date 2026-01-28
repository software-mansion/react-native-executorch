# Class: OCRModule

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/OCRModule.ts:10](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/modules/computer_vision/OCRModule.ts#L10)

Module for Optical Character Recognition (OCR) tasks.

## Constructors

### Constructor

> **new OCRModule**(): `OCRModule`

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/OCRModule.ts:13](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/modules/computer_vision/OCRModule.ts#L13)

#### Returns

`OCRModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/OCRModule.ts:55](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/modules/computer_vision/OCRModule.ts#L55)

Release the memory held by the module. Calling `forward` afterwards is invalid. 
Note that you cannot delete model while it's generating.

#### Returns

`void`

***

### forward()

> **forward**(`imageSource`): `Promise`\<`any`\>

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/OCRModule.ts:47](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/modules/computer_vision/OCRModule.ts#L47)

Executes the model's forward pass, where `imageSource` can be a fetchable resource or a Base64-encoded string.

#### Parameters

##### imageSource

`string`

The image source to be processed.

#### Returns

`Promise`\<`any`\>

The OCR result as a string.

***

### load()

> **load**(`model`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/OCRModule.ts:25](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/modules/computer_vision/OCRModule.ts#L25)

Loads the model, where `detectorSource` is a string that specifies the location of the detector binary,
`recognizerSource` is a string that specifies the location of the recognizer binary,
and `language` is a parameter that specifies the language of the text to be recognized by the OCR.

#### Parameters

##### model

Object containing `detectorSource`, `recognizerSource`, and `language`.

###### detectorSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

###### language

`"abq"` \| `"ady"` \| `"af"` \| `"ava"` \| `"az"` \| `"be"` \| `"bg"` \| `"bs"` \| `"chSim"` \| `"che"` \| `"cs"` \| `"cy"` \| `"da"` \| `"dar"` \| `"de"` \| `"en"` \| `"es"` \| `"et"` \| `"fr"` \| `"ga"` \| `"hr"` \| `"hu"` \| `"id"` \| `"inh"` \| `"ic"` \| `"it"` \| `"ja"` \| `"kbd"` \| `"kn"` \| `"ko"` \| `"ku"` \| `"la"` \| `"lbe"` \| `"lez"` \| `"lt"` \| `"lv"` \| `"mi"` \| `"mn"` \| `"ms"` \| `"mt"` \| `"nl"` \| `"no"` \| `"oc"` \| `"pi"` \| `"pl"` \| `"pt"` \| `"ro"` \| `"ru"` \| `"rsCyrillic"` \| `"rsLatin"` \| `"sk"` \| `"sl"` \| `"sq"` \| `"sv"` \| `"sw"` \| `"tab"` \| `"te"` \| `"tjk"` \| `"tl"` \| `"tr"` \| `"uk"` \| `"uz"` \| `"vi"`

###### recognizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### onDownloadProgressCallback

(`progress`) => `void`

Optional callback to monitor download progress.

#### Returns

`Promise`\<`void`\>
