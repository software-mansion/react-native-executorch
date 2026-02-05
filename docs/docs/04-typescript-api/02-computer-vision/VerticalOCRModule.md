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

// Creating an instance
const verticalOCRModule = new VerticalOCRModule();

// Loading the model
await verticalOCRModule.load(OCR_ENGLISH);

// Running the model
const detections = await verticalOCRModule.forward(imageUri);
```

### Methods

All methods of `VerticalOCRModule` are explained in details here: [`VerticalOCRModule` API Reference](../../06-api-reference/classes/VerticalOCRModule.md)

## Loading the model

To load the model, use the [`load`](../../06-api-reference/classes/VerticalOCRModule.md#load) method. It accepts an object:

- [`model`](../../06-api-reference/classes/VerticalOCRModule.md#model) - Object containing:
  - [`detectorSource`](../../06-api-reference/classes/VerticalOCRModule.md#detectorsource) - Location of the used detector.
  - [`recognizerSource`](../../06-api-reference/classes/VerticalOCRModule.md#recognizersource) - Location of the used recognizer.
  - [`language`](../../06-api-reference/classes/VerticalOCRModule.md#recognizersource) - Language used in OCR.

- [`independentCharacters`](../../06-api-reference/classes/VerticalOCRModule.md#independentcharacters) - Flag indicating to either treat characters as independent or not.

- [`onDownloadProgressCallback`](../../06-api-reference/classes/VerticalOCRModule.md#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, you can use the [`forward`](../../06-api-reference/classes/VerticalOCRModule.md#forward) method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The method returns a promise, which can resolve either to an error or an array of [`OCRDetection`](../../06-api-reference/interfaces/OCRDetection.md) objects. Each object contains coordinates of the bounding box, the label of the detected object, and the confidence score.
