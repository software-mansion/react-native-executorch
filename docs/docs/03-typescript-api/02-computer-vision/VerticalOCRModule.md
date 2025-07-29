---
title: VerticalOCRModule
---

TypeScript API implementation of the [useVerticalOCR](../../02-hooks/02-computer-vision/useVerticalOCR.md) hook.

## Reference

```typescript
import {
  DETECTOR_CRAFT_1280,
  DETECTOR_CRAFT_320,
  RECOGNIZER_EN_CRNN_512,
  RECOGNIZER_EN_CRNN_64,
  useVerticalOCR,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Loading the model
await VerticalOCRModule.load({
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

// Running the model
const ocrDetections = await VerticalOCRModule.forward(imageUri);
```

### Methods

| Method               | Type                                                                                                                                            | Description                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `load`               | `(detectorSources: DetectorSources, recognizerSources: RecognizerSources, language: OCRLanguage independentCharacters: boolean): Promise<void>` | Loads detectors and recognizers, which sources are represented by `DetectorSources` and `RecognizerSources`. |
| `forward`            | `(input: string): Promise<OCRDetections[]>`                                                                                                     | Executes the model's forward pass, where `input` can be a fetchable resource or a Base64-encoded string.     |
| `onDownloadProgress` | `(callback: (downloadProgress: number) => void): any`                                                                                           | Subscribe to the download progress event.                                                                    |

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

## Loading the model

To load the model, use the `load` method. It accepts:

**`detectorSources`** - An object that specifies the location of the detectors binary files. Each detector is composed of two models tailored to process images of varying widths.

- `detectorLarge` - A string that specifies the location of the recognizer binary file which accepts input images with a width of 1280 pixels.
- `detectorNarrow` - A string that specifies the location of the detector binary file which accepts input images with a width of 320 pixels.

For more information, take a look at [loading models](../../01-fundamentals/02-loading-models.md) section.

**`recognizerSources`** - An object that specifies the locations of the recognizers binary files. Each recognizer is composed of two models tailored to process images of varying widths.

- `recognizerLarge` - A string that specifies the location of the recognizer binary file which accepts input images with a width of 512 pixels.
- `recognizerSmall` - A string that specifies the location of the recognizer binary file which accepts input images with a width of 64 pixels.

For more information, take a look at [loading models](../../01-fundamentals/02-loading-models.md) section.

**`language`** - A parameter that specifies the language of the text to be recognized by the OCR.

**`independentCharacters`** – A boolean parameter that indicates whether the text in the image consists of a random sequence of characters. If set to true, the algorithm will scan each character individually instead of reading them as continuous text.

This method returns a promise, which can resolve to an error or void.

## Listening for download progress

To subscribe to the download progress event, you can use the `onDownloadProgress` method. It accepts a callback function that will be called whenever the download progress changes.

## Running the model

To run the model, you can use the `forward` method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The method returns a promise, which can resolve either to an error or an array of `OCRDetection` objects. Each object contains coordinates of the bounding box, the label of the detected object, and the confidence score.
