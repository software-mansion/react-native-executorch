# Type Alias: ModelInspection

> **ModelInspection** = `object`

Defined in: [utils.ts:31](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/utils.ts#L31)

Result of inspecting an ExecuTorch model file.

## Properties

### backends

> `readonly` **backends**: `Record`\<`string`, readonly `string`[]\>

Defined in: [utils.ts:37](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/utils.ts#L37)

Map of method names to the backends each method was compiled for.

---

### schema

> `readonly` **schema**: [`ModelSpec`](../react-native-executorch/namespaces/schema/type-aliases/ModelSpec.md)\<[`ConcreteDim`](../react-native-executorch/namespaces/schema/type-aliases/ConcreteDim.md)\>

Defined in: [utils.ts:35](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/utils.ts#L35)

Method signatures and tensor schema metadata.

---

### source

> `readonly` **source**: `string`

Defined in: [utils.ts:33](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/utils.ts#L33)

The model source URL or file path that was inspected.
