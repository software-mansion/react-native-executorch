---
title: useClassification
sidebar_position: 1
---

Image classification is the process of assigning a category to an image that best describes its contents. For example, when given an image of a hotdog, the image classifier should assign the hotdog class to that image.

:::info
Usually, the class with the highest probability is the one that is assigned to an image. However, if there are multiple classes with comparatively high probabilities, this may indicate that the model is not confident in its prediction.
:::

### Initializing

```typescript
import { useClassification, EFFICIENTNET_V2_S } from 'react-native-executorch';

const model = useClassification({
  modelSource: EFFICIENTNET_V2_S,
});
```

The provided code snippet fetches the model from the specified `modelSource`, loads it into memory and returns an object with various methods and properties enabling you to control the model's lifecycle.

## Arguments

**`modelSource`** - A string that specifies the location of the model binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) page.

## Returns

| Field               | Type                                                         | Description                                                                                              |
| ------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `forward`           | `(input: string) => Promise<{ [category: string]: number }>` | Executes the model's forward pass, where `input` can be a fetchable resource or a Base64-encoded string. |
| `error`             | <code>string &#124; null</code>                              | Contains the error message if the model failed to load.                                                  |
| `isModelGenerating` | `boolean`                                                    | Indicates whether the model is currently performing classification.                                      |
| `isModelReady`      | `boolean`                                                    | Indicates whether the model is ready.                                                                    |

:::info[Info]
Images from external sources are stored in your application's temporary directory.
:::

## Usage

In order to perform image classification, you should use the following code:

```typescript
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
```

The forward function returns a promise, which resolves to an object mapping class names to their probabilities. Handle the promise result as needed, for example, by determining the classes with the highest probabilities.

### Output format

- `keys`: These are the class names that the model predicts.
- `values`: These represent the probability associated with each class, indicating the model's confidence that the image belongs to that class.

## Supported Models and Classes

| Model                                                                                                           | Number of classes | Class list                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [efficientnet_v2_s](https://pytorch.org/vision/0.20/models/generated/torchvision.models.efficientnet_v2_s.html) | 1000              | [ImageNet1k_v1](https://github.com/software-mansion/react-native-executorch/blob/main/android/src/main/java/com/swmansion/rnexecutorch/models/classification/Constants.kt) |
