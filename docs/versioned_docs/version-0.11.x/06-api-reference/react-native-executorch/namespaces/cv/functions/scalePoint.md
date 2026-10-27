# Function: scalePoint()

> **scalePoint**(`point`, `options`): [`Point`](../type-aliases/Point.md)

Defined in: [extensions/cv/ops/point.ts:64](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/ops/point.ts#L64)

Helper function to scale a 2D point based on resize mode and resolution
changes.

## Parameters

### point

[`Point`](../type-aliases/Point.md)

The original coordinate point to scale.

### options

[`ScalePointOptions`](../type-aliases/ScalePointOptions.md)

Options detailing the scaling factors and resize mode.
See [ScalePointOptions](../type-aliases/ScalePointOptions.md).

## Returns

[`Point`](../type-aliases/Point.md)

The scaled coordinate point.
