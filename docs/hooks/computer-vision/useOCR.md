# useOCR

Optical character recognition(OCR) is a computer vision technique that detects and recognizes text within the image. It's commonly used to convert different types of documents, such as scanned paper documents, PDF files, or images captured by a digital camera, into editable and searchable data.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/ocr-68d0eb320ae6d20b5f901ea9). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.

## Reference[​](#reference "Direct link to Reference")

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

![](/react-native-executorch/img/Arrow.svg)![](/react-native-executorch/img/Arrow-dark.svg)Type definitions

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

### Arguments[​](#arguments "Direct link to Arguments")

**`model`** - Object containing the detector source, recognizer sources, and language.

* **`detectorSource`** - A string that specifies the location of the detector binary.
* **`recognizerLarge`** - A string that specifies the location of the recognizer binary file which accepts input images with a width of 512 pixels.
* **`recognizerMedium`** - A string that specifies the location of the recognizer binary file which accepts input images with a width of 256 pixels.
* **`recognizerSmall`** - A string that specifies the location of the recognizer binary file which accepts input images with a width of 128 pixels.
* **`language`** - A parameter that specifies the language of the text to be recognized by the OCR.

**`preventLoad?`** - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

### Returns[​](#returns "Direct link to Returns")

The hook returns an object with the following properties:

| Field              | Type                                               | Description                                                                                 |
| ------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `forward`          | `(imageSource: string) => Promise<OCRDetection[]>` | A function that accepts an image (url, b64) and returns an array of `OCRDetection` objects. |
| `error`            | `string \| null`                                   | Contains the error message if the model loading failed.                                     |
| `isGenerating`     | `boolean`                                          | Indicates whether the model is currently processing an inference.                           |
| `isReady`          | `boolean`                                          | Indicates whether the model has successfully loaded and is ready for inference.             |
| `downloadProgress` | `number`                                           | Represents the download progress as a value between 0 and 1.                                |

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the `forward` method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The function returns an array of `OCRDetection` objects. Each object contains coordinates of the bounding box, the text recognized within the box, and the confidence score. For more information, please refer to the reference or type definitions.

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

## Language-Specific Recognizers[​](#language-specific-recognizers "Direct link to Language-Specific Recognizers")

Each supported language requires its own set of recognizer models. The built-in constants such as `RECOGNIZER_EN_CRNN_512`, `RECOGNIZER_PL_CRNN_256`, etc., point to specific models trained for a particular language.

> For example:
>
> * To recognize **English** text, use:
>
>   <!-- -->
>
>   * `RECOGNIZER_EN_CRNN_512`
>   * `RECOGNIZER_EN_CRNN_256`
>   * `RECOGNIZER_EN_CRNN_128`
>
> * To recognize **Polish** text, use:
>
>   <!-- -->
>
>   * `RECOGNIZER_PL_CRNN_512`
>   * `RECOGNIZER_PL_CRNN_256`
>   * `RECOGNIZER_PL_CRNN_128`

You need to make sure the recognizer models you pass in `recognizerSources` match the `language` you specify.

## Supported languages[​](#supported-languages "Direct link to Supported languages")

| Language           | Code Name  |
| ------------------ | ---------- |
| Abaza              | abq        |
| Adyghe             | ady        |
| Africans           | af         |
| Avar               | ava        |
| Azerbaijani        | az         |
| Belarusian         | be         |
| Bulgarian          | bg         |
| Bosnian            | bs         |
| Simplified Chinese | chSim      |
| Chechen            | che        |
| Chech              | cs         |
| Welsh              | cy         |
| Danish             | da         |
| Dargwa             | dar        |
| German             | de         |
| English            | en         |
| Spanish            | es         |
| Estonian           | et         |
| French             | fr         |
| Irish              | ga         |
| Croatian           | hr         |
| Hungarian          | hu         |
| Indonesian         | id         |
| Ingush             | inh        |
| Icelandic          | ic         |
| Italian            | it         |
| Japanese           | ja         |
| Karbadian          | kbd        |
| Kannada            | kn         |
| Korean             | ko         |
| Kurdish            | ku         |
| Latin              | la         |
| Lak                | lbe        |
| Lezghian           | lez        |
| Lithuanian         | lt         |
| Latvian            | lv         |
| Maori              | mi         |
| Mongolian          | mn         |
| Malay              | ms         |
| Maltese            | mt         |
| Dutch              | nl         |
| Norwegian          | no         |
| Occitan            | oc         |
| Pali               | pi         |
| Polish             | pl         |
| Portuguese         | pt         |
| Romanian           | ro         |
| Russian            | ru         |
| Serbian (Cyrillic) | rsCyrillic |
| Serbian (Latin)    | rsLatin    |
| Slovak             | sk         |
| Slovenian          | sl         |
| Albanian           | sq         |
| Swedish            | sv         |
| Swahili            | sw         |
| Tabassaran         | tab        |
| Telugu             | te         |
| Thai               | th         |
| Tajik              | tjk        |
| Tagalog            | tl         |
| Turkish            | tr         |
| Ukrainian          | uk         |
| Uzbek              | uz         |
| Vietnamese         | vi         |

## Supported models[​](#supported-models "Direct link to Supported models")

| Model                                                    | Type       |
| -------------------------------------------------------- | ---------- |
| [CRAFT\_800\*](https://github.com/clovaai/CRAFT-pytorch) | Detector   |
| [CRNN\_512\*](https://www.jaided.ai/easyocr/modelhub/)   | Recognizer |
| [CRNN\_256\*](https://www.jaided.ai/easyocr/modelhub/)   | Recognizer |
| [CRNN\_128\*](https://www.jaided.ai/easyocr/modelhub/)   | Recognizer |

\* - The number following the underscore (\_) indicates the input image width used during model export.

## Benchmarks[​](#benchmarks "Direct link to Benchmarks")

### Model size[​](#model-size "Direct link to Model size")

| Model                            | XNNPACK \[MB] |
| -------------------------------- | ------------- |
| Detector (CRAFT\_800\_QUANTIZED) | 19.8          |
| Recognizer (CRNN\_512)           | 15 - 18\*     |
| Recognizer (CRNN\_256)           | 16 - 18\*     |
| Recognizer (CRNN\_128)           | 17 - 19\*     |

\* - The model weights vary depending on the language.

### Memory usage[​](#memory-usage "Direct link to Memory usage")

| Model                                                                                                       | Android (XNNPACK) \[MB] | iOS (XNNPACK) \[MB] |
| ----------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------- |
| Detector (CRAFT\_800\_QUANTIZED) + Recognizer (CRNN\_512) + Recognizer (CRNN\_256) + Recognizer (CRNN\_128) | 1400                    | 1320                |

### Inference time[​](#inference-time "Direct link to Inference time")

**Image Used for Benchmarking:**

| ![Alt text](/react-native-executorch/assets/images/harvard-263ba6e6b318b4345e9809f8cbda5af0.png) | ![Alt text](/react-native-executorch/assets/images/harvard-boxes-591c7206f08577c5086406161a85c442.png) |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Original Image                                                                                   | Image with detected Text Boxes                                                                         |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.

**Time measurements:**

| Metric                               | iPhone 17 Pro<br />\[ms] | iPhone 16 Pro<br />\[ms] | iPhone SE 3 | Samsung Galaxy S24<br />\[ms] | OnePlus 12<br />\[ms] |
| ------------------------------------ | ------------------------ | ------------------------ | ----------- | ----------------------------- | --------------------- |
| **Total Inference Time**             | 652                      | 600                      | 2855        | 1092                          | 1034                  |
| **Detector (CRAFT\_800\_QUANTIZED)** | 220                      | 221                      | 1740        | 521                           | 492                   |
| **Recognizer (CRNN\_512)**           |                          |                          |             |                               |                       |
| ├─ Average Time                      | 45                       | 38                       | 110         | 40                            | 38                    |
| ├─ Total Time (3 runs)               | 135                      | 114                      | 330         | 120                           | 114                   |
| **Recognizer (CRNN\_256)**           |                          |                          |             |                               |                       |
| ├─ Average Time                      | 21                       | 18                       | 54          | 20                            | 19                    |
| ├─ Total Time (7 runs)               | 147                      | 126                      | 378         | 140                           | 133                   |
| **Recognizer (CRNN\_128)**           |                          |                          |             |                               |                       |
| ├─ Average Time                      | 11                       | 9                        | 27          | 10                            | 10                    |
| ├─ Total Time (7 runs)               | 77                       | 63                       | 189         | 70                            | 70                    |
