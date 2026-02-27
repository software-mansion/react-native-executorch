# Interface: TextToImageProps

Defined in: [types/tti.ts:8](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tti.ts#L8)

Configuration properties for the `useTextToImage` hook.

## Properties

### inferenceCallback()?

> `optional` **inferenceCallback**: (`stepIdx`) => `void`

Defined in: [types/tti.ts:30](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tti.ts#L30)

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

Defined in: [types/tti.ts:12](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tti.ts#L12)

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

Defined in: [types/tti.ts:36](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/tti.ts#L36)

Boolean that can prevent automatic model loading (and downloading the data if loaded for the first time) after running the hook.
Defaults to `false`.
