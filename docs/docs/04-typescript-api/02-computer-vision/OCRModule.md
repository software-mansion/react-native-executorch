---
title: OCRModule
---

TypeScript API implementation of the [useOCR](../../03-hooks/02-computer-vision/useOCR.md) hook.

## API Reference

- For detailed API Reference for `OCRModule` see: [`OCRModule` API Reference](../../06-api-reference/classes/OCRModule.md).
- For all alphabets available in ocr out-of-the-box in React Native ExecuTorch see: [OCR Supported Alphabets](../../06-api-reference/index.md#ocr-supported-alphabets).

## High Level Overview

```typescript
import { OCRModule, OCR_ENGLISH } from 'react-native-executorch';
const imageUri = 'path/to/image.png';

// Creating an instance and loading the model
const ocrModule = await OCRModule.fromModelName(OCR_ENGLISH);

// Running the model
const detections = await ocrModule.forward(imageUri);
```

### Methods

All methods of `OCRModule` are explained in details here: [`OCRModule` API Reference](../../06-api-reference/classes/OCRModule.md)

## Loading the model

Use the static [`fromModelName`](../../06-api-reference/classes/OCRModule.md#frommodelname) factory method. It accepts a model config object (e.g. `OCR_ENGLISH`) containing:

- [`detectorSource`](../../06-api-reference/classes/OCRModule.md#detectorsource) - Location of the used detector.
- [`recognizerSource`](../../06-api-reference/classes/OCRModule.md#recognizersource) - Location of the used recognizer.
- [`language`](../../06-api-reference/classes/OCRModule.md#recognizersource) - Language used in OCR.

And an optional `onDownloadProgress` callback. It returns a promise resolving to an `OCRModule` instance.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, you can use the [`forward`](../../06-api-reference/classes/OCRModule.md#forward) method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image (whole URI or only raw base64). The method returns a promise, which can resolve either to an error or an array of [`OCRDetection`](../../06-api-reference/interfaces/OCRDetection.md) objects. Each object contains coordinates of the bounding box, the label of the detected object, and the confidence score.
