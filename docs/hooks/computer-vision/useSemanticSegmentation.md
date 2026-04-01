# useSemanticSegmentation

Semantic semantic segmentation, akin to image classification, tries to assign the content of the image to one of the predefined classes. However, in case of segmentation this classification is done on a per-pixel basis, so as the result the model provides an image-sized array of scores for each of the classes. You can then use this information to detect objects on a per-pixel basis. React Native ExecuTorch offers a dedicated hook `useSemanticSegmentation` for this task.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

It is recommended to use models provided by us which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/semantic-segmentation-68d5291bdf4a30bee0220f4f), you can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `useSemanticSegmentation` see: [`useSemanticSegmentation` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useSemanticSegmentation).
* For all semantic segmentation models available out-of-the-box in React Native ExecuTorch see: [Semantic Segmentation Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---semantic-segmentation).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

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

### Arguments[​](#arguments "Direct link to Arguments")

`useSemanticSegmentation` takes [`SemanticSegmentationProps`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SemanticSegmentationProps) that consists of:

* `model` - An object containing:

  <!-- -->

  * `modelName` - The name of a built-in model. See [`SemanticSegmentationModelSources`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SemanticSegmentationModelSources) for the list of supported models.
  * `modelSource` - The location of the model binary (a URL or a bundled resource).

* An optional flag [`preventLoad`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SemanticSegmentationProps#preventload) which prevents auto-loading of the model.

The hook is generic over the model config — TypeScript automatically infers the correct label type based on the `modelName` you provide. No explicit generic parameter is needed.

You need more details? Check the following resources:

* For detailed information about `useSemanticSegmentation` arguments check this section: [`useSemanticSegmentation` arguments](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useSemanticSegmentation#parameters).
* For all semantic segmentation models available out-of-the-box in React Native ExecuTorch see: [Semantic Segmentation Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---semantic-segmentation).
* For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

### Returns[​](#returns "Direct link to Returns")

`useSemanticSegmentation` returns an [`SemanticSegmentationType`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SemanticSegmentationType) object containing:

* `isReady` - Whether the model is loaded and ready to process images.
* `isGenerating` - Whether the model is currently processing an image.
* `error` - An error object if the model failed to load or encountered a runtime error.
* `downloadProgress` - A value between 0 and 1 representing the download progress of the model binary.
* `forward` - A function to run inference on an image.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SemanticSegmentationType#forward) method. It accepts three arguments:

* [`input`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SemanticSegmentationType#forward) (required) - The image to segment. Can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PixelData) object (raw RGB pixel buffer).
* [`classesOfInterest`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SemanticSegmentationType#forward) (optional) - An array of label keys indicating which per-class probability masks to include in the output. Defaults to `[]` (no class masks). The `ARGMAX` map is always returned regardless of this parameter.
* [`resizeToInput`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SemanticSegmentationType#forward) (optional) - Whether to resize the output masks to the original input image dimensions. Defaults to `true`. If `false`, returns the raw model output dimensions (e.g. 224x224 for `DEEPLAB_V3_RESNET50`).

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)tip

Setting `resizeToInput` to `false` will make `forward` faster.

`forward` returns a promise resolving to an object containing:

* `ARGMAX` - An `Int32Array` where each element is the class index with the highest probability for that pixel.
* For each label included in `classesOfInterest`, a `Float32Array` of per-pixel probabilities for that class.

The return type is fully typed — TypeScript narrows it based on the labels you pass in `classesOfInterest`.

## Example[​](#example "Direct link to Example")

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

## VisionCamera integration[​](#visioncamera-integration "Direct link to VisionCamera integration")

See the full guide: [VisionCamera Integration](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/visioncamera-integration.md).

## Supported models[​](#supported-models "Direct link to Supported models")

| Model                                                                                                       | Number of classes | Class list                                                                                                                            | Quantized |
| ----------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| [deeplab-v3-resnet50](https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3)           | 21                | [DeeplabLabel](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/DeeplabLabel)                       | ✅        |
| [deeplab-v3-resnet101](https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3)          | 21                | [DeeplabLabel](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/DeeplabLabel)                       | ✅        |
| [deeplab-v3-mobilenet-v3-large](https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3) | 21                | [DeeplabLabel](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/DeeplabLabel)                       | ✅        |
| [lraspp-mobilenet-v3-large](https://huggingface.co/software-mansion/react-native-executorch-lraspp)         | 21                | [DeeplabLabel](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/DeeplabLabel)                       | ✅        |
| [fcn-resnet50](https://huggingface.co/software-mansion/react-native-executorch-fcn)                         | 21                | [DeeplabLabel](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/DeeplabLabel)                       | ✅        |
| [fcn-resnet101](https://huggingface.co/software-mansion/react-native-executorch-fcn)                        | 21                | [DeeplabLabel](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/DeeplabLabel)                       | ✅        |
| [selfie-segmentation](https://huggingface.co/software-mansion/react-native-executorch-selfie-segmentation)  | 2                 | [SelfieSegmentationLabel](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/SelfieSegmentationLabel) | No        |
