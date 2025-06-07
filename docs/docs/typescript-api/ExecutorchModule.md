---
title: ExecuTorchModule
---

TypeScript API implementation of the [useExecutorchModule](../executorch-bindings/useExecutorchModule.md) hook.

## Reference

```typescript
import {
  ExecutorchModule,
  STYLE_TRANSFER_CANDY,
} from 'react-native-executorch';

// Creating the input array
const inputShape = [1, 3, 640, 640];
const inputData = new Float32Array(1 * 3 * 640 * 640);

// Loading the model
await ExecutorchModule.load(STYLE_TRANSFER_CANDY);

// Running the model
const output = await ExecutorchModule.forward({
  data: inputData,
  shape: inputShape,
});
```

### Methods

| Method               | Type                                                  | Description                                                                                                                                                                                                                                                                   |
| -------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `load`               | `(modelSource: ResourceSource): Promise<void>`        | Loads the model, where `modelSource` is a string that specifies the location of the model binary.                                                                                                                                                                             |
| `forward`            | `(input: Tensor[] \| Tensor): Promise<number[]>`      | Executes the model's forward pass, where `input` is a `Tensor` or array of tensors `Tensor[]`. Tensor is a compound type consisting of two elements: data and shape. Data is a JavaScript typed array, and shape is an array of integers representing the input tensor shape. |
| `loadMethod`         | `(methodName: string): Promise<void>`                 | Loads resources specific to `methodName` into memory before execution.                                                                                                                                                                                                        |
| `loadForward`        | `(): Promise<void>`                                   | Loads resources specific to `forward` method into memory before execution. Uses `loadMethod` under the hood.                                                                                                                                                                  |
| `onDownloadProgress` | `(callback: (downloadProgress: number) => void): any` | Subscribe to the download progress event.                                                                                                                                                                                                                                     |

<details>
<summary>Type definitions</summary>

```typescript
export type ResourceSource = string | number | object;

type ETInput =
  | Int8Array
  | Int32Array
  | BigInt64Array
  | Float32Array
  | Float64Array;

export interface Tensor {
  data: ETInput[];
  shape: number[];
}
```

</details>

## Loading the model

To load the model, use the `load` method. It accepts the `modelSource` which is a string that specifies the location of the model binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) page. This method returns a promise, which can resolve to an error or void.

## Running the model

To run the model use the `forward` method. It accepts one argument: `input`. The `input` is a `Tensor` or array of tensors `Tensor[]`. Tensor is a compound type consisting of two elements: data and shape. Data is a JavaScript typed array, and `shape` is an array of integers representing the input tensor shape. There's no need to explicitly define the input type, as it will automatically be inferred from the typed array you pass to forward method. Outputs from the model, such as classification probabilities, are returned in raw format.

## Loading methods

Loads resources specific to methodName into memory before execution.

## Loading forward

Loads resources specific to `forward` method into memory before execution. Uses loadMethod under the hood.

:::info
This code assumes that you have handled preprocessing of the input image (scaling, normalization) and postprocessing of the output (interpreting the raw output data) according to the model's requirements. Make sure to adjust these parts depending on your specific data and model outputs.
:::
