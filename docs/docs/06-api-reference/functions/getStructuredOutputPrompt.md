# Function: getStructuredOutputPrompt()

> **getStructuredOutputPrompt**\<`T`\>(`responseSchema`): `string`

Defined in: [packages/react-native-executorch/src/utils/llm.ts:64](https://github.com/software-mansion/react-native-executorch/blob/7e10c820da55c41850b183cae64d67ab1e216a67/packages/react-native-executorch/src/utils/llm.ts#L64)

Generates a structured output prompt based on the provided schema.

## Type Parameters

### T

`T` *extends* `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>

## Parameters

### responseSchema

The schema (Zod or JSON Schema) defining the desired output format.

`T` | `Schema`

## Returns

`string`

A prompt string instructing the model to format its output according to the given schema.
