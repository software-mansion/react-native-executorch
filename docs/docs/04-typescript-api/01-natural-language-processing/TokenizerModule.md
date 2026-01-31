---
title: TokenizerModule
---

TypeScript API implementation of the [useTokenizer](../../03-hooks/01-natural-language-processing/useTokenizer.md) hook.

## API Reference

* For detailed API Reference for `TokenizerModule` see: [`TokenizerModule` API Reference](../../06-api-reference/classes/TokenizerModule.md).

## Reference

```typescript
import { TokenizerModule, ALL_MINILM_L6_V2 } from 'react-native-executorch';

// Creating an instance
const tokenizerModule = new TokenizerModule();

// Load the tokenizer
await tokenizerModule.load(ALL_MINILM_L6_V2);
console.log('Tokenizer loaded');

// Get tokenizers vocabulary size
const vocabSize = await tokenizerModule.getVocabSize();
console.log('Vocabulary size:', vocabSize);

const text = 'Hello, world!';

// Tokenize the text
const tokens = await tokenizerModule.encode(text);
console.log('Token IDs:', tokens);

// Decode the tokens back to text
const decoded = await tokenizerModule.decode(tokens);
console.log('Decoded text:', decoded);

// Get the token ID for a specific token
const tokenId = await tokenizerModule.tokenToId('hello');
console.log('Token ID for "Hello":', tokenId);

// Get the token for a specific ID
const token = await tokenizerModule.idToToken(tokenId);
console.log('Token for ID:', token);
```

### Methods

All methods of `TokenizerModule` are explained in details here: [`TokenizerModule API Reference`](../../06-api-reference/classes/TokenizerModule.md)
