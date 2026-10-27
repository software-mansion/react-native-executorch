# Type Alias: DepthEstimatorModel

> **DepthEstimatorModel** = `object`

Defined in: [extensions/cv/tasks/depthEstimation.ts:49](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/depthEstimation.ts#L49)

Model configuration required to instantiate a depth estimator task runner.

## Properties

### modelOpts

> `readonly` **modelOpts**: [`DepthEstimatorOptions`](DepthEstimatorOptions.md)

Defined in: [extensions/cv/tasks/depthEstimation.ts:56](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/depthEstimation.ts#L56)

Input preprocessing and output depth map interpolation. `resizeMode` is
fixed to `'stretch'`. See [DepthEstimatorOptions](DepthEstimatorOptions.md).

---

### modelPath

> `readonly` **modelPath**: `string`

Defined in: [extensions/cv/tasks/depthEstimation.ts:51](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/depthEstimation.ts#L51)

Local path or remote URL of the `.pte` model file.
