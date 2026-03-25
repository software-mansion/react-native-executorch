# Interface: TranscriptionResult

Defined in: [types/stt.ts:258](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L258)

Structure that represent result of transcription for a one function call (either `transcribe` or `stream`).

## Properties

### duration

> **duration**: `number`

Defined in: [types/stt.ts:261](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L261)

Duration in seconds of a given transcription.

***

### language

> **language**: `string`

Defined in: [types/stt.ts:260](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L260)

Language chosen for transcription.

***

### segments?

> `optional` **segments**: [`TranscriptionSegment`](TranscriptionSegment.md)[]

Defined in: [types/stt.ts:263](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L263)

If `verbose` set to `true` in `DecodingOptions`, it contains array of
`TranscriptionSegment` with details split into separate transcription segments.

***

### task?

> `optional` **task**: `"transcribe"` \| `"stream"`

Defined in: [types/stt.ts:259](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L259)

String indicating task, either 'transcribe' or 'stream'.

***

### text

> **text**: `string`

Defined in: [types/stt.ts:262](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L262)

The whole text of a transcription as a `string`.
