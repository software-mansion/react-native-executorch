# useTextEmbeddings

Text Embedding is the process of converting text into a numerical representation. This representation can be used for various natural language processing tasks, such as semantic search, text classification, and clustering.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/text-embeddings-68d0ed42f8ca0200d0283362). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `useTextEmbeddings` see: [`useTextEmbeddings` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextEmbeddings).
* For all text embeddings models available out-of-the-box in React Native ExecuTorch see: [Text Embeddings Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---text-embeddings).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import { useTextEmbeddings, ALL_MINILM_L6_V2 } from 'react-native-executorch';

const model = useTextEmbeddings({ model: ALL_MINILM_L6_V2 });

try {
  const embedding = await model.forward('Hello World!');
} catch (error) {
  console.error(error);
}

```

### Arguments[​](#arguments "Direct link to Arguments")

`useTextEmbeddings` takes [`TextEmbeddingsProps`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextEmbeddingsProps) that consists of:

* `model` of type `object` containing the [model source](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextEmbeddingsProps#modelsource) and [tokenizer source](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextEmbeddingsProps#tokenizersource).
* An optional flag [`preventLoad`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextEmbeddingsProps#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:

* For detailed information about `useTextEmbeddings` arguments check this section: [`useTextEmbeddings` arguments](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextEmbeddings#parameters).
* For all text embeddings models available out-of-the-box in React Native ExecuTorch see: [Text Embeddings Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---text-embeddings).
* For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

### Returns[​](#returns "Direct link to Returns")

`useTextEmbeddings` returns an object called `TextEmbeddingsType` containing bunch of functions to interact with text embedding. To get more details please read: [`TextEmbeddingsType` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextEmbeddingsType).

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TextEmbeddingsType#forward) method. It accepts one argument, which is a string representing the text you want to embed. The function returns a promise, which can resolve either to an error or an array of numbers representing the embedding.

## Example[​](#example "Direct link to Example")

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

## Supported models[​](#supported-models "Direct link to Supported models")

| Model                                                                                                 | Language | Max Tokens | Embedding Dimensions | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------- | -------- | ---------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)                     | English  | 254        | 384                  | All-round model tuned for many use-cases. Trained on a large and diverse dataset of over 1 billion training pairs.                                                                                                                                                                                                                                                                                                                                                                       |
| [all-mpnet-base-v2](https://huggingface.co/sentence-transformers/all-mpnet-base-v2)                   | English  | 382        | 768                  | All-round model tuned for many use-cases. Trained on a large and diverse dataset of over 1 billion training pairs.                                                                                                                                                                                                                                                                                                                                                                       |
| [multi-qa-MiniLM-L6-cos-v1](https://huggingface.co/sentence-transformers/multi-qa-MiniLM-L6-cos-v1)   | English  | 509        | 384                  | This model was tuned for semantic search: Given a query/question, it can find relevant passages. It was trained on a large and diverse set of (question, answer) pairs.                                                                                                                                                                                                                                                                                                                  |
| [multi-qa-mpnet-base-dot-v1](https://huggingface.co/sentence-transformers/multi-qa-mpnet-base-dot-v1) | English  | 510        | 768                  | This model was tuned for semantic search: Given a query/question, it can find relevant passages. It was trained on a large and diverse set of (question, answer) pairs.                                                                                                                                                                                                                                                                                                                  |
| [clip-vit-base-patch32-text](https://huggingface.co/openai/clip-vit-base-patch32)                     | English  | 74         | 512                  | CLIP (Contrastive Language-Image Pre-Training) is a neural network trained on a variety of (image, text) pairs. CLIP allows to embed images and text into the same vector space. This allows to find similar images as well as to implement image search. This is the text encoder part of the CLIP model. To embed images checkout [clip-vit-base-patch32-image](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useImageEmbeddings.md#supported-models). |

**`Max Tokens`** - The maximum number of tokens that can be processed by the model. If the input text exceeds this limit, it will be truncated.

**`Embedding Dimensions`** - The size of the output embedding vector. This is the number of dimensions in the vector representation of the input text.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

For the supported models, the returned embedding vector is normalized, meaning that its length is equal to 1. This allows for easier comparison of vectors using cosine similarity, just calculate the dot product of two vectors to get the cosine similarity score.
