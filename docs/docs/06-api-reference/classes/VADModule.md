# Class: VADModule

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/VADModule.ts:13](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/modules/natural_language_processing/VADModule.ts#L13)

Module for Voice Activity Detection (VAD) functionalities.

## Extends

- `BaseModule`

## Constructors

### Constructor

> **new VADModule**(): `VADModule`

#### Returns

`VADModule`

#### Inherited from

`BaseModule.constructor`

## Properties

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:8](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/modules/BaseModule.ts#L8)

Native module instance

#### Inherited from

`BaseModule.nativeModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:41](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/modules/BaseModule.ts#L41)

Unloads the model from memory.

#### Returns

`void`

#### Inherited from

`BaseModule.delete`

---

### forward()

> **forward**(`waveform`): `Promise`\<[`Segment`](../interfaces/Segment.md)[]\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/VADModule.ts:44](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/modules/natural_language_processing/VADModule.ts#L44)

Executes the model's forward pass, where `waveform` is a Float32Array representing the audio signal (16kHz).

#### Parameters

##### waveform

`Float32Array`

The input audio waveform as a Float32Array. It must represent a mono audio signal sampled at 16kHz.

#### Returns

`Promise`\<[`Segment`](../interfaces/Segment.md)[]\>

A promise resolving to an array of detected speech segments.

---

### forwardET()

> `protected` **forwardET**(`inputTensor`): `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:23](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/modules/BaseModule.ts#L23)

Runs the model's forward method with the given input tensors.
It returns the output tensors that mimic the structure of output from ExecuTorch.

#### Parameters

##### inputTensor

[`TensorPtr`](../interfaces/TensorPtr.md)[]

Array of input tensors.

#### Returns

`Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Array of output tensors.

#### Inherited from

`BaseModule.forwardET`

---

### getInputShape()

> **getInputShape**(`methodName`, `index`): `Promise`\<`number`[]\>

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:34](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/modules/BaseModule.ts#L34)

Gets the input shape for a given method and index.

#### Parameters

##### methodName

`string`

method name

##### index

`number`

index of the argument which shape is requested

#### Returns

`Promise`\<`number`[]\>

The input shape as an array of numbers.

#### Inherited from

`BaseModule.getInputShape`

---

### load()

> **load**(`model`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/natural_language_processing/VADModule.ts:21](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/modules/natural_language_processing/VADModule.ts#L21)

Loads the model, where `modelSource` is a string that specifies the location of the model binary.
To track the download progress, supply a callback function `onDownloadProgressCallback`.

#### Parameters

##### model

Object containing `modelSource`.

###### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### onDownloadProgressCallback

(`progress`) => `void`

Optional callback to monitor download progress.

#### Returns

`Promise`\<`void`\>

#### Overrides

`BaseModule.load`
