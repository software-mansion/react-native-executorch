# Function: quadSize()

> **quadSize**(`ordered`): `object`

Defined in: [extensions/cv/ops/quad.ts:105](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/ops/quad.ts#L105)

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
