---
title: useClassification
---

Image classification is the process of assigning a label to an image that best describes its contents. For example, when given an image of a puppy, the image classifier should assign the puppy class to that image.

:::info
Usually, the class with the highest probability is the one that is assigned to an image. However, if there are multiple classes with comparatively high probabilities, this may indicate that the model is not confident in its prediction.
:::

:::warning
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/classification-68d0ea49b5c7de8a3cae1e68). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

* For detailed API Reference for `useClassification` see: [`useClassification` API Reference](../../06-api-reference/functions/useClassification.md).
* For all classification models available out-of-the-box in React Native ExecuTorch see: [Classification Models](../../06-api-reference/index.md#models---classification).

## Reference

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
* `model` containing [`modelSource`](../../06-api-reference/interfaces/ClassificationProps.md#modelsource). 
* An optional flag [`preventLoad`](../../06-api-reference/interfaces/ClassificationProps.md#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:
* For detailed information about `useClassification` arguments check this section: [`useClassification` arguments](../../06-api-reference/functions/useClassification.md#parameters).
* For all classification models available out-of-the-box in React Native ExecuTorch see: [Classification Models](../../06-api-reference/index.md#models---classification).
* For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useClassification` returns an object called `ClassificationType` containing bunch of functions to interact with Classification models. To get more details please read: [`ClassificationType` API Reference](../../06-api-reference/interfaces/ClassificationType.md).

## Running the model

To run the model, you can use the [`forward`](../../06-api-reference/interfaces/ClassificationType.md#forward) method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The function returns a promise, which can resolve either to an error or an object containing categories with their probabilities.

:::info
Images from external sources are stored in your application's temporary directory.
:::

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

| Model                                                                                                             | Number of classes | Class list                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [efficientnet_v2_s](https://huggingface.co/software-mansion/react-native-executorch-efficientnet-v2-s) | 1000              | [ImageNet1k_v1](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/common/rnexecutorch/models/classification/Constants.h) |
