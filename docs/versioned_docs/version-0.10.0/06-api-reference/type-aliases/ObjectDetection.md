# Type Alias: ObjectDetection\<F, L\>

> **ObjectDetection**\<`F`, `L`\> = `object`

Defined in: [extensions/cv/tasks/objectDetection.ts:77](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/objectDetection.ts#L77)

Result structure representing a single object detection prediction.

## Type Parameters

### F

`F` _extends_ [`BoxFormat`](../react-native-executorch/namespaces/cv/type-aliases/BoxFormat.md)

### L

`L`

## Properties

### box

> `readonly` **box**: [`BoundingBox`](../react-native-executorch/namespaces/cv/type-aliases/BoundingBox.md)\<`F`\>

Defined in: [extensions/cv/tasks/objectDetection.ts:79](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/objectDetection.ts#L79)

Scaled bounding box coordinates matching the input image resolution.

---

### confidence

> `readonly` **confidence**: `number`

Defined in: [extensions/cv/tasks/objectDetection.ts:83](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/objectDetection.ts#L83)

Confidence score of the detection (between 0.0 and 1.0).

---

### label

> `readonly` **label**: `L`

Defined in: [extensions/cv/tasks/objectDetection.ts:81](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/objectDetection.ts#L81)

Predicted object class label.
