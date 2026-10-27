# Type Alias: ExtractFramesOptions

> **ExtractFramesOptions** = `object`

Defined in: [extensions/speech/utils/vadUtils.ts:12](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/vadUtils.ts#L12)

Options controlling how [extractFrames](../functions/extractFrames.md) slices and filters the waveform.

## Properties

### hopLength

> `readonly` **hopLength**: `number`

Defined in: [extensions/speech/utils/vadUtils.ts:16](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/vadUtils.ts#L16)

Number of samples between consecutive frames.

---

### numFrames

> `readonly` **numFrames**: `number`

Defined in: [extensions/speech/utils/vadUtils.ts:14](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/vadUtils.ts#L14)

Number of audio frames to extract and write into the destination tensor.

---

### preemphasis

> `readonly` **preemphasis**: `number`

Defined in: [extensions/speech/utils/vadUtils.ts:18](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/vadUtils.ts#L18)

Pre-emphasis filter coefficient.
