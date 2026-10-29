# Function: selectByText()

## Call Signature

> **selectByText**\<`L`\>(`instances`, `instanceEmbeddings`, `textEmbedding`, `topk?`): [`SegmentedInstance`](../interfaces/SegmentedInstance.md)\<`L`\> \| `null`

Defined in: [utils/segmentAnythingPrompts.ts:105](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/segmentAnythingPrompts.ts#L105)

Selects the best matching instance(s) for a text prompt.

Returns the instance(s) whose image embedding has the highest cosine similarity
with the text embedding. The caller is responsible for producing the
embeddings (e.g. with CLIP) and passing them in the same order as
`instances`.

### Type Parameters

#### L

`L` _extends_ `Readonly`\<`Record`\<`string`, `string` \| `number`\>\>

### Parameters

#### instances

[`SegmentedInstance`](../interfaces/SegmentedInstance.md)\<`L`\>[]

Array of segmented instances returned by `forward()`.

#### instanceEmbeddings

`Float32Array`\<`ArrayBufferLike`\>[]

Image embedding for each instance, in the same order as `instances`.

#### textEmbedding

`Float32Array`

Embedding of the text prompt.

#### topk?

`1`

Number of top matches to return (defaults to 1).

### Returns

[`SegmentedInstance`](../interfaces/SegmentedInstance.md)\<`L`\> \| `null`

The best matching instance (or null) if topk is 1, otherwise an array of the topk matching instances.

## Call Signature

> **selectByText**\<`L`\>(`instances`, `instanceEmbeddings`, `textEmbedding`, `topk`): [`SegmentedInstance`](../interfaces/SegmentedInstance.md)\<`L`\>[]

Defined in: [utils/segmentAnythingPrompts.ts:111](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/segmentAnythingPrompts.ts#L111)

Selects the best matching instance(s) for a text prompt.

Returns the instance(s) whose image embedding has the highest cosine similarity
with the text embedding. The caller is responsible for producing the
embeddings (e.g. with CLIP) and passing them in the same order as
`instances`.

### Type Parameters

#### L

`L` _extends_ `Readonly`\<`Record`\<`string`, `string` \| `number`\>\>

### Parameters

#### instances

[`SegmentedInstance`](../interfaces/SegmentedInstance.md)\<`L`\>[]

Array of segmented instances returned by `forward()`.

#### instanceEmbeddings

`Float32Array`\<`ArrayBufferLike`\>[]

Image embedding for each instance, in the same order as `instances`.

#### textEmbedding

`Float32Array`

Embedding of the text prompt.

#### topk

`number`

Number of top matches to return (defaults to 1).

### Returns

[`SegmentedInstance`](../interfaces/SegmentedInstance.md)\<`L`\>[]

The best matching instance (or null) if topk is 1, otherwise an array of the topk matching instances.
