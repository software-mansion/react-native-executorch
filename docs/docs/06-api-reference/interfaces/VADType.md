# Interface: VADType

Defined in: [packages/react-native-executorch/src/types/vad.ts:34](https://github.com/software-mansion/react-native-executorch/blob/4bb7c5e39cad5e7f0481e1bb508135978edc9be2/packages/react-native-executorch/src/types/vad.ts#L34)

React hook state and methods for managing a Voice Activity Detection (VAD) model instance.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/vad.ts:53](https://github.com/software-mansion/react-native-executorch/blob/4bb7c5e39cad5e7f0481e1bb508135978edc9be2/packages/react-native-executorch/src/types/vad.ts#L53)

Represents the download progress as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/vad.ts:38](https://github.com/software-mansion/react-native-executorch/blob/4bb7c5e39cad5e7f0481e1bb508135978edc9be2/packages/react-native-executorch/src/types/vad.ts#L38)

Contains the error message if the VAD model failed to load or during processing.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/vad.ts:48](https://github.com/software-mansion/react-native-executorch/blob/4bb7c5e39cad5e7f0481e1bb508135978edc9be2/packages/react-native-executorch/src/types/vad.ts#L48)

Indicates whether the model is currently processing an inference.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/vad.ts:43](https://github.com/software-mansion/react-native-executorch/blob/4bb7c5e39cad5e7f0481e1bb508135978edc9be2/packages/react-native-executorch/src/types/vad.ts#L43)

Indicates whether the VAD model has successfully loaded and is ready for inference.

## Methods

### forward()

> **forward**(`waveform`): `Promise`\<[`Segment`](Segment.md)[]\>

Defined in: [packages/react-native-executorch/src/types/vad.ts:61](https://github.com/software-mansion/react-native-executorch/blob/4bb7c5e39cad5e7f0481e1bb508135978edc9be2/packages/react-native-executorch/src/types/vad.ts#L61)

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
