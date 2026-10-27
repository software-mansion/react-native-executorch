# Function: createVectorStore()

> **createVectorStore**\<`Metadata`\>(`options?`): [`VectorStore`](../type-aliases/VectorStore.md)\<`Metadata`\>

Defined in: [extensions/vectorStore.ts:250](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L250)

Creates an in-memory vector store with exact (brute-force) nearest-neighbor
search.

The store takes plain vectors, so it works with any embedder: the
`models.textEmbeddings` and `models.imageEmbeddings` ones, or vectors computed
elsewhere. Vectors live in one contiguous `Float32Array`, and a query scans
all of them, which takes a few milliseconds for tens of thousands of
384-dimensional vectors. Nothing is persisted.

## Type Parameters

### Metadata

`Metadata` = `undefined`

The type of the data stored alongside each vector.

## Parameters

### options?

[`VectorStoreOptions`](../type-aliases/VectorStoreOptions.md)

The vector dimension and similarity metric.
See [VectorStoreOptions](../type-aliases/VectorStoreOptions.md).

## Returns

[`VectorStore`](../type-aliases/VectorStore.md)\<`Metadata`\>

An empty [VectorStore](../type-aliases/VectorStore.md).

## Throws

With code `INVALID_ARGUMENT` if `dimension` is
not a positive integer or `metric` is unknown.

## Example

```ts
const store = createVectorStore<{ text: string }>();
store.add('a', await embedder.embed('The cat sleeps.'), { text: 'The cat sleeps.' });
const [best] = store.query(await embedder.embed('Where is the cat?'), 1);
```
