---
title: OCRModule
---

TypeScript API implementation of the [useOCR](../../02-hooks/02-computer-vision/useOCR.md) hook.

## Reference

```typescript
import { OCRModule, OCR_ENGLISH } from 'react-native-executorch';
const imageUri = 'path/to/image.png';

// Creating an instance
const ocrModule = new OCRModule();

// Loading the model
await ocrModule.load(OCR_ENGLISH);

// Running the model
const detections = await ocrModule.forward(imageUri);
```

### Methods

| Method    | Type                                                                                                                                                                                                                                             | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `load`    | `(model: { detectorSource: ResourceSource; recognizerLarge: ResourceSource; recognizerMedium: ResourceSource; recognizerSmall: ResourceSource; language: OCRLanguage }, onDownloadProgressCallback?: (progress: number) => void): Promise<void>` | Loads the model, where `detectorSource` is a string that specifies the location of the detector binary, `recognizerLarge` is a string that specifies the location of the recognizer binary file which accepts input images with a width of 512 pixels, `recognizerMedium` is a string that specifies the location of the recognizer binary file which accepts input images with a width of 256 pixels, `recognizerSmall` is a string that specifies the location of the recognizer binary file which accepts input images with a width of 128 pixels, and `language` is a parameter that specifies the language of the text to be recognized by the OCR. |
| `forward` | `(input: string): Promise<OCRDetections[]>`                                                                                                                                                                                                      | Executes the model's forward pass, where `input` can be a fetchable resource or a Base64-encoded string.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `delete`  | `(): void`                                                                                                                                                                                                                                       | Release the memory held by the module. Calling `forward` afterwards is invalid. Note that you cannot delete model while it's generating.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

<details>
<summary>Type definitions</summary>

```typescript
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

To load the model, use the `load` method. It accepts an object:

**`model`** - Object containing the detector source, recognizer sources, and language.

- **`detectorSource`** - A string that specifies the location of the detector binary.
- **`recognizerLarge`** - A string that specifies the location of the recognizer binary file which accepts input images with a width of 512 pixels.
- **`recognizerMedium`** - A string that specifies the location of the recognizer binary file which accepts input images with a width of 256 pixels.
- **`recognizerSmall`** - A string that specifies the location of the recognizer binary file which accepts input images with a width of 128 pixels.
- **`language`** - A parameter that specifies the language of the text to be recognized by the OCR.

**`onDownloadProgressCallback`** - (Optional) Function called on download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, you can use the `forward` method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The method returns a promise, which can resolve either to an error or an array of `OCRDetection` objects. Each object contains coordinates of the bounding box, the label of the detected object, and the confidence score.
