---
title: useExecutorchModule
---

useExecutorchModule provides React Native bindings to the ExecuTorch [Module API](https://pytorch.org/executorch/stable/extension-module.html) directly from JavaScript.

:::warning
These bindings are primarily intended for custom model integration where no dedicated hook exists. If you are considering using a provided model, first verify whether a dedicated hook is available. Dedicated hooks simplify the implementation process by managing necessary pre and post-processing automatically. Utilizing these can save you effort and reduce complexity, ensuring you do not implement additional handling that is already covered.
:::

## API Reference

* For detailed API Reference for `useExecutorchModule` see: [`useExecutorchModule` API Reference](../../06-api-reference/functions/useExecutorchModule.md).

## Initializing ExecuTorch Module

You can initialize the ExecuTorch module in your JavaScript application using the `useExecutorchModule` hook. This hook facilitates the loading of models from the specified source and prepares them for use.

```typescript
import { useExecutorchModule } from 'react-native-executorch';

const executorchModule = useExecutorchModule({
  modelSource: require('../assets/models/model.pte'),
});
```

The `modelSource` parameter expects a location string pointing to the model binary.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Arguments

`useExecutorchModule` takes [`ExecutorchModuleProps`](../../06-api-reference/interfaces/ExecutorchModuleProps.md) that consists of:
* `model` containing [`modelSource`](../../06-api-reference/interfaces/ExecutorchModuleProps.md#modelsource). 
* An optional flag [`preventLoad`](../../06-api-reference/interfaces/ExecutorchModuleProps.md#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:
* For detailed information about `useExecutorchModule` arguments check this section: [`useExecutorchModule` arguments](../../06-api-reference/functions/useExecutorchModule.md#parameters).
* For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useExecutorchModule` returns an object called `ExecutorchModuleType` containing bunch of functions to interact with arbitrarly chosen models. To get more details please read: [`ExecutorchModuleType` API Reference](../../06-api-reference/interfaces/ExecutorchModuleType.md).

## TensorPtr

[`TensorPtr`](../../06-api-reference/interfaces/TensorPtr.md) is a JS representation of the underlying tensor, which is then passed to the model. You can read more about creating tensors [here](https://docs.pytorch.org/executorch/stable/extension-tensor.html). On JS side, the TensorPtr holds the following information:

[`dataPtr`](../../06-api-reference/interfaces/TensorPtr.md#dataptr) - Represents a data buffer that will be used to create a tensor on the native side. This can be either an `ArrayBuffer` or a `TypedArray`. If your model takes in a datatype which is not covered by any of the `TypedArray` types, just pass an `ArrayBuffer` here.

[`sizes`](../../06-api-reference/interfaces/TensorPtr.md#sizes) - Represents a shape of a given tensor, i.e. for a 640x640 RGB image with a batch size of 1, you would need to pass `[1, 3, 640, 640]` here.

[`scalarType`](../../06-api-reference/interfaces/TensorPtr.md#scalartype) - An enum resembling the ExecuTorch's `ScalarType`. For example, if your model was exported with float32 as an input, you will need to pass `ScalarType.FLOAT` here.

## End to end example

This example demonstrates the integration and usage of the ExecuTorch bindings with a [style transfer model](../../03-hooks/02-computer-vision/useStyleTransfer.md). Specifically, we'll be using the `STYLE_TRANSFER_CANDY` model, which applies artistic style transfer to an input image.

### Importing the Module and loading the model

First, import the necessary functions from the `react-native-executorch` package and initialize the ExecuTorch module with the specified style transfer model.

```typescript
import {
  useExecutorchModule,
  STYLE_TRANSFER_CANDY,
  ScalarType,
} from 'react-native-executorch';

// Initialize the executorch module with the predefined style transfer model.
const executorchModule = useExecutorchModule({
  modelSource: STYLE_TRANSFER_CANDY,
});
```

### Setting up input parameters

To prepare the model input, define the tensor shape according to your model's requirements (defined by the model export process). For example, the STYLE_TRANSFER_CANDY model expects a tensor with shape `[1, 3, 640, 640]` — representing a batch size of 1, 3 color channels (RGB), and 640×640 pixel dimensions.

```typescript
const inputTensor = {
  dataPtr: new Float32Array(1 * 3 * 640 * 640), // or other TypedArray / ArrayBuffer
  sizes: [1, 3, 640, 640],
  scalarType: ScalarType.FLOAT,
};
```

### Performing inference

After passing input to the forward function, you'll receive an array of TensorPtr objects. Each TensorPtr contains its `dataPtr` as an ArrayBuffer. Since ArrayBuffer represents raw binary data, you'll need to interpret it according to the tensor's underlying data type (e.g., creating a Float32Array view for float32 tensors, Int32Array for int32 tensors, etc.).

```typescript
try {
  // Perform the forward operation and receive the stylized image output.
  const output = await executorchModule.forward([inputTensor]);
  // Interpret the output ArrayBuffer
  // foo(output[0].dataPtr);
} catch (error) {
  // Log any errors that occur during the forward pass.
  console.error('Error during model execution:', error);
}
```

:::info
This code assumes that you have handled preprocessing of the input image (scaling, normalization) and postprocessing of the output (interpreting the raw output data) according to the model's requirements. Make sure to adjust these parts depending on your specific data and model outputs.
:::
