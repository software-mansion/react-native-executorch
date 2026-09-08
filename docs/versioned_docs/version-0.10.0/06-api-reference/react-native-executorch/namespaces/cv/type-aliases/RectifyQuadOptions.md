# Type Alias: RectifyQuadOptions

> **RectifyQuadOptions** = `object`

Defined in: [extensions/cv/ops/quad.ts:149](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/quad.ts#L149)

Options for [rectifyQuad](../functions/rectifyQuad.md).

## Properties

### align?

> `readonly` `optional` **align**: `"left"` \| `"center"`

Defined in: [extensions/cv/ops/quad.ts:153](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/quad.ts#L153)

Where the content sits in the canvas. Default `'left'`.

---

### contentWidth

> `readonly` **contentWidth**: `number`

Defined in: [extensions/cv/ops/quad.ts:151](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/quad.ts#L151)

Width in px the rectified content occupies inside the destination canvas.

---

### padValue?

> `readonly` `optional` **padValue**: `number`

Defined in: [extensions/cv/ops/quad.ts:155](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/quad.ts#L155)

Value the canvas is filled with outside the content. Default `0`.
