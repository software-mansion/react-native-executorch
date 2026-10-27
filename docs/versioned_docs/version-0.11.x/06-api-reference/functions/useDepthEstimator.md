# Function: useDepthEstimator()

> **useDepthEstimator**(`config`, `options?`): `object`

Defined in: [hooks/useDepthEstimator.ts:25](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/hooks/useDepthEstimator.ts#L25)

React hook to load and run a depth estimation model.

This hook manages downloading (if remote URLs are provided) and loading the
model assets, compiling them, tracking download progress and load errors, and
releasing native memory when the component unmounts or the configuration
changes.

For imperative usage, see [createDepthEstimator](createDepthEstimator.md).

## Parameters

### config

[`DepthEstimatorModel`](../type-aliases/DepthEstimatorModel.md)

The depth estimation model configuration.
See [DepthEstimatorModel](../type-aliases/DepthEstimatorModel.md).

### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

The same object as [DepthEstimator](../type-aliases/DepthEstimator.md) (without `dispose`),
combined with loading state and download progress.

### downloadProgress

> **downloadProgress**: `number`

### error

> **error**: `Error` \| `undefined`

### estimateDepth

> **estimateDepth**: (`input`) => `Promise`\<[`DepthMap`](../type-aliases/DepthMap.md)\> \| `undefined` = `model.estimateDepth`

### estimateDepthWorklet

> **estimateDepthWorklet**: (`input`) => [`DepthMap`](../type-aliases/DepthMap.md) \| `undefined` = `model.estimateDepthWorklet`

### isReady

> **isReady**: `boolean` = `!!model`

### resource

> **resource**: [`DepthEstimatorModel`](../type-aliases/DepthEstimatorModel.md) \| `undefined`

## See

[DepthEstimator](../type-aliases/DepthEstimator.md)
