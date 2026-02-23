# Interface: DecodingOptions

Defined in: [packages/react-native-executorch/src/types/stt.ts:195](https://github.com/software-mansion/react-native-executorch/blob/a6b2b6f4f1622166e3517338d42680655383a3be/packages/react-native-executorch/src/types/stt.ts#L195)

Options for decoding speech to text.

## Properties

### language?

> `optional` **language**: [`SpeechToTextLanguage`](../type-aliases/SpeechToTextLanguage.md)

Defined in: [packages/react-native-executorch/src/types/stt.ts:196](https://github.com/software-mansion/react-native-executorch/blob/a6b2b6f4f1622166e3517338d42680655383a3be/packages/react-native-executorch/src/types/stt.ts#L196)

Optional language code to guide the transcription.

---

### verbose?

> `optional` **verbose**: `boolean`

Defined in: [packages/react-native-executorch/src/types/stt.ts:197](https://github.com/software-mansion/react-native-executorch/blob/a6b2b6f4f1622166e3517338d42680655383a3be/packages/react-native-executorch/src/types/stt.ts#L197)

Optional flag. If set, transcription result is presented with timestamps
and with additional parameters. For more details please refer to `TranscriptionResult`.
