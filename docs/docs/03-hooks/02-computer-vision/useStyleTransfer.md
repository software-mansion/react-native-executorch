---
title: useStyleTransfer
---

Style transfer is a technique used in computer graphics and machine learning where the visual style of one image is applied to the content of another. This is achieved using algorithms that manipulate data from both images, typically with the aid of a neural network. The result is a new image that combines the artistic elements of one picture with the structural details of another, effectively merging art with traditional imagery. React Native ExecuTorch offers a dedicated hook `useStyleTransfer`, for this task. However before you start you'll need to obtain ExecuTorch-compatible model binary.

:::warning
It is recommended to use models provided by us which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/style-transfer-68d0eab2b0767a20e7efeaf5), you can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

- For detailed API Reference for `useStyleTransfer` see: [`useStyleTransfer` API Reference](../../06-api-reference/functions/useStyleTransfer.md).
- For all style transfer models available out-of-the-box in React Native ExecuTorch see: [Style Transfer Models](../../06-api-reference/index.md#models---style-transfer).

## High Level Overview

```typescript
import {
  useStyleTransfer,
  STYLE_TRANSFER_CANDY,
} from 'react-native-executorch';

const model = useStyleTransfer({ model: STYLE_TRANSFER_CANDY });

const imageUri = 'file:///Users/.../cute_cat.png';

try {
  // Returns a file URI string
  const uri = await model.forward(imageUri, 'url');
  // Or returns raw PixelData (default)
  const pixels = await model.forward(imageUri);
} catch (error) {
  console.error(error);
}
```

### Arguments

`useStyleTransfer` takes [`StyleTransferProps`](../../06-api-reference/interfaces/StyleTransferProps.md) that consists of:

- `model` containing [`modelSource`](../../06-api-reference/interfaces/StyleTransferProps.md#modelsource).
- An optional flag [`preventLoad`](../../06-api-reference/interfaces/StyleTransferProps.md#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:

- For detailed information about `useStyleTransfer` arguments check this section: [`useStyleTransfer` arguments](../../06-api-reference/functions/useStyleTransfer.md#parameters).
- For all style transfer models available out-of-the-box in React Native ExecuTorch see: [Style Transfer Models](../../06-api-reference/index.md#models---style-transfer).
- For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useStyleTransfer` returns an object called `StyleTransferType` containing bunch of functions to interact with style transfer models. To get more details please read: [`StyleTransferType` API Reference](../../06-api-reference/interfaces/StyleTransferType.md).

## Running the model

To run the model, use the [`forward`](../../06-api-reference/interfaces/StyleTransferType.md#forward) method. It accepts two arguments:

- `input` (required) — The image to stylize. Can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](../../06-api-reference/interfaces/PixelData.md) object (raw RGB pixel buffer).
- `outputType` (optional) — Controls the return format:
  - `'pixelData'` (default) — Returns a `PixelData` object with raw RGB pixels. No file is written.
  - `'url'` — Saves the result to a temp file and returns its URI as a `string`.

:::info
When `outputType` is `'url'`, the generated image is stored in your application's temporary directory.
:::

## Example

```typescript
import {
  useStyleTransfer,
  STYLE_TRANSFER_CANDY,
} from 'react-native-executorch';

function App() {
  const model = useStyleTransfer({ model: STYLE_TRANSFER_CANDY });

  // Returns a file URI — easy to pass to <Image source={{ uri }} />
  const runWithUrl = async (imageUri: string) => {
    try {
      const uri = await model.forward(imageUri, 'url');
      console.log('Styled image saved at:', uri);
    } catch (error) {
      console.error(error);
    }
  };

  // Returns raw PixelData — useful for further processing or frame pipelines
  const runWithPixelData = async (imageUri: string) => {
    try {
      const pixels = await model.forward(imageUri);
      // pixels.dataPtr is a Uint8Array of RGB bytes
    } catch (error) {
      console.error(error);
    }
  };
}
```

## VisionCamera integration

For real-time style transfer on camera frames, use `runOnFrame`. It runs synchronously on the JS worklet thread and always returns `PixelData`.

See the full guide: [VisionCamera Integration](./visioncamera-integration.md).

## Supported models

- [Candy](https://github.com/pytorch/examples/tree/main/fast_neural_style)
- [Mosaic](https://github.com/pytorch/examples/tree/main/fast_neural_style)
- [Udnie](https://github.com/pytorch/examples/tree/main/fast_neural_style)
- [Rain princess](https://github.com/pytorch/examples/tree/main/fast_neural_style)
