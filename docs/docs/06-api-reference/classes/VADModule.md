# Class: VADModule

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/VADModule.ts:8](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/modules/natural_language_processing/VADModule.ts#L8)

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

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:5](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/modules/BaseModule.ts#L5)

#### Inherited from

`BaseModule.nativeModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:21](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/modules/BaseModule.ts#L21)

#### Returns

`void`

#### Inherited from

`BaseModule.delete`

***

### forward()

> **forward**(`waveform`): `Promise`\<[`Segment`](../interfaces/Segment.md)[]\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/VADModule.ts:26](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/modules/natural_language_processing/VADModule.ts#L26)

#### Parameters

##### waveform

`Float32Array`

#### Returns

`Promise`\<[`Segment`](../interfaces/Segment.md)[]\>

***

### forwardET()

> `protected` **forwardET**(`inputTensor`): `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:13](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/modules/BaseModule.ts#L13)

#### Parameters

##### inputTensor

[`TensorPtr`](../interfaces/TensorPtr.md)[]

#### Returns

`Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

#### Inherited from

`BaseModule.forwardET`

***

### getInputShape()

> **getInputShape**(`methodName`, `index`): `Promise`\<`number`[]\>

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:17](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/modules/BaseModule.ts#L17)

#### Parameters

##### methodName

`string`

##### index

`number`

#### Returns

`Promise`\<`number`[]\>

#### Inherited from

`BaseModule.getInputShape`

***

### load()

> **load**(`model`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/VADModule.ts:9](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/modules/natural_language_processing/VADModule.ts#L9)

#### Parameters

##### model

###### modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### onDownloadProgressCallback

(`progress`) => `void`

#### Returns

`Promise`\<`void`\>

#### Overrides

`BaseModule.load`
