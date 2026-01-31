---
title: OCRModule
---

TypeScript API implementation of the [useOCR](../../03-hooks/02-computer-vision/useOCR.md) hook.

## API Reference

* For detailed API Reference for `OCRModule` see: [`OCRModule` API Reference](../../06-api-reference/classes/OCRModule.md).
* For all alphabets available in ocr out-of-the-box in React Native ExecuTorch see: [OCR Supported Alphabets](../../06-api-reference/index.md#ocr-supported-alphabets).

## Reference

```typescript
import { OCRModule, OCR_ENGLISH } from 'react-native-executorch';
const imageUri = 'path/to/image.png';

// Creating an instance
const ocrModule = new OCRModule();

// Loading the model
await ocrModule.load(OCR_ENGLISH);

// Running the model
const detections = await ocrModule.forward(imageUri);
```

### Methods

All methods of `OCRModule` are explained in details here: [`OCRModule` API Reference](../../06-api-reference/classes/OCRModule.md)

## Loading the model

To load the model, use the [`load`](../../06-api-reference/classes/OCRModule.md#load) method. It accepts an object:

* [`model`](../../06-api-reference/classes/OCRModule.md#model) - Object containing:

    * [`detectorSource`](../../06-api-reference/classes/OCRModule.md#detectorsource) - Location of the used detector. 
    * [`recognizerSource`](../../06-api-reference/classes/OCRModule.md#recognizersource) - Location of the used recognizer.
    * [`language`](../../06-api-reference/classes/OCRModule.md#recognizersource) - Language used in OCR.

* [`onDownloadProgressCallback`](../../06-api-reference/classes/OCRModule.md#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, you can use the [`forward`](../../06-api-reference/classes/OCRModule.md#forward) method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The method returns a promise, which can resolve either to an error or an array of [`OCRDetection`](../../06-api-reference/interfaces/OCRDetection.md) objects. Each object contains coordinates of the bounding box, the label of the detected object, and the confidence score.
