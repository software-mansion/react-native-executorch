# Type Alias: InstanceSegmentationResult\<F, L\>

> **InstanceSegmentationResult**\<`F`, `L`\> = `object`

Defined in: [extensions/cv/tasks/instanceSegmentation.ts:99](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts#L99)

Result structure representing a single detected instance with its bounding box,
segmentation mask, label, and confidence score.

## Type Parameters

### F

`F` _extends_ [`BoxFormat`](../react-native-executorch/namespaces/cv/type-aliases/BoxFormat.md)

The format type of the bounding box.

### L

`L`

The label type.

## Properties

### box

> `readonly` **box**: [`BoundingBox`](../react-native-executorch/namespaces/cv/type-aliases/BoundingBox.md)\<`F`\>

Defined in: [extensions/cv/tasks/instanceSegmentation.ts:101](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts#L101)

Scaled bounding box coordinates matching the input image resolution.

---

### confidence

> `readonly` **confidence**: `number`

Defined in: [extensions/cv/tasks/instanceSegmentation.ts:107](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts#L107)

Confidence score of the instance detection (between 0.0 and 1.0).

---

### label

> `readonly` **label**: `L`

Defined in: [extensions/cv/tasks/instanceSegmentation.ts:105](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts#L105)

Predicted instance class label.

---

### mask

> `readonly` **mask**: [`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

Defined in: [extensions/cv/tasks/instanceSegmentation.ts:103](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts#L103)

Binary segmentation mask buffer cropped to the instance bounding box.
