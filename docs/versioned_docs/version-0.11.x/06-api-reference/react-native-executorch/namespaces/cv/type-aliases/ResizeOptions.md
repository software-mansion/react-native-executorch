# Type Alias: ResizeOptions

> **ResizeOptions** = `object`

Defined in: [extensions/cv/ops/image.ts:84](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L84)

Configuration options for image resize operations.

## Properties

### interpolation?

> `readonly` `optional` **interpolation**: [`InterpolationMethod`](InterpolationMethod.md)

Defined in: [extensions/cv/ops/image.ts:90](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L90)

Pixel interpolation method.

---

### mode?

> `readonly` `optional` **mode**: [`ResizeMode`](ResizeMode.md)

Defined in: [extensions/cv/ops/image.ts:86](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L86)

How the image is resized (stretch, letterbox, or crop).

---

### padValue?

> `readonly` `optional` **padValue**: `number`

Defined in: [extensions/cv/ops/image.ts:88](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/ops/image.ts#L88)

Background fill value used when letterboxing (padding).
