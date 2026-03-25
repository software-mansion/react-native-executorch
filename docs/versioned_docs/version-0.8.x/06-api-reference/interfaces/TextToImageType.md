# Interface: TextToImageType

Defined in: [types/tti.ts:57](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tti.ts#L57)

Return type for the `useTextToImage` hook.
Manages the state and operations for generating images from text prompts using a diffusion model pipeline.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/tti.ts:76](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tti.ts#L76)

Represents the total download progress of all the model binaries combined, as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/tti.ts:61](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tti.ts#L61)

Contains the error object if any of the pipeline models failed to load, download, or encountered a runtime error.

***

### generate()

> **generate**: (`input`, `imageSize?`, `numSteps?`, `seed?`) => `Promise`\<`string`\>

Defined in: [types/tti.ts:87](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tti.ts#L87)

Runs the diffusion pipeline to generate an image from the provided text prompt.

#### Parameters

##### input

`string`

The text prompt describing the desired image.

##### imageSize?

`number`

Optional. The target width and height of the generated image (e.g., 512 for 512x512). Defaults to the model's standard size if omitted.

##### numSteps?

`number`

Optional. The number of denoising steps for the diffusion process. More steps generally yield higher quality at the cost of generation time.

##### seed?

`number`

Optional. A random seed for reproducible generation. Should be a positive integer.

#### Returns

`Promise`\<`string`\>

A Promise that resolves to a string representing the generated image (e.g., base64 string or file URI).

#### Throws

If the model is not loaded or is currently generating another image.

***

### interrupt()

> **interrupt**: () => `void`

Defined in: [types/tti.ts:97](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tti.ts#L97)

Interrupts the currently active image generation process at the next available inference step.

#### Returns

`void`

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/tti.ts:71](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tti.ts#L71)

Indicates whether the model is currently generating an image.

***

### isReady

> **isReady**: `boolean`

Defined in: [types/tti.ts:66](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/tti.ts#L66)

Indicates whether the entire diffusion pipeline is loaded into memory and ready for generation.
