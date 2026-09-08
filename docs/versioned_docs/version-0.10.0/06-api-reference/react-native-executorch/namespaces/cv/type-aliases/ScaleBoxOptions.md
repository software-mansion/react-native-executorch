# Type Alias: ScaleBoxOptions

> **ScaleBoxOptions** = `object`

Defined in: [extensions/cv/ops/box.ts:39](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/box.ts#L39)

Configuration options for scaling bounding box coordinates.

## Properties

### from

> `readonly` **from**: `object`

Defined in: [extensions/cv/ops/box.ts:41](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/box.ts#L41)

The source bounds (e.g. model input dimensions).

#### height

> `readonly` **height**: `number`

#### width

> `readonly` **width**: `number`

---

### resizeMode

> `readonly` **resizeMode**: `Exclude`\<[`ResizeMode`](ResizeMode.md), `"crop"`\>

Defined in: [extensions/cv/ops/box.ts:45](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/box.ts#L45)

The mode used to resize the image (excluding `'crop'`).

---

### to

> `readonly` **to**: `object`

Defined in: [extensions/cv/ops/box.ts:43](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/box.ts#L43)

The destination bounds (e.g. original image dimensions).

#### height

> `readonly` **height**: `number`

#### width

> `readonly` **width**: `number`
