# Type Alias: OcrDetection

> **OcrDetection** = `object`

Defined in: [extensions/cv/tasks/paddleOcr.ts:49](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L49)

A single recognized text region.

## Properties

### confidence

> `readonly` **confidence**: `number`

Defined in: [extensions/cv/tasks/paddleOcr.ts:53](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L53)

Mean per-character probability over the non-blank timesteps, in `[0, 1]`.

---

### quad

> `readonly` **quad**: [`Quad`](../react-native-executorch/namespaces/cv/type-aliases/Quad.md)

Defined in: [extensions/cv/tasks/paddleOcr.ts:59](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L59)

The region's corners, ordered top-left, top-right, bottom-right, bottom-left,
in original image pixels. Oriented, so a rotated line keeps its angle; take
[boundingBoxOfPoints](../react-native-executorch/namespaces/cv/functions/boundingBoxOfPoints.md) for the axis-aligned box.

---

### text

> `readonly` **text**: `string`

Defined in: [extensions/cv/tasks/paddleOcr.ts:51](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L51)

The recognized text.
