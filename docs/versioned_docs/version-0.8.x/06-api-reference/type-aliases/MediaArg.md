# Type Alias: MediaArg\<C\>

> **MediaArg**\<`C`\> = `"vision"` *extends* `C`\[`number`\] ? `object` : `object`

Defined in: [types/llm.ts:14](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L14)

Derives the media argument shape for `sendMessage` from a capabilities tuple.

## Type Parameters

### C

`C` *extends* readonly [`LLMCapability`](LLMCapability.md)[]
