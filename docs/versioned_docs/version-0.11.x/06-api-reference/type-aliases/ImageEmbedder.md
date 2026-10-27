# Type Alias: ImageEmbedder

> **ImageEmbedder** = `object`

Defined in: [extensions/cv/tasks/imageEmbedding.ts:35](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/imageEmbedding.ts#L35)

Image embedding task runner.

## Properties

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/cv/tasks/imageEmbedding.ts:39](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/imageEmbedding.ts#L39)

Releases all allocated native resources.

#### Returns

`void`

---

### embed()

> `readonly` **embed**: (`input`) => `Promise`\<`Float32Array`\>

Defined in: [extensions/cv/tasks/imageEmbedding.ts:48](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/imageEmbedding.ts#L48)

Asynchronously computes the embedding vector for the given input image.

#### Parameters

##### input

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

The input image buffer.

#### Returns

`Promise`\<`Float32Array`\>

A promise resolving to the embedding vector.

#### Throws

With code `RESOURCE_BUSY` if the model is in
use, or `RESOURCE_DISPOSED` if disposed.

---

### embedWorklet()

> `readonly` **embedWorklet**: (`input`) => `Float32Array`

Defined in: [extensions/cv/tasks/imageEmbedding.ts:54](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/imageEmbedding.ts#L54)

Synchronous version of [embed](#embed) to be executed directly on the
caller or worklet thread.

#### Parameters

##### input

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

#### Returns

`Float32Array`
