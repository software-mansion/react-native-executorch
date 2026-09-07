# Interface: TranscriptionResult

Defined in: [types/stt.ts:275](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L275)

Structure that represent result of transcription for a one function call (either `transcribe` or `stream`).

## Properties

### duration

> **duration**: `number`

Defined in: [types/stt.ts:278](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L278)

Duration in seconds of a given transcription.

---

### language

> **language**: `string`

Defined in: [types/stt.ts:277](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L277)

Language chosen for transcription.

---

### segments?

> `optional` **segments**: [`TranscriptionSegment`](TranscriptionSegment.md)[]

Defined in: [types/stt.ts:280](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L280)

If `verbose` set to `true` in `DecodingOptions`, it contains array of
`TranscriptionSegment` with details split into separate transcription segments.

---

### task?

> `optional` **task**: `"transcribe"` \| `"stream"`

Defined in: [types/stt.ts:276](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L276)

String indicating task, either 'transcribe' or 'stream'.

---

### text

> **text**: `string`

Defined in: [types/stt.ts:279](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L279)

The whole text of a transcription as a `string`.
