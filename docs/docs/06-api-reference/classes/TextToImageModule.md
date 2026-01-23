# Class: TextToImageModule

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/TextToImageModule.ts:9](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts#L9)

## Extends

- `BaseModule`

## Constructors

### Constructor

> **new TextToImageModule**(`inferenceCallback?`): `TextToImageModule`

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/TextToImageModule.ts:12](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts#L12)

#### Parameters

##### inferenceCallback?

(`stepIdx`) => `void`

#### Returns

`TextToImageModule`

#### Overrides

`BaseModule.constructor`

## Properties

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:5](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/modules/BaseModule.ts#L5)

#### Inherited from

`BaseModule.nativeModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:21](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/modules/BaseModule.ts#L21)

#### Returns

`void`

#### Inherited from

`BaseModule.delete`

***

### forward()

> **forward**(`input`, `imageSize`, `numSteps`, `seed?`): `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/TextToImageModule.ts:74](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts#L74)

#### Parameters

##### input

`string`

##### imageSize

`number` = `512`

##### numSteps

`number` = `5`

##### seed?

`number`

#### Returns

`Promise`\<`string`\>

***

### forwardET()

> `protected` **forwardET**(`inputTensor`): `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:13](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/modules/BaseModule.ts#L13)

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

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:17](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/modules/BaseModule.ts#L17)

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

### interrupt()

> **interrupt**(): `void`

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/TextToImageModule.ts:98](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts#L98)

#### Returns

`void`

***

### load()

> **load**(`model`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/computer\_vision/TextToImageModule.ts:19](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/modules/computer_vision/TextToImageModule.ts#L19)

#### Parameters

##### model

###### decoderSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

###### encoderSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

###### schedulerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

###### tokenizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

###### unetSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

##### onDownloadProgressCallback

(`progress`) => `void`

#### Returns

`Promise`\<`void`\>

#### Overrides

`BaseModule.load`
