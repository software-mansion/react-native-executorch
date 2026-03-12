---
title: useSemanticSegmentation
---

Semantic semantic segmentation, akin to image classification, tries to assign the content of the image to one of the predefined classes. However, in case of segmentation this classification is done on a per-pixel basis, so as the result the model provides an image-sized array of scores for each of the classes. You can then use this information to detect objects on a per-pixel basis. React Native ExecuTorch offers a dedicated hook `useSemanticSegmentation` for this task.

:::warning
It is recommended to use models provided by us which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/semantic-segmentation-68d5291bdf4a30bee0220f4f), you can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

- For detailed API Reference for `useSemanticSegmentation` see: [`useSemanticSegmentation` API Reference](../../06-api-reference/functions/useSemanticSegmentation.md).
- For all semantic segmentation models available out-of-the-box in React Native ExecuTorch see: [Semantic Segmentation Models](../../06-api-reference/index.md#models---semantic-segmentation).

## High Level Overview

```typescript
import {
  useSemanticSegmentation,
  DEEPLAB_V3_RESNET50,
} from 'react-native-executorch';

const model = useSemanticSegmentation({
  model: DEEPLAB_V3_RESNET50,
});

const imageUri = 'file::///Users/.../cute_cat.png';

try {
  const result = await model.forward(imageUri);
  // result.ARGMAX is an Int32Array of per-pixel class indices
} catch (error) {
  console.error(error);
}
```

### Arguments

`useSemanticSegmentation` takes [`SemanticSegmentationProps`](../../06-api-reference/interfaces/SemanticSegmentationProps.md) that consists of:

- `model` - An object containing:
  - `modelName` - The name of a built-in model. See [`SemanticSegmentationModelSources`](../../06-api-reference/type-aliases/SemanticSegmentationModelSources.md) for the list of supported models.
  - `modelSource` - The location of the model binary (a URL or a bundled resource).
- An optional flag [`preventLoad`](../../06-api-reference/interfaces/SemanticSegmentationProps.md#preventload) which prevents auto-loading of the model.

The hook is generic over the model config — TypeScript automatically infers the correct label type based on the `modelName` you provide. No explicit generic parameter is needed.

You need more details? Check the following resources:

- For detailed information about `useSemanticSegmentation` arguments check this section: [`useSemanticSegmentation` arguments](../../06-api-reference/functions/useSemanticSegmentation.md#parameters).
- For all semantic segmentation models available out-of-the-box in React Native ExecuTorch see: [Semantic Segmentation Models](../../06-api-reference/index.md#models---semantic-segmentation).
- For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useSemanticSegmentation` returns an [`SemanticSegmentationType`](../../06-api-reference/interfaces/SemanticSegmentationType.md) object containing:

- `isReady` - Whether the model is loaded and ready to process images.
- `isGenerating` - Whether the model is currently processing an image.
- `error` - An error object if the model failed to load or encountered a runtime error.
- `downloadProgress` - A value between 0 and 1 representing the download progress of the model binary.
- `forward` - A function to run inference on an image.

## Running the model

To run the model, use the [`forward`](../../06-api-reference/interfaces/SemanticSegmentationType.md#forward) method. It accepts three arguments:

- [`input`](../../06-api-reference/interfaces/SemanticSegmentationType.md#forward) (required) - The image to segment. Can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](../../06-api-reference/interfaces/PixelData.md) object (raw RGB pixel buffer).
- [`classesOfInterest`](../../06-api-reference/interfaces/SemanticSegmentationType.md#forward) (optional) - An array of label keys indicating which per-class probability masks to include in the output. Defaults to `[]` (no class masks). The `ARGMAX` map is always returned regardless of this parameter.
- [`resizeToInput`](../../06-api-reference/interfaces/SemanticSegmentationType.md#forward) (optional) - Whether to resize the output masks to the original input image dimensions. Defaults to `true`. If `false`, returns the raw model output dimensions (e.g. 224x224 for `DEEPLAB_V3_RESNET50`).

:::warning
Setting `resizeToInput` to `false` will make `forward` faster.
:::

`forward` returns a promise resolving to an object containing:

- `ARGMAX` - An `Int32Array` where each element is the class index with the highest probability for that pixel.
- For each label included in `classesOfInterest`, a `Float32Array` of per-pixel probabilities for that class.

The return type is fully typed — TypeScript narrows it based on the labels you pass in `classesOfInterest`.

## Example

```typescript
import {
  useSemanticSegmentation,
  DEEPLAB_V3_RESNET50,
  DeeplabLabel,
} from 'react-native-executorch';

function App() {
  const model = useSemanticSegmentation({
    model: DEEPLAB_V3_RESNET50,
  });

  const handleSegment = async () => {
    if (!model.isReady) return;

    const imageUri = 'file::///Users/.../cute_cat.png';

    try {
      const result = await model.forward(imageUri, ['CAT', 'PERSON'], true);

      // result.ARGMAX — Int32Array of per-pixel class indices
      // result.CAT — Float32Array of per-pixel probabilities for CAT
      // result.PERSON — Float32Array of per-pixel probabilities for PERSON
    } catch (error) {
      console.error(error);
    }
  };

  // ...
}
```

## VisionCamera integration

For real-time segmentation on camera frames, use `runOnFrame`. It runs synchronously on the JS worklet thread and returns the same segmentation result object as `forward`.

See the full guide: [VisionCamera Integration](./visioncamera-integration.md).

## Supported models

| Model                                                                                                       | Number of classes | Class list                                                                                | Quantized |
| ----------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------- | :-------: |
| [deeplab-v3-resnet50](https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3)           | 21                | [DeeplabLabel](../../06-api-reference/enumerations/DeeplabLabel.md)                       |    Yes    |
| [deeplab-v3-resnet101](https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3)          | 21                | [DeeplabLabel](../../06-api-reference/enumerations/DeeplabLabel.md)                       |    Yes    |
| [deeplab-v3-mobilenet-v3-large](https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3) | 21                | [DeeplabLabel](../../06-api-reference/enumerations/DeeplabLabel.md)                       |    Yes    |
| [lraspp-mobilenet-v3-large](https://huggingface.co/software-mansion/react-native-executorch-lraspp)         | 21                | [DeeplabLabel](../../06-api-reference/enumerations/DeeplabLabel.md)                       |    Yes    |
| [fcn-resnet50](https://huggingface.co/software-mansion/react-native-executorch-fcn)                         | 21                | [DeeplabLabel](../../06-api-reference/enumerations/DeeplabLabel.md)                       |    Yes    |
| [fcn-resnet101](https://huggingface.co/software-mansion/react-native-executorch-fcn)                        | 21                | [DeeplabLabel](../../06-api-reference/enumerations/DeeplabLabel.md)                       |    Yes    |
| [selfie-segmentation](https://huggingface.co/software-mansion/react-native-executorch-selfie-segmentation)  | 2                 | [SelfieSegmentationLabel](../../06-api-reference/enumerations/SelfieSegmentationLabel.md) |    No     |
