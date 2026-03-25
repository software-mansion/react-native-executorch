# Interface: OCRProps

Defined in: [types/ocr.ts:34](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/ocr.ts#L34)

Configuration properties for the `useOCR` hook.

## Extended by

- [`VerticalOCRProps`](VerticalOCRProps.md)

## Properties

### model

> **model**: `object`

Defined in: [types/ocr.ts:38](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/ocr.ts#L38)

Object containing the necessary model sources and configuration for the OCR pipeline.

#### detectorSource

> **detectorSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` that specifies the location of the text detector model binary.

#### language

> **language**: `"abq"` \| `"ady"` \| `"af"` \| `"ava"` \| `"az"` \| `"be"` \| `"bg"` \| `"bs"` \| `"chSim"` \| `"che"` \| `"cs"` \| `"cy"` \| `"da"` \| `"dar"` \| `"de"` \| `"en"` \| `"es"` \| `"et"` \| `"fr"` \| `"ga"` \| `"hr"` \| `"hu"` \| `"id"` \| `"inh"` \| `"ic"` \| `"it"` \| `"ja"` \| `"kbd"` \| `"kn"` \| `"ko"` \| `"ku"` \| `"la"` \| `"lbe"` \| `"lez"` \| `"lt"` \| `"lv"` \| `"mi"` \| `"mn"` \| `"ms"` \| `"mt"` \| `"nl"` \| `"no"` \| `"oc"` \| `"pi"` \| `"pl"` \| `"pt"` \| `"ro"` \| `"ru"` \| `"rsCyrillic"` \| `"rsLatin"` \| `"sk"` \| `"sl"` \| `"sq"` \| `"sv"` \| `"sw"` \| `"tab"` \| `"te"` \| `"tjk"` \| `"tl"` \| `"tr"` \| `"uk"` \| `"uz"` \| `"vi"`

The language configuration enum for the OCR model (e.g., English, Polish, etc.).

#### modelName

> **modelName**: `"ocr-abq"` \| `"ocr-ady"` \| `"ocr-af"` \| `"ocr-ava"` \| `"ocr-az"` \| `"ocr-be"` \| `"ocr-bg"` \| `"ocr-bs"` \| `"ocr-chSim"` \| `"ocr-che"` \| `"ocr-cs"` \| `"ocr-cy"` \| `"ocr-da"` \| `"ocr-dar"` \| `"ocr-de"` \| `"ocr-en"` \| `"ocr-es"` \| `"ocr-et"` \| `"ocr-fr"` \| `"ocr-ga"` \| `"ocr-hr"` \| `"ocr-hu"` \| `"ocr-id"` \| `"ocr-inh"` \| `"ocr-ic"` \| `"ocr-it"` \| `"ocr-ja"` \| `"ocr-kbd"` \| `"ocr-kn"` \| `"ocr-ko"` \| `"ocr-ku"` \| `"ocr-la"` \| `"ocr-lbe"` \| `"ocr-lez"` \| `"ocr-lt"` \| `"ocr-lv"` \| `"ocr-mi"` \| `"ocr-mn"` \| `"ocr-ms"` \| `"ocr-mt"` \| `"ocr-nl"` \| `"ocr-no"` \| `"ocr-oc"` \| `"ocr-pi"` \| `"ocr-pl"` \| `"ocr-pt"` \| `"ocr-ro"` \| `"ocr-ru"` \| `"ocr-rsCyrillic"` \| `"ocr-rsLatin"` \| `"ocr-sk"` \| `"ocr-sl"` \| `"ocr-sq"` \| `"ocr-sv"` \| `"ocr-sw"` \| `"ocr-tab"` \| `"ocr-te"` \| `"ocr-tjk"` \| `"ocr-tl"` \| `"ocr-tr"` \| `"ocr-uk"` \| `"ocr-uz"` \| `"ocr-vi"`

The built-in model name, e.g. `'ocr-en'`. Used for telemetry and hook reload triggers.
Pass one of the pre-built OCR constants (e.g. `OCR_ENGLISH`) to populate all required fields.

#### recognizerSource

> **recognizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` that specifies the location of the text recognizer model binary.

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/ocr.ts:65](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/ocr.ts#L65)

Boolean that can prevent automatic model loading (and downloading the data if loaded for the first time) after running the hook.
Defaults to `false`.
