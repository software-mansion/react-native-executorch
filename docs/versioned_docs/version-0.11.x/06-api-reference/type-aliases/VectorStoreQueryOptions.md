# Type Alias: VectorStoreQueryOptions\<Metadata\>

> **VectorStoreQueryOptions**\<`Metadata`\> = `object`

Defined in: [extensions/vectorStore.ts:58](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L58)

Options for a single [VectorStore.query](VectorStore.md#query) call.

## Type Parameters

### Metadata

`Metadata`

## Properties

### filter()?

> `readonly` `optional` **filter**: (`id`, `metadata`) => `boolean`

Defined in: [extensions/vectorStore.ts:62](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L62)

Only entries for which this returns `true` are considered.

#### Parameters

##### id

`string`

##### metadata

`Metadata`

#### Returns

`boolean`

---

### minScore?

> `readonly` `optional` **minScore**: `number`

Defined in: [extensions/vectorStore.ts:60](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L60)

Drops matches scoring below this value.
