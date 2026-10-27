# Type Alias: Inpainter

> **Inpainter** = `object`

Defined in: [extensions/cv/tasks/inpainting.ts:80](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/inpainting.ts#L80)

Image inpainting task runner.

## Properties

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/cv/tasks/inpainting.ts:84](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/inpainting.ts#L84)

Releases all allocated native resources.

#### Returns

`void`

---

### inpaint()

> `readonly` **inpaint**: (`image`, `mask`) => `Promise`\<[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)\>

Defined in: [extensions/cv/tasks/inpainting.ts:101](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/inpainting.ts#L101)

Fills the masked region of `image` and returns the whole frame with the
hole filled. The model sees the whole frame stretched to its input size;
to fill a small hole in a large photo at higher detail, crop the region
around it first and inpaint the crop.

#### Parameters

##### image

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

The input image buffer.

##### mask

[`MaskBuffer`](MaskBuffer.md)

A `'gray'` buffer of the same dimensions as `image` marking the
region to fill: any non-zero pixel is part of the hole. Pixels outside the
hole are returned unchanged.

#### Returns

`Promise`\<[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)\>

A promise resolving to the inpainted RGBA image buffer at the
input dimensions.

#### Throws

With code `INVALID_ARGUMENT` if `mask` is not
a `'gray'` buffer or does not match the dimensions of `image`,
`RESOURCE_BUSY` if the model is in use, or `RESOURCE_DISPOSED` if disposed.

---

### inpaintWorklet()

> `readonly` **inpaintWorklet**: (`image`, `mask`) => [`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

Defined in: [extensions/cv/tasks/inpainting.ts:107](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/inpainting.ts#L107)

Synchronous version of [inpaint](#inpaint) to be executed directly on the
caller or worklet thread.

#### Parameters

##### image

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

##### mask

[`MaskBuffer`](MaskBuffer.md)

#### Returns

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)
