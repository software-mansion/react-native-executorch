# Function: createDepthEstimator()

> **createDepthEstimator**(`config`, `runtime?`): `Promise`\<[`DepthEstimator`](../type-aliases/DepthEstimator.md)\>

Defined in: [extensions/cv/tasks/depthEstimation.ts:109](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/depthEstimation.ts#L109)

Creates a depth estimator runner for executing local depth estimation models.

It validates the model inputs and outputs requirements, pre-allocates the
necessary static execution tensors, sets up an image preprocessor, and
registers clean disposal hooks to clear all native memory.

Accepts batched or unbatched CHW RGB inputs and matching depth outputs.
Output spatial dimensions may differ from the input tensor. Preprocessing
and output interpolation follow `modelOpts`; depth values retain the model's
original scale.

## Parameters

### config

[`DepthEstimatorModel`](../type-aliases/DepthEstimatorModel.md)

Depth estimator task configuration containing path and options.
See [DepthEstimatorModel](../type-aliases/DepthEstimatorModel.md).

### runtime?

`WorkletRuntime`

Optional worklet runtime thread on which to run the model
execution.

## Returns

`Promise`\<[`DepthEstimator`](../type-aliases/DepthEstimator.md)\>

A promise resolving to the instantiated [DepthEstimator](../type-aliases/DepthEstimator.md) runner.

## Throws

With code `LOAD_FAILED` if model fails to load,
or `SCHEMA_MISMATCH` if model schema does not match depth estimation spec.
