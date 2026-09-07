# Interface: PrivacyFilterType

Defined in: [types/privacyFilter.ts:91](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L91)

React hook state and methods for a Privacy Filter model.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/privacyFilter.ts:95](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L95)

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/privacyFilter.ts:92](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L92)

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/privacyFilter.ts:94](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L94)

---

### isReady

> **isReady**: `boolean`

Defined in: [types/privacyFilter.ts:93](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L93)

## Methods

### generate()

> **generate**(`text`): `Promise`\<[`PiiEntity`](PiiEntity.md)[]\>

Defined in: [types/privacyFilter.ts:103](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/privacyFilter.ts#L103)

Run PII detection over the given text. Long inputs are processed in
sliding windows with 50% overlap; no truncation. The window size is
determined by the model's exported `forward` input shape.

#### Parameters

##### text

`string`

Input text.

#### Returns

`Promise`\<[`PiiEntity`](PiiEntity.md)[]\>

A promise resolving to detected entity spans.
