# Class: RnExecutorchError

Defined in: [errors/errorUtils.ts:20](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/errorUtils.ts#L20)

Custom error class for React Native ExecuTorch errors.

## Extends

- `Error`

## Constructors

### Constructor

> **new RnExecutorchError**(`code`, `message?`, `cause?`): `RnExecutorchError`

Defined in: [errors/errorUtils.ts:37](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/errorUtils.ts#L37)

#### Parameters

##### code

`number`

##### message?

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

Defined in: [errors/errorUtils.ts:35](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/errorUtils.ts#L35)

The original cause of the error, if any.

#### Overrides

`Error.cause`

---

### code

> **code**: `number`

Defined in: [errors/errorUtils.ts:30](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/errorUtils.ts#L30)

The error code representing the type of error.

Typed as `RnExecutorchErrorCode | number` because codes are defined in
`scripts/errors.config.ts` and generated into both the C++ and the TS
sources. If those generated files drift, a code emitted on one side may
not exist in the enum on the other and flows through as a raw number.
Consumers switching on `code` should always include a `default` branch.
