---
title: useStyleTransfer
sidebar_position: 3
---

Style transfer is a technique used in computer graphics and machine learning where the visual style of one image is applied to the content of another. This is achieved using algorithms that manipulate data from both images, typically with the aid of a neural network. The result is a new image that combines the artistic elements of one picture with the structural details of another, effectively merging art with traditional imagery. React Native ExecuTorch offers a dedicated hook `useStyleTransfer`, for this task. However before you start you'll need to obtain ExecuTorch-compatible model binary.

:::caution
It is recommended to use models provided by us which are available at our [Hugging Face repository](https://huggingface.co/software-mansion/react-native-executorch-style-transfer-candy), you can also use [constants](https://github.com/software-mansion/react-native-executorch/tree/main/src/constants/modelUrls.ts) shipped with our library
:::

## Reference

```typescript
import {
  useStyleTransfer,
  STYLE_TRANSFER_CANDY,
} from 'react-native-executorch';

const model = useStyleTransfer({
  modelSource: STYLE_TRANSFER_CANDY,
});

const imageUri = 'file::///Users/.../cute_cat.png';

try {
  const generatedImageUrl = await model.forward(imageUri);
} catch (error) {
  console.error(error);
}
```

### Arguments

**`modelSource`**
A string that specifies the location of the model binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) page.

### Returns

| Field          | Type                                 | Description                                                                                              |
| -------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `forward`      | `(input: string) => Promise<string>` | Executes the model's forward pass, where `input` can be a fetchable resource or a Base64-encoded string. |
| `error`        | <code>string &#124; null</code>      | Contains the error message if the model failed to load.                                                  |
| `isGenerating` | `boolean`                            | Indicates whether the model is currently processing an inference.                                        |
| `isReady`      | `boolean`                            | Indicates whether the model has successfully loaded and is ready for inference.                          |

## Running the model

To run the model, you can use `forward` method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The function returns a promise which can resolve either to an error or a URL to generated image.

:::info
Images from external sources and the generated image are stored in your application's temporary directory.
:::

## Example

```typescript
function App(){
  const model = useStyleTransfer(
      modelSource: STYLE_TRANSFER_CANDY,
  );

  ...
  const imageUri = 'file::///Users/.../cute_cat.png';

  try{
      const generatedImageUrl = await model.forward(imageUri)
  }catch(error){
      console.error(error)
  }
  ...
}
```

## Supported models

- [Candy](https://github.com/pytorch/examples/tree/main/fast_neural_style)
- [Mosaic](https://github.com/pytorch/examples/tree/main/fast_neural_style)
- [Udnie](https://github.com/pytorch/examples/tree/main/fast_neural_style)
- [Rain princess](https://github.com/pytorch/examples/tree/main/fast_neural_style)

## Benchmarks

### Model size

| Model                        | XNNPACK [MB] | Core ML [MB] |
| ---------------------------- | ------------ | ------------ |
| STYLE_TRANSFER_CANDY         | 6.78         | 5.22         |
| STYLE_TRANSFER_MOSAIC        | 6.78         | 5.22         |
| STYLE_TRANSFER_UDNIE         | 6.78         | 5.22         |
| STYLE_TRANSFER_RAIN_PRINCESS | 6.78         | 5.22         |

### Memory usage

| Model                        | Android (XNNPACK) [MB] | iOS (Core ML) [MB] |
| ---------------------------- | ---------------------- | ------------------ |
| STYLE_TRANSFER_CANDY         | 950                    | 350                |
| STYLE_TRANSFER_MOSAIC        | 950                    | 350                |
| STYLE_TRANSFER_UDNIE         | 950                    | 350                |
| STYLE_TRANSFER_RAIN_PRINCESS | 950                    | 350                |

### Inference time

:::warning warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

| Model                        | iPhone 16 Pro (Core ML) [ms] | iPhone 13 Pro (Core ML) [ms] | iPhone SE 3 (Core ML) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ---------------------------- | ---------------------------- | ---------------------------- | -------------------------- | --------------------------------- | ------------------------- |
| STYLE_TRANSFER_CANDY         | 450                          | 600                          | 750                        | 1650                              | 1800                      |
| STYLE_TRANSFER_MOSAIC        | 450                          | 600                          | 750                        | 1650                              | 1800                      |
| STYLE_TRANSFER_UDNIE         | 450                          | 600                          | 750                        | 1650                              | 1800                      |
| STYLE_TRANSFER_RAIN_PRINCESS | 450                          | 600                          | 750                        | 1650                              | 1800                      |
