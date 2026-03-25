---
title: useInstanceSegmentation
---

Instance segmentation is a computer vision technique that detects individual objects within an image and produces a per-pixel segmentation mask for each one. Unlike object detection (which only returns bounding boxes), instance segmentation provides precise object boundaries. React Native ExecuTorch offers a dedicated hook `useInstanceSegmentation` for this task.

:::warning
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/instance-segmentation).
:::

## API Reference

- For detailed API Reference for `useInstanceSegmentation` see: [`useInstanceSegmentation` API Reference](../../06-api-reference/functions/useInstanceSegmentation.md).

## High Level Overview

```typescript
import { useInstanceSegmentation, YOLO26N_SEG } from 'react-native-executorch';

const model = useInstanceSegmentation({
  model: YOLO26N_SEG,
});

const imageUri = 'file:///Users/.../photo.jpg';

try {
  const instances = await model.forward(imageUri);
  // instances is an array of SegmentedInstance objects
} catch (error) {
  console.error(error);
}
```

### Arguments

`useInstanceSegmentation` takes [`InstanceSegmentationProps`](../../06-api-reference/interfaces/InstanceSegmentationProps.md) that consists of:

- `model` - An object containing:
  - `modelName` - The name of a built-in model. See [`InstanceSegmentationModelName`](../../06-api-reference/type-aliases/InstanceSegmentationModelName.md) for the list of supported models.
  - `modelSource` - The location of the model binary (a URL or a bundled resource).
- An optional flag [`preventLoad`](../../06-api-reference/interfaces/InstanceSegmentationProps.md#preventload) which prevents auto-loading of the model.

The hook is generic over the model config — TypeScript automatically infers the correct label type based on the `modelName` you provide. No explicit generic parameter is needed.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useInstanceSegmentation` returns an [`InstanceSegmentationType`](../../06-api-reference/interfaces/InstanceSegmentationType.md) object containing:

- `isReady` - Whether the model is loaded and ready to process images.
- `isGenerating` - Whether the model is currently processing an image.
- `error` - An error object if the model failed to load or encountered a runtime error.
- `downloadProgress` - A value between 0 and 1 representing the download progress of the model binary.
- `forward` - A function to run inference on an image.
- `getAvailableInputSizes` - Returns the available input sizes for the loaded model, or `undefined` if the model accepts only a single input size. Use this to populate UI controls for selecting the input resolution.
- `runOnFrame` - A synchronous worklet function for real-time VisionCamera frame processing. Returns `null` until the model is ready. See [VisionCamera Integration](./visioncamera-integration.md) for usage.

## Running the model

To run the model, use the [`forward`](../../06-api-reference/interfaces/InstanceSegmentationType.md#forward) method. It accepts two arguments:

- `imageSource` (required) - The image to process. Can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](../../06-api-reference/interfaces/PixelData.md) object (raw RGB pixel buffer).
- `options` (optional) - An [`InstanceSegmentationOptions`](../../06-api-reference/interfaces/InstanceSegmentationOptions.md) object with the following fields:
  - `confidenceThreshold` - Minimum confidence score for including instances. Defaults to the model's configured threshold (typically `0.5`).
  - `iouThreshold` - IoU threshold for non-maximum suppression. Defaults to `0.5`.
  - `maxInstances` - Maximum number of instances to return. Defaults to `100`.
  - `classesOfInterest` - Filter results to include only specific classes (e.g. `['PERSON', 'CAR']`). Use label names from the model's label enum (e.g. [`CocoLabelYolo`](../../06-api-reference/enumerations/CocoLabelYolo.md) for YOLO models).
  - `returnMaskAtOriginalResolution` - Whether to resize masks to the original image resolution. Defaults to `true`.
  - `inputSize` - Input size for the model (e.g. `384`, `512`, `640`). Must be one of the model's available input sizes. If the model has only one forward method (i.e. no `availableInputSizes` configured), this option is not needed.

`forward` returns a promise resolving to an array of [`SegmentedInstance`](../../06-api-reference/interfaces/SegmentedInstance.md) objects, each containing:

- `bbox` - A [`Bbox`](../../06-api-reference/interfaces/Bbox.md) object with `x1`, `y1` (top-left corner) and `x2`, `y2` (bottom-right corner) coordinates in the original image's pixel space.
- `label` - The class name of the detected instance, typed to the label map of the chosen model.
- `score` - The confidence score of the detection, between 0 and 1.
- `mask` - A `Uint8Array` binary mask (0 or 1) representing the instance's segmentation.
- `maskWidth` - Width of the mask array.
- `maskHeight` - Height of the mask array.

## Example

```typescript
import { useInstanceSegmentation, YOLO26N_SEG } from 'react-native-executorch';

function App() {
  const model = useInstanceSegmentation({
    model: YOLO26N_SEG,
  });

  const handleSegment = async () => {
    if (!model.isReady) return;

    const imageUri = 'file:///Users/.../photo.jpg';

    try {
      const instances = await model.forward(imageUri, {
        confidenceThreshold: 0.5,
        inputSize: 640,
      });

      for (const instance of instances) {
        console.log('Label:', instance.label);
        console.log('Score:', instance.score);
        console.log('Bounding box:', instance.bbox);
        console.log('Mask size:', instance.maskWidth, 'x', instance.maskHeight);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ...
}
```

## VisionCamera integration

See the full guide: [VisionCamera Integration](./visioncamera-integration.md).

## Supported models

:::info
YOLO models use the [`CocoLabelYolo`](../../06-api-reference/enumerations/CocoLabelYolo.md) enum (80 classes, 0-indexed), which differs from [`CocoLabel`](../../06-api-reference/enumerations/CocoLabel.md) used by RF-DETR and SSDLite object detection models (91 classes, 1-indexed). When filtering with `classesOfInterest`, use the label names from `CocoLabelYolo`.
:::

| Model           | Number of classes | Class list                                                          | Available input sizes |
| --------------- | ----------------- | ------------------------------------------------------------------- | --------------------- |
| yolo26n-seg     | 80                | [COCO (YOLO)](../../06-api-reference/enumerations/CocoLabelYolo.md) | 384, 512, 640         |
| yolo26s-seg     | 80                | [COCO (YOLO)](../../06-api-reference/enumerations/CocoLabelYolo.md) | 384, 512, 640         |
| yolo26m-seg     | 80                | [COCO (YOLO)](../../06-api-reference/enumerations/CocoLabelYolo.md) | 384, 512, 640         |
| yolo26l-seg     | 80                | [COCO (YOLO)](../../06-api-reference/enumerations/CocoLabelYolo.md) | 384, 512, 640         |
| yolo26x-seg     | 80                | [COCO (YOLO)](../../06-api-reference/enumerations/CocoLabelYolo.md) | 384, 512, 640         |
| rfdetr-nano-seg | 91                | [COCO](../../06-api-reference/enumerations/CocoLabel.md)            | N/A                   |
