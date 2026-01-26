# Interface: TextToImageType

Defined in: packages/react-native-executorch/src/types/tti.ts:42

Return type for the `useTextToImage` hook.
Manages the state and operations for generating images from text prompts using a diffusion model pipeline.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: packages/react-native-executorch/src/types/tti.ts:61

Represents the total download progress of all the model binaries combined, as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: packages/react-native-executorch/src/types/tti.ts:46

Contains the error object if any of the pipeline models failed to load, download, or encountered a runtime error.

***

### generate()

> **generate**: (`input`, `imageSize?`, `numSteps?`, `seed?`) => `Promise`\<`string`\>

Defined in: packages/react-native-executorch/src/types/tti.ts:72

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

Optional. A random seed for reproducible generation.

#### Returns

`Promise`\<`string`\>

A Promise that resolves to a string representing the generated image (e.g., base64 string or file URI).

#### Throws

If the model is not loaded or is currently generating another image.

***

### interrupt()

> **interrupt**: () => `void`

Defined in: packages/react-native-executorch/src/types/tti.ts:82

Interrupts the currently active image generation process at the next available inference step.

#### Returns

`void`

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: packages/react-native-executorch/src/types/tti.ts:56

Indicates whether the model is currently generating an image.

***

### isReady

> **isReady**: `boolean`

Defined in: packages/react-native-executorch/src/types/tti.ts:51

Indicates whether the entire diffusion pipeline is loaded into memory and ready for generation.
