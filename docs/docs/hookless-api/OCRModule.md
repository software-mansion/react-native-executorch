---
title: OCRModule
sidebar_position: 6
---

Hookless implementation of the [useOCR](../computer-vision/useOCR.md) hook.

## Reference

```typescript
import {
  OCRModule,
  CRAFT_800,
  CRNN_RECOGNIZERS_EN,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Loading the model
await OCRModule.load({
  detectorSource: CRAFT_800,
  recognizerSources: CRNN_RECOGNIZERS_EN,
});

// Running the model
const ocrDetections = await OCRModule.forward(imageUri);
```

### Methods

| Method               | Type                                                                            | Description                                                                                              |
| -------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `load`               | `(detectorSource: string, recognizerSources: RecognizerSources): Promise<void>` | Loads the model, where `modelSource` is a string that specifies the location of the model binary.        |
| `forward`            | `(input: string): Promise<OCRDetections[]>`                                     | Executes the model's forward pass, where `input` can be a fetchable resource or a Base64-encoded string. |
| `onDownloadProgress` | `(callback: (downloadProgress: number) => void): any`                           | Subscribe to the download progress event.                                                                |

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

interface RecognizerSources: {
    recognizerLarge: String;
    recognizerMedium: String;
    recognizerSmall: String;
}
```

</details>

## Loading the model

To load the model, use the `load` method. It accepts the `detectorSource` - a string that specifies the location of the detector binary and `recognizerSources` which is an object specifying locations of the recognizer binary files. For more information, take a look at [loading models](../fundamentals/loading-models.md) page. This method returns a promise, which can resolve to an error or void.

## Running the model

To run the model, you can use the `forward` method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The method returns a promise, which can resolve either to an error or an array of `OCRDetection` objects. Each object contains coordinates of the bounding box, the label of the detected object, and the confidence score.
