# Type Alias: ObjectDetectorModel\<F, L\>

> **ObjectDetectorModel**\<`F`, `L`\> = `object`

Defined in: [extensions/cv/tasks/objectDetection.ts:45](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/objectDetection.ts#L45)

Model configuration required to instantiate an object detector task runner.

## Type Parameters

### F

`F` _extends_ [`BoxFormat`](../react-native-executorch/namespaces/cv/type-aliases/BoxFormat.md)

### L

`L`

## Properties

### modelOpts

> `readonly` **modelOpts**: [`ObjectDetectorOptions`](ObjectDetectorOptions.md)\<`F`, `L`\>

Defined in: [extensions/cv/tasks/objectDetection.ts:53](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/objectDetection.ts#L53)

Image preprocessing, label vocabulary, and default NMS/confidence
thresholds. Used as fallbacks when per-call overrides are omitted.
See [ObjectDetectorOptions](ObjectDetectorOptions.md).

---

### modelPath

> `readonly` **modelPath**: `string`

Defined in: [extensions/cv/tasks/objectDetection.ts:47](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/objectDetection.ts#L47)

Local path or remote URL of the `.pte` model file.
