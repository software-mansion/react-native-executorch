# Interface: VADType

Defined in: [types/vad.ts:38](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/vad.ts#L38)

React hook state and methods for managing a Voice Activity Detection (VAD) model instance.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/vad.ts:57](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/vad.ts#L57)

Represents the download progress as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/vad.ts:42](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/vad.ts#L42)

Contains the error message if the VAD model failed to load or during processing.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/vad.ts:52](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/vad.ts#L52)

Indicates whether the model is currently processing an inference.

***

### isReady

> **isReady**: `boolean`

Defined in: [types/vad.ts:47](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/vad.ts#L47)

Indicates whether the VAD model has successfully loaded and is ready for inference.

## Methods

### forward()

> **forward**(`waveform`): `Promise`\<[`Segment`](Segment.md)[]\>

Defined in: [types/vad.ts:65](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/vad.ts#L65)

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
