# Interface: Detection\<L\>

Defined in: [types/objectDetection.ts:30](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L30)

Represents a detected object within an image, including its bounding box, label, and confidence score.

## Type Parameters

### L

`L` _extends_ [`LabelEnum`](../type-aliases/LabelEnum.md) = _typeof_ [`CocoLabel`](../enumerations/CocoLabel.md)

The label enum type for the detected object. Defaults to [CocoLabel](../enumerations/CocoLabel.md).

## Properties

### bbox

> **bbox**: [`Bbox`](Bbox.md)

Defined in: [types/objectDetection.ts:31](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L31)

The bounding box of the detected object, defined by its top-left (x1, y1) and bottom-right (x2, y2) coordinates.

---

### label

> **label**: keyof `L`

Defined in: [types/objectDetection.ts:32](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L32)

The class label of the detected object.

---

### score

> **score**: `number`

Defined in: [types/objectDetection.ts:33](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L33)

The confidence score of the detection, typically ranging from 0 to 1.
