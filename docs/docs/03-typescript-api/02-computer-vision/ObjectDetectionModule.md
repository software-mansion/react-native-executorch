---
title: ObjectDetectionModule
---

TypeScript API implementation of the [useObjectDetection](../../02-hooks/02-computer-vision/useObjectDetection.md) hook.

## Reference

```typescript
import {
  ObjectDetectionModule,
  SSDLITE_320_MOBILENET_V3_LARGE,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Creating an instance
const objectDetectionModule = new ObjectDetectionModule();

// Loading the model
await objectDetectionModule.load(SSDLITE_320_MOBILENET_V3_LARGE);

// Running the model
const detections = await objectDetectionModule.forward(imageUri);
```

### Methods

| Method    | Type                                                                                                               | Description                                                                                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `load`    | `(model: { modelSource: ResourceSource }, onDownloadProgressCallback?: (progress: number) => void): Promise<void>` | Loads the model, where `modelSource` is a string that specifies the location of the model binary. To track the download progress, supply a callback function `onDownloadProgressCallback`. |
| `forward` | `(input: string, detectionThreshold: number = 0.7): Promise<Detection[]>`                                          | Executes the model's forward pass, where `input` can be a fetchable resource or a Base64-encoded string. `detectionThreshold` can be supplied to alter the sensitivity of the detection.   |
| `delete`  | `(): void`                                                                                                         | Release the memory held by the module. Calling `forward` afterwards is invalid.                                                                                                            |

<details>
<summary>Type definitions</summary>

```typescript
type ResourceSource = string | number | object;

interface Bbox {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

interface Detection {
  bbox: Bbox;
  label: keyof typeof CocoLabel;
  score: number;
}
```

</details>

## Loading the model

To load the model, create a new instance of the module and use the `load` method on it. It accepts an object:

**`model`** - Object containing the model source.

- **`modelSource`** - A string that specifies the location of the model binary.

**`onDownloadProgressCallback`** - (Optional) Function called on download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, you can use the `forward` method on the module object. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The method returns a promise, which can resolve either to an error or an array of `Detection` objects. Each object contains coordinates of the bounding box, the label of the detected object, and the confidence score.

## Managing memory

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method `delete()` on the module object you will no longer use, and want to remove from the memory. Note that you cannot use `forward` after `delete` unless you load the module again.
