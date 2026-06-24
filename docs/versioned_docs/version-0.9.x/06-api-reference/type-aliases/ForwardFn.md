# Type Alias: ForwardFn\<M\>

> **ForwardFn**\<`M`\> = `M` *extends* `object` ? (`input`, `role`) => `Promise`\<[`ForwardReturn`](ForwardReturn.md)\<`M`\>\> : `undefined` *extends* `M`\[`"prompts"`\] ? `M`\[`"prompts"`\] *extends* `undefined` ? (`input`) => `Promise`\<[`ForwardReturn`](ForwardReturn.md)\<`M`\>\> : (`input`, `role?`) => `Promise`\<[`ForwardReturn`](ForwardReturn.md)\<`M`\>\> : (`input`) => `Promise`\<[`ForwardReturn`](ForwardReturn.md)\<`M`\>\>

Defined in: [types/textEmbeddings.ts:90](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L90)

`forward`'s signature, computed from the model config: `role` is required
when the model has `prompts`, omitted when it has none, and optional when
unknown (e.g. a heterogeneous model list).

## Type Parameters

### M

`M` *extends* [`TextEmbeddingsModel`](../interfaces/TextEmbeddingsModel.md)
