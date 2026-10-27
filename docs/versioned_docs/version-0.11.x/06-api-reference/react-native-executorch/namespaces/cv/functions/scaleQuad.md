# Function: scaleQuad()

> **scaleQuad**(`quad`, `options`): [`Quad`](../type-aliases/Quad.md)

Defined in: [extensions/cv/ops/quad.ts:135](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/ops/quad.ts#L135)

Rescales a quad from one frame to another, clamping the result to the target
bounds. The counterpart of [scaleBox](scaleBox.md) for quads.

## Parameters

### quad

[`Quad`](../type-aliases/Quad.md)

The quad, expressed in the `from` frame.

### options

[`ScaleQuadOptions`](../type-aliases/ScaleQuadOptions.md)

Options detailing the scaling factors and resize mode.
See [ScaleQuadOptions](../type-aliases/ScaleQuadOptions.md).

## Returns

[`Quad`](../type-aliases/Quad.md)

The four corners in `to` pixels.
