---
title: useOCR
---

Optical character recognition (OCR) is a computer vision technique that detects and recognizes text within the image. It's commonly used to convert different types of documents, such as scanned paper documents, PDF files, or images captured by a digital camera, into editable and searchable data.

:::warning
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/ocr-68d0eb320ae6d20b5f901ea9). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

* For detailed API Reference for `useOCR` see: [`useOCR` API Reference](../../06-api-reference/functions/useOCR.md).
* For all alphabets available in ocr out-of-the-box in React Native ExecuTorch see: [OCR Supported Alphabets](../../06-api-reference/index.md#ocr-supported-alphabets).

## Reference

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

### Arguments

`useOCR` takes [`OCRProps`](../../06-api-reference/interfaces/OCRProps.md) that consists of:
* `model` containing [`detectorSource`](../../06-api-reference/interfaces/OCRProps.md#detectorsource), [`recognizerSource`](../../06-api-reference/interfaces/OCRProps.md#recognizersource), and [`language`](../../06-api-reference/interfaces/OCRProps.md#language). 
* An optional flag [`preventLoad`](../../06-api-reference/interfaces/OCRProps.md#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:
* For detailed information about `useOCR` arguments check this section: [`useOCR` arguments](../../06-api-reference/functions/useOCR.md#parameters).
* For all alphabets available in ocr out-of-the-box in React Native ExecuTorch see: [OCR Supported Alphabets](../../06-api-reference/index.md#ocr-supported-alphabets).
* For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useOCR` returns an object called `OCRType` containing bunch of functions to interact with OCR models. To get more details please read: [`OCRType` API Reference](../../06-api-reference/interfaces/OCRType.md).

## Running the model

To run the model, you can use the `forward` method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The function returns an array of `OCRDetection` objects. Each object contains coordinates of the bounding box, the text recognized within the box, and the confidence score. For more information, please refer to the reference or type definitions.

## Detection object

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

The `bbox` property contains information about the bounding box of detected text regions. It is represented as four points, which are corners of detected bounding box.
The `text` property contains the text recognized within detected text region. The `score` represents the confidence score of the recognized text.

## Example

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

## Alphabet-Specific Recognizers

Each supported alphabet requires its own recognizer model. The built-in constants, such as `RECOGNIZER_LATIN_CRNN` or `RECOGNIZER_CYRILLIC_CRNN`, point to specific models trained for a particular alphabet.

> For example:
>
> - To recognize text in languages using the **Latin** alphabet (like Polish, or German), use:
>   - `RECOGNIZER_LATIN_CRNN`
> - To recognize text in languages using the **Cyrillic** alphabet (like Russian or Ukrainian), use:
>   - `RECOGNIZER_CYRILLIC_CRNN`

You need to make sure the recognizer model you pass in `recognizerSource` matches the alphabet of the `language` you specify.

## Supported languages

For all alphabets available in ocr out-of-the-box in React Native ExecuTorch see: [OCR Supported Alphabets](../../06-api-reference/index.md#ocr-supported-alphabets).

## Supported models

| Model                                             |    Type    |
| ------------------------------------------------- | :--------: |
| [CRAFT](https://github.com/clovaai/CRAFT-pytorch) |  Detector  |
| [CRNN](https://www.jaided.ai/easyocr/modelhub/)   | Recognizer |
