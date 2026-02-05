---
title: StyleTransferModule
---

TypeScript API implementation of the [useStyleTransfer](../../03-hooks/02-computer-vision/useStyleTransfer.md) hook.

## API Reference

- For detailed API Reference for `StyleTransferModule` see: [`StyleTransferModule` API Reference](../../06-api-reference/classes/StyleTransferModule.md).
- For all style transfer models available out-of-the-box in React Native ExecuTorch see: [Style Transfer Models](../../06-api-reference/index.md#models---style-transfer).

## High Level Overview

```typescript
import {
  StyleTransferModule,
  STYLE_TRANSFER_CANDY,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Creating an instance
const styleTransferModule = new StyleTransferModule();

// Loading the model
await styleTransferModule.load(STYLE_TRANSFER_CANDY);

// Running the model
const generatedImageUrl = await styleTransferModule.forward(imageUri);
```

### Methods

All methods of `StyleTransferModule` are explained in details here: [`StyleTransferModule` API Reference](../../06-api-reference/classes/StyleTransferModule.md)

## Loading the model

To load the model, create a new instance of the module and use the [`load`](../../06-api-reference/classes/StyleTransferModule.md#load) method on it. It accepts an object:

- [`model`](../../06-api-reference/classes/StyleTransferModule.md#model) - Object containing:
  - [`modelSource`](../../06-api-reference/classes/StyleTransferModule.md#modelsource) - Location of the used model.

- [`onDownloadProgressCallback`](../../06-api-reference/classes/StyleTransferModule.md#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, you can use the [`forward`](../../06-api-reference/classes/StyleTransferModule.md#forward) method on the module object. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The method returns a promise, which can resolve either to an error or a URL to generated image.

## Managing memory

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](../../06-api-reference/classes/StyleTransferModule.md#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](../../06-api-reference/classes/StyleTransferModule.md#forward) after [`delete`](../../06-api-reference/classes/StyleTransferModule.md#delete) unless you load the module again.
