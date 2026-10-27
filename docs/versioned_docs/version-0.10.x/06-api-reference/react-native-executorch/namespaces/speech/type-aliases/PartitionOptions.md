# Type Alias: PartitionOptions

> **PartitionOptions** = `object`

Defined in: [extensions/speech/utils/textPartitioner.ts:32](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/textPartitioner.ts#L32)

Configuration options for text partitioning.

## Properties

### initialShortDeviationScale?

> `readonly` `optional` **initialShortDeviationScale**: `number`

Defined in: [extensions/speech/utils/textPartitioner.ts:44](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/textPartitioner.ts#L44)

Scaling multiplier for the length deviation penalty when the first segment
is shorter than target length. Lower values reduce the length penalty for
short initial chunks when `prioritizeInitialTtfa` is true.

---

### prioritizeInitialTtfa?

> `readonly` `optional` **prioritizeInitialTtfa**: `boolean`

Defined in: [extensions/speech/utils/textPartitioner.ts:37](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/textPartitioner.ts#L37)

Whether to prioritize shorter initial segment lengths and scale up
progressively to minimize Time To First Audio (TTFA).

---

### separatorPenalties?

> `readonly` `optional` **separatorPenalties**: `object`

Defined in: [extensions/speech/utils/textPartitioner.ts:50](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/textPartitioner.ts#L50)

Custom separator penalties for breakpoint tag types (`'eos'`, `'pause'`,
`'whitespace'`).

#### eos?

> `readonly` `optional` **eos**: `number`

#### pause?

> `readonly` `optional` **pause**: `number`

#### whitespace?

> `readonly` `optional` **whitespace**: `number`
