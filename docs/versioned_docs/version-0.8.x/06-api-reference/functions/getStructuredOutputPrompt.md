# Function: getStructuredOutputPrompt()

> **getStructuredOutputPrompt**\<`T`\>(`responseSchema`): `string`

Defined in: [utils/llm.ts:62](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/utils/llm.ts#L62)

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
