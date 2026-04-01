# useClassification

Image classification is the process of assigning a label to an image that best describes its contents. For example, when given an image of a puppy, the image classifier should assign the puppy class to that image.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)note

Usually, the class with the highest probability is the one that is assigned to an image. However, if there are multiple classes with comparatively high probabilities, this may indicate that the model is not confident in its prediction.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/classification-68d0ea49b5c7de8a3cae1e68). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `useClassification` see: [`useClassification` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useClassification).
* For all classification models available out-of-the-box in React Native ExecuTorch see: [Classification Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---classification).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import { useClassification, EFFICIENTNET_V2_S } from 'react-native-executorch';

const model = useClassification({ model: EFFICIENTNET_V2_S });

const imageUri = 'file::///Users/.../cute_puppy.png';

try {
  const classesWithProbabilities = await model.forward(imageUri);
} catch (error) {
  console.error(error);
}

```

### Arguments[​](#arguments "Direct link to Arguments")

`useClassification` takes [`ClassificationProps`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ClassificationProps) that consists of:

* `model` - An object containing:

  <!-- -->

  * `modelName` - The name of a built-in model. See [`ClassificationModelSources`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ClassificationProps) for the list of supported models.
  * `modelSource` - The location of the model binary (a URL or a bundled resource).

* An optional flag [`preventLoad`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ClassificationProps#preventload) which prevents auto-loading of the model.

The hook is generic over the model config — TypeScript automatically infers the correct label type based on the `modelName` you provide. No explicit generic parameter is needed.

You need more details? Check the following resources:

* For detailed information about `useClassification` arguments check this section: [`useClassification` arguments](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useClassification#parameters).
* For all classification models available out-of-the-box in React Native ExecuTorch see: [Classification Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---classification).
* For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

### Returns[​](#returns "Direct link to Returns")

`useClassification` returns a [`ClassificationType`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ClassificationType) object containing:

* `isReady` - Whether the model is loaded and ready to process images.
* `isGenerating` - Whether the model is currently processing an image.
* `error` - An error object if the model failed to load or encountered a runtime error.
* `downloadProgress` - A value between 0 and 1 representing the download progress of the model binary.
* `forward` - A function to run inference on an image.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ClassificationType#forward) method. It accepts one argument — the image to classify. The image can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PixelData) object (raw RGB pixel buffer). The function returns a promise resolving to an object mapping label keys to their probabilities.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

Images from external sources are stored in your application's temporary directory.

## VisionCamera integration[​](#visioncamera-integration "Direct link to VisionCamera integration")

See the full guide: [VisionCamera Integration](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/visioncamera-integration.md).

## Example[​](#example "Direct link to Example")

```typescript
import { useClassification, EFFICIENTNET_V2_S } from 'react-native-executorch';

function App() {
  const model = useClassification({ model: EFFICIENTNET_V2_S });

  // ...
  const imageUri = 'file:///Users/.../cute_puppy.png';

  try {
    const classesWithProbabilities = await model.forward(imageUri);

    // Extract three classes with the highest probabilities
    const topThreeClasses = Object.entries(classesWithProbabilities)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([label, score]) => ({ label, score }));
  } catch (error) {
    console.error(error);
  }
  // ...
}

```

## Supported models[​](#supported-models "Direct link to Supported models")

| Model                                                                                                    | Number of classes | Class list                                                                                                                                                                                   | Quantized |
| -------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| [efficientnet\_v2\_s](https://huggingface.co/software-mansion/react-native-executorch-efficientnet-v2-s) | 1000              | [ImageNet1k\_v1](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/constants/classification.ts) | ✅        |
