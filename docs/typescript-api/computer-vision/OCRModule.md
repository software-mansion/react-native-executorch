# OCRModule

TypeScript API implementation of the [useOCR](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useOCR.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `OCRModule` see: [`OCRModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/OCRModule).
* For all alphabets available in ocr out-of-the-box in React Native ExecuTorch see: [OCR Supported Alphabets](https://docs.swmansion.com/react-native-executorch/docs/api-reference#ocr-supported-alphabets).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import { OCRModule, OCR_ENGLISH } from 'react-native-executorch';
const imageUri = 'path/to/image.png';

// Creating an instance and loading the model
const ocrModule = await OCRModule.fromModelName(OCR_ENGLISH);

// Running the model
const detections = await ocrModule.forward(imageUri);

```

### Methods[​](#methods "Direct link to Methods")

All methods of `OCRModule` are explained in details here: [`OCRModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/OCRModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

Use the static [`fromModelName`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/OCRModule#frommodelname) factory method. It accepts a `namedSources` object (e.g. `OCR_ENGLISH`) containing:

* `modelName` - Model name identifier.
* [`detectorSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/OCRModule#detectorsource) - Location of the used detector.
* [`recognizerSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/OCRModule#recognizersource) - Location of the used recognizer.
* [`language`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/OCRModule#recognizersource) - Language used in OCR.

And an optional `onDownloadProgress` callback. It returns a promise resolving to an `OCRModule` instance.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/OCRModule#forward) method. It accepts one argument — the image to recognize. The image can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PixelData) object (raw RGB pixel buffer). The method returns a promise resolving to an array of [`OCRDetection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/OCRDetection) objects, each containing the bounding box, recognized text, and confidence score.

For real-time frame processing, use [`runOnFrame`](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/visioncamera-integration.md) instead.
