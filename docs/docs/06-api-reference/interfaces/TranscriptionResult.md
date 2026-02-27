# Interface: TranscriptionResult

Defined in: [types/stt.ts:243](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L243)

Structure that represent result of transcription for a one function call (either `transcribe` or `stream`).

## Properties

### duration

> **duration**: `number`

Defined in: [types/stt.ts:246](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L246)

Duration in seconds of a given transcription.

---

### language

> **language**: `string`

Defined in: [types/stt.ts:245](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L245)

Language chosen for transcription.

---

### segments?

> `optional` **segments**: [`TranscriptionSegment`](TranscriptionSegment.md)[]

Defined in: [types/stt.ts:248](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L248)

If `verbose` set to `true` in `DecodingOptions`, it contains array of
`TranscriptionSegment` with details split into separate transcription segments.

---

### task?

> `optional` **task**: `"transcribe"` \| `"stream"`

Defined in: [types/stt.ts:244](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L244)

String indicating task, either 'transcribe' or 'stream'.

---

### text

> **text**: `string`

Defined in: [types/stt.ts:247](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/stt.ts#L247)

The whole text of a transcription as a `string`.
