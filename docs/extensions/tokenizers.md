# Tokenizers

Tokenizers translate human-readable natural language text into numeric token ID arrays (and decode token ID sequences back into text).

The library embeds PyTorch's native C++ tokenizer engine, providing high-performance Hugging Face `tokenizer.json` compatibility directly on-device without Python or Rust runtimes. It supports Byte-Pair Encoding (BPE), WordPiece, Unigram, and Byte-level tokenizers with full support for normalizers, pre-tokenizers, truncation, padding, and post-processors (such as adding special `[CLS]` and `[SEP]` tokens automatically).

## Native Tokenizer (loadTokenizer)[​](#native-tokenizer-loadtokenizer "Direct link to Native Tokenizer (loadTokenizer)")

The core tokenizer primitive is [`nlp.loadTokenizer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/functions/loadTokenizer). It synchronously loads a local `tokenizer.json` file into a native C++ JSI host object ([`Tokenizer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/type-aliases/Tokenizer)) that can be called directly on the JavaScript thread or inside [Worklet runtimes](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) with zero serialization overhead:

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

## Tokenizer Operations[​](#tokenizer-operations "Direct link to Tokenizer Operations")

The [`Tokenizer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/type-aliases/Tokenizer) interface provides the following synchronous methods:

### 1. encode(text)[​](#1-encodetext "Direct link to 1. encode(text)")

Converts a string into an [`Int32Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int32Array) of token IDs. Special tokens are automatically appended/prepended according to the `tokenizer.json` post-processor configuration (e.g. `[CLS]` and `[SEP]` for BERT/WordPiece):

```typescript
const ids: Int32Array = tokenizer.encode('ExecuTorch on React Native');
// e.g. Int32Array([101, 10769, 2178, 2006, 2690, 3110, 102])

```

### 2. decode(tokens, skipSpecialTokens?)[​](#2-decodetokens-skipspecialtokens "Direct link to 2. decode(tokens, skipSpecialTokens?)")

Decodes an [`Int32Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int32Array) of token IDs back into a reconstructed UTF-8 string. The optional [`skipSpecialTokens`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/type-aliases/Tokenizer#decode) boolean parameter defaults to `true`:

```typescript
const cleanText = tokenizer.decode(ids); // "ExecuTorch on React Native"
const rawText = tokenizer.decode(ids, false); // "[CLS] ExecuTorch on React Native [SEP]"

```

### 3. Vocabulary & Piece Inspection[​](#3-vocabulary--piece-inspection "Direct link to 3. Vocabulary & Piece Inspection")

Translate between individual subword pieces, numeric token IDs, and query total vocabulary size:

```typescript
// Total number of tokens in the vocabulary
const vocabSize = tokenizer.getVocabSize(); // e.g. 30522

// Convert token ID -> piece string
const piece = tokenizer.idToToken(101); // "[CLS]"

// Convert piece string -> token ID
const id = tokenizer.tokenToId('[SEP]'); // 102

```

## Imperative Task Pipeline[​](#imperative-task-pipeline "Direct link to Imperative Task Pipeline")

If you want an asynchronous, Promise-based wrapper around [`nlp.loadTokenizer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/functions/loadTokenizer) that dispatches execution to a background worklet thread, use [`createTokenizer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createTokenizer):

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

## React Hook[​](#react-hook "Direct link to React Hook")

If you are using tokenizers directly inside a React component, [`useTokenizer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTokenizer) downloads remote `tokenizer.json` files, tracks loading progress, and automatically cleans up native memory on unmount:

```tsx
import { models, useTokenizer } from 'react-native-executorch';

const tokenizer = useTokenizer(models.tokenizer.ALL_MINILM_L6_V2);

// Use when ready:
// const ids = await tokenizer.encode('Text');

```

## Using Custom Tokenizers[​](#using-custom-tokenizers "Direct link to Using Custom Tokenizers")

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

## API Reference[​](#api-reference "Direct link to API Reference")

### Primitives & Loaders[​](#primitives--loaders "Direct link to Primitives & Loaders")

* [`nlp.loadTokenizer()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/functions/loadTokenizer) — Synchronous native JSI tokenizer loader.
* [`createTokenizer()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createTokenizer) — Imperative asynchronous factory for tokenizers.
* [`useTokenizer()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTokenizer) — React hook for tokenizer downloading, loading, and lifecycle.

### Types[​](#types "Direct link to Types")

* [`Tokenizer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/type-aliases/Tokenizer) — Native tokenizer host object interface ([`encode`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/type-aliases/Tokenizer#encode), [`decode`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/type-aliases/Tokenizer#decode), [`getVocabSize`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/type-aliases/Tokenizer#getvocabsize), [`idToToken`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/type-aliases/Tokenizer#idtotoken), [`tokenToId`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/nlp/type-aliases/Tokenizer#tokentoid), `dispose`).

### Model Presets[​](#model-presets "Direct link to Model Presets")

* [`models.tokenizer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#tokenizer) — Pre-configured tokenizer presets.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/nlp/tasks/tokenization.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/extensions/nlp/tasks/tokenization.ts)
