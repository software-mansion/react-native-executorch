---
title: Text Embeddings and Tokenizer
description: Reference for using Text Embeddings and Tokenizer in React Native Executorch.
---

# useTextEmbeddings

**Purpose:** Convert text into numerical vectors for semantic search, similarity, and clustering.

**Use cases:** Semantic search, document similarity, text classification, clustering, RAG systems.

## Basic Usage

```typescript
import { useTextEmbeddings, ALL_MINILM_L6_V2 } from 'react-native-executorch';

const model = useTextEmbeddings({ model: ALL_MINILM_L6_V2 });

try {
  const embedding = await model.forward('Hello World!');
  console.log(embedding);
} catch (error) {
  console.error(error);
}
```

## Example (computing similarity)

```typescript
const dotProduct = (a: number[], b: number[]) =>
  a.reduce((sum, val, i) => sum + val * b[i], 0);

const cosineSimilarity = (a: number[], b: number[]) => {
  const dot = dotProduct(a, b);
  const normA = Math.sqrt(dotProduct(a, a));
  const normB = Math.sqrt(dotProduct(b, b));
  return dot / (normA * normB);
};

function App() {
  const model = useTextEmbeddings({ model: ALL_MINILM_L6_V2 });

  // ...

  try {
    const helloWorldEmbedding = await model.forward('Hello World!');
    const goodMorningEmbedding = await model.forward('Good Morning!');

    const similarity = cosineSimilarity(
      helloWorldEmbedding,
      goodMorningEmbedding
    );

    console.log(`Cosine similarity: ${similarity}`);
  } catch (error) {
    console.error(error);
  }

  // ...
}
```

## Available Models

| Model                      | Max Tokens | Dimensions | Use Case                 |
| -------------------------- | ---------- | ---------- | ------------------------ |
| all-MiniLM-L6-v2           | 254        | 384        | General purpose          |
| all-mpnet-base-v2          | 382        | 768        | Higher quality, slower   |
| multi-qa-MiniLM-L6-cos-v1  | 509        | 384        | Q&A / semantic search    |
| multi-qa-mpnet-base-dot-v1 | 510        | 768        | Q&A / semantic search    |
| clip-vit-base-patch32-text | 74         | 512        | Match with images (CLIP) |

**Model constants:** `ALL_MINILM_L6_V2`, `ALL_MPNET_BASE_V2`, `MULTI_QA_MINILM_L6_COS_V1`, `MULTI_QA_MPNET_BASE_DOT_V1`, `CLIP_VIT_BASE_PATCH32_TEXT`

**Max Tokens** - The maximum number of tokens that can be processed by the model. If the input text exceeds this limit, it will be truncated.

**Embedding Dimensions** - The size of the output embedding vector. This is the number of dimensions in the vector representation of the input text.

For the latest available models reference exported models in [HuggingFace Text Embeddings collection](https://huggingface.co/collections/software-mansion/text-embeddings)

## Troubleshooting

**Normalized vectors:** For the supported models, the returned embedding vector is normalized, meaning that its length is equal to 1. This allows for easier comparison of vectors using cosine similarity, just calculate the dot product of two vectors to get the cosine similarity score.
**Token limits:** Text exceeding max tokens will be truncated.

## Additional references

- [useTextEmbeddings docs](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useTextEmbeddings)
- [HuggingFace Text Embeddings collection](https://huggingface.co/collections/software-mansion/text-embeddings)
- [Available model constants](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---text-embeddings)
- [useTextEmbeddings API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextEmbeddings)
- [Typescript API implementation of useTextEmbeddings](https://docs.swmansion.com/react-native-executorch/docs/typescript-api/natural-language-processing/TextEmbeddingsModule)

---

# useTokenizer

**Purpose:** Convert text to tokens and vice versa (used internally by LLMs and embeddings).
**Use cases:** Token counting, understanding model limits, debugging, custom preprocessing.

## Basic Usage

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

## Example usage

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

## Troubleshooting

**Uses HuggingFace Tokenizers:** Full compatibility with HF ecosystem - we are using [Hugging Face Tokenizers](https://huggingface.co/docs/tokenizers/index) under the hood, ensuring compatibility with the Hugging Face ecosystem.

**Mostly internal:** You usually don't need this directly - LLM/embedding hooks handle it.

## Additional references

- [useTokenizer docs](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useTokenizer)
- [useTokenizer API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTokenizer)
- [HuggingFace Tokenizers documentation](https://huggingface.co/docs/tokenizers/index)
- [Typescript API implementation of useTokenizer](https://docs.swmansion.com/react-native-executorch/docs/typescript-api/natural-language-processing/TokenizerModule)
