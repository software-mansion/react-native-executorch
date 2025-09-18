---
title: useTextToImage
keywords: []
description: "Learn how to use image generation models in your React Native applications with React Native ExecuTorch's useTextToImage hook."
---

Text-to-image is a process of generating images directly from a description in natural language by conditioning a model on the provided text input. Our implementation follows the Stable Diffusion pipeline, which applies the diffusion process in a lower-dimensional latent space to reduce memory requirements. The pipeline combines a text encoder to preprocess the prompt, a U-Net that iteratively denoises latent representations, and a VAE decoder to reconstruct the final image. React Native ExecuTorch offers a dedicated hook, `useTextToImage`, for this task.

<!-- Update links after uploading the model to Swm HuggingFace -->

:::caution
It is recommended to use models provided by us which are available at our [Hugging Face repository](), you can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## Reference

```typescript
import { useTextToImage, BK_SDM_TINY_VPRED } from 'react-native-executorch';

const model = useTextToImage({ model: BK_SDM_TINY_VPRED });

const input = 'a castle';

try {
  const image = await model.generate(input);
} catch (error) {
  console.error(error);
}
```

### Arguments

**`model`** - Object containing the model source.

- **`schedulerSource`** - A string that specifies the location of the scheduler config.
- **`tokenizerSource`** - A string that specifies the location of the tokenizer config.
- **`encoderSource`** - A string that specifies the location of the text encoder binary.
- **`unetSource`** - A string that specifies the location of the UNet binary.
- **`decoderSource`** - A string that specifies the location of the VAE decoder binary.

**`preventLoad?`** - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

| Field              | Type                                                                        | Description                                                                                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate`         | `(input: string, imageSize?: number, numSteps?: number) => Promise<string>` | Runs the model to generate an image described by `input`, performing `numSteps` inference passes. The resulting image, with dimensions `imageSize`×`imageSize` pixels, is returned as a base64-encoded string. |
| `error`            | <code>string &#124; null</code>                                             | Contains the error message if the model failed to load.                                                                                                                                                        |
| `isGenerating`     | `boolean`                                                                   | Indicates whether the model is currently processing an inference.                                                                                                                                              |
| `isReady`          | `boolean`                                                                   | Indicates whether the model has successfully loaded and is ready for inference.                                                                                                                                |
| `downloadProgress` | `number`                                                                    | Represents the download progress as a value between 0 and 1.                                                                                                                                                   |
| `interrupt()`      | `() => void`                                                                | Interrupts the current inference. The model is stopped in the nearest inference step.                                                                                                                          |

## Running the model

To run the model, you can use the `generate` method. It accepts three arguments: a text prompt describing the requested image, an optional size of the image in pixels, and an optional number of inference steps.

:::caution
The image size must fall within the range from 128 to 512 unless specified differently, and be a multiple of 32 due to the architecture of the UNet and VAE models.

Larger imageSize values require significantly more memory to run the model.
:::

## Example

```tsx
import { useTextToImage, BK_SDM_TINY_VPRED } from 'react-native-executorch';

function App() {
  const model = useTextToImage({ model: BK_SDM_TINY_VPRED });

  //...
  const input = 'a medieval castle by the sea shore';

  const imageSize = 512;
  const numSteps = 10;

  try {
    image = await model.generate(input, imageSize, numSteps);
  } catch (error) {
    console.error(error);
  }
  //...

  return <Image source={{ uri: `data:image/png;base64,${inputState.uri}` }} />;
}
```

<img src="../../../static/img/castle.png" alt="Castle" width="300" />

## Supported models

| Model                                                               | Number of parameters [B] | Image size [pixels]                                                                                                                                                                                                                                                                                                         | Description |
| ------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| [bk-sdm-tiny-vpred](https://huggingface.co/vivym/bk-sdm-tiny-vpred) | 0.5                      | BK-SDM (Block-removed Knowledge-distilled Stable Diffusion Model) is a compressed version of Stable Diffusion v1.4 with several residual and attention blocks removed from the U-Net. The BK-SDM-Tiny is a v-prediction variant of the model, obtained through further block removal, built around a 0.33B-parameter U-Net. |

|

## Benchmarks

:::info
The number following the underscore (\_) specifies that the model is exported with a static input size. This helps optimize memory usage by allocating only as much as needed. In contrast, models exported with dynamic input shapes allocate memory up to the maximum allowed input dimensions, which can be less efficient. This setting has no effect on the actual model size, only on how memory is allocated at runtime.
:::

### Model size

| Model             | Text encoder (XNNPACK) [MB] | UNet (XNNPACK) [MB] | VAE decoder (XNNPACK) [MB] |
| ----------------- | --------------------------- | ------------------- | -------------------------- |
| BK_SDM_TINY_VPRED | 492                         | 1290                | 198                        |

### Memory usage

| Model                 | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| --------------------- | ---------------------- | ------------------ |
| BK_SDM_TINY_VPRED_256 | 2900                   | 2800               |
| BK_SDM_TINY_VPRED     | 6700                   | 6560               |

### Inference time

:::warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

| Model                 | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro Max (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| --------------------- | :--------------------------: | :------------------------------: | :-------------------: | :-------------------------------: | :-----------------------: |
| BK_SDM_TINY_VPRED_256 |            19100             |                ?                 |          ❌           |                ❌                 |           23100           |

:::info
Text-to-image benchmark times are measured generating 256×256 images in 10 inference steps.
:::
