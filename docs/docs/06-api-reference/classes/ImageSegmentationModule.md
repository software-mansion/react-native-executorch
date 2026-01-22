# Class: ImageSegmentationModule

Defined in: [packages/react-native-executorch/src/modules/computer_vision/ImageSegmentationModule.ts:8](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/modules/computer_vision/ImageSegmentationModule.ts#L8)

## Extends

- `BaseModule`

## Constructors

### Constructor

> **new ImageSegmentationModule**(): `ImageSegmentationModule`

#### Returns

`ImageSegmentationModule`

#### Inherited from

`BaseModule.constructor`

## Properties

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:5](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/modules/BaseModule.ts#L5)

#### Inherited from

`BaseModule.nativeModule`

## Methods

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:21](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/modules/BaseModule.ts#L21)

#### Returns

`void`

#### Inherited from

`BaseModule.delete`

---

### forward()

> **forward**(`imageSource`, `classesOfInterest?`, `resize?`): `Promise`\<\{ `0?`: `number`[]; `1?`: `number`[]; `10?`: `number`[]; `11?`: `number`[]; `12?`: `number`[]; `13?`: `number`[]; `14?`: `number`[]; `15?`: `number`[]; `16?`: `number`[]; `17?`: `number`[]; `18?`: `number`[]; `19?`: `number`[]; `2?`: `number`[]; `20?`: `number`[]; `21?`: `number`[]; `3?`: `number`[]; `4?`: `number`[]; `5?`: `number`[]; `6?`: `number`[]; `7?`: `number`[]; `8?`: `number`[]; `9?`: `number`[]; \}\>

Defined in: [packages/react-native-executorch/src/modules/computer_vision/ImageSegmentationModule.ts:26](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/modules/computer_vision/ImageSegmentationModule.ts#L26)

#### Parameters

##### imageSource

`string`

##### classesOfInterest?

[`DeeplabLabel`](../enumerations/DeeplabLabel.md)[]

##### resize?

`boolean`

#### Returns

`Promise`\<\{ `0?`: `number`[]; `1?`: `number`[]; `10?`: `number`[]; `11?`: `number`[]; `12?`: `number`[]; `13?`: `number`[]; `14?`: `number`[]; `15?`: `number`[]; `16?`: `number`[]; `17?`: `number`[]; `18?`: `number`[]; `19?`: `number`[]; `2?`: `number`[]; `20?`: `number`[]; `21?`: `number`[]; `3?`: `number`[]; `4?`: `number`[]; `5?`: `number`[]; `6?`: `number`[]; `7?`: `number`[]; `8?`: `number`[]; `9?`: `number`[]; \}\>

---

### forwardET()

> `protected` **forwardET**(`inputTensor`): `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:13](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/modules/BaseModule.ts#L13)

#### Parameters

##### inputTensor

[`TensorPtr`](../interfaces/TensorPtr.md)[]

#### Returns

`Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

#### Inherited from

`BaseModule.forwardET`

---

### getInputShape()

> **getInputShape**(`methodName`, `index`): `Promise`\<`number`[]\>

Defined in: [packages/react-native-executorch/src/modules/BaseModule.ts:17](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/modules/BaseModule.ts#L17)

#### Parameters

##### methodName

`string`

##### index

`number`

#### Returns

`Promise`\<`number`[]\>

#### Inherited from

`BaseModule.getInputShape`

---

### load()

> **load**(`model`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/computer_vision/ImageSegmentationModule.ts:9](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/modules/computer_vision/ImageSegmentationModule.ts#L9)

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
