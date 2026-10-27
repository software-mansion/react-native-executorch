# Type Alias: VectorStore\<Metadata\>

> **VectorStore**\<`Metadata`\> = `object`

Defined in: [extensions/vectorStore.ts:69](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L69)

An in-memory vector store. See [createVectorStore](../functions/createVectorStore.md).

## Type Parameters

### Metadata

`Metadata` = `undefined`

## Properties

### dimension

> `readonly` **dimension**: `number` \| `undefined`

Defined in: [extensions/vectorStore.ts:71](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L71)

The vector length, or `undefined` until it is fixed by the first `add`.

---

### metric

> `readonly` **metric**: [`VectorStoreMetric`](VectorStoreMetric.md)

Defined in: [extensions/vectorStore.ts:73](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L73)

The similarity metric used by [VectorStore.query](#query).

---

### size

> `readonly` **size**: `number`

Defined in: [extensions/vectorStore.ts:75](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L75)

The number of stored vectors.

## Methods

### add()

> **add**(`id`, `vector`, ...`metadata`): `void`

Defined in: [extensions/vectorStore.ts:87](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L87)

Stores a vector under `id`, replacing any vector already stored under it.
The vector is copied, so the caller may reuse its buffer.

#### Parameters

##### id

`string`

The identifier to store the vector under.

##### vector

`ArrayLike`\<`number`\>

The vector to store.

##### metadata

...`undefined` _extends_ `Metadata` ? \[`Metadata`\] : \[`Metadata`\]

Arbitrary data returned alongside the vector by `get` and
`query`. Optional when `Metadata` admits `undefined`.

#### Returns

`void`

#### Throws

With code `INVALID_ARGUMENT` if the vector is
empty, has the wrong length, or contains a non-finite value.

---

### clear()

> **clear**(): `void`

Defined in: [extensions/vectorStore.ts:121](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L121)

Removes every vector. A dimension fixed by the first `add` is kept.

#### Returns

`void`

---

### get()

> **get**(`id`): [`VectorStoreEntry`](VectorStoreEntry.md)\<`Metadata`\> \| `undefined`

Defined in: [extensions/vectorStore.ts:112](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L112)

Returns the vector stored under `id`.

#### Parameters

##### id

`string`

The identifier to look up.

#### Returns

[`VectorStoreEntry`](VectorStoreEntry.md)\<`Metadata`\> \| `undefined`

The stored entry, or `undefined` if `id` is not stored.

---

### has()

> **has**(`id`): `boolean`

Defined in: [extensions/vectorStore.ts:105](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L105)

Whether a vector is stored under `id`.

#### Parameters

##### id

`string`

The identifier to look up.

#### Returns

`boolean`

`true` if `id` is stored.

---

### ids()

> **ids**(): `string`[]

Defined in: [extensions/vectorStore.ts:118](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L118)

Returns the stored ids, in no particular order.

#### Returns

`string`[]

The stored ids.

---

### query()

> **query**(`vector`, `k?`, `options?`): [`VectorStoreMatch`](VectorStoreMatch.md)\<`Metadata`\>[]

Defined in: [extensions/vectorStore.ts:133](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L133)

Finds the `k` stored vectors most similar to `vector`.

#### Parameters

##### vector

`ArrayLike`\<`number`\>

The query vector.

##### k?

`number`

The maximum number of matches to return. Defaults to 10.

##### options?

[`VectorStoreQueryOptions`](VectorStoreQueryOptions.md)\<`Metadata`\>

Optional score threshold and entry filter.
See [VectorStoreQueryOptions](VectorStoreQueryOptions.md).

#### Returns

[`VectorStoreMatch`](VectorStoreMatch.md)\<`Metadata`\>[]

Up to `k` matches, most similar first.

#### Throws

With code `INVALID_ARGUMENT` if the vector has
the wrong length or `k` is not a non-negative integer.

---

### remove()

> **remove**(`id`): `boolean`

Defined in: [extensions/vectorStore.ts:98](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L98)

Removes the vector stored under `id`.

#### Parameters

##### id

`string`

The identifier to remove.

#### Returns

`boolean`

`true` if a vector was removed, `false` if `id` was not stored.
