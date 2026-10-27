# Function: method()

> **method**(`name`, `inputs`, `outputs`, `constraints?`): `Record`\<`string`, [`MethodSpec`](../type-aliases/MethodSpec.md)\<[`SymbolicDim`](../type-aliases/SymbolicDim.md)\>\>

Defined in: [core/schema.ts:413](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/schema.ts#L413)

Constructs a method specification mapping a method name to its parameter
specs and runtime constraints.

## Parameters

### name

`string`

The execution method name (e.g., `'forward'`).

### inputs

[`ParamSpec`](../type-aliases/ParamSpec.md)\<[`SymbolicDim`](../type-aliases/SymbolicDim.md)\>[]

Ordered list of parameter specifications for method inputs.

### outputs

[`ParamSpec`](../type-aliases/ParamSpec.md)\<[`SymbolicDim`](../type-aliases/SymbolicDim.md)\>[]

Ordered list of parameter specifications for method outputs.

### constraints?

[`RuntimeConstraint`](../type-aliases/RuntimeConstraint.md)[]

Optional array of [RuntimeConstraint](../type-aliases/RuntimeConstraint.md) declarations
(equality or linear relations across dimensions).

## Returns

`Record`\<`string`, [`MethodSpec`](../type-aliases/MethodSpec.md)\<[`SymbolicDim`](../type-aliases/SymbolicDim.md)\>\>

A record mapping `name` to its corresponding [MethodSpec](../type-aliases/MethodSpec.md).
