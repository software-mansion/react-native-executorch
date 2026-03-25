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

// Creating and loading the module
const styleTransferModule =
  await StyleTransferModule.fromModelName(STYLE_TRANSFER_CANDY);

// Running the model
const generatedImageUrl = await styleTransferModule.forward(imageUri);
```

### Methods

All methods of `StyleTransferModule` are explained in details here: [`StyleTransferModule` API Reference](../../06-api-reference/classes/StyleTransferModule.md)

## Loading the model

To create a ready-to-use instance, call the static [`fromModelName`](../../06-api-reference/classes/StyleTransferModule.md#frommodelname) factory with the following parameters:

- `namedSources` - Object containing:
  - `modelName` - Model name identifier.
  - `modelSource` - Location of the model binary.

- `onDownloadProgress` - Optional callback to track download progress (value between 0 and 1).

The factory returns a promise that resolves to a loaded `StyleTransferModule` instance.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, use the [`forward`](../../06-api-reference/classes/StyleTransferModule.md#forward) method. It accepts two arguments:

- `input` (required) — The image to stylize. Can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](../../06-api-reference/interfaces/PixelData.md) object (raw RGB pixel buffer).
- `outputType` (optional) — Controls the return format:
  - `'pixelData'` (default) — Returns a `PixelData` object with raw RGB pixels. No file is written.
  - `'url'` — Saves the result to a temp file and returns its URI as a `string`.

For real-time frame processing, use [`runOnFrame`](../../03-hooks/02-computer-vision/visioncamera-integration.md) instead.

## Managing memory

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](../../06-api-reference/classes/StyleTransferModule.md#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](../../06-api-reference/classes/StyleTransferModule.md#forward) after [`delete`](../../06-api-reference/classes/StyleTransferModule.md#delete) unless you load the module again.
