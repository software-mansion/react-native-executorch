# Function: fixAndValidateStructuredOutput()

> **fixAndValidateStructuredOutput**\<`T`\>(`output`, `responseSchema`): `output`\<`T`\>

Defined in: [utils/llm.ts:102](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/utils/llm.ts#L102)

Fixes and validates structured output from LLMs against a provided schema.

## Type Parameters

### T

`T` _extends_ `$ZodType`

## Parameters

### output

`string`

The raw output string from the LLM.

### responseSchema

`any`

The schema (Zod or JSON Schema) to validate the output against.

## Returns

`output`\<`T`\>

The validated and parsed output.
