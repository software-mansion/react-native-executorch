---
title: ImageSegmentationModule
---

TypeScript API implementation of the [useImageSegmentation](../../02-hooks/02-computer-vision/useImageSegmentation.md) hook.

## Reference

```typescript
import {
  ImageSegmentationModule,
  DEEPLAB_V3_RESNET50,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

const module = new ImageSegmentationModule();

// Loading the model
await module.load(DEEPLAB_V3_RESNET50);

// Running the model
const outputDict = await module.forward(imageUri);
```

### Methods

| Method    | Type                                                                                                                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `load`    | `(model: { modelSource: ResourceSource }, onDownloadProgressCallback?: (progress: number) => void): Promise<void>`     | Loads the model, where `modelSource` is a string that specifies the location of the model binary. To track the download progress, supply a callback function `onDownloadProgressCallback`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `forward` | `(input: string, classesOfInterest?: DeeplabLabel[], resize?: boolean) => Promise<{[key in DeeplabLabel]?: number[]}>` | Executes the model's forward pass, where : <br/> \* `input` can be a fetchable resource or a Base64-encoded string. <br/> \* `classesOfInterest` is an optional list of `DeeplabLabel` used to indicate additional arrays of probabilities to output (see section "Running the model"). The default is an empty list. <br/> \* `resize` is an optional boolean to indicate whether the output should be resized to the original image dimensions, or left in the size of the model (see section "Running the model"). The default is `false`. <br/> <br/> The return is a dictionary containing: <br/> \* for the key `DeeplabLabel.ARGMAX` an array of integers corresponding to the most probable class for each pixel <br/> \* an array of floats for each class from `classesOfInterest` corresponding to the probabilities for this class. |
| `delete`  | `(): void`                                                                                                             | Release the memory held by the module. Calling `forward` afterwards is invalid.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

<details>
<summary>Type definitions</summary>

```typescript
type ResourceSource = string | number | object;
```

</details>

## Loading the model

To load the model, create a new instance of the module and use the `load` method on it. It accepts an object:

**`model`** - Object containing the model source.

- **`modelSource`** - A string that specifies the location of the model binary.

For more information, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page. This method returns a promise, which can resolve to an error or void.

## Running the model

To run the model, you can use the `forward` method on the module object. It accepts three arguments: a required image, an optional list of classes, and an optional flag whether to resize the output to the original dimensions.

- The image can be a remote URL, a local file URI, or a base64-encoded image.
- The `classesOfInterest` list contains classes for which to output the full results. By default the list is empty, and only the most probable classes are returned (essentially an arg max for each pixel). Look at `DeeplabLabel` enum for possible classes.
- The `resize` flag says whether the output will be rescaled back to the size of the image you put in. The default is `false`. The model runs inference on a scaled (probably smaller) version of your image (224x224 for the `DEEPLAB_V3_RESNET50`). If you choose to resize, the output will be `number[]` of size `width * height` of your original image.

:::caution
Setting `resize` to true will make `forward` slower.
:::

`forward` returns a promise which can resolve either to an error or a dictionary containing number arrays with size depending on `resize`:

- For the key `DeeplabLabel.ARGMAX` the array contains for each pixel an integer corresponding to the class with the highest probability.
- For every other key from `DeeplabLabel`, if the label was included in `classesOfInterest` the dictionary will contain an array of floats corresponding to the probability of this class for every pixel.

## Managing memory

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method `delete()` on the module object you will no longer use, and want to remove from the memory. Note that you cannot use `forward` after `delete` unless you load the module again.
