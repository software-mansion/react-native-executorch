# OCRModule

TypeScript API implementation of the [useOCR](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useOCR.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `OCRModule` see: [`OCRModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/OCRModule).
* For all alphabets available in ocr out-of-the-box in React Native ExecuTorch see: [OCR Supported Alphabets](https://docs.swmansion.com/react-native-executorch/docs/api-reference#ocr-supported-alphabets).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

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

### Methods[​](#methods "Direct link to Methods")

All methods of `OCRModule` are explained in details here: [`OCRModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/OCRModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

To load the model, use the [`load`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/OCRModule#load) method. It accepts an object:

* [`model`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/OCRModule#model) - Object containing:

  * [`detectorSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/OCRModule#detectorsource) - Location of the used detector.
  * [`recognizerSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/OCRModule#recognizersource) - Location of the used recognizer.
  * [`language`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/OCRModule#recognizersource) - Language used in OCR.

* [`onDownloadProgressCallback`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/OCRModule#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/OCRModule#forward) method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The method returns a promise, which can resolve either to an error or an array of [`OCRDetection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/OCRDetection) objects. Each object contains coordinates of the bounding box, the label of the detected object, and the confidence score.
