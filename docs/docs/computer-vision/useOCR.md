---
title: useOCR
---

Optical character recognition(OCR) is a computer vision technique that detects and recognizes text within the image. It's commonly used to convert different types of documents, such as scanned paper documents, PDF files, or images captured by a digital camera, into editable and searchable data.

:::caution
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/software-mansion). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/765305abc289083787eb9613b899d6fcc0e24126/src/constants/modelUrls.ts#L51) shipped with our library.
:::

## Reference

```jsx
import {
  useOCR,
  DETECTOR_CRAFT_800,
  RECOGNIZER_EN_CRNN_512,
  RECOGNIZER_EN_CRNN_256,
  RECOGNIZER_EN_CRNN_128
} from 'react-native-executorch';

function App() {
  const model = useOCR({
    detectorSource: DETECTOR_CRAFT_800,
    recognizerSources: {
      recognizerLarge: RECOGNIZER_EN_CRNN_512,
      recognizerMedium: RECOGNIZER_EN_CRNN_256,
      recognizerSmall: RECOGNIZER_EN_CRNN_128
    },
    language: "en",
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
interface RecognizerSources {
  recognizerLarge: string | number;
  recognizerMedium: string | number;
  recognizerSmall: string | number;
}

type OCRLanguage =
  | 'abq'
  | 'ady'
  | 'af'
  | 'ava'
  | 'az'
  | 'be'
  | 'bg'
  | 'bs'
  | 'chSim'
  | 'che'
  | 'cs'
  | 'cy'
  | 'da'
  | 'dar'
  | 'de'
  | 'en'
  | 'es'
  | 'et'
  | 'fr'
  | 'ga'
  | 'hr'
  | 'hu'
  | 'id'
  | 'inh'
  | 'ic'
  | 'it'
  | 'ja'
  | 'kbd'
  | 'kn'
  | 'ko'
  | 'ku'
  | 'la'
  | 'lbe'
  | 'lez'
  | 'lt'
  | 'lv'
  | 'mi'
  | 'mn'
  | 'ms'
  | 'mt'
  | 'nl'
  | 'no'
  | 'oc'
  | 'pi'
  | 'pl'
  | 'pt'
  | 'ro'
  | 'ru'
  | 'rsCyrillic'
  | 'rsLatin'
  | 'sk'
  | 'sl'
  | 'sq'
  | 'sv'
  | 'sw'
  | 'tab'
  | 'te'
  | 'th'
  | 'tjk'
  | 'tl'
  | 'tr'
  | 'uk'
  | 'uz'
  | 'vi';

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

**`detectorSource`** - A string that specifies the location of the detector binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) section.

**`recognizerSources`** - An object that specifies locations of the recognizers binary files. Each recognizer is composed of three models tailored to process images of varying widths.

- `recognizerLarge` - A string that specifies the location of the recognizer binary file which accepts input images with a width of 512 pixels.
- `recognizerMedium` - A string that specifies the location of the recognizer binary file which accepts input images with a width of 256 pixels.
- `recognizerSmall` - A string that specifies the location of the recognizer binary file which accepts input images with a width of 128 pixels.

For more information, take a look at [loading models](../fundamentals/loading-models.md) section.

**`language`** - A parameter that specifies the language of the text to be recognized by the OCR.

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
The `text` property contains the text recognized within detected text region. The `score` represents the confidence score of the recognized text.

## Example

```tsx
import {
  useOCR,
  DETECTOR_CRAFT_800,
  RECOGNIZER_EN_CRNN_512,
  RECOGNIZER_EN_CRNN_256,
  RECOGNIZER_EN_CRNN_128,
} from 'react-native-executorch';

function App() {
  const model = useOCR({
    detectorSource: DETECTOR_CRAFT_800,
    recognizerSources: {
      recognizerLarge: RECOGNIZER_EN_CRNN_512,
      recognizerMedium: RECOGNIZER_EN_CRNN_256,
      recognizerSmall: RECOGNIZER_EN_CRNN_128,
    },
    language: 'en',
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

## Supported languages

|      Language      | Code Name  |
| :----------------: | :--------: |
|       Abaza        |    abq     |
|       Adyghe       |    ady     |
|      Africans      |     af     |
|        Avar        |    ava     |
|    Azerbaijani     |     az     |
|     Belarusian     |     be     |
|     Bulgarian      |     bg     |
|      Bosnian       |     bs     |
| Simplified Chinese |   chSim    |
|      Chechen       |    che     |
|       Chech        |     cs     |
|       Welsh        |     cy     |
|       Danish       |     da     |
|       Dargwa       |    dar     |
|       German       |     de     |
|      English       |     en     |
|      Spanish       |     es     |
|      Estonian      |     et     |
|       French       |     fr     |
|       Irish        |     ga     |
|      Croatian      |     hr     |
|     Hungarian      |     hu     |
|     Indonesian     |     id     |
|       Ingush       |    inh     |
|     Icelandic      |     ic     |
|      Italian       |     it     |
|      Japanese      |     ja     |
|     Karbadian      |    kbd     |
|      Kannada       |     kn     |
|       Korean       |     ko     |
|      Kurdish       |     ku     |
|       Latin        |     la     |
|        Lak         |    lbe     |
|      Lezghian      |    lez     |
|     Lithuanian     |     lt     |
|      Latvian       |     lv     |
|       Maori        |     mi     |
|     Mongolian      |     mn     |
|       Malay        |     ms     |
|      Maltese       |     mt     |
|       Dutch        |     nl     |
|     Norwegian      |     no     |
|      Occitan       |     oc     |
|        Pali        |     pi     |
|       Polish       |     pl     |
|     Portuguese     |     pt     |
|      Romanian      |     ro     |
|      Russian       |     ru     |
| Serbian (Cyrillic) | rsCyrillic |
|  Serbian (Latin)   |  rsLatin   |
|       Slovak       |     sk     |
|     Slovenian      |     sl     |
|      Albanian      |     sq     |
|      Swedish       |     sv     |
|      Swahili       |     sw     |
|     Tabassaran     |    tab     |
|       Telugu       |     te     |
|        Thai        |     th     |
|       Tajik        |    tjk     |
|      Tagalog       |     tl     |
|      Turkish       |     tr     |
|     Ukrainian      |     uk     |
|       Uzbek        |     uz     |
|     Vietnamese     |     vi     |

## Supported models

| Model                                                   |    Type    |
| ------------------------------------------------------- | :--------: |
| [CRAFT_800\*](https://github.com/clovaai/CRAFT-pytorch) |  Detector  |
| [CRNN_512\*](https://www.jaided.ai/easyocr/modelhub/)   | Recognizer |
| [CRNN_256\*](https://www.jaided.ai/easyocr/modelhub/)   | Recognizer |
| [CRNN_128\*](https://www.jaided.ai/easyocr/modelhub/)   | Recognizer |

\* - The number following the underscore (\_) indicates the input image width used during model export.

## Benchmarks

### Model size

| Model                 | XNNPACK [MB] |
| --------------------- | :----------: |
| Detector (CRAFT_800)  |     83.1     |
| Recognizer (CRNN_512) |  15 - 18\*   |
| Recognizer (CRNN_256) |  16 - 18\*   |
| Recognizer (CRNN_128) |  17 - 19\*   |

\* - The model weights vary depending on the language.

### Memory usage

| Model                                                                                        | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| -------------------------------------------------------------------------------------------- | :--------------------: | :----------------: |
| Detector (CRAFT_800) + Recognizer (CRNN_512) + Recognizer (CRNN_256) + Recognizer (CRNN_128) |          2100          |        1782        |

### Inference time

:::warning warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

| Model                 | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro Max (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | Samsung Galaxy S21 (XNNPACK) [ms] |
| --------------------- | :--------------------------: | :------------------------------: | :------------------------: | :-------------------------------: | :-------------------------------: |
| Detector (CRAFT_800)  |             2099             |               2227               |             ❌             |               2245                |               7108                |
| Recognizer (CRNN_512) |              70              |               252                |             ❌             |                54                 |                151                |
| Recognizer (CRNN_256) |              39              |               123                |             ❌             |                24                 |                78                 |
| Recognizer (CRNN_128) |              17              |                83                |             ❌             |                14                 |                39                 |

❌ - Insufficient RAM.
