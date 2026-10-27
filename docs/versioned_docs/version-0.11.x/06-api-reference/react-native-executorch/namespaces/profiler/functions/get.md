# Function: get()

## Call Signature

> **get**(): `Readonly`\<`Record`\<`string`, [`ModelProfile`](../type-aliases/ModelProfile.md)\>\>

Defined in: [core/profiler.ts:43](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/profiler.ts#L43)

Reads the totals accumulated since the last [reset](reset.md).

### Returns

`Readonly`\<`Record`\<`string`, [`ModelProfile`](../type-aliases/ModelProfile.md)\>\>

Totals of every executed model, keyed by model path.

## Call Signature

> **get**(`modelPath`): [`ModelProfile`](../type-aliases/ModelProfile.md)

Defined in: [core/profiler.ts:50](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/profiler.ts#L50)

Reads the totals one model accumulated since the last [reset](reset.md).

### Parameters

#### modelPath

`string`

The model's path, as in `model.path`.

### Returns

[`ModelProfile`](../type-aliases/ModelProfile.md)

Totals keyed by method name; empty if the model was not executed.
