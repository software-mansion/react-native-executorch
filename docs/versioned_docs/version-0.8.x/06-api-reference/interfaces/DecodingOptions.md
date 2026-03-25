# Interface: DecodingOptions

Defined in: [types/stt.ts:206](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L206)

Options for decoding speech to text.

## Properties

### language?

> `optional` **language**: [`SpeechToTextLanguage`](../type-aliases/SpeechToTextLanguage.md)

Defined in: [types/stt.ts:207](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L207)

Optional language code to guide the transcription.

***

### verbose?

> `optional` **verbose**: `boolean`

Defined in: [types/stt.ts:208](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L208)

Optional flag. If set, transcription result is presented with timestamps
and with additional parameters. For more details please refer to `TranscriptionResult`.
