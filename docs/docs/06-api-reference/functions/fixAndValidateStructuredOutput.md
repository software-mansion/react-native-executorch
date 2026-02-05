# Function: fixAndValidateStructuredOutput()

> **fixAndValidateStructuredOutput**\<`T`\>(`output`, `responseSchema`): `output`\<`T`\>

Defined in: [packages/react-native-executorch/src/utils/llm.ts:102](https://github.com/software-mansion/react-native-executorch/blob/4ee3121e1a18c982703726f1f72421920ed523a4/packages/react-native-executorch/src/utils/llm.ts#L102)

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
