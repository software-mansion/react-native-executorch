# Interface: TranscriptionSegment

Defined in: [packages/react-native-executorch/src/types/stt.ts:230](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L230)

Structure that represent single Segment of transcription.

## Properties

### avg_logprob

> **avg_logprob**: `number`

Defined in: [packages/react-native-executorch/src/types/stt.ts:237](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L237)

Average log probability calculated across all tokens in a segment.

---

### compression_ratio

> **compression_ratio**: `number`

Defined in: [packages/react-native-executorch/src/types/stt.ts:238](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L238)

Compression ration achieved on a given segment.

---

### end

> **end**: `number`

Defined in: [packages/react-native-executorch/src/types/stt.ts:232](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L232)

Timestamp of the end of the segment in audio (in seconds).

---

### no_speech_prob

> **no_speech_prob**: `number`

Defined in: [packages/react-native-executorch/src/types/stt.ts:239](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L239)

No speech probability, the probability that segment contains silence,
background noise etc.

---

### start

> **start**: `number`

Defined in: [packages/react-native-executorch/src/types/stt.ts:231](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L231)

Timestamp of the beginning of the segment in audio (in seconds).

---

### temperature

> **temperature**: `number`

Defined in: [packages/react-native-executorch/src/types/stt.ts:236](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L236)

Temperature for which given segment was computed.

---

### text

> **text**: `string`

Defined in: [packages/react-native-executorch/src/types/stt.ts:233](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L233)

Full text of the given segment as a string.

---

### tokens

> **tokens**: `number`[]

Defined in: [packages/react-native-executorch/src/types/stt.ts:235](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L235)

Raw tokens represented as table of integers.

---

### words?

> `optional` **words**: [`Word`](Word.md)[]

Defined in: [packages/react-native-executorch/src/types/stt.ts:234](https://github.com/software-mansion/react-native-executorch/blob/dc9a5617585ba60b2224b30bbe71a79b0f4e44d2/packages/react-native-executorch/src/types/stt.ts#L234)

If `verbose` set to `true` in `DecodingOptions`, it returns word-level timestamping
as an array of `Word`.
