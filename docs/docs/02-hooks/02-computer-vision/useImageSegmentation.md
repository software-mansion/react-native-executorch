---
title: useImageSegmentation
---

Semantic image segmentation, akin to image classification, tries to assign the content of the image to one of the predefined classes. However, in case of segmentation this classification is done on a per-pixel basis, so as the result the model provides an image-sized array of scores for each of the classes. You can then use this information to detect objects on a per-pixel basis. React Native ExecuTorch offers a dedicated hook `useImageSegmentation` for this task.

:::warning
It is recommended to use models provided by us which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/image-segmentation-68d5291bdf4a30bee0220f4f), you can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

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

**`model`** - Object containing the model source.

- **`modelSource`** - A string that specifies the location of the model binary.

**`preventLoad?`** - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

| Field              | Type                                                                                                                         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `forward`          | `(imageSource: string, classesOfInterest?: DeeplabLabel[], resize?: boolean) => Promise<{[key in DeeplabLabel]?: number[]}>` | Executes the model's forward pass, where: <br/> \* `imageSource` can be a fetchable resource or a Base64-encoded string. <br/> \* `classesOfInterest` is an optional list of `DeeplabLabel` used to indicate additional arrays of probabilities to output (see section "Running the model"). The default is an empty list. <br/> \* `resize` is an optional boolean to indicate whether the output should be resized to the original image dimensions, or left in the size of the model (see section "Running the model"). The default is `false`. <br/> <br/> The return is a dictionary containing: <br/> \* for the key `DeeplabLabel.ARGMAX` an array of integers corresponding to the most probable class for each pixel <br/> \* an array of floats for each class from `classesOfInterest` corresponding to the probabilities for this class. |
| `error`            | <code>string &#124; null</code>                                                                                              | Contains the error message if the model failed to load.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `isGenerating`     | `boolean`                                                                                                                    | Indicates whether the model is currently processing an inference.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `isReady`          | `boolean`                                                                                                                    | Indicates whether the model has successfully loaded and is ready for inference.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `downloadProgress` | `number`                                                                                                                     | Represents the download progress as a value between 0 and 1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

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

## Benchmarks

### Model size

| Model             | XNNPACK [MB] |
| ----------------- | ------------ |
| DEELABV3_RESNET50 | 168          |

### Memory usage

:::warning
Data presented in the following sections is based on inference with non-resized output. When resize is enabled, expect higher memory usage and inference time with higher resolutions.
:::

| Model             | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ----------------- | ---------------------- | ------------------ |
| DEELABV3_RESNET50 | 930                    | 660                |

### Inference time

:::warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

| Model             | iPhone 16 Pro (Core ML) [ms] | iPhone 14 Pro Max (Core ML) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] |
| ----------------- | ---------------------------- | -------------------------------- | --------------------------------- |
| DEELABV3_RESNET50 | 1000                         | 670                              | 700                               |
