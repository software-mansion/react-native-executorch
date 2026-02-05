# Function: fixAndValidateStructuredOutput()

> **fixAndValidateStructuredOutput**\<`T`\>(`output`, `responseSchema`): `output`\<`T`\>

Defined in: [packages/react-native-executorch/src/utils/llm.ts:102](https://github.com/software-mansion/react-native-executorch/blob/180a40dc66a1a5554cd133093a04bade528bff90/packages/react-native-executorch/src/utils/llm.ts#L102)

Fixes and validates structured output from LLMs against a provided schema.

## Type Parameters

### T

`T` _extends_ `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>

## Parameters

### output

`string`

The raw output string from the LLM.

### responseSchema

The schema (Zod or JSON Schema) to validate the output against.

`Schema` | `T`

## Returns

`output`\<`T`\>

The validated and parsed output.
