---
title: useTokenizer
keywords:
  [
    tokenizer,
    text tokenizer,
    tokenization,
    react native,
    executorch,
    ai,
    machine learning,
    on-device,
    mobile ai,
  ]
description: "Learn how to tokenize your text in your React Native applications using React Native ExecuTorch's useTokenizer hook."
---

Tokenization is the process of breaking down text into smaller units called tokens. It’s a crucial step in natural language processing that
converts text into a format that machine learning models can understand.

:::info
We are using [Hugging Face Tokenizers](https://huggingface.co/docs/tokenizers/index) under the hood, ensuring compatibility with the Hugging Face ecosystem.
:::

## Reference

```typescript
import { useTokenizer, ALL_MINILM_L6_V2 } from 'react-native-executorch';

const tokenizer = useTokenizer(ALL_MINILM_L6_V2);

const text = 'Hello, world!';

try {
  // Tokenize the text
  const tokens = await tokenizer.encode(text);
  console.log('Tokens:', tokens);

  // Decode the tokens back to text
  const decodedText = await tokenizer.decode(tokens);
  console.log('Decoded text:', decodedText);
} catch (error) {
  console.error('Error tokenizing text:', error);
}
```

## Arguments

**`tokenizerSource`** - A string that specifies the path or URI of the tokenizer JSON file.

**`preventLoad?`** - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

### Returns

| Field              | Type                                  | Description                                                           |
| ------------------ | ------------------------------------- | --------------------------------------------------------------------- |
| `encode`           | `(text: string) => Promise<number[]>` | Converts a string into an array of token IDs.                         |
| `decode`           | `(ids: number[]) => Promise<string>`  | Converts an array of token IDs into a string.                         |
| `getVocabSize`     | `() => Promise<number>`               | Returns the size of the tokenizer's vocabulary.                       |
| `idToToken`        | `(id: number) => Promise<string>`     | Returns the token associated to the ID.                               |
| `tokenToId`        | `(token: string) => Promise<number>`  | Returns the ID associated to the token.                               |
| `error`            | <code>string &#124; null</code>       | Contains the error message if the tokenizer failed to load.           |
| `isGenerating`     | `boolean`                             | Indicates whether the tokenizer is currently running.                 |
| `isReady`          | `boolean`                             | Indicates whether the tokenizer has successfully loaded and is ready. |
| `downloadProgress` | `number`                              | Represents the download progress as a value between 0 and 1.          |

## Example

```typescript
import { useTokenizer, ALL_MINILM_L6_V2 } from 'react-native-executorch';

function App() {
  const tokenizer = useTokenizer(ALL_MINILM_L6_V2);

  // ...

  try {
    const text = 'Hello, world!';

    const vocabSize = await tokenizer.getVocabSize();
    console.log('Vocabulary size:', vocabSize);

    const tokens = await tokenizer.encode(text);
    console.log('Token IDs:', tokens);

    const decoded = await tokenizer.decode(tokens);
    console.log('Decoded text:', decoded);

    const tokenId = await tokenizer.tokenToId('hello');
    console.log('Token ID for "Hello":', tokenId);

    const token = await tokenizer.idToToken(tokenId);
    console.log('Token for ID:', token);
  } catch (error) {
    console.error(error);
  }

  // ...
}
```
