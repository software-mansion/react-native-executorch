# Function: fixAndValidateStructuredOutput()

> **fixAndValidateStructuredOutput**\<`T`\>(`output`, `responseSchema`): `output`\<`T`\>

Defined in: [utils/llm.ts:99](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/utils/llm.ts#L99)

Fixes and validates structured output from LLMs against a provided schema.

## Type Parameters

### T

`T` *extends* `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>

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
