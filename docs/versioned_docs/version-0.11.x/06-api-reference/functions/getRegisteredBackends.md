# Function: getRegisteredBackends()

> **getRegisteredBackends**(): readonly `string`[]

Defined in: [utils.ts:47](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/utils.ts#L47)

Retrieves the names of all ExecuTorch backends compiled and registered in the
native binary.

## Returns

readonly `string`[]

An array of registered backend name strings (e.g. 'XnnpackBackend',
'CoreMLBackend').
