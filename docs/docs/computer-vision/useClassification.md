---
title: useClassification
sidebar_position: 1
---

Image classification is the process of assigning a label to an image that best describes its contents. For example, when given an image of a puppy, the image classifier should assign the puppy class to that image.

:::info
Usually, the class with the highest probability is the one that is assigned to an image. However, if there are multiple classes with comparatively high probabilities, this may indicate that the model is not confident in its prediction.
:::

:::caution
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/software-mansion/react-native-executorch-efficientnet-v2-s). You can also use [constants](https://github.com/software-mansion/react-native-executorch/tree/main/src/constants/modelUrls.ts) shipped with our library
:::

## Reference

```typescript
import { useClassification, EFFICIENTNET_V2_S } from 'react-native-executorch';

const model = useClassification({
  modelSource: EFFICIENTNET_V2_S,
});

const imageUri = 'file::///Users/.../cute_puppy.png';

try {
  const classesWithProbabilities = await model.forward(imageUri);
} catch (error) {
  console.error(error);
}
```

### Arguments

**`modelSource`**
A string that specifies the location of the model binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) page.

### Returns

| Field          | Type                                                         | Description                                                                                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `forward`      | `(input: string) => Promise<{ [category: string]: number }>` | Executes the model's forward pass, where `input` can be a fetchable resource or a Base64-encoded string. |
| `error`        | <code>string &#124; null</code>                              | Contains the error message if the model failed to load.                                                  |
| `isGenerating` | `boolean`                                                    | Indicates whether the model is currently processing an inference.                                        |
| `isReady`      | `boolean`                                                    | Indicates whether the model has successfully loaded and is ready for inference.                          |

## Running the model

To run the model, you can use the `forward` method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The function returns a promise, which can resolve either to an error or an object containing categories with their probabilities.

:::info
Images from external sources are stored in your application's temporary directory.
:::

## Example

```typescript
import { useClassification, EFFICIENTNET_V2_S } from 'react-native-executorch';

function App() {
  const model = useClassification({
    modulePath: EFFICIENTNET_V2_S,
  });

  ...
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
  ...
}
```

## Supported models

| Model                                                                                                           | Number of classes | Class list                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [efficientnet_v2_s](https://pytorch.org/vision/0.20/models/generated/torchvision.models.efficientnet_v2_s.html) | 1000              | [ImageNet1k_v1](https://github.com/software-mansion/react-native-executorch/blob/main/android/src/main/java/com/swmansion/rnexecutorch/models/classification/Constants.kt) |

## Benchmarks

### Model size

| Model             | XNNPACK [MB] | Core ML [MB] |
| ----------------- | ------------ | ------------ |
| EFFICIENTNET_V2_S | 85.6         | 43.9         |

### Memory usage

| Model             | Android (XNNPACK) [MB] | iOS (Core ML) [MB] |
| ----------------- | ---------------------- | ------------------ |
| EFFICIENTNET_V2_S | 130                    | 85                 |

### Inference time

:::warning warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

| Model             | iPhone 16 Pro (Core ML) [ms] | iPhone 13 Pro (Core ML) [ms] | iPhone SE 3 (Core ML) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ----------------- | ---------------------------- | ---------------------------- | -------------------------- | --------------------------------- | ------------------------- |
| EFFICIENTNET_V2_S | 100                          | 120                          | 130                        | 180                               | 170                       |
