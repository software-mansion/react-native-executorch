# useStyleTransfer

Style transfer is a technique used in computer graphics and machine learning where the visual style of one image is applied to the content of another. This is achieved using algorithms that manipulate data from both images, typically with the aid of a neural network. The result is a new image that combines the artistic elements of one picture with the structural details of another, effectively merging art with traditional imagery. React Native ExecuTorch offers a dedicated hook `useStyleTransfer`, for this task. However before you start you'll need to obtain ExecuTorch-compatible model binary.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

It is recommended to use models provided by us which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/style-transfer-68d0eab2b0767a20e7efeaf5), you can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `useStyleTransfer` see: [`useStyleTransfer` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useStyleTransfer).
* For all style transfer models available out-of-the-box in React Native ExecuTorch see: [Style Transfer Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---style-transfer).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import {
  useStyleTransfer,
  STYLE_TRANSFER_CANDY,
} from 'react-native-executorch';

const model = useStyleTransfer({ model: STYLE_TRANSFER_CANDY });

const imageUri = 'file::///Users/.../cute_cat.png';

try {
  const generatedImageUrl = await model.forward(imageUri);
} catch (error) {
  console.error(error);
}

```

### Arguments[​](#arguments "Direct link to Arguments")

`useStyleTransfer` takes [`StyleTransferProps`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/StyleTransferProps) that consists of:

* `model` containing [`modelSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/StyleTransferProps#modelsource).
* An optional flag [`preventLoad`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/StyleTransferProps#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:

* For detailed information about `useStyleTransfer` arguments check this section: [`useStyleTransfer` arguments](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useStyleTransfer#parameters).
* For all style transfer models available out-of-the-box in React Native ExecuTorch see: [Style Transfer Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---style-transfer).
* For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

### Returns[​](#returns "Direct link to Returns")

`useStyleTransfer` returns an object called `StyleTransferType` containing bunch of functions to interact with style transfer models. To get more details please read: [`StyleTransferType` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/StyleTransferType).

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/StyleTransferType#forward) method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The function returns a promise which can resolve either to an error or a URL to generated image.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

Images from external sources and the generated image are stored in your application's temporary directory.

## Example[​](#example "Direct link to Example")

```typescript
function App() {
  const model = useStyleTransfer({ model: STYLE_TRANSFER_CANDY });

  // ...
  const imageUri = 'file::///Users/.../cute_cat.png';

  try {
    const generatedImageUrl = await model.forward(imageUri);
  } catch (error) {
    console.error(error);
  }
  // ...
}

```

## Supported models[​](#supported-models "Direct link to Supported models")

* [Candy](https://github.com/pytorch/examples/tree/main/fast_neural_style)
* [Mosaic](https://github.com/pytorch/examples/tree/main/fast_neural_style)
* [Udnie](https://github.com/pytorch/examples/tree/main/fast_neural_style)
* [Rain princess](https://github.com/pytorch/examples/tree/main/fast_neural_style)
