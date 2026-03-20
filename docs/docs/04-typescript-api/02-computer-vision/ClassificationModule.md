---
title: ClassificationModule
---

TypeScript API implementation of the [useClassification](../../03-hooks/02-computer-vision/useClassification.md) hook.

## API Reference

- For detailed API Reference for `ClassificationModule` see: [`ClassificationModule` API Reference](../../06-api-reference/classes/ClassificationModule.md).
- For all classification models available out-of-the-box in React Native ExecuTorch see: [Classification Models](../../06-api-reference/index.md#models---classification).

## High Level Overview

```typescript
import {
  ClassificationModule,
  EFFICIENTNET_V2_S,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Creating and loading the module
const classificationModule =
  await ClassificationModule.fromModelName(EFFICIENTNET_V2_S);

// Running the model
const classesWithProbabilities = await classificationModule.forward(imageUri);
```

### Methods

All methods of `ClassificationModule` are explained in details here: [`ClassificationModule` API Reference](../../06-api-reference/classes/ClassificationModule.md)

## Loading the model

Use the static [`fromModelName`](../../06-api-reference/classes/ClassificationModule.md#frommodelname) factory method. It accepts a model config object (e.g. `EFFICIENTNET_V2_S`) and an optional `onDownloadProgress` callback. It returns a promise resolving to a `ClassificationModule` instance.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, use the [`forward`](../../06-api-reference/classes/ClassificationModule.md#forward) method. It accepts one argument — the image to classify. The image can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](../../06-api-reference/interfaces/PixelData.md) object (raw RGB pixel buffer). The method returns a promise resolving to an object mapping label keys to their probabilities.

For real-time frame processing, use [`runOnFrame`](../../03-hooks/02-computer-vision/visioncamera-integration.md) instead.

## Using a custom model

Use [`fromCustomModel`](../../06-api-reference/classes/ClassificationModule.md#fromcustommodel) to load your own exported model binary instead of a built-in preset.

```typescript
import { ClassificationModule } from 'react-native-executorch';

const MyLabels = { CAT: 0, DOG: 1, BIRD: 2 } as const;

const classifier = await ClassificationModule.fromCustomModel(
  'https://example.com/custom_classifier.pte',
  { labelMap: MyLabels },
  (progress) => console.log(progress)
);

const result = await classifier.forward(imageUri);
// result is typed as Record<'CAT' | 'DOG' | 'BIRD', number>
```

### Required model contract

The `.pte` binary must expose a single `forward` method with the following interface:

**Input:** one `float32` tensor of shape `[1, 3, H, W]` — a single RGB image, values in `[0, 1]` after optional per-channel normalization `(pixel − mean) / std`. H and W are read from the model's declared input shape at load time.

**Output:** one `float32` tensor of shape `[1, C]` containing raw logits — one value per class, in the same order as the entries in your `labelMap`. Softmax is applied by the native runtime.

Preprocessing (resize → normalize) is handled by the native runtime — your model only needs to produce the raw logits.

## Managing memory

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](../../06-api-reference/classes/ClassificationModule.md#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](../../06-api-reference/classes/ClassificationModule.md#forward) after [`delete`](../../06-api-reference/classes/ClassificationModule.md#delete) unless you load the module again.
