# Function: quadSize()

> **quadSize**(`ordered`): `object`

Defined in: [extensions/cv/ops/quad.ts:105](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/ops/quad.ts#L105)

Computes the width and height (in pixels) of an ordered TL,TR,BR,BL quad, taking
the longer of each pair of opposite sides.

## Parameters

### ordered

[`Quad`](../type-aliases/Quad.md)

The quad corners ordered TL, TR, BR, BL.

## Returns

`object`

The quad's width and height in pixels.

### height

> **height**: `number`

### width

> **width**: `number`
