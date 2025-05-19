---
title: OCRModule
---

TypeScript API implementation of the [useOCR](../computer-vision/useOCR.md) hook.

## Reference

```typescript
import {
  OCRModule,
  CRAFT_800,
  RECOGNIZER_EN_CRNN_512,
  RECOGNIZER_EN_CRNN_256,
  RECOGNIZER_EN_CRNN_128,
} from 'react-native-executorch';
const imageUri = 'path/to/image.png';

// Loading the model
await OCRModule.load({
  detectorSource: CRAFT_800,
  recognizerSources: {
    recognizerLarge: RECOGNIZER_EN_CRNN_512,
    recognizerMedium: RECOGNIZER_EN_CRNN_256,
    recognizerSmall: RECOGNIZER_EN_CRNN_128,
  },
  language: 'en',
});

// Running the model
const ocrDetections = await OCRModule.forward(imageUri);
```

### Methods

| Method               | Type                                                                                                   | Description                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `load`               | `(detectorSource: string, recognizerSources: RecognizerSources, language: OCRLanguage): Promise<void>` | Loads the detector and recognizers, which sources are represented by `RecognizerSources`.                |
| `forward`            | `(input: string): Promise<OCRDetections[]>`                                                            | Executes the model's forward pass, where `input` can be a fetchable resource or a Base64-encoded string. |
| `onDownloadProgress` | `(callback: (downloadProgress: number) => void): any`                                                  | Subscribe to the download progress event.                                                                |

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

## Loading the model

To load the model, use the `load` method. It accepts:

**`detectorSource`** - A string that specifies the location of the detector binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) section.

**`recognizerSources`** - An object that specifies locations of the recognizers binary files. Each recognizer is composed of three models tailored to process images of varying widths.

- `recognizerLarge` - A string that specifies the location of the recognizer binary file which accepts input images with a width of 512 pixels.
- `recognizerMedium` - A string that specifies the location of the recognizer binary file which accepts input images with a width of 256 pixels.
- `recognizerSmall` - A string that specifies the location of the recognizer binary file which accepts input images with a width of 128 pixels.

For more information, take a look at [loading models](../fundamentals/loading-models.md) section.

**`language`** - A parameter that specifies the language of the text to be recognized by the OCR.

This method returns a promise, which can resolve to an error or void.

## Listening for download progress

To subscribe to the download progress event, you can use the `onDownloadProgress` method. It accepts a callback function that will be called whenever the download progress changes.

## Running the model

To run the model, you can use the `forward` method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The method returns a promise, which can resolve either to an error or an array of `OCRDetection` objects. Each object contains coordinates of the bounding box, the label of the detected object, and the confidence score.
