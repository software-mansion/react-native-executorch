# Type Alias: SdxsTextToImage

> **SdxsTextToImage** = `object`

Defined in: [extensions/cv/tasks/sdxsTextToImage.ts:57](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/sdxsTextToImage.ts#L57)

SDXS single-step text-to-image generation task runner.

## Properties

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/cv/tasks/sdxsTextToImage.ts:61](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/sdxsTextToImage.ts#L61)

Releases all allocated native resources.

#### Returns

`void`

---

### generate()

> `readonly` **generate**: (`prompt`, `seed?`) => `Promise`\<[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)\>

Defined in: [extensions/cv/tasks/sdxsTextToImage.ts:72](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/sdxsTextToImage.ts#L72)

Generates an image from a text prompt.

#### Parameters

##### prompt

`string`

The text prompt describing the desired image.

##### seed?

`number`

Seed for the initial latent noise (same seed → same image).
Defaults to a time-based value so omitting it yields a fresh image each call.

#### Returns

`Promise`\<[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)\>

A promise resolving to the generated RGBA image buffer.

#### Throws

With code `RESOURCE_BUSY` if the model is in
use, or `RESOURCE_DISPOSED` if disposed.

---

### generateWorklet()

> `readonly` **generateWorklet**: (`prompt`, `seed?`) => [`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

Defined in: [extensions/cv/tasks/sdxsTextToImage.ts:78](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/sdxsTextToImage.ts#L78)

Synchronous version of [generate](#generate) to be executed directly on the
caller or worklet thread.

#### Parameters

##### prompt

`string`

##### seed?

`number`

#### Returns

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)
