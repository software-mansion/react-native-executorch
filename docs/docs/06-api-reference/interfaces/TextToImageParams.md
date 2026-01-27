# Interface: TextToImageParams

Defined in: [packages/react-native-executorch/src/types/tti.ts:7](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/types/tti.ts#L7)

Configuration properties for the `useTextToImage` hook.

## Properties

### inferenceCallback()?

> `optional` **inferenceCallback**: (`stepIdx`) => `void`

Defined in: [packages/react-native-executorch/src/types/tti.ts:29](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/types/tti.ts#L29)

Optional callback function that is triggered after each diffusion inference step.
Useful for updating a progress bar during image generation.

#### Parameters

##### stepIdx

`number`

The index of the current inference step.

#### Returns

`void`

***

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/tti.ts:11](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/types/tti.ts#L11)

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

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/tti.ts:35](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/types/tti.ts#L35)

Boolean that can prevent automatic model loading (and downloading the data if loaded for the first time) after running the hook.
Defaults to `false`.
