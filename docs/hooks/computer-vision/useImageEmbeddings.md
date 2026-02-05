# useImageEmbeddings

Image Embedding is the process of converting an image into a numerical representation. This representation can be used for tasks, such as classification, clustering and (using contrastive learning like e.g. CLIP model) image search.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/image-embeddings-68d0eda599a9d37caaaf1ad0). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `useImageEmbeddings` see: [`useImageEmbeddings` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useImageEmbeddings).
* For all image embeddings models available out-of-the-box in React Native ExecuTorch see: [Image Embeddings Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---image-embeddings).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import {
  useImageEmbeddings,
  CLIP_VIT_BASE_PATCH32_IMAGE,
} from 'react-native-executorch';

const model = useImageEmbeddings({ model: CLIP_VIT_BASE_PATCH32_IMAGE });

try {
  const imageEmbedding = await model.forward('https://url-to-image.jpg');
} catch (error) {
  console.error(error);
}

```

### Arguments[​](#arguments "Direct link to Arguments")

`useImageEmbeddings` takes [`ImageEmbeddingsProps`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ImageEmbeddingsProps) that consists of:

* `model` containing [`modelSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ImageEmbeddingsProps#modelsource).
* An optional flag [`preventLoad`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ImageEmbeddingsProps#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:

* For detailed information about `useImageEmbeddings` arguments check this section: [`useImageEmbeddings` arguments](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useImageEmbeddings#parameters).
* For all image embeddings models available out-of-the-box in React Native ExecuTorch see: [Image Embeddings Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---image-embeddings).
* For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

### Returns[​](#returns "Direct link to Returns")

`useImageEmbeddings` returns an object called `ImageEmbeddingsType` containing bunch of functions to interact with image embeddings models. To get more details please read: [`ImageEmbeddingsType` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ImageEmbeddingsType).

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ImageEmbeddingsType#forward) method. It accepts one argument which is a URI/URL to an image you want to encode. The function returns a promise, which can resolve either to an error or an array of numbers representing the embedding.

## Example[​](#example "Direct link to Example")

```typescript
const dotProduct = (a: Float32Array, b: Float32Array) =>
  a.reduce((sum, val, i) => sum + val * b[i], 0);

const cosineSimilarity = (a: Float32Array, b: Float32Array) => {
  const dot = dotProduct(a, b);
  const normA = Math.sqrt(dotProduct(a, a));
  const normB = Math.sqrt(dotProduct(b, b));
  return dot / (normA * normB);
};

try {
  // we assume you've provided catImage and dogImage
  const catImageEmbedding = await model.forward(catImage);
  const dogImageEmbedding = await model.forward(dogImage);

  const similarity = cosineSimilarity(catImageEmbedding, dogImageEmbedding);

  console.log(`Cosine similarity: ${similarity}`);
} catch (error) {
  console.error(error);
}

```

## Supported models[​](#supported-models "Direct link to Supported models")

| Model                                                                                               | Language | Image size | Embedding dimensions | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------- | -------- | ---------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [clip-vit-base-patch32-image](https://huggingface.co/collections/software-mansion/image-embeddings) | English  | 224×224    | 512                  | CLIP (Contrastive Language-Image Pre-Training) is a neural network trained on a variety of (image, text) pairs. CLIP allows to embed images and text into the same vector space. This allows to find similar images as well as to implement image search. This is the image encoder part of the CLIP model. To embed text checkout [clip-vit-base-patch32-text](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useTextEmbeddings.md#supported-models). |

**`Image size`** - The size of an image that the model takes as an input. Resize will happen automatically.

**`Embedding Dimensions`** - The size of the output embedding vector. This is the number of dimensions in the vector representation of the input image.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

For the supported models, the returned embedding vector is normalized, meaning that its length is equal to 1. This allows for easier comparison of vectors using cosine similarity, just calculate the dot product of two vectors to get the cosine similarity score.
