# Interface: TranscriptionResult

Defined in: [packages/react-native-executorch/src/types/stt.ts:250](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L250)

Structure that represent result of transcription for a one function call (either `transcribe` or `stream`).

## Properties

### duration

> **duration**: `number`

Defined in: [packages/react-native-executorch/src/types/stt.ts:253](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L253)

Duration in seconds of a given transcription.

---

### language

> **language**: `string`

Defined in: [packages/react-native-executorch/src/types/stt.ts:252](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L252)

Language chosen for transcription.

---

### segments?

> `optional` **segments**: [`TranscriptionSegment`](TranscriptionSegment.md)[]

Defined in: [packages/react-native-executorch/src/types/stt.ts:255](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L255)

If `verbose` set to `true` in `DecodingOptions`, it contains array of
`TranscriptionSegment` with details split into separate transcription segments.

---

### task?

> `optional` **task**: `"transcribe"` \| `"stream"`

Defined in: [packages/react-native-executorch/src/types/stt.ts:251](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L251)

String indicating task, either 'transcribe' or 'stream'.

---

### text

> **text**: `string`

Defined in: [packages/react-native-executorch/src/types/stt.ts:254](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L254)

The whole text of a transcription as a `string`.
