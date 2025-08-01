---
title: useTextEmbeddings
keywords:
  [
    text embedding,
    text embeddings,
    embeddings,
    react native,
    executorch,
    ai,
    machine learning,
    on-device,
    mobile ai,
  ]
description: "Learn how to use text embeddings models in your React Native applications with React Native ExecuTorch's useTextEmbeddings hook."
---

Text Embedding is the process of converting text into a numerical representation. This representation can be used for various natural language processing tasks, such as semantic search, text classification, and clustering.

:::caution
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## Reference

```typescript
import { useTextEmbeddings, ALL_MINILM_L6_V2 } from 'react-native-executorch';

const model = useTextEmbeddings({ model: ALL_MINILM_L6_V2 });

try {
  const embedding = await model.forward('Hello World!');
} catch (error) {
  console.error(error);
}
```

### Arguments

**`model`** - Object containing the model source and tokenizer source.

- **`modelSource`** - A string that specifies the location of the model binary.

- **`tokenizerSource`** - A string that specifies the location of the tokenizer JSON file.

**`preventLoad?`** - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

| Field              | Type                                   | Description                                                                       |
| ------------------ | -------------------------------------- | --------------------------------------------------------------------------------- |
| `forward`          | `(input: string) => Promise<number[]>` | Executes the model's forward pass, where `input` is a text that will be embedded. |
| `error`            | <code>string &#124; null</code>        | Contains the error message if the model failed to load.                           |
| `isGenerating`     | `boolean`                              | Indicates whether the model is currently processing an inference.                 |
| `isReady`          | `boolean`                              | Indicates whether the model has successfully loaded and is ready for inference.   |
| `downloadProgress` | `number`                               | Represents the download progress as a value between 0 and 1.                      |

## Running the model

To run the model, you can use the `forward` method. It accepts one argument, which is a string representing the text you want to embed. The function returns a promise, which can resolve either to an error or an array of numbers representing the embedding.

## Example

```typescript
import { useTextEmbeddings, ALL_MINILM_L6_V2 } from 'react-native-executorch';

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

## Supported models

| Model                                                                                                 | Language | Max Tokens | Embedding Dimensions | Description                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------- | :------: | :--------: | :------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)                     | English  |    254     |         384          | All-round model tuned for many use-cases. Trained on a large and diverse dataset of over 1 billion training pairs.                                                                                                                                                                                                                                                                                                               |
| [all-mpnet-base-v2](https://huggingface.co/sentence-transformers/all-mpnet-base-v2)                   | English  |    382     |         768          | All-round model tuned for many use-cases. Trained on a large and diverse dataset of over 1 billion training pairs.                                                                                                                                                                                                                                                                                                               |
| [multi-qa-MiniLM-L6-cos-v1](https://huggingface.co/sentence-transformers/multi-qa-MiniLM-L6-cos-v1)   | English  |    509     |         384          | This model was tuned for semantic search: Given a query/question, it can find relevant passages. It was trained on a large and diverse set of (question, answer) pairs.                                                                                                                                                                                                                                                          |
| [multi-qa-mpnet-base-dot-v1](https://huggingface.co/sentence-transformers/multi-qa-mpnet-base-dot-v1) | English  |    510     |         768          | This model was tuned for semantic search: Given a query/question, it can find relevant passages. It was trained on a large and diverse set of (question, answer) pairs.                                                                                                                                                                                                                                                          |
| [clip-vit-base-patch32-text](https://huggingface.co/openai/clip-vit-base-patch32)                     | English  |     74     |         512          | CLIP (Contrastive Language-Image Pre-Training) is a neural network trained on a variety of (image, text) pairs. CLIP allows to embed images and text into the same vector space. This allows to find similar images as well as to implement image search. This is the text encoder part of the CLIP model. To embed images checkout [clip-vit-base-patch32-image](../02-computer-vision/useImageEmbeddings.md#supported-models). |

**`Max Tokens`** - the maximum number of tokens that can be processed by the model. If the input text exceeds this limit, it will be truncated.

**`Embedding Dimensions`** - the size of the output embedding vector. This is the number of dimensions in the vector representation of the input text.

:::info
For the supported models, the returned embedding vector is normalized, meaning that its length is equal to 1. This allows for easier comparison of vectors using cosine similarity, just calculate the dot product of two vectors to get the cosine similarity score.
:::

## Benchmarks

### Model size

| Model                      | XNNPACK [MB] |
| -------------------------- | :----------: |
| ALL_MINILM_L6_V2           |      91      |
| ALL_MPNET_BASE_V2          |     438      |
| MULTI_QA_MINILM_L6_COS_V1  |      91      |
| MULTI_QA_MPNET_BASE_DOT_V1 |     438      |
| CLIP_VIT_BASE_PATCH32_TEXT |     254      |

### Memory usage

| Model                      | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| -------------------------- | :--------------------: | :----------------: |
| ALL_MINILM_L6_V2           |           85           |        100         |
| ALL_MPNET_BASE_V2          |          390           |        465         |
| MULTI_QA_MINILM_L6_COS_V1  |          115           |        130         |
| MULTI_QA_MPNET_BASE_DOT_V1 |          415           |        490         |
| CLIP_VIT_BASE_PATCH32_TEXT |          195           |        250         |

### Inference time

:::warning warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

| Model                      | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro Max (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) | OnePlus 12 (XNNPACK) [ms] |
| -------------------------- | :--------------------------: | :------------------------------: | :------------------------: | :--------------------------: | :-----------------------: |
| ALL_MINILM_L6_V2           |              15              |                22                |             23             |              36              |            31             |
| ALL_MPNET_BASE_V2          |              71              |                96                |            101             |             112              |            105            |
| MULTI_QA_MINILM_L6_COS_V1  |              15              |                22                |             23             |              36              |            31             |
| MULTI_QA_MPNET_BASE_DOT_V1 |              71              |                95                |            100             |             112              |            105            |
| CLIP_VIT_BASE_PATCH32_TEXT |              31              |                47                |             48             |              55              |            49             |

:::info
Benchmark times for text embeddings are highly dependent on the sentence length. The numbers above are based on a sentence of around 80 tokens. For shorter or longer sentences, inference time may vary accordingly.
:::
