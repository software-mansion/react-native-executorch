# Interface: StreamingOptions

Defined in: [types/stt.ts:222](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L222)

Configuration options for the speech-to-text streaming process.

## Extends

- [`DecodingOptions`](DecodingOptions.md)

## Properties

### language?

> `optional` **language**: [`SpeechToTextLanguage`](../type-aliases/SpeechToTextLanguage.md)

Defined in: [types/stt.ts:209](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L209)

Optional language code to guide the transcription.

#### Inherited from

[`DecodingOptions`](DecodingOptions.md).[`language`](DecodingOptions.md#language)

---

### timeout?

> `optional` **timeout**: `number`

Defined in: [types/stt.ts:223](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L223)

Specifies (in milliseconds) how much does streamer wait between model inferences.

---

### useVAD?

> `optional` **useVAD**: `boolean`

Defined in: [types/stt.ts:224](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L224)

When set to true, utilizes the inner VAD submodule (if initialized) and
transcription process runs only when speech is being detected.

---

### vadDetectionMargin?

> `optional` **vadDetectionMargin**: `number`

Defined in: [types/stt.ts:225](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L225)

Specifies (in milliseconds) how far the last detected speech segment can be to still be considered
as ongoing speech. Works only with useVAD set to true.

---

### verbose?

> `optional` **verbose**: `boolean`

Defined in: [types/stt.ts:210](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L210)

Optional flag. If set, transcription result is presented with timestamps
and with additional parameters. For more details please refer to `TranscriptionResult`.

#### Inherited from

[`DecodingOptions`](DecodingOptions.md).[`verbose`](DecodingOptions.md#verbose)
