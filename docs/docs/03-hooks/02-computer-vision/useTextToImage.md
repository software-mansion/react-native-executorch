---
title: useTextToImage
keywords: [image generation]
description: "Learn how to use image generation models in your React Native applications with React Native ExecuTorch's useTextToImage hook."
---

Text-to-image is a process of generating images directly from a description in natural language by conditioning a model on the provided text input. Our implementation follows the Stable Diffusion pipeline, which applies the diffusion process in a lower-dimensional latent space to reduce memory requirements. The pipeline combines a text encoder to preprocess the prompt, a U-Net that iteratively denoises latent representations, and a VAE decoder to reconstruct the final image. React Native ExecuTorch offers a dedicated hook, `useTextToImage`, for this task.

:::warning
It is recommended to use models provided by us which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/text-to-image-68d0edf50ae6d20b5f9076cd), you can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

- For detailed API Reference for `useTextToImage` see: [`useTextToImage` API Reference](../../06-api-reference/functions/useTextToImage.md).
- For all text to image models available out-of-the-box in React Native ExecuTorch see: [Text to Image Models](../../06-api-reference/index.md#models---image-generation).

## High Level Overview

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

`useTextToImage` takes [`TextToImageProps`](../../06-api-reference/interfaces/TextToImageProps.md) that consists of:

- `model` containing [`schedulerSource`](../../06-api-reference/interfaces/TextToImageProps.md#schedulersource), [`tokenizerSource`](../../06-api-reference/interfaces/TextToImageProps.md#tokenizersource), [`encoderSource`](../../06-api-reference/interfaces/TextToImageProps.md#encodersource), [`unetSource`](../../06-api-reference/interfaces/TextToImageProps.md#unetsource), and [`decoderSource`](../../06-api-reference/interfaces/TextToImageProps.md#decodersource).
- An inference callback [`inferenceCallback`](../../06-api-reference/interfaces/TextToImageProps.md#inferencecallback).
- An optional flag [`preventLoad`](../../06-api-reference/interfaces/TextToImageProps.md#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:

- For detailed information about `useTextToImage` arguments check this section: [`useTextToImage` arguments](../../06-api-reference/functions/useTextToImage.md#parameters).
- For all text to image models available out-of-the-box in React Native ExecuTorch see: [Text to Image Models](../../06-api-reference/index.md#models---image-generation).
- For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useTextToImage` returns an object called `TextToImageType` containing bunch of functions to interact with text to image models. To get more details please read: [`TextToImageType` API Reference](../../06-api-reference/interfaces/TextToImageType.md).

## Running the model

To run the model, you can use the [`generate`](../../06-api-reference/interfaces/TextToImageType.md#generate) method. It accepts four arguments: a text prompt describing the requested image, a size of the image in pixels, a number of denoising steps, and an optional seed value, which enables reproducibility of the results.

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

| ![Castle 256x256](/img/castle256.png) | ![Castle 512x512](/img/castle512.png) |
| ------------------------------------- | ------------------------------------- |
| Image of size 256×256                 | Image of size 512×512                 |

## Supported models

| Model                                                               | Parameters [B] | Description                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [bk-sdm-tiny-vpred](https://huggingface.co/vivym/bk-sdm-tiny-vpred) | 0.5            | BK-SDM (Block-removed Knowledge-distilled Stable Diffusion Model) is a compressed version of Stable Diffusion v1.4 with several residual and attention blocks removed. The BK-SDM-Tiny is a v-prediction variant of the model, obtained through further block removal, built around a 0.33B-parameter U-Net. |
