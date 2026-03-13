---
title: ClassificationModule
---

TypeScript API implementation of the [useClassification](../../03-hooks/02-computer-vision/useClassification.md) hook.

## API Reference

- For detailed API Reference for `ClassificationModule` see: [`ClassificationModule` API Reference](../../06-api-reference/classes/ClassificationModule.md).
- For all classification models available out-of-the-box in React Native ExecuTorch see: [Classification Models](../../06-api-reference/index.md#models---classification).

## High Level Overview

```typescript
import {
  ClassificationModule,
  EFFICIENTNET_V2_S,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Creating and loading the module
const classificationModule =
  await ClassificationModule.fromModelName(EFFICIENTNET_V2_S);

// Running the model
const classesWithProbabilities = await classificationModule.forward(imageUri);
```

### Methods

All methods of `ClassificationModule` are explained in details here: [`ClassificationModule` API Reference](../../06-api-reference/classes/ClassificationModule.md)

## Loading the model

To create a ready-to-use instance, call the static [`fromModelName`](../../06-api-reference/classes/ClassificationModule.md#frommodelname) factory with the following parameters:

- `namedSources` - Object containing:
  - `modelName` - Model name identifier.
  - `modelSource` - Location of the model binary.

- `onDownloadProgress` - Optional callback to track download progress (value between 0 and 1).

The factory returns a promise that resolves to a loaded `ClassificationModule` instance.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, use the [`forward`](../../06-api-reference/classes/ClassificationModule.md#forward) method. It accepts one argument — the image to classify. The image can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](../../06-api-reference/interfaces/PixelData.md) object (raw RGB pixel buffer). The method returns a promise resolving to an object containing categories with their probabilities.

For real-time frame processing, use [`runOnFrame`](../../03-hooks/02-computer-vision/visioncamera-integration.md) instead.

## Managing memory

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](../../06-api-reference/classes/ClassificationModule.md#forward) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](../../06-api-reference/classes/ClassificationModule.md#forward) after [`delete`](../../06-api-reference/classes/ClassificationModule.md#forward) unless you load the module again.
