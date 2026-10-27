# Type Alias: DepthEstimator

> **DepthEstimator** = `object`

Defined in: [extensions/cv/tasks/depthEstimation.ts:63](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/depthEstimation.ts#L63)

Depth estimation task runner.

## Properties

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/cv/tasks/depthEstimation.ts:67](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/depthEstimation.ts#L67)

Releases all allocated native resources.

#### Returns

`void`

---

### estimateDepth()

> `readonly` **estimateDepth**: (`input`) => `Promise`\<[`DepthMap`](DepthMap.md)\>

Defined in: [extensions/cv/tasks/depthEstimation.ts:80](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/depthEstimation.ts#L80)

Asynchronously performs depth estimation on the input image.

The full input image is stretched to the model's input size, and the
floating-point depth map is resized back to the input image dimensions.
Depth values retain the model's original scale.

#### Parameters

##### input

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

The input image buffer.

#### Returns

`Promise`\<[`DepthMap`](DepthMap.md)\>

A promise resolving to the depth map at the input image resolution.

#### Throws

With code `RESOURCE_BUSY` if the model is in
use, or `RESOURCE_DISPOSED` if disposed.

---

### estimateDepthWorklet()

> `readonly` **estimateDepthWorklet**: (`input`) => [`DepthMap`](DepthMap.md)

Defined in: [extensions/cv/tasks/depthEstimation.ts:86](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/depthEstimation.ts#L86)

Synchronous version of [estimateDepth](#estimatedepth) to be executed directly on the
caller or worklet thread.

#### Parameters

##### input

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

#### Returns

[`DepthMap`](DepthMap.md)
