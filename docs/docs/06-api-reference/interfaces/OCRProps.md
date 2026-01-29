# Interface: OCRProps

Defined in: [packages/react-native-executorch/src/types/ocr.ts:37](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/ocr.ts#L37)

Configuration properties for the `useOCR` hook.

## Extended by

- [`VerticalOCRProps`](VerticalOCRProps.md)

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/ocr.ts:41](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/ocr.ts#L41)

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

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/ocr.ts:62](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/ocr.ts#L62)

Boolean that can prevent automatic model loading (and downloading the data if loaded for the first time) after running the hook.
Defaults to `false`.
