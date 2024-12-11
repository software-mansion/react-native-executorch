---
title: useStyleTransfer
sidebar_position: 1
---

Style transfer is a technique used in computer graphics and machine learning where the visual style of one image is applied to the content of another. This is achieved using algorithms that manipulate data from both images, typically with the aid of a neural network. The result is a new image that combines the artistic elements of one picture with the structural details of another, effectively merging art with traditional imagery. React Native ExecuTorch offers a dedicated hook for this task, but before you will get started you have to obtain ExecuTorch compatible model binary.

- It's best to use models provided with our library, you can get them from our [hugging face repository](https://huggingface.co/software-mansion), you can also use [constants](https://github.com/software-mansion/react-native-executorch/tree/main/src/constants/modelUrls.ts) shipped with our library
- If you want to export model by yourself make sure to check official [ExecuTorch documentation](https://pytorch.org/executorch/stable/index.html)

## Initializing

To load a model into the application you have to run required code:

```typescript
import {
  useStyleTransfer,
  STYLE_TRANSFER_CANDY,
} from 'react-native-executorch';

const model = useStyleTransfer({
  modelSource: STYLE_TRANSFER_CANDY,
});
```

The provided code snippet fetches the model from the [specified source](../fundamentals/loading-models.md), loads it into memory and returns an object with various methods and properties enabling you to controll lifecycle of the model.

### Arguments

**`modelSource`** - A string that specifies the location of the model binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) page.

### Returns

| Field               | Type                                 | Description                                                                                        |
| ------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `forward`           | `(input: string) => Promise<string>` | Function to run forward method of the model, input can be any fetchable resource or base64 string. |
| `error`             | <code>string &#124; null</code>      | Contains the error message if the model failed to load.                                            |
| `isModelGenerating` | `boolean`                            | Indicates whether the model is currently performing style transfer.                                |
| `isModelReady`      | `boolean`                            | Indicates whether the model is ready.                                                              |

### Using forward function

In order to perform style transfer, you should use following code:

```typescript
const model = useStyleTransfer(
    modelSource: STYLE_TRANSFER_CANDY,
);

...
const imageUri = 'file::///Users/.../cute_cat.png';
try{
    const generatedImageUri = await model.forward(imageUri)
}catch(error){
    console.error(error)
}
...
```

The forward function returns promise which resolves either to error or a URI to newly created image.
:::info[Info]
Images from external sources and the generated image are stored in your application's temporary directory.
:::
