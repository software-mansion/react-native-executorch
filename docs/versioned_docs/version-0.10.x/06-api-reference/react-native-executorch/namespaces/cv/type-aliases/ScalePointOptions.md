# Type Alias: ScalePointOptions

> **ScalePointOptions** = `object`

Defined in: [extensions/cv/ops/point.ts:46](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/point.ts#L46)

Configuration options for scaling 2D point coordinates.

## Properties

### from

> `readonly` **from**: `object`

Defined in: [extensions/cv/ops/point.ts:48](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/point.ts#L48)

The source bounds (e.g. model input dimensions).

#### height

> `readonly` **height**: `number`

#### width

> `readonly` **width**: `number`

---

### resizeMode

> `readonly` **resizeMode**: `Exclude`\<[`ResizeMode`](ResizeMode.md), `"crop"`\>

Defined in: [extensions/cv/ops/point.ts:52](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/point.ts#L52)

The mode used to resize the image (excluding `'crop'`).

---

### to

> `readonly` **to**: `object`

Defined in: [extensions/cv/ops/point.ts:50](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/point.ts#L50)

The destination bounds (e.g. original image dimensions).

#### height

> `readonly` **height**: `number`

#### width

> `readonly` **width**: `number`
