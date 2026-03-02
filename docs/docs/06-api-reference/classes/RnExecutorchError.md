# Class: RnExecutorchError

Defined in: [errors/errorUtils.ts:6](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/errors/errorUtils.ts#L6)

Custom error class for React Native ExecuTorch errors.

## Extends

- `Error`

## Constructors

### Constructor

> **new RnExecutorchError**(`code`, `message`, `cause?`): `RnExecutorchError`

Defined in: [errors/errorUtils.ts:17](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/errors/errorUtils.ts#L17)

#### Parameters

##### code

`number`

##### message

`string`

##### cause?

`unknown`

#### Returns

`RnExecutorchError`

#### Overrides

`Error.constructor`

## Properties

### cause?

> `optional` **cause**: `unknown`

Defined in: [errors/errorUtils.ts:15](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/errors/errorUtils.ts#L15)

The original cause of the error, if any.

#### Overrides

`Error.cause`

---

### code

> **code**: [`RnExecutorchErrorCode`](../enumerations/RnExecutorchErrorCode.md)

Defined in: [errors/errorUtils.ts:10](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/errors/errorUtils.ts#L10)

The error code representing the type of error.
