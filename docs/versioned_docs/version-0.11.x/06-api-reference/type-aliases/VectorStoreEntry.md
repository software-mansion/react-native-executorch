# Type Alias: VectorStoreEntry\<Metadata\>

> **VectorStoreEntry**\<`Metadata`\> = `object`

Defined in: [extensions/vectorStore.ts:36](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L36)

A vector held by a [VectorStore](VectorStore.md), with its id and metadata.

## Type Parameters

### Metadata

`Metadata`

## Properties

### id

> `readonly` **id**: `string`

Defined in: [extensions/vectorStore.ts:37](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L37)

---

### metadata

> `readonly` **metadata**: `Metadata`

Defined in: [extensions/vectorStore.ts:40](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L40)

---

### vector

> `readonly` **vector**: `Float32Array`

Defined in: [extensions/vectorStore.ts:39](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L39)

A copy of the stored vector.
