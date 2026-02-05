# useOCR

Optical character recognition (OCR) is a computer vision technique that detects and recognizes text within the image. It's commonly used to convert different types of documents, such as scanned paper documents, PDF files, or images captured by a digital camera, into editable and searchable data.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/ocr-68d0eb320ae6d20b5f901ea9). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `useOCR` see: [`useOCR` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useOCR).
* For all alphabets available in ocr out-of-the-box in React Native ExecuTorch see: [OCR Supported Alphabets](https://docs.swmansion.com/react-native-executorch/docs/api-reference#ocr-supported-alphabets).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```tsx
import { useOCR, OCR_ENGLISH } from 'react-native-executorch';

function App() {
  const model = useOCR({ model: OCR_ENGLISH });

  // ...
  for (const ocrDetection of await model.forward('https://url-to-image.jpg')) {
    console.log('Bounding box: ', ocrDetection.bbox);
    console.log('Bounding label: ', ocrDetection.text);
    console.log('Bounding score: ', ocrDetection.score);
  }
  // ...
}

```

### Arguments[​](#arguments "Direct link to Arguments")

`useOCR` takes [`OCRProps`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/OCRProps) that consists of:

* `model` containing [`detectorSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/OCRProps#detectorsource), [`recognizerSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/OCRProps#recognizersource), and [`language`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/OCRProps#language).
* An optional flag [`preventLoad`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/OCRProps#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:

* For detailed information about `useOCR` arguments check this section: [`useOCR` arguments](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useOCR#parameters).
* For all alphabets available in ocr out-of-the-box in React Native ExecuTorch see: [OCR Supported Alphabets](https://docs.swmansion.com/react-native-executorch/docs/api-reference#ocr-supported-alphabets).
* For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

### Returns[​](#returns "Direct link to Returns")

`useOCR` returns an object called `OCRType` containing bunch of functions to interact with OCR models. To get more details please read: [`OCRType` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/OCRType).

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/OCRType#forward) method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The function returns an array of [`OCRDetection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/OCRDetection) objects. Each object contains coordinates of the bounding box, the text recognized within the box, and the confidence score. For more information, please refer to the reference or type definitions.

## Detection object[​](#detection-object "Direct link to Detection object")

The detection object is specified as follows:

```typescript
interface Point {
  x: number;
  y: number;
}

interface OCRDetection {
  bbox: Point[];
  text: string;
  score: number;
}

```

The `bbox` property contains information about the bounding box of detected text regions. It is represented as four points, which are corners of detected bounding box. The `text` property contains the text recognized within detected text region. The `score` represents the confidence score of the recognized text.

## Example[​](#example "Direct link to Example")

```tsx
import { useOCR, OCR_ENGLISH } from 'react-native-executorch';

function App() {
  const model = useOCR({ model: OCR_ENGLISH });

  const runModel = async () => {
    const ocrDetections = await model.forward('https://url-to-image.jpg');

    for (const ocrDetection of ocrDetections) {
      console.log('Bounding box: ', ocrDetection.bbox);
      console.log('Bounding text: ', ocrDetection.text);
      console.log('Bounding score: ', ocrDetection.score);
    }
  };
}

```

## Alphabet-Specific Recognizers[​](#alphabet-specific-recognizers "Direct link to Alphabet-Specific Recognizers")

Each supported alphabet requires its own recognizer model. The built-in constants, such as `RECOGNIZER_LATIN_CRNN` or `RECOGNIZER_CYRILLIC_CRNN`, point to specific models trained for a particular alphabet.

> For example:
>
> * To recognize text in languages using the **Latin** alphabet (like Polish, or German), use:
>   <!-- -->
>   * `RECOGNIZER_LATIN_CRNN`
> * To recognize text in languages using the **Cyrillic** alphabet (like Russian or Ukrainian), use:
>   <!-- -->
>   * `RECOGNIZER_CYRILLIC_CRNN`

You need to make sure the recognizer model you pass in [`recognizerSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/OCRProps#recognizersource) matches the alphabet of the [`language`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/OCRProps#language) you specify.

## Supported languages[​](#supported-languages "Direct link to Supported languages")

For all alphabets available in ocr out-of-the-box in React Native ExecuTorch see: [OCR Supported Alphabets](https://docs.swmansion.com/react-native-executorch/docs/api-reference#ocr-supported-alphabets).

## Supported models[​](#supported-models "Direct link to Supported models")

| Model                                             | Type       |
| ------------------------------------------------- | ---------- |
| [CRAFT](https://github.com/clovaai/CRAFT-pytorch) | Detector   |
| [CRNN](https://www.jaided.ai/easyocr/modelhub/)   | Recognizer |
