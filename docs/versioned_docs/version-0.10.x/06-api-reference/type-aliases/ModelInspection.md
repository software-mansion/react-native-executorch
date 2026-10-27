# Type Alias: ModelInspection

> **ModelInspection** = `object`

Defined in: [utils.ts:31](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/utils.ts#L31)

Result of inspecting an ExecuTorch model file.

## Properties

### backends

> `readonly` **backends**: `Record`\<`string`, readonly `string`[]\>

Defined in: [utils.ts:37](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/utils.ts#L37)

Map of method names to the backends each method was compiled for.

---

### schema

> `readonly` **schema**: [`ModelSpec`](../react-native-executorch/namespaces/schema/type-aliases/ModelSpec.md)\<[`ConcreteDim`](../react-native-executorch/namespaces/schema/type-aliases/ConcreteDim.md)\>

Defined in: [utils.ts:35](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/utils.ts#L35)

Method signatures and tensor schema metadata.

---

### source

> `readonly` **source**: `string`

Defined in: [utils.ts:33](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/utils.ts#L33)

The model source URL or file path that was inspected.
