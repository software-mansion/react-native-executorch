---
title: Computer Vision models usage (continued)
description: Reference for using Style Transfer, Text to Image, Image Embeddings.
---

# useStyleTransfer

**Purpose:** Apply artistic styles from one image to the content of another image.

**Use cases:** Photo editing, artistic filters, creative content generation, style transformation apps.

## Basic Usage

```typescript
import {
  useStyleTransfer,
  STYLE_TRANSFER_CANDY,
} from 'react-native-executorch';

const model = useStyleTransfer({ model: STYLE_TRANSFER_CANDY });

const imageUri = 'file:///Users/.../photo.png';

try {
  const generatedImageUrl = await model.forward(imageUri);
  console.log('Styled image:', generatedImageUrl);
} catch (error) {
  console.error(error);
}
```

## Available Models

**Model constants:**

- `STYLE_TRANSFER_CANDY` - Candy artistic style
- `STYLE_TRANSFER_MOSAIC` - Mosaic artistic style
- `STYLE_TRANSFER_UDNIE` - Udnie artistic style
- `STYLE_TRANSFER_RAIN_PRINCESS` - Rain princess artistic style

For the latest available models reference exported models in [HuggingFace Style Transfer collection](https://huggingface.co/collections/software-mansion/style-transfer)

## Troubleshooting

**Image storage:** Both input images from external sources and generated images are stored in the application's temporary directory.
**Processing time:** Style transfer can be computationally intensive. Expect processing to take several seconds depending on image size and device capabilities.

## Additional references

- [useStyleTransfer docs](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useStyleTransfer)
- [HuggingFace Style Transfer collection](https://huggingface.co/collections/software-mansion/style-transfer)
- [Available model constants](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---style-transfer)
- [useStyleTransfer API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useStyleTransfer)

---

# useTextToImage

**Purpose:** Generate images from text descriptions using on-device Stable Diffusion.

**Use cases:** AI art generation, creative content creation, concept visualization, design prototyping.

## Basic Usage

```typescript
import { useTextToImage, BK_SDM_TINY_VPRED_256 } from 'react-native-executorch';

const model = useTextToImage({ model: BK_SDM_TINY_VPRED_256 });

const input = 'a castle';

try {
  const image = await model.generate(input);
} catch (error) {
  console.error(error);
}
```

## Example Usage with Parameters

```tsx
import { useTextToImage, BK_SDM_TINY_VPRED_256 } from 'react-native-executorch';

function App() {
  const model = useTextToImage({ model: BK_SDM_TINY_VPRED_256 });

  //...
  const input = 'a medieval castle by the sea shore';

  const imageSize = 256;
  const numSteps = 25;

  try {
    image = await model.generate(input, imageSize, numSteps);
  } catch (error) {
    console.error(error);
  }
  //...

  return <Image source={{ uri: `data:image/png;base64,${image}` }} />;
}
```

**Model constants:** `BK_SDM_TINY_VPRED_256`

For the latest available models reference exported models in [HuggingFace Text to Image collection](https://huggingface.co/collections/software-mansion/text-to-image)

## Troubleshooting

**Memory requirements:** Larger image sizes require significantly more memory. Use 256x256 for lower-end devices, 512x512 for high-end devices.
**Image size constraint:** Image size must be a multiple of 32 (e.g., 256, 320, 384, 512) due to U-Net and VAE decoder architecture.
**Generation time:** Expect 20-60 seconds per image depending on device, image size, and number of steps.
**Prompt engineering:** More descriptive prompts yield better results. Include style descriptors like "digital art", "photorealistic", "watercolor" etc.

## Additional references

- [useTextToImage docs](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useTextToImage)
- [HuggingFace Text to Image collection](https://huggingface.co/collections/software-mansion/text-to-image)
- [Available model constants](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---image-generation)
- [useTextToImage API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextToImage)
- [Typescript API implementation of Text to Image](https://docs.swmansion.com/react-native-executorch/docs/typescript-api/computer-vision/TextToImageModule)

---

# useImageEmbeddings

**Purpose:** Convert images into numerical vectors for similarity comparison and image search.

**Use cases:** Image similarity search, duplicate detection, visual search, clustering, content-based retrieval.

## Basic Usage

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

## Computing Image Similarity

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

## Available Models

**Model constants:** `CLIP_VIT_BASE_PATCH32_IMAGE`

For the latest available models reference exported models in [HuggingFace Image Embeddings collection](https://huggingface.co/collections/software-mansion/image-embeddings)

## Troubleshooting

**Normalized vectors:** Returned embeddings are already normalized, so cosine similarity can be computed as a simple dot product.
**Image resizing:** Images are automatically resized to 224×224. Resizing large images can add processing time.

## Additional references

- [useImageEmbeddings docs](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useImageEmbeddings)
- [HuggingFace Image Embeddings collection](https://huggingface.co/collections/software-mansion/image-embeddings)
- [useImageEmbeddings API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useImageEmbeddings)
- [Typescript API implementation of useImageEmbeddings](https://docs.swmansion.com/react-native-executorch/docs/typescript-api/computer-vision/ImageEmbeddingsModule)
