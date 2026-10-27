# Function: interpolatePoint()

> **interpolatePoint**(`a`, `b`, `t`): [`Point`](../type-aliases/Point.md)

Defined in: [extensions/cv/ops/point.ts:37](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/ops/point.ts#L37)

Linearly interpolates between two points: `t = 0` returns `a`, `t = 1`
returns `b`, values in between interpolate along the segment.

## Parameters

### a

[`Point`](../type-aliases/Point.md)

The start point.

### b

[`Point`](../type-aliases/Point.md)

The end point.

### t

`number`

The interpolation factor.

## Returns

[`Point`](../type-aliases/Point.md)

The interpolated point.
