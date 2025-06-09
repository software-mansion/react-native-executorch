---
title: useVerticalOCR
sidebar_position: 5
---

:::danger Experimental
The `useVerticalOCR` hook is currently in an experimental phase. We appreciate feedback from users as we continue to refine and enhance its functionality.
:::

Optical Character Recognition (OCR) is a computer vision technique used to detect and recognize text within images. It is commonly utilized to convert a variety of documents, such as scanned paper documents, PDF files, or images captured by a digital camera, into editable and searchable data. Traditionally, OCR technology has been optimized for recognizing horizontal text, and integrating support for vertical text recognition often requires significant additional effort from developers. To simplify this, we introduce `useVerticalOCR`, a tool designed to abstract the complexities of vertical text OCR, enabling seamless integration into your applications.

:::caution
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/software-mansion). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/765305abc289083787eb9613b899d6fcc0e24126/src/constants/modelUrls.ts#L51) shipped with our library.
:::

## Reference

```jsx
import {
  DETECTOR_CRAFT_1280,
  DETECTOR_CRAFT_320,
  RECOGNIZER_EN_CRNN_512,
  RECOGNIZER_EN_CRNN_64,
  useVerticalOCR,
} from 'react-native-executorch';

function App() {
  const model = useVerticalOCR({
    detectorSources: {
      detectorLarge: DETECTOR_CRAFT_1280,
      detectorNarrow: DETECTOR_CRAFT_320,
    },
    recognizerSources: {
      recognizerLarge: RECOGNIZER_EN_CRNN_512,
      recognizerSmall: RECOGNIZER_EN_CRNN_64,
    },
    language: 'en',
    independentCharacters: true,
  });

  ...
  for (const ocrDetection of await model.forward("https://url-to-image.jpg")) {
    console.log("Bounding box: ", ocrDetection.bbox);
    console.log("Bounding label: ", ocrDetection.text);
    console.log("Bounding score: ", ocrDetection.score);
  }
  ...
}
```

<details>
<summary>Type definitions</summary>

```typescript
interface DetectorSources {
  detectorLarge: string | number;
  detectorNarrow: string | number;
}

interface RecognizerSources {
  recognizerLarge: string | number;
  recognizerSmall: string | number;
}

type OCRLanguage = 'en';

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

</details>

### Arguments

**`detectorSources`** - An object that specifies the location of the detectors binary files. Each detector is composed of two models tailored to process images of varying widths.

- `detectorLarge` - A string that specifies the location of the recognizer binary file which accepts input images with a width of 1280 pixels.
- `detectorNarrow` - A string that specifies the location of the detector binary file which accepts input images with a width of 320 pixels.

For more information, take a look at [loading models](../fundamentals/loading-models.md) section.

**`recognizerSources`** - An object that specifies the locations of the recognizers binary files. Each recognizer is composed of two models tailored to process images of varying widths.

- `recognizerLarge` - A string that specifies the location of the recognizer binary file which accepts input images with a width of 512 pixels.
- `recognizerSmall` - A string that specifies the location of the recognizer binary file which accepts input images with a width of 64 pixels.

For more information, take a look at [loading models](../fundamentals/loading-models.md) section.

**`language`** - A parameter that specifies the language of the text to be recognized by the OCR.

**`independentCharacters`** – A boolean parameter that indicates whether the text in the image consists of a random sequence of characters. If set to true, the algorithm will scan each character individually instead of reading them as continuous text.

### Returns

The hook returns an object with the following properties:

| Field              | Type                                         | Description                                                                                 |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `forward`          | `(input: string) => Promise<OCRDetection[]>` | A function that accepts an image (url, b64) and returns an array of `OCRDetection` objects. |
| `error`            | <code>string &#124; null</code>              | Contains the error message if the model loading failed.                                     |
| `isGenerating`     | `boolean`                                    | Indicates whether the model is currently processing an inference.                           |
| `isReady`          | `boolean`                                    | Indicates whether the model has successfully loaded and is ready for inference.             |
| `downloadProgress` | `number`                                     | Represents the download progress as a value between 0 and 1.                                |

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
The `text` property contains the text recognized withinh detected text region. The `score` represents the confidence score of the recognized text.

## Example

```tsx
import {
  DETECTOR_CRAFT_1280,
  DETECTOR_CRAFT_320,
  RECOGNIZER_EN_CRNN_512,
  RECOGNIZER_EN_CRNN_64,
  useVerticalOCR,
} from 'react-native-executorch';

function App() {
  const model = useVerticalOCR({
    detectorSources: {
      detectorLarge: DETECTOR_CRAFT_1280,
      detectorNarrow: DETECTOR_CRAFT_320,
    },
    recognizerSources: {
      recognizerLarge: RECOGNIZER_EN_CRNN_512,
      recognizerSmall: RECOGNIZER_EN_CRNN_64,
    },
    language: 'en',
    independentCharacters: true,
  });

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

## Supported models

| Model                                                    | Type       |
| -------------------------------------------------------- | ---------- |
| [CRAFT_1280](https://github.com/clovaai/CRAFT-pytorch)   | Detector   |
| [CRAFT_NARROW](https://github.com/clovaai/CRAFT-pytorch) | Detector   |
| [CRNN_EN_512](https://www.jaided.ai/easyocr/modelhub/)   | Recognizer |
| [CRNN_EN_64](https://www.jaided.ai/easyocr/modelhub/)    | Recognizer |

## Benchmarks

### Model size

| Model       | XNNPACK [MB] |
| ----------- | :----------: |
| CRAFT_1280  |     83.1     |
| CRAFT_320   |     83.1     |
| CRNN_EN_512 |     277      |
| CRNN_EN_64  |     74.3     |

### Memory usage

| Model                                | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ------------------------------------ | :--------------------: | :----------------: |
| CRAFT_1280 + CRAFT_320 + CRNN_EN_512 |          2770          |        3720        |
| CRAFT_1280 + CRAFT_320 + CRNN_EN_64  |          1770          |        2740        |

### Inference time

:::warning warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

| Model       | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro Max (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | Samsung Galaxy S21 (XNNPACK) [ms] |
| ----------- | :--------------------------: | :------------------------------: | :------------------------: | :-------------------------------: | :-------------------------------: |
| CRAFT_1280  |             5457             |               5833               |             ❌             |               6296                |               14053               |
| CRAFT_320   |             1351             |               1460               |             ❌             |               1485                |               3101                |
| CRNN_EN_512 |              39              |               123                |             ❌             |                24                 |                78                 |
| CRNN_EN_64  |              10              |                33                |             ❌             |                 7                 |                18                 |

❌ - Insufficient RAM.
