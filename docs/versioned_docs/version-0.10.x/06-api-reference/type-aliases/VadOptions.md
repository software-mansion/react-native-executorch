# Type Alias: VadOptions

> **VadOptions** = `object`

Defined in: [extensions/speech/tasks/fsmnVoiceActivityDetection.ts:42](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts#L42)

Tunable thresholds controlling how per-frame speech probabilities are turned
into speech [VadSegment](VadSegment.md)s.

## Properties

### mergeGapMs?

> `readonly` `optional` **mergeGapMs**: `number`

Defined in: [extensions/speech/tasks/fsmnVoiceActivityDetection.ts:55](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts#L55)

Segments closer than this gap are merged into one.

---

### minSilenceDurationMs?

> `readonly` `optional` **minSilenceDurationMs**: `number`

Defined in: [extensions/speech/tasks/fsmnVoiceActivityDetection.ts:51](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts#L51)

Minimum duration below threshold required to close a segment.

---

### minSpeechDurationMs?

> `readonly` `optional` **minSpeechDurationMs**: `number`

Defined in: [extensions/speech/tasks/fsmnVoiceActivityDetection.ts:49](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts#L49)

Minimum duration a region must stay above the threshold to open a
segment.

---

### speechPadMs?

> `readonly` `optional` **speechPadMs**: `number`

Defined in: [extensions/speech/tasks/fsmnVoiceActivityDetection.ts:53](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts#L53)

Padding added to both ends of every detected segment.

---

### speechThreshold?

> `readonly` `optional` **speechThreshold**: `number`

Defined in: [extensions/speech/tasks/fsmnVoiceActivityDetection.ts:44](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts#L44)

Minimum speech probability (0-1) for a frame to count as speech.
