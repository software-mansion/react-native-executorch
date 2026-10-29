# Interface: TranscriptionSegment

Defined in: [types/stt.ts:254](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L254)

Structure that represent single Segment of transcription.

## Properties

### avgLogprob

> **avgLogprob**: `number`

Defined in: [types/stt.ts:261](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L261)

Average log probability calculated across all tokens in a segment.

---

### compressionRatio

> **compressionRatio**: `number`

Defined in: [types/stt.ts:262](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L262)

Compression ration achieved on a given segment.

---

### end

> **end**: `number`

Defined in: [types/stt.ts:256](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L256)

Timestamp of the end of the segment in audio (in seconds).

---

### start

> **start**: `number`

Defined in: [types/stt.ts:255](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L255)

Timestamp of the beginning of the segment in audio (in seconds).

---

### temperature

> **temperature**: `number`

Defined in: [types/stt.ts:260](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L260)

Temperature for which given segment was computed.

---

### text

> **text**: `string`

Defined in: [types/stt.ts:257](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L257)

Full text of the given segment as a string.

---

### tokens

> **tokens**: `number`[]

Defined in: [types/stt.ts:259](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L259)

Raw tokens represented as table of integers.

---

### words?

> `optional` **words**: [`Word`](Word.md)[]

Defined in: [types/stt.ts:258](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/stt.ts#L258)

If `verbose` set to `true` in `DecodingOptions`, it returns word-level timestamping
as an array of `Word`.
