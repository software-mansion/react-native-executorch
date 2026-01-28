# Class: VerticalOCRModule

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/VerticalOCRModule.ts:5](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L5)

## Constructors

### Constructor

> **new VerticalOCRModule**(): `VerticalOCRModule`

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/VerticalOCRModule.ts:8](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L8)

#### Returns

`VerticalOCRModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/VerticalOCRModule.ts:53](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L53)

Release the memory held by the module. Calling `forward` afterwards is invalid. 
Note that you cannot delete model while it's generating.

#### Returns

`void`

***

### forward()

> **forward**(`imageSource`): `Promise`\<`any`\>

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/VerticalOCRModule.ts:45](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L45)

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

> **load**(`model`, `independentCharacters`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/VerticalOCRModule.ts:21](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L21)

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
