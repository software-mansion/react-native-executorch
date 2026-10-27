# Type Alias: InstanceSegmenterModel\<F, L\>

> **InstanceSegmenterModel**\<`F`, `L`\> = `object`

Defined in: [extensions/cv/tasks/instanceSegmentation.ts:59](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts#L59)

Model configuration required to instantiate an instance segmenter task runner.

## Type Parameters

### F

`F` _extends_ [`BoxFormat`](../react-native-executorch/namespaces/cv/type-aliases/BoxFormat.md)

The format type of the bounding box.

### L

`L`

The label type.

## Properties

### modelOpts

> `readonly` **modelOpts**: [`InstanceSegmenterOptions`](InstanceSegmenterOptions.md)\<`F`, `L`\>

Defined in: [extensions/cv/tasks/instanceSegmentation.ts:67](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts#L67)

Image preprocessing, label vocabulary, bounding box format, and default
NMS/mask/confidence thresholds.
See [InstanceSegmenterOptions](InstanceSegmenterOptions.md).

---

### modelPath

> `readonly` **modelPath**: `string`

Defined in: [extensions/cv/tasks/instanceSegmentation.ts:61](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts#L61)

Local path or remote URL of the `.pte` model file.
