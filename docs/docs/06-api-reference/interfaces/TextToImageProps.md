# Interface: TextToImageProps

Defined in: [packages/react-native-executorch/src/types/tti.ts:9](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/types/tti.ts#L9)

Configuration properties for the `useTextToImage` hook.

## Properties

### inferenceCallback()?

> `optional` **inferenceCallback**: (`stepIdx`) => `void`

Defined in: [packages/react-native-executorch/src/types/tti.ts:31](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/types/tti.ts#L31)

Optional callback function that is triggered after each diffusion inference step.
Useful for updating a progress bar during image generation.

#### Parameters

##### stepIdx

`number`

The index of the current inference step.

#### Returns

`void`

---

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/tti.ts:13](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/types/tti.ts#L13)

Object containing the required model sources for the diffusion pipeline.

#### decoderSource

> **decoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Source for the VAE decoder model binary, used to decode the final image.

#### encoderSource

> **encoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Source for the text encoder model binary.

#### schedulerSource

> **schedulerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Source for the diffusion scheduler binary/config.

#### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Source for the text tokenizer binary/config.

#### unetSource

> **unetSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Source for the UNet (noise predictor) model binary.

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/tti.ts:37](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/types/tti.ts#L37)

Boolean that can prevent automatic model loading (and downloading the data if loaded for the first time) after running the hook.
Defaults to `false`.
