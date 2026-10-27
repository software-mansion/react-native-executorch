# Type Alias: MethodSpec\<Dim\>

> **MethodSpec**\<`Dim`\> = `object`

Defined in: [core/schema.ts:202](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/schema.ts#L202)

Spec of a single model method: the ordered input and output parameter specs
and the runtime constraints the method declares over its tensor dimensions.

## Type Parameters

### Dim

`Dim` _extends_ [`SymbolicDim`](SymbolicDim.md)

## Properties

### inputs

> **inputs**: readonly [`ParamSpec`](ParamSpec.md)\<`Dim`\>[]

Defined in: [core/schema.ts:203](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/schema.ts#L203)

---

### outputs

> **outputs**: readonly [`ParamSpec`](ParamSpec.md)\<`Dim`\>[]

Defined in: [core/schema.ts:204](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/schema.ts#L204)

---

### runtimeConstraints

> **runtimeConstraints**: readonly [`RuntimeConstraint`](RuntimeConstraint.md)[]

Defined in: [core/schema.ts:205](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/schema.ts#L205)
