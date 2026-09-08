# Type Alias: NmsOptions

> **NmsOptions** = `object`

Defined in: [extensions/cv/ops/box.ts:143](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/box.ts#L143)

Options for Non-Maximum Suppression (NMS).

## Properties

### boxFormat

> `readonly` **boxFormat**: [`BoxFormat`](BoxFormat.md)

Defined in: [extensions/cv/ops/box.ts:145](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/box.ts#L145)

How bounding box coordinates are interpreted [BoxFormat](BoxFormat.md).

---

### confidenceThreshold

> `readonly` **confidenceThreshold**: `number`

Defined in: [extensions/cv/ops/box.ts:149](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/box.ts#L149)

Minimum confidence score threshold for filtering candidate boxes.

---

### iouThreshold

> `readonly` **iouThreshold**: `number`

Defined in: [extensions/cv/ops/box.ts:147](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/box.ts#L147)

Intersection over Union (IoU) threshold for suppressing overlapping boxes.

---

### nmsType

> `readonly` **nmsType**: `"standard"` \| `"weighted"`

Defined in: [extensions/cv/ops/box.ts:154](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/box.ts#L154)

NMS algorithm variant (`standard` for hard suppression, `weighted` for soft
coordinate averaging).
