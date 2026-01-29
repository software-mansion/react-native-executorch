---
title: useImageSegmentation
---

Semantic image segmentation, akin to image classification, tries to assign the content of the image to one of the predefined classes. However, in case of segmentation this classification is done on a per-pixel basis, so as the result the model provides an image-sized array of scores for each of the classes. You can then use this information to detect objects on a per-pixel basis. React Native ExecuTorch offers a dedicated hook `useImageSegmentation` for this task.

:::warning
It is recommended to use models provided by us which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/image-segmentation-68d5291bdf4a30bee0220f4f), you can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

* For detailed API Reference for `useImageSegmentation` see: [`useImageSegmentation` API Reference](../../06-api-reference/functions/useImageSegmentation.md).
* For all image segmentation models available out-of-the-box in React Native ExecuTorch see: [Image Segmentation Models](../../06-api-reference/index.md#models---image-segmentation).

## Reference

```typescript
import {
  useImageSegmentation,
  DEEPLAB_V3_RESNET50,
} from 'react-native-executorch';

const model = useImageSegmentation({ model: DEEPLAB_V3_RESNET50 });

const imageUri = 'file::///Users/.../cute_cat.png';

try {
  const outputDict = await model.forward(imageUri);
} catch (error) {
  console.error(error);
}
```

### Arguments

`useImageSegmentation` takes [`ImageSegmentationProps`](../../06-api-reference/interfaces/ImageSegmentationProps.md) that consists of:
* `model` containing [`modelSource`](../../06-api-reference/interfaces/ImageSegmentationProps.md#modelsource). 
* An optional flag [`preventLoad`](../../06-api-reference/interfaces/ImageSegmentationProps.md#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:
* For detailed information about `useImageSegmentation` arguments check this section: [`useImageSegmentation` arguments](../../06-api-reference/functions/useImageSegmentation.md#parameters).
* For all image segmentation models available out-of-the-box in React Native ExecuTorch see: [Image Segmentation Models](../../06-api-reference/index.md#models---image-segmentation).
* For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useImageSegmentation` returns an object called `ImageSegmentationType` containing bunch of functions to interact with image segmentation models. To get more details please read: [`ImageSegmentationType` API Reference](../../06-api-reference/interfaces/ImageSegmentationType.md).

## Running the model

To run the model, you can use the `forward` method. It accepts three arguments: a required image, an optional list of classes, and an optional flag whether to resize the output to the original dimensions.

- The image can be a remote URL, a local file URI, or a base64-encoded image.
- The `classesOfInterest` list contains classes for which to output the full results. By default the list is empty, and only the most probable classes are returned (essentially an arg max for each pixel). Look at [`DeeplabLabel`](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/imageSegmentation.ts) enum for possible classes.
- The `resize` flag says whether the output will be rescaled back to the size of the image you put in. The default is `false`. The model runs inference on a scaled (probably smaller) version of your image (224x224 for `DEEPLAB_V3_RESNET50`). If you choose to resize, the output will be `number[]` of size `width * height` of your original image.

:::warning
Setting `resize` to true will make `forward` slower.
:::

`forward` returns a promise which can resolve either to an error or a dictionary containing number arrays with size depending on `resize`:

- For the key `DeeplabLabel.ARGMAX` the array contains for each pixel an integer corresponding to the class with the highest probability.
- For every other key from `DeeplabLabel`, if the label was included in `classesOfInterest` the dictionary will contain an array of floats corresponding to the probability of this class for every pixel.

## Example

```typescript
function App() {
  const model = useImageSegmentation({ model: DEEPLAB_V3_RESNET50 });

  // ...
  const imageUri = 'file::///Users/.../cute_cat.png';

  try {
    const outputDict = await model.forward(imageUri, [DeeplabLabel.CAT], true);
  } catch (error) {
    console.error(error);
  }
  // ...
}
```

## Supported models

| Model                                                                                                                            | Number of classes | Class list                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [deeplabv3_resnet50](https://pytorch.org/vision/stable/models/generated/torchvision.models.segmentation.deeplabv3_resnet50.html) | 21                | [DeeplabLabel](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/imageSegmentation.ts) |
