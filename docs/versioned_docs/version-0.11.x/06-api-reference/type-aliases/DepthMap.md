# Type Alias: DepthMap

> **DepthMap** = `object`

Defined in: [extensions/cv/tasks/depthEstimation.ts:20](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/depthEstimation.ts#L20)

Result structure representing the output of a depth estimation task.

## Properties

### data

> `readonly` **data**: `Float32Array`

Defined in: [extensions/cv/tasks/depthEstimation.ts:26](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/depthEstimation.ts#L26)

Raw model values, indexed as `data[y * width + x]`. Each result owns its
buffer. Values are not normalized or converted to display pixels.
Interpretation and units depend on the loaded model.

---

### height

> `readonly` **height**: `number`

Defined in: [extensions/cv/tasks/depthEstimation.ts:30](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/depthEstimation.ts#L30)

Height of the depth map in pixels.

---

### width

> `readonly` **width**: `number`

Defined in: [extensions/cv/tasks/depthEstimation.ts:28](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/depthEstimation.ts#L28)

Width of the depth map in pixels.
