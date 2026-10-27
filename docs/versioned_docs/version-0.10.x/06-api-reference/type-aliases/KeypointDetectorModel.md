# Type Alias: KeypointDetectorModel\<F, L\>

> **KeypointDetectorModel**\<`F`, `L`\> = `object`

Defined in: [extensions/cv/tasks/keypointDetection.ts:45](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L45)

Model configuration required to instantiate a keypoint detector task runner.

## Type Parameters

### F

`F` _extends_ [`BoxFormat`](../react-native-executorch/namespaces/cv/type-aliases/BoxFormat.md)

### L

`L` _extends_ `PropertyKey`

## Properties

### modelOpts

> `readonly` **modelOpts**: [`KeypointDetectorOptions`](KeypointDetectorOptions.md)\<`F`, `L`\>

Defined in: [extensions/cv/tasks/keypointDetection.ts:53](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L53)

Image preprocessing, landmark names, bounding box format, and default
NMS/confidence thresholds.
See [KeypointDetectorOptions](KeypointDetectorOptions.md).

---

### modelPath

> `readonly` **modelPath**: `string`

Defined in: [extensions/cv/tasks/keypointDetection.ts:47](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L47)

Local path or remote URL of the `.pte` model file.
