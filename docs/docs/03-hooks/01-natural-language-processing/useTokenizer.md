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

## API Reference

* For detailed API Reference for `useTokenizer` see: [`useTokenizer` API Reference](../../06-api-reference/functions/useTokenizer.md).

## Reference

```typescript
import { useTokenizer, ALL_MINILM_L6_V2 } from 'react-native-executorch';

const tokenizer = useTokenizer({ tokenizer: ALL_MINILM_L6_V2 });

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

### Arguments

`useTokenizer` takes [`TokenizerProps`](../../06-api-reference/interfaces/TokenizerProps.md) that consists of:
* `tokenizer` of type [`KokoroConfig`](../../06-api-reference/interfaces/KokoroConfig.md) containing [`tokenizerSource`](../../06-api-reference/interfaces/TokenizerProps.md#tokenizersource). 
* An optional flag [`preventLoad`](../../06-api-reference/interfaces/TokenizerProps.md#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:
* For detailed information about `useTokenizer` arguments check this section: [`useTokenizer` arguments](../../06-api-reference/functions/useTokenizer.md#parameters).
* For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useTokenizer` returns an object called `TokenizerType` containing bunch of functions to interact with Tokenizers. To get more details please read: [`TokenizerType` API Reference](../../06-api-reference/interfaces/TokenizerType.md).

## Example

```typescript
import { useTokenizer, ALL_MINILM_L6_V2 } from 'react-native-executorch';

function App() {
  const tokenizer = useTokenizer({ tokenizer: ALL_MINILM_L6_V2 });

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
