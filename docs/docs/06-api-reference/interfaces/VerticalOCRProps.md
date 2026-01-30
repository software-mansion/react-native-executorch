# Interface: VerticalOCRProps

Defined in: [packages/react-native-executorch/src/types/ocr.ts:70](https://github.com/software-mansion/react-native-executorch/blob/bf7cb740914337a4d266d2cb99d42114c1e469b1/packages/react-native-executorch/src/types/ocr.ts#L70)

Configuration properties for the `useVerticalOCR` hook.

## Extends

- [`OCRProps`](OCRProps.md)

## Properties

### independentCharacters?

> `optional` **independentCharacters**: `boolean`

Defined in: [packages/react-native-executorch/src/types/ocr.ts:75](https://github.com/software-mansion/react-native-executorch/blob/bf7cb740914337a4d266d2cb99d42114c1e469b1/packages/react-native-executorch/src/types/ocr.ts#L75)

Boolean indicating whether to treat each character independently during recognition.
Defaults to `false`.

***

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/ocr.ts:41](https://github.com/software-mansion/react-native-executorch/blob/bf7cb740914337a4d266d2cb99d42114c1e469b1/packages/react-native-executorch/src/types/ocr.ts#L41)

Object containing the necessary model sources and configuration for the OCR pipeline.

#### detectorSource

> **detectorSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` that specifies the location of the text detector model binary.

#### language

> **language**: `"abq"` \| `"ady"` \| `"af"` \| `"ava"` \| `"az"` \| `"be"` \| `"bg"` \| `"bs"` \| `"chSim"` \| `"che"` \| `"cs"` \| `"cy"` \| `"da"` \| `"dar"` \| `"de"` \| `"en"` \| `"es"` \| `"et"` \| `"fr"` \| `"ga"` \| `"hr"` \| `"hu"` \| `"id"` \| `"inh"` \| `"ic"` \| `"it"` \| `"ja"` \| `"kbd"` \| `"kn"` \| `"ko"` \| `"ku"` \| `"la"` \| `"lbe"` \| `"lez"` \| `"lt"` \| `"lv"` \| `"mi"` \| `"mn"` \| `"ms"` \| `"mt"` \| `"nl"` \| `"no"` \| `"oc"` \| `"pi"` \| `"pl"` \| `"pt"` \| `"ro"` \| `"ru"` \| `"rsCyrillic"` \| `"rsLatin"` \| `"sk"` \| `"sl"` \| `"sq"` \| `"sv"` \| `"sw"` \| `"tab"` \| `"te"` \| `"tjk"` \| `"tl"` \| `"tr"` \| `"uk"` \| `"uz"` \| `"vi"`

The language configuration enum for the OCR model (e.g., English, Polish, etc.).

#### recognizerSource

> **recognizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` that specifies the location of the text recognizer model binary.

#### Inherited from

[`OCRProps`](OCRProps.md).[`model`](OCRProps.md#model)

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/ocr.ts:62](https://github.com/software-mansion/react-native-executorch/blob/bf7cb740914337a4d266d2cb99d42114c1e469b1/packages/react-native-executorch/src/types/ocr.ts#L62)

Boolean that can prevent automatic model loading (and downloading the data if loaded for the first time) after running the hook.
Defaults to `false`.

#### Inherited from

[`OCRProps`](OCRProps.md).[`preventLoad`](OCRProps.md#preventload)
