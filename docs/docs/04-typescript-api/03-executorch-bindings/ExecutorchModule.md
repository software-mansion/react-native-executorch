---
title: ExecutorchModule
---

ExecutorchModule provides TypeScript bindings for the underlying ExecuTorch [Module API](https://pytorch.org/executorch/stable/extension-module.html).

:::tip
For React applications, consider using the [`useExecutorchModule`](../../03-hooks/03-executorch-bindings/useExecutorchModule.md) hook instead, which provides automatic state management, loading progress tracking, and cleanup on unmount.
:::

## API Reference

* For detailed API Reference for `ExecutorchModule` see: [`ExecutorchModule` API Reference](../../06-api-reference/classes/ExecutorchModule.md).

## Reference

```typescript
import {
  ExecutorchModule,
  STYLE_TRANSFER_CANDY,
  ScalarType,
} from 'react-native-executorch';

// Creating the input array
const inputTensor = {
  dataPtr: new Float32Array(1 * 3 * 640 * 640),
  sizes: [1, 3, 640, 640],
  scalarType: ScalarType.FLOAT,
};

// Creating an instance
const model = new ExecutorchModule();

// Loading the model
await model.load(STYLE_TRANSFER_CANDY);

// Running the forward method
const output = await model.forward([inputTensor]);
```

### Methods

All methods of `ExecutorchModule` are explained in details here: [`ExecutorchModule` API Reference](../../06-api-reference/classes/ExecutorchModule.md)

## TensorPtr

TensorPtr is a JS representation of the underlying tensor, which is then passed to the model. You can read more about creating tensors [here](https://docs.pytorch.org/executorch/stable/extension-tensor.html). On JS side, the [`TensorPtr`](../../06-api-reference/interfaces/TensorPtr.md) holds the following information:

* [`dataPtr`](../../06-api-reference/interfaces/TensorPtr.md#dataptr) - Represents a data buffer that will be used to create a tensor on the native side. This can be either an `ArrayBuffer` or a `TypedArray`. If your model takes in a datatype which is not covered by any of the `TypedArray` types, just pass an `ArrayBuffer` here.

* [`sizes`](../../06-api-reference/interfaces/TensorPtr.md#sizes) - Represents the shape of a given tensor, i.e. for a 640x640 RGB image with a batch size of 1, you would need to pass `[1, 3, 640, 640]` here.

* [`scalarType`](../../06-api-reference/interfaces/TensorPtr.md#scalartype) - An enum resembling the ExecuTorch's [`ScalarType`](../../06-api-reference/enumerations/ScalarType.md). For example, if your model was exported with float32 as an input, you will need to pass [`ScalarType.FLOAT`](../../06-api-reference/enumerations/ScalarType.md#float) here.

## End to end example

This example demonstrates the integration and usage of the ExecuTorch bindings with a [style transfer model](../../03-hooks/02-computer-vision/useStyleTransfer.md). Specifically, we'll be using the `STYLE_TRANSFER_CANDY` model, which applies artistic style transfer to an input image.

### Importing the Module and loading the model

First, import the necessary functions from the `react-native-executorch` package and initialize the ExecuTorch module with the specified style transfer model.

```typescript
import {
  ExecutorchModule,
  STYLE_TRANSFER_CANDY,
  ScalarType,
} from 'react-native-executorch';

// Initialize the executorch module
const executorchModule = new ExecutorchModule();

// Load the model with optional download progress callback
await executorchModule.load(STYLE_TRANSFER_CANDY, (progress) => {
  console.log(`Download progress: ${progress}%`);
});
```

### Setting up input parameters

To prepare the model input, define the tensor shape according to your model's requirements (defined by the model export process). For example, the `STYLE_TRANSFER_CANDY` model expects a tensor with shape `[1, 3, 640, 640]` — representing a batch size of 1, 3 color channels (RGB), and 640×640 pixel dimensions.

```typescript
const inputTensor = {
  dataPtr: new Float32Array(1 * 3 * 640 * 640), // or other TypedArray / ArrayBuffer
  sizes: [1, 3, 640, 640],
  scalarType: ScalarType.FLOAT,
};
```

### Performing inference

After passing input to the forward function, you'll receive an array of [`TensorPtr`](../../06-api-reference/interfaces/TensorPtr.md) objects. Each TensorPtr contains its [`dataPtr`](../../06-api-reference/interfaces/TensorPtr.md#dataptr) field as an `ArrayBuffer`. Since `ArrayBuffer` represents raw binary data, you'll need to interpret it according to the tensor's underlying data type (e.g., creating a `Float32Array` view for float32 tensors, `Int32Array` for int32 tensors, etc.).

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

// Clean up resources when done
executorchModule.delete();
```

:::info
This code assumes that you have handled preprocessing of the input image (scaling, normalization) and postprocessing of the output (interpreting the raw output data) according to the model's requirements. Make sure to adjust these parts depending on your specific data and model outputs.
:::
