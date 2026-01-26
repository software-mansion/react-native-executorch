# Interface: VADType

Defined in: [packages/react-native-executorch/src/types/vad.ts:37](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/vad.ts#L37)

React hook state and methods for managing a Voice Activity Detection (VAD) model instance.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/vad.ts:56](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/vad.ts#L56)

Represents the download progress as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/vad.ts:41](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/vad.ts#L41)

Contains the error message if the VAD model failed to load or during processing.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/vad.ts:51](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/vad.ts#L51)

Indicates whether the model is currently processing an inference.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/vad.ts:46](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/vad.ts#L46)

Indicates whether the VAD model has successfully loaded and is ready for inference.

## Methods

### forward()

> **forward**(`waveform`): `Promise`\<[`Segment`](Segment.md)[]\>

Defined in: [packages/react-native-executorch/src/types/vad.ts:64](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/vad.ts#L64)

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
