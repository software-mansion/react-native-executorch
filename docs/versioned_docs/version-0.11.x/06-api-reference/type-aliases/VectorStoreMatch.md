# Type Alias: VectorStoreMatch\<Metadata\>

> **VectorStoreMatch**\<`Metadata`\> = `object`

Defined in: [extensions/vectorStore.ts:47](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L47)

A single [VectorStore.query](VectorStore.md#query) result.

## Type Parameters

### Metadata

`Metadata`

## Properties

### id

> `readonly` **id**: `string`

Defined in: [extensions/vectorStore.ts:48](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L48)

---

### metadata

> `readonly` **metadata**: `Metadata`

Defined in: [extensions/vectorStore.ts:51](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L51)

---

### score

> `readonly` **score**: `number`

Defined in: [extensions/vectorStore.ts:50](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L50)

The similarity to the query under the store's metric; higher is closer.
