# Function: scaleDurations()

> **scaleDurations**(`durations`, `targetDuration`): `void`

Defined in: [extensions/speech/utils/kokoroUtils.ts:119](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/kokoroUtils.ts#L119)

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
