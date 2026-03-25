# useInstanceSegmentation

Instance segmentation is a computer vision technique that detects individual objects within an image and produces a per-pixel segmentation mask for each one. Unlike object detection (which only returns bounding boxes), instance segmentation provides precise object boundaries. React Native ExecuTorch offers a dedicated hook `useInstanceSegmentation` for this task.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/instance-segmentation).

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `useInstanceSegmentation` see: [`useInstanceSegmentation` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useInstanceSegmentation).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

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

### Arguments[​](#arguments "Direct link to Arguments")

`useInstanceSegmentation` takes [`InstanceSegmentationProps`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/InstanceSegmentationProps) that consists of:

* `model` - An object containing:

  <!-- -->

  * `modelName` - The name of a built-in model. See [`InstanceSegmentationModelName`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/InstanceSegmentationModelName) for the list of supported models.
  * `modelSource` - The location of the model binary (a URL or a bundled resource).

* An optional flag [`preventLoad`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/InstanceSegmentationProps#preventload) which prevents auto-loading of the model.

The hook is generic over the model config — TypeScript automatically infers the correct label type based on the `modelName` you provide. No explicit generic parameter is needed.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

### Returns[​](#returns "Direct link to Returns")

`useInstanceSegmentation` returns an [`InstanceSegmentationType`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/InstanceSegmentationType) object containing:

* `isReady` - Whether the model is loaded and ready to process images.
* `isGenerating` - Whether the model is currently processing an image.
* `error` - An error object if the model failed to load or encountered a runtime error.
* `downloadProgress` - A value between 0 and 1 representing the download progress of the model binary.
* `forward` - A function to run inference on an image.
* `getAvailableInputSizes` - Returns the available input sizes for the loaded model, or `undefined` if the model accepts only a single input size. Use this to populate UI controls for selecting the input resolution.
* `runOnFrame` - A synchronous worklet function for real-time VisionCamera frame processing. See [VisionCamera Integration](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/visioncamera-integration.md) for usage.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/InstanceSegmentationType#forward) method. It accepts two arguments:

* `imageSource` (required) - The image to process. Can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PixelData) object (raw RGB pixel buffer).

* `options` (optional) - An [`InstanceSegmentationOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/InstanceSegmentationOptions) object with the following fields:

  <!-- -->

  * `confidenceThreshold` - Minimum confidence score for including instances. Defaults to the model's configured threshold (typically `0.5`).
  * `iouThreshold` - IoU threshold for non-maximum suppression. Defaults to `0.5`.
  * `maxInstances` - Maximum number of instances to return. Defaults to `100`.
  * `classesOfInterest` - Filter results to include only specific classes (e.g. `['PERSON', 'CAR']`). Use label names from the model's label enum (e.g. [`CocoLabelYolo`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/CocoLabelYolo) for YOLO models).
  * `returnMaskAtOriginalResolution` - Whether to resize masks to the original image resolution. Defaults to `true`.
  * `inputSize` - Input size for the model (e.g. `384`, `512`, `640`). Must be one of the model's available input sizes. If the model has only one forward method (i.e. no `availableInputSizes` configured), this option is not needed.

`forward` returns a promise resolving to an array of [`SegmentedInstance`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SegmentedInstance) objects, each containing:

* `bbox` - A [`Bbox`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/Bbox) object with `x1`, `y1` (top-left corner) and `x2`, `y2` (bottom-right corner) coordinates in the original image's pixel space.
* `label` - The class name of the detected instance, typed to the label map of the chosen model.
* `score` - The confidence score of the detection, between 0 and 1.
* `mask` - A `Uint8Array` binary mask (0 or 1) representing the instance's segmentation.
* `maskWidth` - Width of the mask array.
* `maskHeight` - Height of the mask array.

## Example[​](#example "Direct link to Example")

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

## VisionCamera integration[​](#visioncamera-integration "Direct link to VisionCamera integration")

See the full guide: [VisionCamera Integration](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/visioncamera-integration.md).

## Supported models[​](#supported-models "Direct link to Supported models")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

YOLO models use the [`CocoLabelYolo`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/CocoLabelYolo) enum (80 classes, 0-indexed), which differs from [`CocoLabel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/CocoLabel) used by RF-DETR and SSDLite object detection models (91 classes, 1-indexed). When filtering with `classesOfInterest`, use the label names from `CocoLabelYolo`.

| Model           | Number of classes | Class list                                                                                                      | Available input sizes |
| --------------- | ----------------- | --------------------------------------------------------------------------------------------------------------- | --------------------- |
| yolo26n-seg     | 80                | [COCO (YOLO)](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/CocoLabelYolo) | 384, 512, 640         |
| yolo26s-seg     | 80                | [COCO (YOLO)](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/CocoLabelYolo) | 384, 512, 640         |
| yolo26m-seg     | 80                | [COCO (YOLO)](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/CocoLabelYolo) | 384, 512, 640         |
| yolo26l-seg     | 80                | [COCO (YOLO)](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/CocoLabelYolo) | 384, 512, 640         |
| yolo26x-seg     | 80                | [COCO (YOLO)](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/CocoLabelYolo) | 384, 512, 640         |
| rfdetr-nano-seg | 91                | [COCO](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/CocoLabel)            | N/A                   |
