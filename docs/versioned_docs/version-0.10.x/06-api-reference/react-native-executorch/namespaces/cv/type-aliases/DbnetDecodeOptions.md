# Type Alias: DbnetDecodeOptions

> **DbnetDecodeOptions** = `object`

Defined in: [extensions/cv/utils/paddleOcrUtils.ts:35](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/utils/paddleOcrUtils.ts#L35)

Thresholds for [extractDbnetTextQuads](../functions/extractDbnetTextQuads.md).

## Properties

### binThreshold

> `readonly` **binThreshold**: `number`

Defined in: [extensions/cv/utils/paddleOcrUtils.ts:37](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/utils/paddleOcrUtils.ts#L37)

Binarization threshold on the probability map.

---

### boxThreshold

> `readonly` **boxThreshold**: `number`

Defined in: [extensions/cv/utils/paddleOcrUtils.ts:39](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/utils/paddleOcrUtils.ts#L39)

Minimum mean box score to keep a candidate.

---

### maxCandidates

> `readonly` **maxCandidates**: `number`

Defined in: [extensions/cv/utils/paddleOcrUtils.ts:45](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/utils/paddleOcrUtils.ts#L45)

Cap on contour candidates scored per map.

---

### minBoxSide

> `readonly` **minBoxSide**: `number`

Defined in: [extensions/cv/utils/paddleOcrUtils.ts:43](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/utils/paddleOcrUtils.ts#L43)

Discard boxes with a side smaller than this, in pixels.

---

### unclipRatio

> `readonly` **unclipRatio**: `number`

Defined in: [extensions/cv/utils/paddleOcrUtils.ts:41](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/utils/paddleOcrUtils.ts#L41)

How far to expand (unclip) each shrunk box.
