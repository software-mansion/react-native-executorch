# Type Alias: StyleTransfer

> **StyleTransfer** = `object`

Defined in: [extensions/cv/tasks/styleTransfer.ts:57](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/styleTransfer.ts#L57)

Image style transfer task runner.

## Properties

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/cv/tasks/styleTransfer.ts:61](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/styleTransfer.ts#L61)

Releases all allocated native resources.

#### Returns

`void`

---

### transferStyle()

> `readonly` **transferStyle**: (`input`) => `Promise`\<[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)\>

Defined in: [extensions/cv/tasks/styleTransfer.ts:70](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/styleTransfer.ts#L70)

Performs asynchronous image style transfer on the given input image.

#### Parameters

##### input

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

The input image buffer.

#### Returns

`Promise`\<[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)\>

A promise resolving to the styled image buffer.

#### Throws

With code `RESOURCE_BUSY` if the model is in
use, or `RESOURCE_DISPOSED` if disposed.

---

### transferStyleWorklet()

> `readonly` **transferStyleWorklet**: (`input`) => [`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

Defined in: [extensions/cv/tasks/styleTransfer.ts:76](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/styleTransfer.ts#L76)

Synchronous version of [transferStyle](#transferstyle) to be executed directly on the
caller or worklet thread.

#### Parameters

##### input

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

#### Returns

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)
