# Type Alias: ResizeOptions

> **ResizeOptions** = `object`

Defined in: [extensions/cv/ops/image.ts:84](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L84)

Configuration options for image resize operations.

## Properties

### interpolation?

> `readonly` `optional` **interpolation**: [`InterpolationMethod`](InterpolationMethod.md)

Defined in: [extensions/cv/ops/image.ts:90](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L90)

Pixel interpolation method.

---

### mode?

> `readonly` `optional` **mode**: [`ResizeMode`](ResizeMode.md)

Defined in: [extensions/cv/ops/image.ts:86](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L86)

How the image is resized (stretch, letterbox, or crop).

---

### padValue?

> `readonly` `optional` **padValue**: `number`

Defined in: [extensions/cv/ops/image.ts:88](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L88)

Background fill value used when letterboxing (padding).
