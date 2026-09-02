---
title: Image Classification
slug: /extensions/image-classification
description: 'Classify images on-device into categories using pre-trained computer vision models like EfficientNetV2.'
keywords:
  [
    react native,
    image classification,
    image recognition,
    mobile ml,
    on-device ai,
    efficientnet,
    imagenet,
  ]
---

# Image Classification

Image classification analyzes an input image and predicts the most likely visual
categories it belongs to, along with confidence scores for each prediction.
Unlike object detection (which locates multiple items with bounding boxes),
classification evaluates the image as a whole.

It is ideal for visual search, photo organization, quality inspection, and
accessibility tagging. Because inference runs entirely on-device, images never
leave the user's phone.

<!-- GIF DEMO PLACEHOLDER: Place image classification demo gif here, e.g. ![Image Classification Demo](./media/image-classification.gif) -->

## Quick Start

The [`useClassifier`](../../06-api-reference/functions/useClassifier.md) hook handles model downloading, initialization, and lifecycle management:

```tsx
import { models, useClassifier } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const classifier = useClassifier(models.classification.EFFICIENTNET_V2_S.DEFAULT);

  // Hook state:
  // classifier.isReady          — true once model is downloaded and loaded in memory
  // classifier.downloadProgress — 0.0 to 1.0 download progress
  // classifier.error            — Error instance if download or load failed

  const handleClassify = async (imageBuffer: ImageBuffer) => {
    if (!classifier.isReady || !classifier.classify) return;

    // Run inference on background thread
    const predictions = await classifier.classify(imageBuffer, { topk: 3 });
    console.log('Top prediction:', predictions[0]);
  };

  // Trigger handleClassify from an image picker, button press, or camera frame
}
```

:::tip Full Interactive Example in Gallery App
See [`src/app/(screens)/image-classification.tsx`](<https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/(screens)/image-classification.tsx>) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen with photo picker, result overlays, and latency tracking.
:::

## Output Format

[`classify()`](../../06-api-reference/type-aliases/Classifier.md#classify) returns an array of [`Classification`](../../06-api-reference/type-aliases/Classification.md) objects sorted from highest to lowest confidence:

```typescript
type Classification<L = string> = {
  /** The predicted class label string */
  readonly label: L;
  /** Normalized confidence score between 0.0 and 1.0 */
  readonly confidence: number;
};
```

Example result:

```json
[
  { "label": "golden_retriever", "confidence": 0.912 },
  { "label": "cocker_spaniel", "confidence": 0.043 },
  { "label": "labrador_retriever", "confidence": 0.018 }
]
```

## Configuration & Options

Pass a [`ClassifyOptions`](../../06-api-reference/type-aliases/ClassifyOptions.md) object to [`classify()`](../../06-api-reference/type-aliases/Classifier.md#classify):

| Option                                                                | Type     | Default     | Description                                                                                               |
| :-------------------------------------------------------------------- | :------- | :---------- | :-------------------------------------------------------------------------------------------------------- |
| [`topk`](../../06-api-reference/type-aliases/ClassifyOptions.md#topk) | `number` | `undefined` | Maximum number of top-scoring predictions to return. When omitted, returns all classes in the vocabulary. |

## Imperative API

For background jobs, headless services, or manual lifecycle management outside React components, instantiate the pipeline directly with [`createClassifier`](../../06-api-reference/functions/createClassifier.md):

```typescript
import { createClassifier, download, models } from 'react-native-executorch';

// Download and cache model assets before creating the pipeline
const model = await download(models.classification.EFFICIENTNET_V2_S.DEFAULT);
const classifier = await createClassifier(model);

try {
  const results = await classifier.classify(imageBuffer, { topk: 5 });
  console.log('Top prediction:', results[0]);
} finally {
  // Always release native resources when finished
  classifier.dispose();
}
```

## Synchronous Execution

For high-throughput loops like camera frame processors, [`createClassifier`](../../06-api-reference/functions/createClassifier.md)
exposes a synchronous [`classifyWorklet`](../../06-api-reference/type-aliases/Classifier.md#classifyworklet) function. This executes directly inside
a worklet runtime without Promise scheduling overhead:

```typescript
// Called synchronously inside a VisionCamera frame processor on the UI worklet thread
const results = classifier.classifyWorklet(frameBuffer, { topk: 1 });
```

See [Worklets &
Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details
on dispatching tasks and sharing models across threads.

## Available Models

The library provides ready-to-use models from the [Software Mansion HuggingFace Classification Collection](https://huggingface.co/collections/software-mansion/classification), pre-configured with ImageNet-1k vocabulary and normalization parameters in [`models.classification`](../../06-api-reference/variables/models.md#classification):

| Model Family         | Variants                                                                          | Size Range        | Supported Backends             | Dataset / Vocabulary                                                                         | Notes                                                              |
| :------------------- | :-------------------------------------------------------------------------------- | :---------------- | :----------------------------- | :------------------------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| **EfficientNetV2-S** | [See](../../06-api-reference/variables/models.md#classificationefficientnet_v2_s) | 21.9 MB – 81.7 MB | XNNPACK (CPU), Core ML (Apple) | [`IMAGENET1K_LABELS`](../../06-api-reference/variables/IMAGENET1K_LABELS.md) (1,000 classes) | Fast, lightweight general image recognition and tagging on mobile. |

:::tip Using Custom Models
To use your own fine-tuned classification `.pte` model, pass a
[`ClassifierModel`](../../06-api-reference/type-aliases/ClassifierModel.md)
configuration object to [`useClassifier`](../../06-api-reference/functions/useClassifier.md) or [`createClassifier`](../../06-api-reference/functions/createClassifier.md):

```typescript
const customClassifier = await createClassifier({
  modelPath: 'https://example.com/my-model.pte',
  modelOpts: {
    resizeMode: 'stretch',
    interpolation: 'linear',
    normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
    labels: ['cat', 'dog', 'bird'],
  },
});
```

The pipeline automatically verifies that the model's exported input and output
shapes match its requirements. To prepare and export your own `.pte` model to
match this pipeline, see [Exporting Custom
Models](../../03-core-and-advanced/07-exporting-custom-models.md#using-a-built-in-pipeline).
:::

## API Reference

### Hooks & Pipelines

- [`useClassifier()`](../../06-api-reference/functions/useClassifier.md) — React hook for model downloading, inference state, and automatic memory cleanup.
- [`createClassifier()`](../../06-api-reference/functions/createClassifier.md) — Imperative factory for background jobs, services, and worklet execution.

### Types & Options

- [`Classifier`](../../06-api-reference/type-aliases/Classifier.md) — Classifier task runner interface with `classify` and [`classifyWorklet`](../../06-api-reference/type-aliases/Classifier.md#classifyworklet).
- [`Classification`](../../06-api-reference/type-aliases/Classification.md) — Result prediction object with [`label`](../../06-api-reference/type-aliases/Classification.md#label) and [`confidence`](../../06-api-reference/type-aliases/Classification.md#confidence).
- [`ClassifyOptions`](../../06-api-reference/type-aliases/ClassifyOptions.md) — Configuration options for the `classify` call (`topk`).
- [`ClassifierModel`](../../06-api-reference/type-aliases/ClassifierModel.md) — Model configuration spec for custom and preset models.
- [`ClassifierOptions`](../../06-api-reference/type-aliases/ClassifierOptions.md) — Preprocessing and label vocabulary configuration.
- [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) — Input image buffer structure (`data`, `width`, `height`, `format`).

### Model Presets

- [`models.classification`](../../06-api-reference/variables/models.md#classification) — Pre-configured classification models registry.
