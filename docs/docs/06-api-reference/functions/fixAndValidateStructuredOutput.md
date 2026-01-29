# Function: fixAndValidateStructuredOutput()

> **fixAndValidateStructuredOutput**\<`T`\>(`output`, `responseSchema`): `output`\<`T`\>

Defined in: [packages/react-native-executorch/src/utils/llm.ts:102](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/utils/llm.ts#L102)

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
