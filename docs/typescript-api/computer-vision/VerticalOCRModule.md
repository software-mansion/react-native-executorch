# VerticalOCRModule

TypeScript API implementation of the [useVerticalOCR](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useVerticalOCR.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `VerticalOCRModule` see: [`VerticalOCRModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VerticalOCRModule).
* For all alphabets available in ocr out-of-the-box in React Native ExecuTorch see: [OCR Supported Alphabets](https://docs.swmansion.com/react-native-executorch/docs/api-reference#ocr-supported-alphabets).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

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

### Methods[​](#methods "Direct link to Methods")

All methods of `VerticalOCRModule` are explained in details here: [`VerticalOCRModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VerticalOCRModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

To load the model, use the [`load`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VerticalOCRModule#load) method. It accepts an object:

* [`model`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VerticalOCRModule#model) - Object containing:

  * [`detectorSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VerticalOCRModule#detectorsource) - Location of the used detector.
  * [`recognizerSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VerticalOCRModule#recognizersource) - Location of the used recognizer.
  * [`language`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VerticalOCRModule#recognizersource) - Language used in OCR.

* [`independentCharacters`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VerticalOCRModule#independentcharacters) - Flag indicating to either treat characters as independent or not.

* [`onDownloadProgressCallback`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VerticalOCRModule#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VerticalOCRModule#forward) method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The method returns a promise, which can resolve either to an error or an array of [`OCRDetection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/OCRDetection) objects. Each object contains coordinates of the bounding box, the label of the detected object, and the confidence score.
