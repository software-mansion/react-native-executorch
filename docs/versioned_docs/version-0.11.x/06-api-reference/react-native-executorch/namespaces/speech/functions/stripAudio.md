# Function: stripAudio()

> **stripAudio**(`audio`, `margin`, `steps?`, `threshold?`): `Float32Array`

Defined in: [extensions/speech/utils/kokoroUtils.ts:190](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/kokoroUtils.ts#L190)

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
