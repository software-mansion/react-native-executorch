# Class: ObjectDetectionModule\<T\>

Defined in: [modules/computer_vision/ObjectDetectionModule.ts:61](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts#L61)

Generic object detection module with type-safe label maps.

## Extends

- `BaseLabeledModule`\<`ResolveLabels`\<`T`\>\>

## Type Parameters

### T

`T` _extends_ [`ObjectDetectionModelName`](../type-aliases/ObjectDetectionModelName.md) \| [`LabelEnum`](../type-aliases/LabelEnum.md)

Either a built-in model name (e.g. `'ssdlite-320-mobilenet-v3-large'`)
or a custom [LabelEnum](../type-aliases/LabelEnum.md) label map.

## Properties

### labelMap

> `protected` `readonly` **labelMap**: `ResolveLabels`

Defined in: [modules/BaseLabeledModule.ts:52](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseLabeledModule.ts#L52)

#### Inherited from

`BaseLabeledModule.labelMap`

---

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [modules/BaseModule.ts:8](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L8)

Native module instance

#### Inherited from

`BaseLabeledModule.nativeModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [modules/BaseModule.ts:41](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L41)

Unloads the model from memory.

#### Returns

`void`

#### Inherited from

`BaseLabeledModule.delete`

---

### forward()

> **forward**(`imageSource`, `detectionThreshold`): `Promise`\<[`Detection`](../interfaces/Detection.md)\<`ResolveLabels`\<`T`, \{ `rf-detr-nano`: \{ `labelMap`: _typeof_ [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: \{ `normMean`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; `normStd`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; \}; \}; `ssdlite-320-mobilenet-v3-large`: \{ `labelMap`: _typeof_ [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: `undefined`; \}; \}\>\>[]\>

Defined in: [modules/computer_vision/ObjectDetectionModule.ts:145](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts#L145)

Executes the model's forward pass to detect objects within the provided image.

#### Parameters

##### imageSource

`string`

A string representing the image source (e.g., a file path, URI, or base64 string).

##### detectionThreshold

`number` = `0.7`

Minimum confidence score for a detection to be included. Default is 0.7.

#### Returns

`Promise`\<[`Detection`](../interfaces/Detection.md)\<`ResolveLabels`\<`T`, \{ `rf-detr-nano`: \{ `labelMap`: _typeof_ [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: \{ `normMean`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; `normStd`: [`Triple`](../type-aliases/Triple.md)\<`number`\>; \}; \}; `ssdlite-320-mobilenet-v3-large`: \{ `labelMap`: _typeof_ [`CocoLabel`](../enumerations/CocoLabel.md); `preprocessorConfig`: `undefined`; \}; \}\>\>[]\>

A Promise resolving to an array of [Detection](../interfaces/Detection.md) objects.

#### Throws

If the model is not loaded.

---

### forwardET()

> `protected` **forwardET**(`inputTensor`): `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Defined in: [modules/BaseModule.ts:23](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L23)

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

`BaseLabeledModule.forwardET`

---

### getInputShape()

> **getInputShape**(`methodName`, `index`): `Promise`\<`number`[]\>

Defined in: [modules/BaseModule.ts:34](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L34)

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

`BaseLabeledModule.getInputShape`

---

### load()

> **load**(): `Promise`\<`void`\>

Defined in: [modules/BaseLabeledModule.ts:61](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseLabeledModule.ts#L61)

#### Returns

`Promise`\<`void`\>

#### Inherited from

`BaseLabeledModule.load`

---

### fromCustomConfig()

> `static` **fromCustomConfig**\<`L`\>(`modelSource`, `config`, `onDownloadProgress`): `Promise`\<`ObjectDetectionModule`\<`L`\>\>

Defined in: [modules/computer_vision/ObjectDetectionModule.ts:118](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts#L118)

Creates an object detection instance with a user-provided label map and custom config.

#### Type Parameters

##### L

`L` _extends_ `Readonly`\<`Record`\<`string`, `string` \| `number`\>\>

#### Parameters

##### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the model binary.

##### config

[`ObjectDetectionConfig`](../type-aliases/ObjectDetectionConfig.md)\<`L`\>

A [ObjectDetectionConfig](../type-aliases/ObjectDetectionConfig.md) object with the label map.

##### onDownloadProgress

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`ObjectDetectionModule`\<`L`\>\>

A Promise resolving to an `ObjectDetectionModule` instance typed to the provided label map.

---

### fromModelName()

> `static` **fromModelName**\<`C`\>(`config`, `onDownloadProgress`): `Promise`\<`ObjectDetectionModule`\<`ModelNameOf`\<`C`\>\>\>

Defined in: [modules/computer_vision/ObjectDetectionModule.ts:88](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/ObjectDetectionModule.ts#L88)

Creates an object detection instance for a built-in model.

#### Type Parameters

##### C

`C` _extends_ [`ObjectDetectionModelSources`](../type-aliases/ObjectDetectionModelSources.md)

#### Parameters

##### config

`C`

A [ObjectDetectionModelSources](../type-aliases/ObjectDetectionModelSources.md) object specifying which model to load and where to fetch it from.

##### onDownloadProgress

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`ObjectDetectionModule`\<`ModelNameOf`\<`C`\>\>\>

A Promise resolving to an `ObjectDetectionModule` instance typed to the chosen model's label map.
