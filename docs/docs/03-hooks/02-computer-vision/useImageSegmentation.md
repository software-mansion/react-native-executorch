---
title: useImageSegmentation
---

Semantic image segmentation, akin to image classification, tries to assign the content of the image to one of the predefined classes. However, in case of segmentation this classification is done on a per-pixel basis, so as the result the model provides an image-sized array of scores for each of the classes. You can then use this information to detect objects on a per-pixel basis. React Native ExecuTorch offers a dedicated hook `useImageSegmentation` for this task.

:::warning
It is recommended to use models provided by us which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/image-segmentation-68d5291bdf4a30bee0220f4f), you can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

- For detailed API Reference for `useImageSegmentation` see: [`useImageSegmentation` API Reference](../../06-api-reference/functions/useImageSegmentation.md).
- For all image segmentation models available out-of-the-box in React Native ExecuTorch see: [Image Segmentation Models](../../06-api-reference/index.md#models---image-segmentation).

## High Level Overview

```typescript
import {
  useImageSegmentation,
  DEEPLAB_V3_RESNET50,
} from 'react-native-executorch';

const model = useImageSegmentation({
  model: { modelName: 'deeplab-v3', modelSource: DEEPLAB_V3_RESNET50 },
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

`useImageSegmentation` takes [`ImageSegmentationProps`](../../06-api-reference/interfaces/ImageSegmentationProps.md) that consists of:

- `model` - An object containing:
  - `modelName` - The name of a built-in model. See [`ModelSources`](../../06-api-reference/type-aliases/ModelSources.md) for the list of supported models.
  - `modelSource` - The location of the model binary (a URL or a bundled resource).
- An optional flag [`preventLoad`](../../06-api-reference/interfaces/ImageSegmentationProps.md#preventload) which prevents auto-loading of the model.

The hook is generic over the model config — TypeScript automatically infers the correct label type based on the `modelName` you provide. No explicit generic parameter is needed.

You need more details? Check the following resources:

- For detailed information about `useImageSegmentation` arguments check this section: [`useImageSegmentation` arguments](../../06-api-reference/functions/useImageSegmentation.md#parameters).
- For all image segmentation models available out-of-the-box in React Native ExecuTorch see: [Image Segmentation Models](../../06-api-reference/index.md#models---image-segmentation).
- For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useImageSegmentation` returns an [`ImageSegmentationType`](../../06-api-reference/interfaces/ImageSegmentationType.md) object containing:

- `isReady` - Whether the model is loaded and ready to process images.
- `isGenerating` - Whether the model is currently processing an image.
- `error` - An error object if the model failed to load or encountered a runtime error.
- `downloadProgress` - A value between 0 and 1 representing the download progress of the model binary.
- `forward` - A function to run inference on an image.

## Running the model

To run the model, use the [`forward`](../../06-api-reference/interfaces/ImageSegmentationType.md#forward) method. It accepts three arguments:

- [`imageSource`](../../06-api-reference/interfaces/ImageSegmentationType.md#forward) (required) - The image to segment. Can be a remote URL, a local file URI, or a base64-encoded image (whole URI or only raw base64).
- [`classesOfInterest`](../../06-api-reference/interfaces/ImageSegmentationType.md#forward) (optional) - An array of label keys indicating which per-class probability masks to include in the output. Defaults to `[]` (no class masks). The `ARGMAX` map is always returned regardless of this parameter.
- [`resizeToInput`](../../06-api-reference/interfaces/ImageSegmentationType.md#forward) (optional) - Whether to resize the output masks to the original input image dimensions. Defaults to `true`. If `false`, returns the raw model output dimensions (e.g. 224x224 for `DEEPLAB_V3_RESNET50`).

:::warning
Setting `resizeToInput` to `true` will make `forward` slower.
:::

`forward` returns a promise resolving to an object containing:

- `ARGMAX` - An `Int32Array` where each element is the class index with the highest probability for that pixel.
- For each label included in `classesOfInterest`, a `Float32Array` of per-pixel probabilities for that class.

The return type is fully typed — TypeScript narrows it based on the labels you pass in `classesOfInterest`.

## Example

```typescript
import {
  useImageSegmentation,
  DEEPLAB_V3_RESNET50,
  DeeplabLabel,
} from 'react-native-executorch';

function App() {
  const model = useImageSegmentation({
    model: { modelName: 'deeplab-v3', modelSource: DEEPLAB_V3_RESNET50 },
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

## Supported models

| Model                                                                                            | Number of classes | Class list                                                                                |
| ------------------------------------------------------------------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------- |
| [deeplabv3_resnet50](https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3) | 21                | [DeeplabLabel](../../06-api-reference/enumerations/DeeplabLabel.md)                       |
| selfie-segmentation                                                                              | 2                 | [SelfieSegmentationLabel](../../06-api-reference/enumerations/SelfieSegmentationLabel.md) |
