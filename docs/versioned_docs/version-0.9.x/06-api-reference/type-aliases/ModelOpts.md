# Type Alias: ModelOpts\<B\>

> **ModelOpts**\<`B`\> = `object`

Defined in: [constants/modelRegistry.ts:48](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/constants/modelRegistry.ts#L48)

Options for a `models` accessor call.

## Type Parameters

### B

`B` _extends_ [`Backend`](Backend.md) = [`Backend`](Backend.md)

Subset of [Backend](Backend.md) that the accessor actually supports.

## Properties

### backend?

> `optional` **backend**: `B`

Defined in: [constants/modelRegistry.ts:52](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/constants/modelRegistry.ts#L52)

Explicit backend; defaults to the platform-preferred backend for the model.

---

### quant?

> `optional` **quant**: `boolean`

Defined in: [constants/modelRegistry.ts:50](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/constants/modelRegistry.ts#L50)

Pick the non-quantized variant when `false`. Defaults to the quantized variant when one is published.
