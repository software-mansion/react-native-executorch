# Interface: DecodingOptions

Defined in: [types/stt.ts:208](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L208)

Options for decoding speech to text.

## Extended by

- [`StreamingOptions`](StreamingOptions.md)

## Properties

### language?

> `optional` **language**: [`SpeechToTextLanguage`](../type-aliases/SpeechToTextLanguage.md)

Defined in: [types/stt.ts:209](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L209)

Optional language code to guide the transcription.

---

### verbose?

> `optional` **verbose**: `boolean`

Defined in: [types/stt.ts:210](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L210)

Optional flag. If set, transcription result is presented with timestamps
and with additional parameters. For more details please refer to `TranscriptionResult`.
