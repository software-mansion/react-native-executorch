# Class: PrivacyFilterModule

Defined in: [modules/natural_language_processing/PrivacyFilterModule.ts:37](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/PrivacyFilterModule.ts#L37)

Module for running token-level PII detection over text. Supports any
privacy-filter-style model with a `forward(input_ids, attention_mask)`
graph and a BIOES label space (the runner reads `labelNames` to map
predicted indices back to entity types).

## Extends

- `BaseModule`

## Properties

### generateFromFrame()

> **generateFromFrame**: (`frameData`, ...`args`) => `any`

Defined in: [modules/BaseModule.ts:53](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/BaseModule.ts#L53)

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

Defined in: [modules/BaseModule.ts:16](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/BaseModule.ts#L16)

**`Internal`**

Native module instance (JSI Host Object)

#### Inherited from

`BaseModule.nativeModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [modules/BaseModule.ts:81](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/BaseModule.ts#L81)

Unloads the model from memory and releases native resources.

Always call this method when you're done with a model to prevent memory leaks.

#### Returns

`void`

#### Inherited from

`BaseModule.delete`

---

### forwardET()

> `protected` **forwardET**(`inputTensor`): `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Defined in: [modules/BaseModule.ts:62](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/BaseModule.ts#L62)

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

### generate()

> **generate**(`text`): `Promise`\<[`PiiEntity`](../interfaces/PiiEntity.md)[]\>

Defined in: [modules/natural_language_processing/PrivacyFilterModule.ts:114](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/PrivacyFilterModule.ts#L114)

Executes the model's forward pass to detect PII entity spans within the provided text.

#### Parameters

##### text

`string`

The input text to scan for PII.

#### Returns

`Promise`\<[`PiiEntity`](../interfaces/PiiEntity.md)[]\>

A Promise resolving to an array of detected [PiiEntity](../interfaces/PiiEntity.md) spans.

---

### getInputShape()

> **getInputShape**(`methodName`, `index`): `Promise`\<`number`[]\>

Defined in: [modules/BaseModule.ts:72](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/BaseModule.ts#L72)

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

### fromCustomModel()

> `static` **fromCustomModel**(`modelSource`, `tokenizerSource`, `labelNames`, `options?`): `Promise`\<`PrivacyFilterModule`\>

Defined in: [modules/natural_language_processing/PrivacyFilterModule.ts:88](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/PrivacyFilterModule.ts#L88)

Creates a Privacy Filter instance with a user-provided model binary and tokenizer.
Use this when working with a custom-exported model that is not one of the built-in presets.

#### Parameters

##### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the .pte file.

##### tokenizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the tokenizer.json.

##### labelNames

readonly `string`[]

BIOES label list; index 0 must be "O".

##### options?

Optional Viterbi biases and download progress callback.

###### onDownloadProgress?

(`progress`) => `void`

###### viterbiBiases?

[`ViterbiBiases`](../interfaces/ViterbiBiases.md)

#### Returns

`Promise`\<`PrivacyFilterModule`\>

A Promise resolving to a `PrivacyFilterModule` instance.

#### Remarks

The `labelNames` array must match the model's head dimension and id2label mapping exactly.

---

### fromModelName()

> `static` **fromModelName**(`namedSources`, `onDownloadProgress?`): `Promise`\<`PrivacyFilterModule`\>

Defined in: [modules/natural_language_processing/PrivacyFilterModule.ts:53](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/modules/natural_language_processing/PrivacyFilterModule.ts#L53)

Creates a Privacy Filter instance for a built-in or custom-shaped model.
Pass one of the `PRIVACY_FILTER_*` constants from
`react-native-executorch/constants` for a known-good config, or
construct your own [PrivacyFilterModelSources](../interfaces/PrivacyFilterModelSources.md) for a custom
fine-tune.

#### Parameters

##### namedSources

[`PrivacyFilterModelSources`](../interfaces/PrivacyFilterModelSources.md)

Model + tokenizer resource locations and label list.

##### onDownloadProgress?

(`progress`) => `void`

Optional 0..1 download progress callback.

#### Returns

`Promise`\<`PrivacyFilterModule`\>

A Promise resolving to a `PrivacyFilterModule` instance.
