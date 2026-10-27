# Function: orderQuad()

> **orderQuad**(`quad`): [`Quad`](../type-aliases/Quad.md)

Defined in: [extensions/cv/ops/quad.ts:80](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/ops/quad.ts#L80)

Reorders a quad's corners into the top-left, top-right, bottom-right,
bottom-left order the rest of this module assumes, using their
coordinate-sum and coordinate-difference extremes.

## Parameters

### quad

[`Quad`](../type-aliases/Quad.md)

The quad whose corners may be in any order.

## Returns

[`Quad`](../type-aliases/Quad.md)

The same corners, ordered TL, TR, BR, BL.
