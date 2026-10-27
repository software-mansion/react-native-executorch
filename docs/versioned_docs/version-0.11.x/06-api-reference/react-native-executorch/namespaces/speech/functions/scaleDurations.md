# Function: scaleDurations()

> **scaleDurations**(`durations`, `targetDuration`): `void`

Defined in: [extensions/speech/utils/kokoroUtils.ts:128](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/kokoroUtils.ts#L128)

Scales per-token durations in place so that they sum up exactly to
`targetDuration`, distributing the rounding error by largest remainder.

## Parameters

### durations

`Int32Array`

The per-token durations to scale in place.

### targetDuration

`number`

The exact sum the scaled durations must add up to.

## Returns

`void`
