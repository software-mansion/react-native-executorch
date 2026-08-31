---
title: Tokenizers
slug: /extensions/tokenizers
description: 'Fast, native on-device Hugging Face tokenizer bindings for BPE, WordPiece, Unigram, and Byte-level text tokenization in React Native.'
keywords:
  [
    react native,
    tokenizer,
    tokenization,
    hugging face,
    bpe,
    wordpiece,
    byte-level,
    encode,
    decode,
    mobile ml,
    on-device ai,
  ]
---

# Tokenizers

Tokenizers translate human-readable natural language text into numeric token ID arrays (and decode token ID sequences back into text).

The library embeds a fast, native C++ Hugging Face tokenizer engine that directly loads standard `tokenizer.json` files. It supports Byte-Pair Encoding (BPE), WordPiece, Unigram, and Byte-level tokenizers with full support for normalizers, pre-tokenizers, truncation, padding, and post-processors (such as adding special `[CLS]` and `[SEP]` tokens automatically).

<!-- GIF DEMO PLACEHOLDER: Place tokenizer demo gif here, e.g. ![Tokenizer Demo](./media/tokenizers.gif) -->

## Native Tokenizer (`loadTokenizer`)

The core tokenizer primitive is [`nlp.loadTokenizer`](../../06-api-reference/react-native-executorch/namespaces/nlp/functions/loadTokenizer.md). It synchronously loads a local `tokenizer.json` file into a native C++ JSI host object ([`Tokenizer`](../../06-api-reference/react-native-executorch/namespaces/nlp/type-aliases/Tokenizer.md)) that can be called directly on the JavaScript thread or inside [Worklet runtimes](../../03-core-and-advanced/06-worklets-and-threading.md) with zero serialization overhead:

```typescript
import { nlp } from 'react-native-executorch';

// Synchronously load native tokenizer from a local file path
const tokenizer = nlp.loadTokenizer(localFilePath);

try {
  // 1. Encode text to an Int32Array of token IDs
  const tokenIds: Int32Array = tokenizer.encode('ExecuTorch on React Native');
  console.log('Encoded tokens:', tokenIds);

  // 2. Decode token IDs back to a UTF-8 string
  const text: string = tokenizer.decode(tokenIds);
  console.log('Decoded text:', text);
} finally {
  // Always release native tokenizer resources when finished
  tokenizer.dispose();
}
```

## Tokenizer Operations

The [`Tokenizer`](../../06-api-reference/react-native-executorch/namespaces/nlp/type-aliases/Tokenizer.md) interface provides the following synchronous methods:

### 1. `encode(text)`

Converts a string into an `Int32Array` of token IDs. Special tokens are automatically appended/prepended according to the `tokenizer.json` post-processor configuration (e.g. `[CLS]` and `[SEP]` for BERT/WordPiece):

```typescript
const ids: Int32Array = tokenizer.encode('ExecuTorch on React Native');
// e.g. Int32Array([101, 10769, 2178, 2006, 2690, 3110, 102])
```

### 2. `decode(tokens, skipSpecialTokens?)`

Decodes an `Int32Array` of token IDs back into a reconstructed UTF-8 string. The optional `skipSpecialTokens` boolean parameter defaults to `true`:

```typescript
const cleanText = tokenizer.decode(ids); // "ExecuTorch on React Native"
const rawText = tokenizer.decode(ids, false); // "[CLS] ExecuTorch on React Native [SEP]"
```

### 3. Vocabulary & Piece Inspection

Translate between individual subword pieces, numeric token IDs, and query total vocabulary size:

```typescript
// Total number of tokens in the vocabulary
const vocabSize = tokenizer.getVocabSize(); // e.g. 30522

// Convert token ID -> piece string
const piece = tokenizer.idToToken(101); // "[CLS]"

// Convert piece string -> token ID
const id = tokenizer.tokenToId('[SEP]'); // 102
```

## Imperative Task Pipeline (`createTokenizer`)

If you want an asynchronous, Promise-based wrapper around `loadTokenizer` that dispatches execution to a background worklet thread, use [`createTokenizer`](../../06-api-reference/functions/createTokenizer.md):

```typescript
import { createTokenizer, download, models } from 'react-native-executorch';

// Download and cache tokenizer.json before creating the pipeline
const tokenizerConfig = await download(models.tokenizer.ALL_MINILM_L6_V2);
const tokenizer = await createTokenizer(tokenizerConfig);

try {
  const ids = await tokenizer.encode('On-device tokenization with background execution');
  console.log('Token IDs:', ids);
} finally {
  tokenizer.dispose();
}
```

## React Hook (`useTokenizer`)

If you are using tokenizers directly inside a React component, [`useTokenizer`](../../06-api-reference/functions/useTokenizer.md) downloads remote `tokenizer.json` files, tracks loading progress, and automatically cleans up native memory on unmount:

```tsx
import { models, useTokenizer } from 'react-native-executorch';

const tokenizer = useTokenizer(models.tokenizer.ALL_MINILM_L6_V2);

// Use when ready:
// const ids = await tokenizer.encode('Text');
```

## Using Custom Tokenizers

You can load any standard Hugging Face `tokenizer.json` file (exported via Hugging Face `tokenizers` library or downloaded directly from Hugging Face Hub):

```typescript
// Via React hook with remote URL
const tokenizer = useTokenizer(
  'https://huggingface.co/my-org/my-model/resolve/main/tokenizer.json'
);

// Or locally via native loader
const nativeTokenizer = nlp.loadTokenizer('/path/to/local/tokenizer.json');
```

The native tokenizer automatically handles the model type, vocabulary tables, regex pre-tokenizers, merges, and post-processor rules defined in the JSON file.

## API Reference

### Primitives & Loaders

- [`nlp.loadTokenizer()`](../../06-api-reference/react-native-executorch/namespaces/nlp/functions/loadTokenizer.md) — Synchronous native JSI tokenizer loader.
- [`createTokenizer()`](../../06-api-reference/functions/createTokenizer.md) — Imperative asynchronous factory for tokenizers.
- [`useTokenizer()`](../../06-api-reference/functions/useTokenizer.md) — React hook for tokenizer downloading, loading, and lifecycle.

### Types

- [`Tokenizer`](../../06-api-reference/react-native-executorch/namespaces/nlp/type-aliases/Tokenizer.md) — Native tokenizer host object interface (`encode`, `decode`, `getVocabSize`, `idToToken`, `tokenToId`, `dispose`).

### Model Presets

- [`models.tokenizer`](../../06-api-reference/variables/models.md#tokenizer) — Pre-configured tokenizer presets.
