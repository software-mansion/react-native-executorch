---
title: useTextToImage
keywords: [image generation]
description: "Learn how to use image generation models in your React Native applications with React Native ExecuTorch's useTextToImage hook."
---

Text-to-image is a process of generating images directly from a description in natural language by conditioning a model on the provided text input. Our implementation follows the Stable Diffusion pipeline, which applies the diffusion process in a lower-dimensional latent space to reduce memory requirements. The pipeline combines a text encoder to preprocess the prompt, a U-Net that iteratively denoises latent representations, and a VAE decoder to reconstruct the final image. React Native ExecuTorch offers a dedicated hook, `useTextToImage`, for this task.

<!-- Update links after uploading the model to Swm HuggingFace -->

:::warning
It is recommended to use models provided by us which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/text-to-image-68d0edf50ae6d20b5f9076cd), you can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## Reference

```typescript
import { useTextToImage, BK_SDM_TINY_VPRED_256 } from 'react-native-executorch';

const model = useTextToImage({ model: BK_SDM_TINY_VPRED_256 });

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

- **`unetSource`** - A string that specifies the location of the U-Net binary.

- **`decoderSource`** - A string that specifies the location of the VAE decoder binary.

**`preventLoad?`** - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

| Field              | Type                                                                                       | Description                                                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate`         | `(input: string, imageSize?: number, numSteps?: number, seed?: number) => Promise<string>` | Runs the model to generate an image described by `input`, and conditioned by `seed`, performing `numSteps` inference steps. The resulting image, with dimensions `imageSize`×`imageSize` pixels, is returned as a base64-encoded string. |
| `error`            | <code>string &#124; null</code>                                                            | Contains the error message if the model failed to load.                                                                                                                                                                                  |
| `isGenerating`     | `boolean`                                                                                  | Indicates whether the model is currently processing an inference.                                                                                                                                                                        |
| `isReady`          | `boolean`                                                                                  | Indicates whether the model has successfully loaded and is ready for inference.                                                                                                                                                          |
| `downloadProgress` | `number`                                                                                   | Represents the download progress as a value between 0 and 1.                                                                                                                                                                             |
| `interrupt()`      | `() => void`                                                                               | Interrupts the current inference. The model is stopped in the nearest inference step.                                                                                                                                                    |

## Running the model

To run the model, you can use the `forward` method. It accepts four arguments: a text prompt describing the requested image, a size of the image in pixels, a number of denoising steps, and an optional seed value, which enables reproducibility of the results.

The image size must be a multiple of 32 due to the architecture of the U-Net and VAE models. The seed should be a positive integer.

:::warning
Larger imageSize values require significantly more memory to run the model.
:::

## Example

```tsx
import { useTextToImage, BK_SDM_TINY_VPRED_256 } from 'react-native-executorch';

function App() {
  const model = useTextToImage({ model: BK_SDM_TINY_VPRED_256 });

  //...
  const input = 'a medieval castle by the sea shore';

  const imageSize = 256;
  const numSteps = 25;

  try {
    image = await model.generate(input, imageSize, numSteps);
  } catch (error) {
    console.error(error);
  }
  //...

  return <Image source={{ uri: `data:image/png;base64,${image}` }} />;
}
```

| ![Castle 256x256](../../../static/img/castle256.png) | ![Castle 512x512](../../../static/img/castle512.png) |
| ---------------------------------------------------- | ---------------------------------------------------- |
| Image of size 256×256                                | Image of size 512×512                                |

## Supported models

| Model                                                               | Parameters [B] | Description                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [bk-sdm-tiny-vpred](https://huggingface.co/vivym/bk-sdm-tiny-vpred) | 0.5            | BK-SDM (Block-removed Knowledge-distilled Stable Diffusion Model) is a compressed version of Stable Diffusion v1.4 with several residual and attention blocks removed. The BK-SDM-Tiny is a v-prediction variant of the model, obtained through further block removal, built around a 0.33B-parameter U-Net. |

## Benchmarks

:::info
The number following the underscore (\_) indicates that the model supports generating image with dimensions ranging from 128 pixels up to that value. This setting doesn’t affect the model’s file size - it only determines how memory is allocated at runtime, based on the maximum allowed image size.
:::

### Model size

| Model                 | Text encoder (XNNPACK) [MB] | UNet (XNNPACK) [MB] | VAE decoder (XNNPACK) [MB] |
| --------------------- | --------------------------- | ------------------- | -------------------------- |
| BK_SDM_TINY_VPRED_256 | 492                         | 1290                | 198                        |
| BK_SDM_TINY_VPRED_512 | 492                         | 1290                | 198                        |

### Memory usage

| Model                 | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| --------------------- | ---------------------- | ------------------ |
| BK_SDM_TINY_VPRED_256 | 2900                   | 2800               |
| BK_SDM_TINY_VPRED_512 | 6700                   | 6560               |

### Inference time

| Model                 | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| --------------------- | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| BK_SDM_TINY_VPRED_256 |            21184             |            21021             |             ❌             |               18834               |           16617           |

:::info
Text-to-image benchmark times are measured generating 256×256 images in 10 inference steps.
:::
