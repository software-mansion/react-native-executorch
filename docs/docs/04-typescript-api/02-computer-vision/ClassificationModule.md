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

// Creating an instance
const classificationModule = new ClassificationModule();

// Loading the model
await classificationModule.load(EFFICIENTNET_V2_S);

// Running the model
const classesWithProbabilities = await classificationModule.forward(imageUri);
```

### Methods

All methods of `ClassificationModule` are explained in details here: [`ClassificationModule` API Reference](../../06-api-reference/classes/ClassificationModule.md)

## Loading the model

To initialize the module, create an instance and call the [`load`](../../06-api-reference/classes/ClassificationModule.md#load) method with the following parameters:

- [`model`](../../06-api-reference/classes/ClassificationModule.md#model) - Object containing:
  - [`modelSource`](../../06-api-reference/classes/ClassificationModule.md#modelsource) - Location of the used model.

- [`onDownloadProgressCallback`](../../06-api-reference/classes/ClassificationModule.md#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, you can use the [`forward`](../../06-api-reference/classes/ClassificationModule.md#forward) method on the module object. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image (whole URI or only raw base64). The method returns a promise, which can resolve either to an error or an object containing categories with their probabilities.

## Managing memory

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](../../06-api-reference/classes/ClassificationModule.md#forward) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](../../06-api-reference/classes/ClassificationModule.md#forward) after [`delete`](../../06-api-reference/classes/ClassificationModule.md#forward) unless you load the module again.
