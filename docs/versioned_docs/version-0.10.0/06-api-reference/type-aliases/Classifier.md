# Type Alias: Classifier\<L\>

> **Classifier**\<`L`\> = `object`

Defined in: [extensions/cv/tasks/classification.ts:72](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/classification.ts#L72)

Image classification task runner.

## Type Parameters

### L

`L`

The type representing the classification labels.

## Properties

### classify()

> `readonly` **classify**: (`input`, `options?`) => `Promise`\<[`Classification`](Classification.md)\<`L`\>[]\>

Defined in: [extensions/cv/tasks/classification.ts:89](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/classification.ts#L89)

Performs asynchronous image classification on the given input image.

#### Parameters

##### input

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

The input image buffer.

##### options?

[`ClassifyOptions`](ClassifyOptions.md)

Configuration options for classification.
See [ClassifyOptions](ClassifyOptions.md).

#### Returns

`Promise`\<[`Classification`](Classification.md)\<`L`\>[]\>

A promise resolving to the list of classifications sorted by
confidence.

#### Throws

With code `INVALID_ARGUMENT` if `topk` is
negative, `RESOURCE_BUSY` if the model is in use, or
`RESOURCE_DISPOSED` if disposed.

---

### classifyWorklet()

> `readonly` **classifyWorklet**: (`input`, `options?`) => [`Classification`](Classification.md)\<`L`\>[]

Defined in: [extensions/cv/tasks/classification.ts:98](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/classification.ts#L98)

Synchronous version of [classify](#classify) to be executed directly on the
caller or worklet thread.

#### Parameters

##### input

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

##### options?

[`ClassifyOptions`](ClassifyOptions.md)

#### Returns

[`Classification`](Classification.md)\<`L`\>[]

---

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/cv/tasks/classification.ts:76](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/classification.ts#L76)

Releases all allocated native resources.

#### Returns

`void`
