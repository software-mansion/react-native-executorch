# Class: VADModule

Defined in: [modules/natural_language_processing/VADModule.ts:14](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/VADModule.ts#L14)

Module for Voice Activity Detection (VAD) functionalities.

## Extends

- `BaseModule`

## Properties

### generateFromFrame()

> **generateFromFrame**: (`frameData`, ...`args`) => `any`

Defined in: [modules/BaseModule.ts:56](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L56)

Process a camera frame directly for real-time inference.

This method is bound to a native JSI function after calling `load()`,
making it worklet-compatible and safe to call from VisionCamera's
frame processor thread.

**Performance characteristics:**

- **Zero-copy path**: When using `frame.getNativeBuffer()` from VisionCamera v5,
  frame data is accessed directly without copying (fastest, recommended).
- **Copy path**: When using `frame.toArrayBuffer()`, pixel data is copied
  from native to JS, then accessed from native code (slower, fallback).

**Usage with VisionCamera:**

```typescript
const frameOutput = useFrameOutput({
  pixelFormat: 'rgb',
  onFrame(frame) {
    'worklet';
    // Zero-copy approach (recommended)
    const nativeBuffer = frame.getNativeBuffer();
    const result = model.generateFromFrame(
      {
        nativeBuffer: nativeBuffer.pointer,
        width: frame.width,
        height: frame.height,
      },
      ...args
    );
    nativeBuffer.release();
    frame.dispose();
  },
});
```

#### Parameters

##### frameData

[`Frame`](../interfaces/Frame.md)

Frame data object with either nativeBuffer (zero-copy) or data (ArrayBuffer)

##### args

...`any`[]

Additional model-specific arguments (e.g., threshold, options)

#### Returns

`any`

Model-specific output (e.g., detections, classifications, embeddings)

#### See

[Frame](../interfaces/Frame.md) for frame data format details

#### Inherited from

`BaseModule.generateFromFrame`

---

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [modules/BaseModule.ts:17](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L17)

**`Internal`**

Native module instance (JSI Host Object)

#### Inherited from

`BaseModule.nativeModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [modules/BaseModule.ts:86](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L86)

Unloads the model from memory and releases native resources.

Always call this method when you're done with a model to prevent memory leaks.

#### Returns

`void`

#### Inherited from

`BaseModule.delete`

---

### forward()

> **forward**(`waveform`): `Promise`\<[`Segment`](../interfaces/Segment.md)[]\>

Defined in: [modules/natural_language_processing/VADModule.ts:55](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/VADModule.ts#L55)

Executes the model's forward pass to detect speech segments within the provided audio.

#### Parameters

##### waveform

`Float32Array`

A `Float32Array` representing a mono audio signal sampled at 16kHz.

#### Returns

`Promise`\<[`Segment`](../interfaces/Segment.md)[]\>

A Promise resolving to an array of [Segment](../interfaces/Segment.md) objects.

---

### forwardET()

> `protected` **forwardET**(`inputTensor`): `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Defined in: [modules/BaseModule.ts:66](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L66)

**`Internal`**

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

Defined in: [modules/BaseModule.ts:77](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L77)

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

### fromModelName()

> `static` **fromModelName**(`model`, `onDownloadProgress?`): `Promise`\<`VADModule`\>

Defined in: [modules/natural_language_processing/VADModule.ts:27](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/natural_language_processing/VADModule.ts#L27)

Creates a VAD instance for a built-in model.

#### Parameters

##### model

An object specifying which built-in model to load and where to fetch it from.

###### modelName

`"fsmn-vad"`

###### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`VADModule`\>

A Promise resolving to a `VADModule` instance.
