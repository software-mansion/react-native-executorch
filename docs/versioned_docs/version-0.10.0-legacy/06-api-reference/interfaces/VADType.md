# Interface: VADType

Defined in: [types/vad.ts:73](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L73)

React hook state and methods for managing a Voice Activity Detection (VAD) model instance.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/vad.ts:92](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L92)

Represents the download progress as a value between 0 and 1.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/vad.ts:77](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L77)

Contains the error message if the VAD model failed to load or during processing.

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/vad.ts:87](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L87)

Indicates whether the model is currently processing an inference.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/vad.ts:82](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L82)

Indicates whether the VAD model has successfully loaded and is ready for inference.

## Methods

### forward()

> **forward**(`waveform`): `Promise`\<[`Segment`](Segment.md)[]\>

Defined in: [types/vad.ts:100](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L100)

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

---

### stream()

> **stream**(`input`): `Promise`\<`void`\>

Defined in: [types/vad.ts:107](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L107)

Starts a streaming Voice Activity Detection session.

#### Parameters

##### input

[`VADStreamingInput`](VADStreamingInput.md)

Configuration for streaming, including callbacks for speech begin/end and optional parameters.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the streaming session stops.

---

### streamInsert()

> **streamInsert**(`waveform`): `void`

Defined in: [types/vad.ts:113](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L113)

Inserts an audio chunk into the streaming VAD session.

#### Parameters

##### waveform

`Float32Array`

The audio data to add to the buffer.

#### Returns

`void`

---

### streamStop()

> **streamStop**(): `void`

Defined in: [types/vad.ts:118](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L118)

Stops the current streaming VAD session.

#### Returns

`void`
