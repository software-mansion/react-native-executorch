---
title: useClassification
---

Image classification is the process of assigning a label to an image that best describes its contents. For example, when given an image of a puppy, the image classifier should assign the puppy class to that image.

:::note
Usually, the class with the highest probability is the one that is assigned to an image. However, if there are multiple classes with comparatively high probabilities, this may indicate that the model is not confident in its prediction.
:::

:::info
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/classification-68d0ea49b5c7de8a3cae1e68). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

- For detailed API Reference for `useClassification` see: [`useClassification` API Reference](../../06-api-reference/functions/useClassification.md).
- For all classification models available out-of-the-box in React Native ExecuTorch see: [Classification Models](../../06-api-reference/index.md#models---classification).

## High Level Overview

```typescript
import { useClassification, EFFICIENTNET_V2_S } from 'react-native-executorch';

const model = useClassification({ model: EFFICIENTNET_V2_S });

const imageUri = 'file::///Users/.../cute_puppy.png';

try {
  const classesWithProbabilities = await model.forward(imageUri);
} catch (error) {
  console.error(error);
}
```

### Arguments

`useClassification` takes [`ClassificationProps`](../../06-api-reference/interfaces/ClassificationProps.md) that consists of:

- `model` - An object containing:
  - `modelName` - The name of a built-in model. See [`ClassificationModelSources`](../../06-api-reference/interfaces/ClassificationProps.md) for the list of supported models.
  - `modelSource` - The location of the model binary (a URL or a bundled resource).
- An optional flag [`preventLoad`](../../06-api-reference/interfaces/ClassificationProps.md#preventload) which prevents auto-loading of the model.

The hook is generic over the model config — TypeScript automatically infers the correct label type based on the `modelName` you provide. No explicit generic parameter is needed.

You need more details? Check the following resources:

- For detailed information about `useClassification` arguments check this section: [`useClassification` arguments](../../06-api-reference/functions/useClassification.md#parameters).
- For all classification models available out-of-the-box in React Native ExecuTorch see: [Classification Models](../../06-api-reference/index.md#models---classification).
- For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useClassification` returns a [`ClassificationType`](../../06-api-reference/interfaces/ClassificationType.md) object containing:

- `isReady` - Whether the model is loaded and ready to process images.
- `isGenerating` - Whether the model is currently processing an image.
- `error` - An error object if the model failed to load or encountered a runtime error.
- `downloadProgress` - A value between 0 and 1 representing the download progress of the model binary.
- `forward` - A function to run inference on an image.

## Running the model

To run the model, use the [`forward`](../../06-api-reference/interfaces/ClassificationType.md#forward) method. It accepts one argument — the image to classify. The image can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](../../06-api-reference/interfaces/PixelData.md) object (raw RGB pixel buffer). The function returns a promise resolving to an object mapping label keys to their probabilities.

:::info
Images from external sources are stored in your application's temporary directory.
:::

## VisionCamera integration

See the full guide: [VisionCamera Integration](./visioncamera-integration.md).

## Example

```typescript
import { useClassification, EFFICIENTNET_V2_S } from 'react-native-executorch';

function App() {
  const model = useClassification({ model: EFFICIENTNET_V2_S });

  // ...
  const imageUri = 'file:///Users/.../cute_puppy.png';

  try {
    const classesWithProbabilities = await model.forward(imageUri);

    // Extract three classes with the highest probabilities
    const topThreeClasses = Object.entries(classesWithProbabilities)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([label, score]) => ({ label, score }));
  } catch (error) {
    console.error(error);
  }
  // ...
}
```

## Supported models

| Model                                                                                                  | Number of classes | Class list                                                                                                                                                                                  | Quantized |
| ------------------------------------------------------------------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: |
| [efficientnet_v2_s](https://huggingface.co/software-mansion/react-native-executorch-efficientnet-v2-s) | 1000              | [ImageNet1k_v1](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/constants/classification.ts) |    ✅     |
