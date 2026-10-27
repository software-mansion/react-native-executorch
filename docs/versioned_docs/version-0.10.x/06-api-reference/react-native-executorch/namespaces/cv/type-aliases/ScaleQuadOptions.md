# Type Alias: ScaleQuadOptions

> **ScaleQuadOptions** = `object`

Defined in: [extensions/cv/ops/quad.ts:117](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/quad.ts#L117)

Configuration options for scaling quad coordinates.

## Properties

### from

> `readonly` **from**: `object`

Defined in: [extensions/cv/ops/quad.ts:119](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/quad.ts#L119)

The source bounds (e.g. model input dimensions).

#### height

> `readonly` **height**: `number`

#### width

> `readonly` **width**: `number`

---

### resizeMode?

> `readonly` `optional` **resizeMode**: `Exclude`\<[`ResizeMode`](ResizeMode.md), `"crop"`\>

Defined in: [extensions/cv/ops/quad.ts:123](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/quad.ts#L123)

The mode used to resize the image (excluding `'crop'`).

---

### to

> `readonly` **to**: `object`

Defined in: [extensions/cv/ops/quad.ts:121](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/quad.ts#L121)

The destination bounds (e.g. original image dimensions).

#### height

> `readonly` **height**: `number`

#### width

> `readonly` **width**: `number`
