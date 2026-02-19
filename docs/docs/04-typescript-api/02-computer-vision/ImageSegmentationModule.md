---
title: ImageSegmentationModule
---

TypeScript API implementation of the [useImageSegmentation](../../03-hooks/02-computer-vision/useImageSegmentation.md) hook.

## API Reference

- For detailed API Reference for `ImageSegmentationModule` see: [`ImageSegmentationModule` API Reference](../../06-api-reference/classes/ImageSegmentationModule.md).
- For all image segmentation models available out-of-the-box in React Native ExecuTorch see: [Image Segmentation Models](../../06-api-reference/index.md#models---image-segmentation).

## High Level Overview

```typescript
import {
  ImageSegmentationModule,
  DEEPLAB_V3_RESNET50,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Creating an instance
const imageSegmentationModule = new ImageSegmentationModule();

// Loading the model
await imageSegmentationModule.load(DEEPLAB_V3_RESNET50);

// Running the model
const outputDict = await imageSegmentationModule.forward(imageUri);
```

### Methods

All methods of `ImageSegmentationModule` are explained in details here: [`ImageSegmentationModule` API Reference](../../06-api-reference/classes/ImageSegmentationModule.md)

## Loading the model

To initialize the module, create an instance and call the [`load`](../../06-api-reference/classes/ImageSegmentationModule.md#load) method with the following parameters:

- [`model`](../../06-api-reference/classes/ImageSegmentationModule.md#model) - Object containing:
  - [`modelSource`](../../06-api-reference/classes/ImageSegmentationModule.md#modelsource) - Location of the used model.

- [`onDownloadProgressCallback`](../../06-api-reference/classes/ImageSegmentationModule.md#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, you can use the [`forward`](../../06-api-reference/classes/ImageSegmentationModule.md#forward) method on the module object. It accepts three arguments: a required image - can be a remote URL, a local file URI, or a base64-encoded image (whole URI or only raw base64), an optional list of classes, and an optional flag whether to resize the output to the original dimensions.

- The image can be a remote URL, a local file URI, or a base64-encoded image.
- The [`classesOfInterest`](../../06-api-reference/classes/ImageSegmentationModule.md#classesofinterest) list contains classes for which to output the full results. By default the list is empty, and only the most probable classes are returned (essentially an arg max for each pixel). Look at [`DeeplabLabel`](../../06-api-reference/enumerations/DeeplabLabel.md) enum for possible classes.
- The [`resizeToInput`](../../06-api-reference/classes/ImageSegmentationModule.md#resizetoinput) flag specifies whether the output will be rescaled back to the size of the input image. The default is `true`. The model runs inference on a scaled (probably smaller) version of your image (224x224 for the `DEEPLAB_V3_RESNET50`). If you choose to resize, the output will be `number[]` of size `width * height` of your original image.

:::warning
Setting `resize` to true will make `forward` slower.
:::

[`forward`](../../06-api-reference/classes/ImageSegmentationModule.md#forward) returns a promise which can resolve either to an error or a dictionary containing number arrays with size depending on [`resizeToInput`](../../06-api-reference/classes/ImageSegmentationModule.md#resizetoinput):

- For the key [`DeeplabLabel.ARGMAX`](../../06-api-reference/enumerations/DeeplabLabel.md#argmax) the array contains for each pixel an integer corresponding to the class with the highest probability.
- For every other key from [`DeeplabLabel`](../../06-api-reference/enumerations/DeeplabLabel.md), if the label was included in [`classesOfInterest`](../../06-api-reference/classes/ImageSegmentationModule.md#classesofinterest) the dictionary will contain an array of floats corresponding to the probability of this class for every pixel.

## Managing memory

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](../../06-api-reference/classes/ImageSegmentationModule.md#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](../../06-api-reference/classes/ImageSegmentationModule.md#forward) after [`delete`](../../06-api-reference/classes/ImageSegmentationModule.md#delete) unless you load the module again.
