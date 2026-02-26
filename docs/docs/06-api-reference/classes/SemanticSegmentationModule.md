# Class: SemanticSegmentationModule\<T\>

Defined in: [modules/computer_vision/SemanticSegmentationModule.ts:79](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/SemanticSegmentationModule.ts#L79)

Generic semantic segmentation module with type-safe label maps.
Use a model name (e.g. `'deeplab-v3-resnet50'`) as the generic parameter for built-in models,
or a custom label enum for custom configs.

## Extends

- `BaseModule`

## Type Parameters

### T

`T` _extends_ [`SemanticSegmentationModelName`](../type-aliases/SemanticSegmentationModelName.md) \| [`LabelEnum`](../type-aliases/LabelEnum.md)

Either a built-in model name (`'deeplab-v3-resnet50'`,
`'deeplab-v3-resnet50-quantized'`, `'deeplab-v3-resnet101'`,
`'deeplab-v3-resnet101-quantized'`, `'deeplab-v3-mobilenet-v3-large'`,
`'deeplab-v3-mobilenet-v3-large-quantized'`, `'lraspp-mobilenet-v3-large'`,
`'lraspp-mobilenet-v3-large-quantized'`, `'fcn-resnet50'`,
`'fcn-resnet50-quantized'`, `'fcn-resnet101'`, `'fcn-resnet101-quantized'`,
`'selfie-segmentation'`) or a custom [LabelEnum](../type-aliases/LabelEnum.md) label map.

## Properties

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [modules/BaseModule.ts:8](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L8)

Native module instance

#### Inherited from

`BaseModule.nativeModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [modules/BaseModule.ts:39](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L39)

Unloads the model from memory.

#### Returns

`void`

#### Inherited from

`BaseModule.delete`

---

### forward()

> **forward**\<`K`\>(`imageSource`, `classesOfInterest?`, `resizeToInput?`): `Promise`\<`Record`\<`"ARGMAX"`, `Int32Array`\<`ArrayBufferLike`\>\> & `Record`\<`K`, `Float32Array`\<`ArrayBufferLike`\>\>\>

Defined in: [modules/computer_vision/SemanticSegmentationModule.ts:190](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/SemanticSegmentationModule.ts#L190)

Executes the model's forward pass to perform semantic segmentation on the provided image.

#### Type Parameters

##### K

`K` _extends_ `string` \| `number` \| `symbol`

#### Parameters

##### imageSource

`string`

A string representing the image source (e.g., a file path, URI, or Base64-encoded string).

##### classesOfInterest?

`K`[] = `[]`

An optional list of label keys indicating which per-class probability masks to include in the output. `ARGMAX` is always returned regardless.

##### resizeToInput?

`boolean` = `true`

Whether to resize the output masks to the original input image dimensions. If `false`, returns the raw model output dimensions. Defaults to `true`.

#### Returns

`Promise`\<`Record`\<`"ARGMAX"`, `Int32Array`\<`ArrayBufferLike`\>\> & `Record`\<`K`, `Float32Array`\<`ArrayBufferLike`\>\>\>

A Promise resolving to an object with an `'ARGMAX'` key mapped to an `Int32Array` of per-pixel class indices, and each requested class label mapped to a `Float32Array` of per-pixel probabilities.

#### Throws

If the model is not loaded.

---

### forwardET()

> `protected` **forwardET**(`inputTensor`): `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Defined in: [modules/BaseModule.ts:22](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L22)

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

Defined in: [modules/BaseModule.ts:32](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/BaseModule.ts#L32)

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

> **load**(): `Promise`\<`void`\>

Defined in: [modules/computer_vision/SemanticSegmentationModule.ts:95](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/SemanticSegmentationModule.ts#L95)

#### Returns

`Promise`\<`void`\>

#### Overrides

`BaseModule.load`

---

### fromCustomConfig()

> `static` **fromCustomConfig**\<`L`\>(`modelSource`, `config`, `onDownloadProgress?`): `Promise`\<`SemanticSegmentationModule`\<`L`\>\>

Defined in: [modules/computer_vision/SemanticSegmentationModule.ts:157](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/SemanticSegmentationModule.ts#L157)

Creates a segmentation instance with a user-provided label map and custom config.
Use this when working with a custom-exported segmentation model that is not one of the built-in models.

#### Type Parameters

##### L

`L` _extends_ `Readonly`\<`Record`\<`string`, `string` \| `number`\>\>

#### Parameters

##### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

A fetchable resource pointing to the model binary.

##### config

[`SemanticSegmentationConfig`](../type-aliases/SemanticSegmentationConfig.md)\<`L`\>

A [SemanticSegmentationConfig](../type-aliases/SemanticSegmentationConfig.md) object with the label map and optional preprocessing parameters.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`SemanticSegmentationModule`\<`L`\>\>

A Promise resolving to a `SemanticSegmentationModule` instance typed to the provided label map.

#### Example

```ts
const MyLabels = { BACKGROUND: 0, FOREGROUND: 1 } as const;
const segmentation = await SemanticSegmentationModule.fromCustomConfig(
  'https://example.com/custom_model.pte',
  { labelMap: MyLabels }
);
```

---

### fromModelName()

> `static` **fromModelName**\<`C`\>(`config`, `onDownloadProgress?`): `Promise`\<`SemanticSegmentationModule`\<[`ModelNameOf`](../type-aliases/ModelNameOf.md)\<`C`\>\>\>

Defined in: [modules/computer_vision/SemanticSegmentationModule.ts:112](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/modules/computer_vision/SemanticSegmentationModule.ts#L112)

Creates a segmentation instance for a built-in model.
The config object is discriminated by `modelName` — each model can require different fields.

#### Type Parameters

##### C

`C` _extends_ [`SemanticSegmentationModelSources`](../type-aliases/SemanticSegmentationModelSources.md)

#### Parameters

##### config

`C`

A [SemanticSegmentationModelSources](../type-aliases/SemanticSegmentationModelSources.md) object specifying which model to load and where to fetch it from.

##### onDownloadProgress?

(`progress`) => `void`

Optional callback to monitor download progress, receiving a value between 0 and 1.

#### Returns

`Promise`\<`SemanticSegmentationModule`\<[`ModelNameOf`](../type-aliases/ModelNameOf.md)\<`C`\>\>\>

A Promise resolving to a `SemanticSegmentationModule` instance typed to the chosen model's label map.

#### Example

```ts
const segmentation = await SemanticSegmentationModule.fromModelName({
  modelName: 'deeplab-v3',
  modelSource: 'https://example.com/deeplab.pte',
});
```
