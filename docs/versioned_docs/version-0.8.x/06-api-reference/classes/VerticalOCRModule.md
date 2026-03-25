# Class: VerticalOCRModule

Defined in: [modules/computer\_vision/VerticalOCRModule.ts:11](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L11)

Module for Vertical Optical Character Recognition (Vertical OCR) tasks.

## Methods

### delete()

> **delete**(): `void`

Defined in: [modules/computer\_vision/VerticalOCRModule.ts:100](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L100)

Release the memory held by the module. Calling `forward` afterwards is invalid.
Note that you cannot delete model while it's generating.

#### Returns

`void`

***

### forward()

> **forward**(`imageSource`): `Promise`\<[`OCRDetection`](../interfaces/OCRDetection.md)[]\>

Defined in: [modules/computer\_vision/VerticalOCRModule.ts:92](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L92)

Executes the model's forward pass, where `imageSource` can be a fetchable resource or a Base64-encoded string.

#### Parameters

##### imageSource

`string`

The image source to be processed.

#### Returns

`Promise`\<[`OCRDetection`](../interfaces/OCRDetection.md)[]\>

The OCR result as a `OCRDetection[]`.

***

### fromCustomModel()

> `static` **fromCustomModel**(`detectorSource`, `recognizerSource`, `language`, `independentCharacters?`, `onDownloadProgress?`): `Promise`\<`VerticalOCRModule`\>

Defined in: [modules/computer\_vision/VerticalOCRModule.ts:68](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L68)

Creates a Vertical OCR instance with a user-provided model binary.
Use this when working with a custom-exported Vertical OCR model.
Internally uses `'custom'` as the model name for telemetry.

#### Parameters

##### detectorSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the text detector model binary.

##### recognizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the text recognizer model binary.

##### language

The language for the OCR model.

`"abq"` | `"ady"` | `"af"` | `"ava"` | `"az"` | `"be"` | `"bg"` | `"bs"` | `"chSim"` | `"che"` | `"cs"` | `"cy"` | `"da"` | `"dar"` | `"de"` | `"en"` | `"es"` | `"et"` | `"fr"` | `"ga"` | `"hr"` | `"hu"` | `"id"` | `"inh"` | `"ic"` | `"it"` | `"ja"` | `"kbd"` | `"kn"` | `"ko"` | `"ku"` | `"la"` | `"lbe"` | `"lez"` | `"lt"` | `"lv"` | `"mi"` | `"mn"` | `"ms"` | `"mt"` | `"nl"` | `"no"` | `"oc"` | `"pi"` | `"pl"` | `"pt"` | `"ro"` | `"ru"` | `"rsCyrillic"` | `"rsLatin"` | `"sk"` | `"sl"` | `"sq"` | `"sv"` | `"sw"` | `"tab"` | `"te"` | `"tjk"` | `"tl"` | `"tr"` | `"uk"` | `"uz"` | `"vi"`

##### independentCharacters?

`boolean` = `false`

Whether to treat characters independently during recognition.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`VerticalOCRModule`\>

A Promise resolving to a `VerticalOCRModule` instance.

#### Remarks

The native model contract for this method is not formally defined and may change
between releases. Refer to the native source code for the current expected tensor interface.

***

### fromModelName()

> `static` **fromModelName**(`namedSources`, `onDownloadProgress?`): `Promise`\<`VerticalOCRModule`\>

Defined in: [modules/computer\_vision/VerticalOCRModule.ts:29](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/modules/computer_vision/VerticalOCRModule.ts#L29)

Creates a Vertical OCR instance for a built-in model.

#### Parameters

##### namedSources

An object specifying the model name, detector source, recognizer source, language, and optional independent characters flag.

###### detectorSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

###### independentCharacters?

`boolean`

###### language

`"abq"` \| `"ady"` \| `"af"` \| `"ava"` \| `"az"` \| `"be"` \| `"bg"` \| `"bs"` \| `"chSim"` \| `"che"` \| `"cs"` \| `"cy"` \| `"da"` \| `"dar"` \| `"de"` \| `"en"` \| `"es"` \| `"et"` \| `"fr"` \| `"ga"` \| `"hr"` \| `"hu"` \| `"id"` \| `"inh"` \| `"ic"` \| `"it"` \| `"ja"` \| `"kbd"` \| `"kn"` \| `"ko"` \| `"ku"` \| `"la"` \| `"lbe"` \| `"lez"` \| `"lt"` \| `"lv"` \| `"mi"` \| `"mn"` \| `"ms"` \| `"mt"` \| `"nl"` \| `"no"` \| `"oc"` \| `"pi"` \| `"pl"` \| `"pt"` \| `"ro"` \| `"ru"` \| `"rsCyrillic"` \| `"rsLatin"` \| `"sk"` \| `"sl"` \| `"sq"` \| `"sv"` \| `"sw"` \| `"tab"` \| `"te"` \| `"tjk"` \| `"tl"` \| `"tr"` \| `"uk"` \| `"uz"` \| `"vi"`

###### modelName

`"ocr-abq"` \| `"ocr-ady"` \| `"ocr-af"` \| `"ocr-ava"` \| `"ocr-az"` \| `"ocr-be"` \| `"ocr-bg"` \| `"ocr-bs"` \| `"ocr-chSim"` \| `"ocr-che"` \| `"ocr-cs"` \| `"ocr-cy"` \| `"ocr-da"` \| `"ocr-dar"` \| `"ocr-de"` \| `"ocr-en"` \| `"ocr-es"` \| `"ocr-et"` \| `"ocr-fr"` \| `"ocr-ga"` \| `"ocr-hr"` \| `"ocr-hu"` \| `"ocr-id"` \| `"ocr-inh"` \| `"ocr-ic"` \| `"ocr-it"` \| `"ocr-ja"` \| `"ocr-kbd"` \| `"ocr-kn"` \| `"ocr-ko"` \| `"ocr-ku"` \| `"ocr-la"` \| `"ocr-lbe"` \| `"ocr-lez"` \| `"ocr-lt"` \| `"ocr-lv"` \| `"ocr-mi"` \| `"ocr-mn"` \| `"ocr-ms"` \| `"ocr-mt"` \| `"ocr-nl"` \| `"ocr-no"` \| `"ocr-oc"` \| `"ocr-pi"` \| `"ocr-pl"` \| `"ocr-pt"` \| `"ocr-ro"` \| `"ocr-ru"` \| `"ocr-rsCyrillic"` \| `"ocr-rsLatin"` \| `"ocr-sk"` \| `"ocr-sl"` \| `"ocr-sq"` \| `"ocr-sv"` \| `"ocr-sw"` \| `"ocr-tab"` \| `"ocr-te"` \| `"ocr-tjk"` \| `"ocr-tl"` \| `"ocr-tr"` \| `"ocr-uk"` \| `"ocr-uz"` \| `"ocr-vi"`

###### recognizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`VerticalOCRModule`\>

A Promise resolving to a `VerticalOCRModule` instance.

#### Example

```ts
import { VerticalOCRModule, OCR_JAPANESE } from 'react-native-executorch';
const ocr = await VerticalOCRModule.fromModelName({ ...OCR_JAPANESE, independentCharacters: true });
```
