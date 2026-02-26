# Interface: VADType

Defined in: [types/vad.ts:31](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/vad.ts#L31)

React hook state and methods for managing a Voice Activity Detection (VAD) model instance.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/vad.ts:50](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/vad.ts#L50)

Represents the download progress as a value between 0 and 1.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/vad.ts:35](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/vad.ts#L35)

Contains the error message if the VAD model failed to load or during processing.

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/vad.ts:45](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/vad.ts#L45)

Indicates whether the model is currently processing an inference.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/vad.ts:40](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/vad.ts#L40)

Indicates whether the VAD model has successfully loaded and is ready for inference.

## Methods

### forward()

> **forward**(`waveform`): `Promise`\<[`Segment`](Segment.md)[]\>

Defined in: [types/vad.ts:58](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/vad.ts#L58)

Runs the Voice Activity Detection model on the provided audio waveform.

#### Parameters

##### waveform

`Float32Array`

The input audio waveform array.

#### Returns

`Promise`\<[`Segment`](Segment.md)[]\>

A promise resolving to an array of detected audio segments (e.g., timestamps for speech).

#### Throws

If the model is not loaded or is currently processing another request.
