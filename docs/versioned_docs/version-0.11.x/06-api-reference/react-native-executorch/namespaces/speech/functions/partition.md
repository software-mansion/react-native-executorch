# Function: partition()

> **partition**(`text`, `limit`, `options?`): `string`[]

Defined in: [extensions/speech/utils/textPartitioner.ts:104](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/textPartitioner.ts#L104)

Divides input text into logical segments under the maximum character limit
using a forward dynamic programming algorithm.

## Parameters

### text

`string`

The input text string to partition.

### limit

`number`

The maximum character limit per partition (must be >= 10).

### options?

[`PartitionOptions`](../type-aliases/PartitionOptions.md)

Optional configuration for TTFA prioritization and custom penalties.
See [PartitionOptions](../type-aliases/PartitionOptions.md).

## Returns

`string`[]

An array of partitioned text segments.

## Throws

With code `INVALID_ARGUMENT` if `limit` is below
10 or the text cannot be divided into chunks within the given limit.
