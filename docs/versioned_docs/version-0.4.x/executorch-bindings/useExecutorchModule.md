---
title: useExecutorchModule
---

ExecuTorch bindings provide streamlined interface to access the [Module API](https://pytorch.org/executorch/stable/extension-module.html) directly from Javascript.

:::caution
These bindings are primarily intended for custom model integration where no dedicated hook exists. If you are considering using a provided model, first verify whether a dedicated hook is available. Dedicated hooks simplify the implementation process by managing necessary pre and post-processing automatically. Utilizing these can save you effort and reduce complexity, ensuring you do not implement additional handling that is already covered.
:::

## Initializing ExecuTorch Module

You can initialize the ExecuTorch module in your JavaScript application using the `useExecutorchModule` hook. This hook facilitates the loading of models from the specified source and prepares them for use.

```typescript
import { useExecutorchModule } from 'react-native-executorch';

const executorchModule = useExecutorchModule({
  modelSource: require('../assets/models/model.pte'),
});
```

The `modelSource` parameter expects a location string pointing to the model binary. For more details on how to specify model sources, refer to the [loading models](../fundamentals/loading-models.md) documentation.

### Arguments

**`modelSource`** - A string that specifies the location of the model binary.

**`preventLoad?`** - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

### Returns

|       Field        |                                 Type                                 |                                                                                                              Description                                                                                                              |
| :----------------: | :------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|      `error`       |                   <code>string &#124; null</code>                    |                                                                                        Contains the error message if the model failed to load.                                                                                        |
|   `isGenerating`   |                              `boolean`                               |                                                                                   Indicates whether the model is currently processing an inference.                                                                                   |
|     `isReady`      |                              `boolean`                               |                                                                            Indicates whether the model has successfully loaded and is ready for inference.                                                                            |
|     `forward`      | `(input: ETInput[] \| ETInput, shape: number[][]): Promise<unknown>` | Executes the model's forward pass, where `input` is a Javascript typed array or an array of them, and `shape` is an array of arrays of integers representing input Tensors' shapes. The output is a Tensor - raw result of inference. |
| `downloadProgress` |                               `number`                               |                                                                                     Represents the download progress as a value between 0 and 1.                                                                                      |

## ETInput

The `ETInput` type defines the typed arrays that can be used as inputs in the `forward` method:

- Int8Array
- Int32Array
- BigInt64Array
- Float32Array
- Float64Array

## Errors

All functions provided by the `useExecutorchModule` hook are asynchronous and may throw an error. The `ETError` enum includes errors [defined by the ExecuTorch team](https://github.com/pytorch/executorch/blob/main/runtime/core/error.h) and additional errors specified by our library.

## Performing inference

To run the model with ExecuTorch Bindings, it's essential to specify the shape of the input tensor(s). The `forward` method accepts an `input` (a typed array or an array of typed arrays) and a `shape` (an array of arrays of numbers). Each inner array in `shape` corresponds to the shape of a tensor in the `input`. Outputs from the model, such as classification probabilities, are returned in raw format.

## End to end example

This example demonstrates the integration and usage of the ExecuTorch bindings with a [style transfer model](../computer-vision/useStyleTransfer.md). Specifically, we'll be using the `STYLE_TRANSFER_CANDY` model, which applies artistic style transfer to an input image.

### Importing the Module and loading the model

First, import the necessary functions from the `react-native-executorch` package and initialize the ExecuTorch module with the specified style transfer model.

```typescript
import {
  useExecutorchModule,
  STYLE_TRANSFER_CANDY,
} from 'react-native-executorch';

// Initialize the executorch module with the predefined style transfer model.
const { isReady, forward } = useExecutorchModule({
  modelSource: STYLE_TRANSFER_CANDY,
});
```

### Setting up input parameters

To prepare the input for the model, define the shape of the input tensor. This shape depends on the model's requirements. For the `STYLE_TRANSFER_CANDY` model, we need a tensor of shape `[1, 3, 640, 640]`, corresponding to a batch size of 1, 3 color channels (RGB), and dimensions of 640x640 pixels.

```typescript
// This shape is for a single input tensor.
const shape = [[1, 3, 640, 640]];
// Create a Float32Array to hold the pixel data of the image,
// which should be preprocessed according to the model's specific needs.
const input = new Float32Array(1 * 3 * 640 * 640); // fill this array with your image data
```

### Performing inference

```typescript
if (isReady) {
  try {
    // Perform the forward operation and receive the stylized image output.
    const output = await forward(input, shape);
    console.log('Stylization successful. Output:', output);
  } catch (error) {
    // Log any errors that occur during the forward pass.
    console.error('Error during model execution:', error);
  }
}
```

:::info
This code assumes that you have handled preprocessing of the input image (scaling, normalization) and postprocessing of the output (interpreting the raw output data) according to the model's requirements. Make sure to adjust these parts depending on your specific data and model outputs.
:::
