# Interface: TranscriptionSegment

Defined in: [packages/react-native-executorch/src/types/stt.ts:228](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L228)

Structure that represent single Segment of transcription.

## Properties

### avgLogprob

> **avgLogprob**: `number`

Defined in: [packages/react-native-executorch/src/types/stt.ts:235](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L235)

Average log probability calculated across all tokens in a segment.

---

### compressionRatio

> **compressionRatio**: `number`

Defined in: [packages/react-native-executorch/src/types/stt.ts:236](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L236)

Compression ration achieved on a given segment.

---

### end

> **end**: `number`

Defined in: [packages/react-native-executorch/src/types/stt.ts:230](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L230)

Timestamp of the end of the segment in audio (in seconds).

---

### start

> **start**: `number`

Defined in: [packages/react-native-executorch/src/types/stt.ts:229](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L229)

Timestamp of the beginning of the segment in audio (in seconds).

---

### temperature

> **temperature**: `number`

Defined in: [packages/react-native-executorch/src/types/stt.ts:234](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L234)

Temperature for which given segment was computed.

---

### text

> **text**: `string`

Defined in: [packages/react-native-executorch/src/types/stt.ts:231](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L231)

Full text of the given segment as a string.

---

### tokens

> **tokens**: `number`[]

Defined in: [packages/react-native-executorch/src/types/stt.ts:233](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L233)

Raw tokens represented as table of integers.

---

### words?

> `optional` **words**: [`Word`](Word.md)[]

Defined in: [packages/react-native-executorch/src/types/stt.ts:232](https://github.com/software-mansion/react-native-executorch/blob/3acba46b6ae095fd7b0f269070ace822138c6f6a/packages/react-native-executorch/src/types/stt.ts#L232)

If `verbose` set to `true` in `DecodingOptions`, it returns word-level timestamping
as an array of `Word`.
