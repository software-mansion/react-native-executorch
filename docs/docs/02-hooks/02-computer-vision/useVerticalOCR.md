---
title: useVerticalOCR
---

:::danger Experimental
The `useVerticalOCR` hook is currently in an experimental phase. We appreciate feedback from users as we continue to refine and enhance its functionality.
:::

Optical Character Recognition (OCR) is a computer vision technique used to detect and recognize text within images. It is commonly utilized to convert a variety of documents, such as scanned paper documents, PDF files, or images captured by a digital camera, into editable and searchable data. Traditionally, OCR technology has been optimized for recognizing horizontal text, and integrating support for vertical text recognition often requires significant additional effort from developers. To simplify this, we introduce `useVerticalOCR`, a tool designed to abstract the complexities of vertical text OCR, enabling seamless integration into your applications.

:::warning
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/ocr-68d0eb320ae6d20b5f901ea9). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## Reference

```tsx
import { useVerticalOCR, VERTICAL_OCR_ENGLISH } from 'react-native-executorch';

function App() {
  const model = useVerticalOCR({
    model: VERTICAL_OCR_ENGLISH,
    independentCharacters: true,
  });

  // ...
  for (const ocrDetection of await model.forward('https://url-to-image.jpg')) {
    console.log('Bounding box: ', ocrDetection.bbox);
    console.log('Bounding label: ', ocrDetection.text);
    console.log('Bounding score: ', ocrDetection.score);
  }
  // ...
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

**`model`** - Object containing the detector sources, recognizer sources, and language.

- **`detectorLarge`** - A string that specifies the location of the recognizer binary file which accepts input images with a width of 1280 pixels.
- **`detectorNarrow`** - A string that specifies the location of the detector binary file which accepts input images with a width of 320 pixels.
- **`recognizerLarge`** - A string that specifies the location of the recognizer binary file which accepts input images with a width of 512 pixels.
- **`recognizerSmall`** - A string that specifies the location of the recognizer binary file which accepts input images with a width of 64 pixels.
- **`language`** - A parameter that specifies the language of the text to be recognized by the OCR.

**`independentCharacters`** – A boolean parameter that indicates whether the text in the image consists of a random sequence of characters. If set to true, the algorithm will scan each character individually instead of reading them as continuous text.

**`preventLoad?`** - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

The hook returns an object with the following properties:

| Field              | Type                                               | Description                                                                                 |
| ------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `forward`          | `(imageSource: string) => Promise<OCRDetection[]>` | A function that accepts an image (url, b64) and returns an array of `OCRDetection` objects. |
| `error`            | <code>string &#124; null</code>                    | Contains the error message if the model loading failed.                                     |
| `isGenerating`     | `boolean`                                          | Indicates whether the model is currently processing an inference.                           |
| `isReady`          | `boolean`                                          | Indicates whether the model has successfully loaded and is ready for inference.             |
| `downloadProgress` | `number`                                           | Represents the download progress as a value between 0 and 1.                                |

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
import { useVerticalOCR, VERTICAL_OCR_ENGLISH } from 'react-native-executorch';

function App() {
  const model = useVerticalOCR({
    model: VERTICAL_OCR_ENGLISH,
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

## Language-Specific Recognizers

Each supported language requires its own set of recognizer models.  
The built-in constants such as `RECOGNIZER_EN_CRNN_512`, `RECOGNIZER_PL_CRNN_64`, etc., point to specific models trained for a particular language.

> For example:
>
> - To recognize **English** text, use:
>   - `RECOGNIZER_EN_CRNN_512`
>   - `RECOGNIZER_EN_CRNN_64`
> - To recognize **Polish** text, use:
>   - `RECOGNIZER_PL_CRNN_512`
>   - `RECOGNIZER_PL_CRNN_64`

You need to make sure the recognizer models you pass in `recognizerSources` match the `language` you specify.

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

| Model                                                    | Type       |
| -------------------------------------------------------- | ---------- |
| [CRAFT_1280\*](https://github.com/clovaai/CRAFT-pytorch) | Detector   |
| [CRAFT_320\*](https://github.com/clovaai/CRAFT-pytorch)  | Detector   |
| [CRNN_512\*](https://www.jaided.ai/easyocr/modelhub/)    | Recognizer |
| [CRNN_64\*](https://www.jaided.ai/easyocr/modelhub/)     | Recognizer |

\* - The number following the underscore (\_) indicates the input image width used during model export.

## Benchmarks

### Model size

| Model                 | XNNPACK [MB] |
| --------------------- | :----------: |
| Detector (CRAFT_1280) |     83.1     |
| Detector (CRAFT_320)  |     83.1     |
| Recognizer (CRNN_512) |  15 - 18\*   |
| Recognizer (CRNN_64)  |  15 - 16\*   |

\* - The model weights vary depending on the language.

### Memory usage

| Model                                                                | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| -------------------------------------------------------------------- | :--------------------: | :----------------: |
| Detector (CRAFT_1280) + Detector (CRAFT_320) + Recognizer (CRNN_512) |          2172          |        2214        |
| Detector(CRAFT_1280) + Detector(CRAFT_320) + Recognizer (CRNN_64)    |          1774          |        1705        |

### Inference time

**Image Used for Benchmarking:**

| ![Alt text](../../../static/img/sales-vertical.jpeg) | ![Alt text](../../../static/img/sales-vertical-boxes.png) |
| ---------------------------------------------------- | --------------------------------------------------------- |
| Original Image                                       | Image with detected Text Boxes                            |

:::warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

**Time measurements:**

| Metric                                                                     | iPhone 14 Pro Max <br /> [ms] | iPhone 16 Pro <br /> [ms] | iPhone SE 3 | Samsung Galaxy S24 <br /> [ms] | OnePlus 12 <br /> [ms] |
| -------------------------------------------------------------------------- | ----------------------------- | ------------------------- | ----------- | ------------------------------ | ---------------------- |
| **Total Inference Time**                                                   | 9350 / 9620                   | 8572 / 8621               | ❌          | 13737 / 10570                  | 13436 / 9848           |
| **Detector (CRAFT_1250)**                                                  | 4895                          | 4756                      | ❌          | 5574                           | 5016                   |
| **Detector (CRAFT_320)**                                                   |                               |                           |             |                                |                        |
| ├─ Average Time                                                            | 1247                          | 1206                      | ❌          | 1350                           | 1356                   |
| ├─ Total Time (3 runs)                                                     | 3741                          | 3617                      | ❌          | 4050                           | 4069                   |
| **Recognizer (CRNN_64)** <br /> (_With Flag `independentChars == true`_)   |                               |                           |             |                                |                        |
| ├─ Average Time                                                            | 31                            | 9                         | ❌          | 195                            | 207                    |
| ├─ Total Time (21 runs)                                                    | 649                           | 191                       | ❌          | 4092                           | 4339                   |
| **Recognizer (CRNN_512)** <br /> (_With Flag `independentChars == false`_) |                               |                           |             |                                |                        |
| ├─ Average Time                                                            | 306                           | 80                        | ❌          | 308                            | 250                    |
| ├─ Total Time (3 runs)                                                     | 919                           | 240                       | ❌          | 925                            | 751                    |

❌ - Insufficient RAM.
