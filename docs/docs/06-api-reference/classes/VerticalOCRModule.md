# Class: VerticalOCRModule

Defined in: [modules/computer_vision/VerticalOCRModule.ts:11](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L11)

Module for Vertical Optical Character Recognition (Vertical OCR) tasks.

## Constructors

### Constructor

> **new VerticalOCRModule**(): `VerticalOCRModule`

Defined in: [modules/computer_vision/VerticalOCRModule.ts:14](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L14)

#### Returns

`VerticalOCRModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [modules/computer_vision/VerticalOCRModule.ts:62](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L62)

Release the memory held by the module. Calling `forward` afterwards is invalid.
Note that you cannot delete model while it's generating.

#### Returns

`void`

---

### forward()

> **forward**(`imageSource`): `Promise`\<[`OCRDetection`](../interfaces/OCRDetection.md)[]\>

Defined in: [modules/computer_vision/VerticalOCRModule.ts:54](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L54)

Executes the model's forward pass, where `imageSource` can be a fetchable resource or a Base64-encoded string.

#### Parameters

##### imageSource

`string`

The image source to be processed.

#### Returns

`Promise`\<[`OCRDetection`](../interfaces/OCRDetection.md)[]\>

The OCR result as a `OCRDetection[]`.

---

### load()

> **load**(`model`, `independentCharacters`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [modules/computer_vision/VerticalOCRModule.ts:26](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L26)

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

##### independentCharacters

`boolean`

Whether to treat characters independently during recognition.

##### onDownloadProgressCallback

(`progress`) => `void`

Optional callback to monitor download progress.

#### Returns

`Promise`\<`void`\>
