---
title: TokenizerModule
---

TypeScript API implementation of the [useTokenizer](../../02-hooks/01-natural-language-processing/useTokenizer.md) hook.

## Reference

```typescript
import {
  TokenizerModule,
  ALL_MINILM_L6_V2_TOKENIZER,
} from 'react-native-executorch';

// Load the tokenizer
await TokenizerModule.load(ALL_MINILM_L6_V2_TOKENIZER);
console.log('Tokenizer loaded');

// Get tokenizers vocabulary size
const vocabSize = await TokenizerModule.getVocabSize();
console.log('Vocabulary size:', vocabSize);

const text = 'Hello, world!';

// Tokenize the text
const tokens = await TokenizerModule.encode(text);
console.log('Token IDs:', tokens);

// Decode the tokens back to text
const decoded = await TokenizerModule.decode(tokens);
console.log('Decoded text:', decoded);

// Get the token ID for a specific token
const tokenId = await TokenizerModule.tokenToId('hello');
console.log('Token ID for "Hello":', tokenId);

// Get the token for a specific ID
const token = await TokenizerModule.idToToken(tokenId);
console.log('Token for ID:', token);
```

### Methods

| Method         | Type                                               | Description                                                                                                                          |
| -------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `load`         | `(tokenizerSource: ResourceSource): Promise<void>` | Loads the tokenizer from the specified source. `tokenizerSource` is a string that points to the location of the tokenizer JSON file. |
| `encode`       | `(input: string): Promise<number[]>`               | Converts a string into an array of token IDs.                                                                                        |
| `decode`       | `(input: number[]): Promise<string>`               | Converts an array of token IDs into a string.                                                                                        |
| `getVocabSize` | `(): Promise<number>`                              | Returns the size of the tokenizer's vocabulary.                                                                                      |
| `idToToken`    | `(tokenId: number): Promise<string>`               | Returns the token associated to the ID.                                                                                              |
| `tokenToId`    | `(token: string): Promise<number>`                 | Returns the ID associated to the token.                                                                                              |

<details>
<summary>Type definitions</summary>

```typescript
type ResourceSource = string | number | object;
```

</details>
