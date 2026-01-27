# Class: TextEmbeddingsModule

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TextEmbeddingsModule.ts:10](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/modules/natural_language_processing/TextEmbeddingsModule.ts#L10)

Module for generating text embeddings from input text.

## Extends

- `BaseModule`

## Constructors

### Constructor

> **new TextEmbeddingsModule**(): `TextEmbeddingsModule`

#### Returns

`TextEmbeddingsModule`

#### Inherited from

`BaseModule.constructor`

## Properties

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:8](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/modules/BaseModule.ts#L8)

Native module instance

#### Inherited from

`BaseModule.nativeModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:41](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/modules/BaseModule.ts#L41)

Unloads the model from memory.

#### Returns

`void`

#### Inherited from

`BaseModule.delete`

***

### forward()

> **forward**(`input`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TextEmbeddingsModule.ts:53](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/modules/natural_language_processing/TextEmbeddingsModule.ts#L53)

Executes the model's forward pass, where `input` is a text that will be embedded.

#### Parameters

##### input

`string`

The text string to embed.

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

A Float32Array containing the vector embeddings.

***

### forwardET()

> `protected` **forwardET**(`inputTensor`): `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:23](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/modules/BaseModule.ts#L23)

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

***

### getInputShape()

> **getInputShape**(`methodName`, `index`): `Promise`\<`number`[]\>

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:34](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/modules/BaseModule.ts#L34)

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

***

### load()

> **load**(`model`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TextEmbeddingsModule.ts:20](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/modules/natural_language_processing/TextEmbeddingsModule.ts#L20)

Loads the model and tokenizer specified by the config object.

#### Parameters

##### model

Object containing model and tokenizer sources.

###### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` that specifies the location of the text embeddings model binary.

###### tokenizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` that specifies the location of the tokenizer JSON file.

##### onDownloadProgressCallback

(`progress`) => `void`

Optional callback to track download progress (value between 0 and 1).

#### Returns

`Promise`\<`void`\>

#### Overrides

`BaseModule.load`
