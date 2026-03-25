# Interface: TranscriptionSegment

Defined in: [types/stt.ts:237](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L237)

Structure that represent single Segment of transcription.

## Properties

### avgLogprob

> **avgLogprob**: `number`

Defined in: [types/stt.ts:244](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L244)

Average log probability calculated across all tokens in a segment.

***

### compressionRatio

> **compressionRatio**: `number`

Defined in: [types/stt.ts:245](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L245)

Compression ration achieved on a given segment.

***

### end

> **end**: `number`

Defined in: [types/stt.ts:239](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L239)

Timestamp of the end of the segment in audio (in seconds).

***

### start

> **start**: `number`

Defined in: [types/stt.ts:238](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L238)

Timestamp of the beginning of the segment in audio (in seconds).

***

### temperature

> **temperature**: `number`

Defined in: [types/stt.ts:243](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L243)

Temperature for which given segment was computed.

***

### text

> **text**: `string`

Defined in: [types/stt.ts:240](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L240)

Full text of the given segment as a string.

***

### tokens

> **tokens**: `number`[]

Defined in: [types/stt.ts:242](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L242)

Raw tokens represented as table of integers.

***

### words?

> `optional` **words**: [`Word`](Word.md)[]

Defined in: [types/stt.ts:241](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/stt.ts#L241)

If `verbose` set to `true` in `DecodingOptions`, it returns word-level timestamping
as an array of `Word`.
