# useImageSegmentation

Semantic image segmentation, akin to image classification, tries to assign the content of the image to one of the predefined classes. However, in case of segmentation this classification is done on a per-pixel basis, so as the result the model provides an image-sized array of scores for each of the classes. You can then use this information to detect objects on a per-pixel basis. React Native ExecuTorch offers a dedicated hook `useImageSegmentation` for this task.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

It is recommended to use models provided by us which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/image-segmentation-68d5291bdf4a30bee0220f4f), you can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `useImageSegmentation` see: [`useImageSegmentation` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useImageSegmentation).
* For all image segmentation models available out-of-the-box in React Native ExecuTorch see: [Image Segmentation Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---image-segmentation).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

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

### Arguments[​](#arguments "Direct link to Arguments")

`useImageSegmentation` takes [`ImageSegmentationProps`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ImageSegmentationProps) that consists of:

* `model` containing [`modelSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ImageSegmentationProps#modelsource).
* An optional flag [`preventLoad`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ImageSegmentationProps#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:

* For detailed information about `useImageSegmentation` arguments check this section: [`useImageSegmentation` arguments](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useImageSegmentation#parameters).
* For all image segmentation models available out-of-the-box in React Native ExecuTorch see: [Image Segmentation Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---image-segmentation).
* For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

### Returns[​](#returns "Direct link to Returns")

`useImageSegmentation` returns an object called `ImageSegmentationType` containing bunch of functions to interact with image segmentation models. To get more details please read: [`ImageSegmentationType` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ImageSegmentationType).

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ImageSegmentationType#forward) method. It accepts three arguments: a required image, an optional list of classes, and an optional flag whether to resize the output to the original dimensions.

* The image can be a remote URL, a local file URI, or a base64-encoded image.
* The [`classesOfInterest`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ImageSegmentationType#classesofinterest) list contains classes for which to output the full results. By default the list is empty, and only the most probable classes are returned (essentially an arg max for each pixel). Look at [`DeeplabLabel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/DeeplabLabel) enum for possible classes.
* The [`resize`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ImageSegmentationType#resize) flag says whether the output will be rescaled back to the size of the image you put in. The default is `false`. The model runs inference on a scaled (probably smaller) version of your image (224x224 for `DEEPLAB_V3_RESNET50`). If you choose to resize, the output will be `number[]` of size `width * height` of your original image.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

Setting `resize` to true will make `forward` slower.

[`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ImageSegmentationType#forward) returns a promise which can resolve either to an error or a dictionary containing number arrays with size depending on [`resize`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ImageSegmentationType#resize):

* For the key [`DeeplabLabel.ARGMAX`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/DeeplabLabel#argmax) the array contains for each pixel an integer corresponding to the class with the highest probability.
* For every other key from [`DeeplabLabel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/DeeplabLabel), if the label was included in [`classesOfInterest`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ImageSegmentationType#classesofinterest) the dictionary will contain an array of floats corresponding to the probability of this class for every pixel.

## Example[​](#example "Direct link to Example")

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

## Supported models[​](#supported-models "Direct link to Supported models")

| Model                                                                                             | Number of classes | Class list                                                                                                      |
| ------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| [deeplabv3\_resnet50](https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3) | 21                | [DeeplabLabel](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/DeeplabLabel) |
