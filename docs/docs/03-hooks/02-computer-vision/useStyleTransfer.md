---
title: useStyleTransfer
---

Style transfer is a technique used in computer graphics and machine learning where the visual style of one image is applied to the content of another. This is achieved using algorithms that manipulate data from both images, typically with the aid of a neural network. The result is a new image that combines the artistic elements of one picture with the structural details of another, effectively merging art with traditional imagery. React Native ExecuTorch offers a dedicated hook `useStyleTransfer`, for this task. However before you start you'll need to obtain ExecuTorch-compatible model binary.

:::warning
It is recommended to use models provided by us which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/style-transfer-68d0eab2b0767a20e7efeaf5), you can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

* For detailed API Reference for `useStyleTransfer` see: [`useStyleTransfer` API Reference](../../06-api-reference/functions/useStyleTransfer.md).
* For all style transfer models available out-of-the-box in React Native ExecuTorch see: [Style Transfer Models](../../06-api-reference/index.md#models---style-transfer).

## Reference

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

### Arguments

`useStyleTransfer` takes [`StyleTransferProps`](../../06-api-reference/interfaces/StyleTransferProps.md) that consists of:
* `model` containing [`modelSource`](../../06-api-reference/interfaces/StyleTransferProps.md#modelsource). 
* An optional flag [`preventLoad`](../../06-api-reference/interfaces/StyleTransferProps.md#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:
* For detailed information about `useStyleTransfer` arguments check this section: [`useStyleTransfer` arguments](../../06-api-reference/functions/useStyleTransfer.md#parameters).
* For all style transfer models available out-of-the-box in React Native ExecuTorch see: [Style Transfer Models](../../06-api-reference/index.md#models---style-transfer).
* For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useStyleTransfer` returns an object called `StyleTransferType` containing bunch of functions to interact with style transfer models. To get more details please read: [`StyleTransferType` API Reference](../../06-api-reference/interfaces/StyleTransferType.md).

## Running the model

To run the model, you can use [`forward`](../../06-api-reference/interfaces/StyleTransferType.md#forward) method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The function returns a promise which can resolve either to an error or a URL to generated image.

:::info
Images from external sources and the generated image are stored in your application's temporary directory.
:::

## Example

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

## Supported models

- [Candy](https://github.com/pytorch/examples/tree/main/fast_neural_style)
- [Mosaic](https://github.com/pytorch/examples/tree/main/fast_neural_style)
- [Udnie](https://github.com/pytorch/examples/tree/main/fast_neural_style)
- [Rain princess](https://github.com/pytorch/examples/tree/main/fast_neural_style)
