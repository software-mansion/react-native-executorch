---
title: VerticalOCRModule
---

TypeScript API implementation of the [useVerticalOCR](../../03-hooks/02-computer-vision/useVerticalOCR.md) hook.

## API Reference

- For detailed API Reference for `VerticalOCRModule` see: [`VerticalOCRModule` API Reference](../../06-api-reference/classes/VerticalOCRModule.md).
- For all alphabets available in ocr out-of-the-box in React Native ExecuTorch see: [OCR Supported Alphabets](../../06-api-reference/index.md#ocr-supported-alphabets).

## High Level Overview

```typescript
import { VerticalOCRModule, OCR_ENGLISH } from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Creating an instance and loading the model
const verticalOCRModule = await VerticalOCRModule.fromModelName(OCR_ENGLISH);

// Running the model
const detections = await verticalOCRModule.forward(imageUri);
```

### Methods

All methods of `VerticalOCRModule` are explained in details here: [`VerticalOCRModule` API Reference](../../06-api-reference/classes/VerticalOCRModule.md)

## Loading the model

Use the static [`fromModelName`](../../06-api-reference/classes/VerticalOCRModule.md#frommodelname) factory method. It accepts a `namedSources` object (e.g. `{ ...OCR_ENGLISH, independentCharacters: true }`) containing:

- `modelName` - Model name identifier.
- [`detectorSource`](../../06-api-reference/classes/VerticalOCRModule.md#detectorsource) - Location of the used detector.
- [`recognizerSource`](../../06-api-reference/classes/VerticalOCRModule.md#recognizersource) - Location of the used recognizer.
- [`language`](../../06-api-reference/classes/VerticalOCRModule.md#recognizersource) - Language used in OCR.
- [`independentCharacters`](../../06-api-reference/classes/VerticalOCRModule.md#independentcharacters) - Flag indicating whether to treat characters as independent.

And an optional `onDownloadProgress` callback. It returns a promise resolving to a `VerticalOCRModule` instance.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, use the [`forward`](../../06-api-reference/classes/VerticalOCRModule.md#forward) method. It accepts one argument — the image to recognize. The image can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](../../06-api-reference/interfaces/PixelData.md) object (raw RGB pixel buffer). The method returns a promise resolving to an array of [`OCRDetection`](../../06-api-reference/interfaces/OCRDetection.md) objects, each containing the bounding box, recognized text, and confidence score.

For real-time frame processing, use [`runOnFrame`](../../03-hooks/02-computer-vision/visioncamera-integration.md) instead.
