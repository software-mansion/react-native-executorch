---
title: ObjectDetectionModule
---

TypeScript API implementation of the [useObjectDetection](../../03-hooks/02-computer-vision/useObjectDetection.md) hook.

## API Reference

- For detailed API Reference for `ObjectDetectionModule` see: [`ObjectDetectionModule` API Reference](../../06-api-reference/classes/ObjectDetectionModule.md).
- For all object detection models available out-of-the-box in React Native ExecuTorch see: [Object Detection Models](../../06-api-reference/index.md#models---object-detection).

## High Level Overview

```typescript
import {
  ObjectDetectionModule,
  SSDLITE_320_MOBILENET_V3_LARGE,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Creating an instance
const objectDetectionModule = new ObjectDetectionModule();

// Loading the model
await objectDetectionModule.load(SSDLITE_320_MOBILENET_V3_LARGE);

// Running the model
const detections = await objectDetectionModule.forward(imageUri);
```

### Methods

All methods of `ObjectDetectionModule` are explained in details here: [`ObjectDetectionModule` API Reference](../../06-api-reference/classes/ObjectDetectionModule.md)

## Loading the model

To initialize the module, create an instance and call the [`load`](../../06-api-reference/classes/ObjectDetectionModule.md#load) method with the following parameters:

- [`model`](../../06-api-reference/classes/ObjectDetectionModule.md#model) - Object containing:
  - [`modelSource`](../../06-api-reference/classes/ObjectDetectionModule.md#modelsource) - Location of the used model.

- [`onDownloadProgressCallback`](../../06-api-reference/classes/ObjectDetectionModule.md#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, you can use the [`forward`](../../06-api-reference/classes/ObjectDetectionModule.md#forward) method on the module object. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image (whole URI or only raw base64). The method returns a promise, which can resolve either to an error or an array of [`Detection`](../../06-api-reference/interfaces/Detection.md) objects. Each object contains coordinates of the bounding box, the label of the detected object, and the confidence score.

## Managing memory

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](../../06-api-reference/classes/ObjectDetectionModule.md#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](../../06-api-reference/classes/ObjectDetectionModule.md#forward) after [`delete`](../../06-api-reference/classes/ObjectDetectionModule.md#delete) unless you load the module again.
