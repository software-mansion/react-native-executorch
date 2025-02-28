---
title: VerticalOCRModule
sidebar_position: 7
---

Hookless implementation of the [useVerticalOCR](../computer-vision/useVerticalOCR.md) hook.

## Reference

```typescript
import {
  VerticalOCRModule,
  VERTICAL_DETECTORS,
  VERTICAL_CRNN_RECOGNIZERS_EN,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Loading the model
await VerticalOCRModule.load({
  detectorSources: VERTICAL_DETECTORS,
  recognizerSources: VERTICAL_CRNN_RECOGNIZERS_EN,
});

// Running the model
const ocrDetections = await VerticalOCRModule.forward(imageUri);
```

### Methods

| Method               | Type                                                                                                                      | Description                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `load`               | `(detectorSources: DetectorSources, recognizerSources: RecognizerSources, independentCharacters: boolean): Promise<void>` | Loads the model, where `modelSource` is a string that specifies the location of the model binary.        |
| `forward`            | `(input: string): Promise<OCRDetections[]>`                                                                               | Executes the model's forward pass, where `input` can be a fetchable resource or a Base64-encoded string. |
| `onDownloadProgress` | `(callback: (downloadProgress: number) => void): any`                                                                     | Subscribe to the download progress event.                                                                |

<details>
<summary>Type definitions</summary>

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

interface DetectorSources: {
    detectorLarge: string;
    detectorNarrow: string;
}

interface RecognizerSources: {
    recognizerLarge: string;
    recognizerSmall: string;
}
```

</details>

## Loading the model

To load the model, use the `load` method. It accepts:

- `detectorSources` - An object that specifies the location of the detectors binary files. For more information, take a look at [loading models](../fundamentals/loading-models.md) section.
- `recognizerSources` - An object that specifies the locations of the recognizers binary files. For more information, take a look at [loading models](../fundamentals/loading-models.md) section.
- `independentCharacters` - A boolean parameter that indicates whether the text in the image consists of a random sequence of characters. If set to true, the algorithm will scan each character individually instead of reading them as continuous text.

## Running the model

To run the model, you can use the `forward` method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The method returns a promise, which can resolve either to an error or an array of `OCRDetection` objects. Each object contains coordinates of the bounding box, the label of the detected object, and the confidence score.
