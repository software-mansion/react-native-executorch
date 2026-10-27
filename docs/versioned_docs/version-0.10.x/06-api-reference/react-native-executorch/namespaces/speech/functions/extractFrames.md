# Function: extractFrames()

> **extractFrames**(`waveform`, `hann`, `dst`, `options`): [`Tensor`](../../../../type-aliases/Tensor.md)

Defined in: [extensions/speech/utils/vadUtils.ts:44](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/vadUtils.ts#L44)

Slices a mono audio waveform tensor into overlapping frames, applying
per-frame mean-removal, a pre-emphasis filter and a Hann window, and writing
each frame into a zero-padded row of `dst`.

`dst` is fully zeroed first, so rows beyond `numFrames` stay zero (padding).
The frame length is taken from `hann`'s length and the padded width from
`dst`'s last dimension.

## Parameters

### waveform

[`Tensor`](../../../../type-aliases/Tensor.md)

Input audio samples tensor. Expected 1D shape `[length]` with
data type `float32`. Framing starts at the first sample.

### hann

[`Tensor`](../../../../type-aliases/Tensor.md)

Precomputed Hann window tensor. Expected 1D shape `[frameLength]`
with data type `float32`.

### dst

[`Tensor`](../../../../type-aliases/Tensor.md)

Pre-allocated destination tensor. Expected 2D shape `[frames,
fftLength]` with data type `float32`.

### options

[`ExtractFramesOptions`](../type-aliases/ExtractFramesOptions.md)

Framing options controlling frame count, hop length, and
pre-emphasis filtering. See [ExtractFramesOptions](../type-aliases/ExtractFramesOptions.md).

## Returns

[`Tensor`](../../../../type-aliases/Tensor.md)

The destination tensor `dst` containing extracted frames of shape
`[frames, fftLength]` and data type `float32`.

## Throws

With code `INVALID_ARGUMENT` if tensor shapes,
data types, or frame windows are invalid, `RESOURCE_BUSY` if a tensor is in
use, or `RESOURCE_DISPOSED` if either tensor was disposed.
