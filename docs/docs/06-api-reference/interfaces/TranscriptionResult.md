# Interface: TranscriptionResult

Defined in: [packages/react-native-executorch/src/types/stt.ts:253](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L253)

Structure that represent result of transcription for a one function call (either `transcribe` or `stream`).

## Properties

### duration

> **duration**: `number`

Defined in: [packages/react-native-executorch/src/types/stt.ts:256](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L256)

Duration in seconds of a given transcription.

---

### language

> **language**: `string`

Defined in: [packages/react-native-executorch/src/types/stt.ts:255](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L255)

Language chosen for transcription.

---

### segments?

> `optional` **segments**: [`TranscriptionSegment`](TranscriptionSegment.md)[]

Defined in: [packages/react-native-executorch/src/types/stt.ts:258](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L258)

If `verbose` set to `true` in `DecodingOptions`, it contains array of
`TranscriptionSegment` with details split into separate transcription segments.

---

### task?

> `optional` **task**: `string`

Defined in: [packages/react-native-executorch/src/types/stt.ts:254](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L254)

String indicating task, either 'transcribe' or 'stream'.

---

### text

> **text**: `string`

Defined in: [packages/react-native-executorch/src/types/stt.ts:257](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L257)

The whole text of a transcription as a `string`.
