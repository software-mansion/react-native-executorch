# Function: getStructuredOutputPrompt()

> **getStructuredOutputPrompt**\<`T`\>(`responseSchema`): `string`

Defined in: [packages/react-native-executorch/src/utils/llm.ts:56](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/utils/llm.ts#L56)

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
