# Interface: TextToImageProps

Defined in: [types/tti.ts:16](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tti.ts#L16)

Configuration properties for the `useTextToImage` hook.

## Properties

### inferenceCallback()?

> `optional` **inferenceCallback**: (`stepIdx`) => `void`

Defined in: [types/tti.ts:43](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tti.ts#L43)

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

Defined in: [types/tti.ts:20](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tti.ts#L20)

Object containing the required model sources for the diffusion pipeline.

#### decoderSource

> **decoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Source for the VAE decoder model binary, used to decode the final image.

#### encoderSource

> **encoderSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Source for the text encoder model binary.

#### modelName

> **modelName**: [`TextToImageModelName`](../type-aliases/TextToImageModelName.md)

The built-in model name (e.g. `'bk-sdm-tiny-vpred-512'`). Used for telemetry and hook reload triggers.
Pass one of the pre-built TTI constants (e.g. `BK_SDM_TINY_VPRED_512`) to populate all required fields.

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

Defined in: [types/tti.ts:49](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tti.ts#L49)

Boolean that can prevent automatic model loading (and downloading the data if loaded for the first time) after running the hook.
Defaults to `false`.
