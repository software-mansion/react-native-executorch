# Function: stripAudio()

> **stripAudio**(`audio`, `margin`, `steps?`, `threshold?`): `Float32Array`

Defined in: [extensions/speech/utils/kokoroUtils.ts:181](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/kokoroUtils.ts#L181)

Strips leading and trailing silence using a sliding-window moving average.

## Parameters

### audio

`Float32Array`

The audio samples to strip.

### margin

`number`

The number of silence samples to preserve at each edge.

### steps?

`number` = `10`

The moving average window length.

### threshold?

`number` = `0.005`

The amplitude below which audio counts as silence.

## Returns

`Float32Array`

A view of `audio` with the silent edges removed.
