# useTextToImage

Text-to-image is a process of generating images directly from a description in natural language by conditioning a model on the provided text input. Our implementation follows the Stable Diffusion pipeline, which applies the diffusion process in a lower-dimensional latent space to reduce memory requirements. The pipeline combines a text encoder to preprocess the prompt, a U-Net that iteratively denoises latent representations, and a VAE decoder to reconstruct the final image. React Native ExecuTorch offers a dedicated hook, `useTextToImage`, for this task.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

It is recommended to use models provided by us which are available at our Hugging Face repository, you can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.

## Reference[​](#reference "Direct link to Reference")

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

### Arguments[​](#arguments "Direct link to Arguments")

**`model`** - Object containing the model source.

* **`schedulerSource`** - A string that specifies the location of the scheduler config.

* **`tokenizerSource`** - A string that specifies the location of the tokenizer config.

* **`encoderSource`** - A string that specifies the location of the text encoder binary.

* **`unetSource`** - A string that specifies the location of the U-Net binary.

* **`decoderSource`** - A string that specifies the location of the VAE decoder binary.

**`preventLoad?`** - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

### Returns[​](#returns "Direct link to Returns")

| Field              | Type                                                                                       | Description                                                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate`         | `(input: string, imageSize?: number, numSteps?: number, seed?: number) => Promise<string>` | Runs the model to generate an image described by `input`, and conditioned by `seed`, performing `numSteps` inference steps. The resulting image, with dimensions `imageSize`×`imageSize` pixels, is returned as a base64-encoded string. |
| `error`            | `string \| null`                                                                           | Contains the error message if the model failed to load.                                                                                                                                                                                  |
| `isGenerating`     | `boolean`                                                                                  | Indicates whether the model is currently processing an inference.                                                                                                                                                                        |
| `isReady`          | `boolean`                                                                                  | Indicates whether the model has successfully loaded and is ready for inference.                                                                                                                                                          |
| `downloadProgress` | `number`                                                                                   | Represents the download progress as a value between 0 and 1.                                                                                                                                                                             |
| `interrupt()`      | `() => void`                                                                               | Interrupts the current inference. The model is stopped in the nearest inference step.                                                                                                                                                    |

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the `forward` method. It accepts four arguments: a text prompt describing the requested image, a size of the image in pixels, a number of denoising steps, and an optional seed value, which enables reproducibility of the results.

The image size must be a multiple of 32 due to the architecture of the U-Net and VAE models. The seed should be a positive integer.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

Larger imageSize values require significantly more memory to run the model.

## Example[​](#example "Direct link to Example")

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

| ![Castle 256x256](/react-native-executorch/assets/images/castle256-f1bd9ddef581060ac70921b8a806ef5f.png) | ![Castle 512x512](/react-native-executorch/assets/images/castle512-ce3f6cb4d1c34ca0703d57c8e164add9.png) |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Image of size 256×256                                                                                    | Image of size 512×512                                                                                    |

## Supported models[​](#supported-models "Direct link to Supported models")

| Model                                                               | Parameters \[B] | Description                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [bk-sdm-tiny-vpred](https://huggingface.co/vivym/bk-sdm-tiny-vpred) | 0.5             | BK-SDM (Block-removed Knowledge-distilled Stable Diffusion Model) is a compressed version of Stable Diffusion v1.4 with several residual and attention blocks removed. The BK-SDM-Tiny is a v-prediction variant of the model, obtained through further block removal, built around a 0.33B-parameter U-Net. |

## Benchmarks[​](#benchmarks "Direct link to Benchmarks")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

The number following the underscore (\_) indicates that the model supports generating image with dimensions ranging from 128 pixels up to that value. This setting doesn’t affect the model’s file size - it only determines how memory is allocated at runtime, based on the maximum allowed image size.

### Model size[​](#model-size "Direct link to Model size")

| Model                     | Text encoder (XNNPACK) \[MB] | UNet (XNNPACK) \[MB] | VAE decoder (XNNPACK) \[MB] |
| ------------------------- | ---------------------------- | -------------------- | --------------------------- |
| BK\_SDM\_TINY\_VPRED\_256 | 492                          | 1290                 | 198                         |
| BK\_SDM\_TINY\_VPRED\_512 | 492                          | 1290                 | 198                         |

### Memory usage[​](#memory-usage "Direct link to Memory usage")

| Model                     | Android (XNNPACK) \[MB] | iOS (XNNPACK) \[MB] |
| ------------------------- | ----------------------- | ------------------- |
| BK\_SDM\_TINY\_VPRED\_256 | 2900                    | 2800                |
| BK\_SDM\_TINY\_VPRED\_512 | 6700                    | 6560                |

### Inference time[​](#inference-time "Direct link to Inference time")

| Model                     | iPhone 17 Pro (XNNPACK) \[ms] | iPhone 16 Pro (XNNPACK) \[ms] | iPhone SE 3 (XNNPACK) \[ms] | Samsung Galaxy S24 (XNNPACK) \[ms] | OnePlus 12 (XNNPACK) \[ms] |
| ------------------------- | ----------------------------- | ----------------------------- | --------------------------- | ---------------------------------- | -------------------------- |
| BK\_SDM\_TINY\_VPRED\_256 | 21184                         | 21021                         | ❌                          | 18834                              | 16617                      |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

Text-to-image benchmark times are measured generating 256×256 images in 10 inference steps.
