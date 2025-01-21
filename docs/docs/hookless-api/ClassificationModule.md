---
title: ClassificationModule
sidebar_position: 1
---

Hookless implementation of the [useClassification](../computer-vision/useClassification.mdx) hook.

## Reference

```typescript
import {
  ClassificationModule,
  EFFICIENTNET_V2_S,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Loading the model
await ClassificationModule.load(EFFICIENTNET_V2_S);

// Running the model
const classesWithProbabilities = await ClassificationModule.forward(imageUri);
```

### Methods

| Method    | Parameters                                     | Returns                                   | Description                                                                                              |
| --------- | ---------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `load`    | <code>modelSource: string &#124; number</code> | `Promise<void>`                           | Loads the model, where `modelSource` is a string that specifies the location of the model binary.        |
| `forward` | `input: string`                                | `Promise<{ [category: string]: number }>` | Executes the model's forward pass, where `input` can be a fetchable resource or a Base64-encoded string. |

## Loading the model

To load the model, use the `load` method. It accepts the `modelSource` which is a string that specifies the location of the model binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) page. This function returns a promise, which can resolve to an error or void.

## Running the model

To run the model, you can use the `forward` method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The function returns a promise, which can resolve either to an error or an object containing categories with their probabilities.

## Example

```typescript
import {
  ClassificationModule,
  EFFICIENTNET_V2_S,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

try {
  // Loading the model
  await ClassificationModule.load(EFFICIENTNET_V2_S);
} catch (e) {
  console.error(e);
}

try {
  // Running the model
  const classesWithProbabilities = await ClassificationModule.forward(imageUri);

  // Getting three most likely classes
  const topThreeClasses = Object.entries(classesWithProbabilities)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([label, score]) => ({ label, score }));
} catch (e) {
  console.error(e);
}
```
