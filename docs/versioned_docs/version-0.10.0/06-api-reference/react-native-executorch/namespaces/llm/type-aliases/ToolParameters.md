# Type Alias: ToolParameters

> **ToolParameters** = `object`

Defined in: [extensions/llm/utils/toolCalling.ts:12](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L12)

JSON Schema definition for tool parameter inputs.

## Indexable

\[`key`: `string`\]: `unknown`

## Properties

### properties?

> `readonly` `optional` **properties**: `Record`\<`string`, `unknown`\>

Defined in: [extensions/llm/utils/toolCalling.ts:16](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L16)

JSON Schema properties mapping parameter names to their schemas.

---

### required?

> `readonly` `optional` **required**: readonly `string`[]

Defined in: [extensions/llm/utils/toolCalling.ts:18](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L18)

Names of required parameters.

---

### type?

> `readonly` `optional` **type**: `"object"` \| `string`

Defined in: [extensions/llm/utils/toolCalling.ts:14](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L14)

JSON Schema type, typically `'object'`.
