---
title: ExecuTorchModule
sidebar_position: 2
---

ExecuTorchModule provides TypeScript bindings for the underlying ExecuTorch [Module API](https://pytorch.org/executorch/stable/extension-module.html).

:::tip
For React applications, consider using the [`useExecutorchModule`](../../02-hooks/03-executorch-bindings/useExecutorchModule.md) hook instead, which provides automatic state management, loading progress tracking, and cleanup on unmount.
:::

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

// Loading the model
const model = new ExecutorchModule();
await model.load(STYLE_TRANSFER_CANDY);

// Running the forward method
const output = await model.forward([inputTensor]);
```

### Methods

| Method          | Type                                                                                                    | Description                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `load`          | `(modelSource: ResourceSource, onDownloadProgressCallback?: (progress: number) => void): Promise<void>` | Loads the model, where `modelSource` is a string, number, or object that specifies the location of the model binary. Optionally accepts a download progress callback. |
| `forward`       | `(inputTensor: TensorPtr[]): Promise<TensorPtr[]>`                                                      | Executes the model's forward pass, where input is an array of TensorPtr objects. If the inference is successful, an array of tensor pointers is returned.             |
| `getInputShape` | `(methodName: string, index: number): Promise<number[]>`                                                | Returns the expected input shape for a specific method and input index.                                                                                               |
| `delete`        | `(): void`                                                                                              | Unloads the model and releases resources.                                                                                                                             |

## TensorPtr

TensorPtr is a JS representation of the underlying tensor, which is then passed to the model. You can read more about creating tensors [here](https://docs.pytorch.org/executorch/stable/extension-tensor.html). On JS side, the TensorPtr holds the following information:

<details>
<summary>Type definitions</summary>

```typescript
interface TensorPtr {
  dataPtr: TensorBuffer;
  sizes: number[];
  scalarType: ScalarType;
}

type TensorBuffer =
  | ArrayBuffer
  | Float32Array
  | Float64Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | BigInt64Array
  | BigUint64Array;

enum ScalarType {
  BYTE = 0,
  CHAR = 1,
  SHORT = 2,
  INT = 3,
  LONG = 4,
  HALF = 5,
  FLOAT = 6,
  DOUBLE = 7,
  BOOL = 11,
  QINT8 = 12,
  QUINT8 = 13,
  QINT32 = 14,
  QUINT4X2 = 16,
  QUINT2X4 = 17,
  BITS16 = 22,
  FLOAT8E5M2 = 23,
  FLOAT8E4M3FN = 24,
  FLOAT8E5M2FNUZ = 25,
  FLOAT8E4M3FNUZ = 26,
  UINT16 = 27,
  UINT32 = 28,
  UINT64 = 29,
}
```

</details>

`dataPtr` - Represents a data buffer that will be used to create a tensor on the native side. This can be either an `ArrayBuffer` or a `TypedArray`. If your model takes in a datatype which is not covered by any of the `TypedArray` types, just pass an `ArrayBuffer` here.

`sizes` - Represents the shape of a given tensor, i.e. for a 640x640 RGB image with a batch size of 1, you would need to pass `[1, 3, 640, 640]` here.

`scalarType` - An enum resembling the ExecuTorch's `ScalarType`. For example, if your model was exported with float32 as an input, you will need to pass `ScalarType.FLOAT` here.

## End to end example

This example demonstrates the integration and usage of the ExecuTorch bindings with a [style transfer model](../../02-hooks/02-computer-vision/useStyleTransfer.md). Specifically, we'll be using the `STYLE_TRANSFER_CANDY` model, which applies artistic style transfer to an input image.

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

To prepare the model input, define the tensor shape according to your model's requirements (defined by the model export process). For example, the STYLE_TRANSFER_CANDY model expects a tensor with shape `[1, 3, 640, 640]` — representing a batch size of 1, 3 color channels (RGB), and 640×640 pixel dimensions.

```typescript
const inputTensor = {
  dataPtr: new Float32Array(1 * 3 * 640 * 640), // or other TypedArray / ArrayBuffer
  sizes: [1, 3, 640, 640],
  scalarType: ScalarType.FLOAT,
};
```

### Performing inference

After passing input to the forward function, you'll receive an array of TensorPtr objects. Each TensorPtr contains its data as an ArrayBuffer field. Since ArrayBuffer represents raw binary data, you'll need to interpret it according to the tensor's underlying data type (e.g., creating a Float32Array view for float32 tensors, Int32Array for int32 tensors, etc.).

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
