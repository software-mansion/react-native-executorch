---
title: ClassificationModule
sidebar_position: 1
---

TypeScript API implementation of the [useClassification](../computer-vision/useClassification.md) hook.

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

| Method               | Type                                                       | Description                                                                                              |
| -------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `load`               | `(modelSource: ResourceSource): Promise<void>`             | Loads the model, where `modelSource` is a string that specifies the location of the model binary.        |
| `forward`            | `(input: string): Promise<{ [category: string]: number }>` | Executes the model's forward pass, where `input` can be a fetchable resource or a Base64-encoded string. |
| `onDownloadProgress` | `(callback: (downloadProgress: number) => void): any`      | Subscribe to the download progress event.                                                                |

<details>
<summary>Type definitions</summary>

```typescript
type ResourceSource = string | number;
```

</details>

## Loading the model

To load the model, use the `load` method. It accepts the `modelSource` which is a string that specifies the location of the model binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) page. This method returns a promise, which can resolve to an error or void.

## Running the model

To run the model, you can use the `forward` method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The method returns a promise, which can resolve either to an error or an object containing categories with their probabilities.
