---
title: ImageSegmentationModule
---

TypeScript API implementation of the [useImageSegmentation](../../03-hooks/02-computer-vision/useImageSegmentation.md) hook.

## API Reference

- For detailed API Reference for `ImageSegmentationModule` see: [`ImageSegmentationModule` API Reference](../../06-api-reference/classes/ImageSegmentationModule.md).
- For all image segmentation models available out-of-the-box in React Native ExecuTorch see: [Image Segmentation Models](../../06-api-reference/index.md#models---image-segmentation).

## High Level Overview

```typescript
import {
  ImageSegmentationModule,
  DEEPLAB_V3_RESNET50,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Creating an instance from a built-in model
const segmentation = await ImageSegmentationModule.fromModelName({
  modelName: 'deeplab-v3',
  modelSource: DEEPLAB_V3_RESNET50,
});

// Running the model
const result = await segmentation.forward(imageUri);
// result.ARGMAX — Int32Array of per-pixel class indices
```

### Methods

All methods of `ImageSegmentationModule` are explained in details here: [`ImageSegmentationModule` API Reference](../../06-api-reference/classes/ImageSegmentationModule.md)

## Loading the model

`ImageSegmentationModule` uses static factory methods instead of `new()` + `load()`. There are two ways to create an instance:

### Built-in models — `fromModelName`

Use [`fromModelName`](../../06-api-reference/classes/ImageSegmentationModule.md#frommodelname) for models that ship with built-in label maps and preprocessing configs:

```typescript
const segmentation = await ImageSegmentationModule.fromModelName(
  { modelName: 'deeplab-v3', modelSource: DEEPLAB_V3_RESNET50 },
  (progress) => console.log(`Download: ${Math.round(progress * 100)}%`)
);
```

The `config` parameter is a discriminated union — TypeScript ensures you provide the correct fields for each model name. Available built-in models: `'deeplab-v3'`, `'selfie-segmentation'`.

### Custom models — `fromCustomConfig`

Use [`fromCustomConfig`](../../06-api-reference/classes/ImageSegmentationModule.md#fromcustomconfig) for custom-exported segmentation models with your own label map:

```typescript
const MyLabels = { BACKGROUND: 0, FOREGROUND: 1 } as const;

const segmentation = await ImageSegmentationModule.fromCustomConfig(
  'https://example.com/custom_model.pte',
  {
    labelMap: MyLabels,
    preprocessorConfig: {
      normMean: [0.485, 0.456, 0.406],
      normStd: [0.229, 0.224, 0.225],
    },
  }
);
```

The `preprocessorConfig` is optional. If omitted, no input normalization is applied. The module instance will be typed to your custom label map — `forward` will accept and return keys from `MyLabels`.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, use the [`forward`](../../06-api-reference/classes/ImageSegmentationModule.md#forward) method. It accepts three arguments:

- [`imageSource`](../../06-api-reference/classes/ImageSegmentationModule.md#forward) (required) - The image to segment. Can be a remote URL, a local file URI, or a base64-encoded image (whole URI or only raw base64).
- [`classesOfInterest`](../../06-api-reference/classes/ImageSegmentationModule.md#forward) (optional) - An array of label keys indicating which per-class probability masks to include in the output. Defaults to `[]`. The `ARGMAX` map is always returned regardless.
- [`resizeToInput`](../../06-api-reference/classes/ImageSegmentationModule.md#forward) (optional) - Whether to resize the output masks to the original input image dimensions. Defaults to `true`. If `false`, returns the raw model output dimensions.

:::warning
Setting `resizeToInput` to `false` will make `forward` faster.
:::

`forward` returns a promise resolving to an object containing:

- `ARGMAX` - An `Int32Array` where each element is the class index with the highest probability for that pixel.
- For each label included in `classesOfInterest`, a `Float32Array` of per-pixel probabilities for that class.

The return type narrows based on the labels passed in `classesOfInterest`:

```typescript
// Only ARGMAX in the result
const result = await segmentation.forward(imageUri);
result.ARGMAX; // Int32Array

// ARGMAX + requested class masks
const result = await segmentation.forward(imageUri, ['CAT', 'DOG']);
result.ARGMAX; // Int32Array
result.CAT; // Float32Array
result.DOG; // Float32Array
```

## Managing memory

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](../../06-api-reference/classes/ImageSegmentationModule.md#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](../../06-api-reference/classes/ImageSegmentationModule.md#forward) after [`delete`](../../06-api-reference/classes/ImageSegmentationModule.md#delete) unless you create a new instance.
