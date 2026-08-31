---
title: Semantic Segmentation
slug: /extensions/semantic-segmentation
description: 'Perform pixel-level image segmentation into categories like person, background, and Pascal VOC objects using models like DeepLabV3 and Selfie Segmentation.'
keywords:
  [
    react native,
    semantic segmentation,
    image segmentation,
    pixel classification,
    deeplab,
    selfie segmentation,
    lraspp,
    pascal voc,
    mobile ml,
    on-device ai,
  ]
---

# Semantic Segmentation

Semantic segmentation classifies every individual pixel of an input image into a designated category label (e.g. background, person, vehicle, dog). The pipeline produces a pixel-aligned segmentation mask matching the input dimensions.

Unlike object detection (which outputs rectangular bounding boxes), semantic segmentation delivers precise pixel boundaries. It powers photo portrait effects, background blur/replacement, scene parsing, medical imaging, and autonomous navigation.

<!-- GIF DEMO PLACEHOLDER: Place semantic segmentation demo gif here, e.g. ![Semantic Segmentation Demo](./media/semantic-segmentation.gif) -->

## Quick Start

The [`useSemanticSegmenter`](../../06-api-reference/functions/useSemanticSegmenter.md) hook manages model downloading, initialization, and lifecycle:

```tsx
import { models, useSemanticSegmenter } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const segmenter = useSemanticSegmenter(models.semanticSegmentation.DEEPLAB_V3_RESNET50.DEFAULT);

  // Hook state:
  // segmenter.isReady          — true once model is downloaded and loaded in memory
  // segmenter.downloadProgress — 0.0 to 1.0 download progress
  // segmenter.error            — Error instance if download or load failed

  const handleSegment = async (imageBuffer: ImageBuffer) => {
    if (!segmenter.isReady || !segmenter.segment) return;

    // Run inference on background thread
    const result = await segmenter.segment(imageBuffer);
    console.log('Output mask buffer:', result.buffer);
  };

  // Trigger handleSegment from an image picker, button press, or camera frame
}
```

<!-- TODO: Update gallery URL once repo is moved to software-mansion organization -->

:::tip Full Interactive Example in Gallery App
See [`src/app/semantic-segmentation.tsx`](https://github.com/barhanc/react-native-executorch-gallery/blob/main/src/app/semantic-segmentation.tsx) in the [React Native ExecuTorch Gallery](https://github.com/barhanc/react-native-executorch-gallery) for a complete, runnable screen with photo picker, custom colormap blending, and latency tracking.
:::

## Output Format

`segment()` returns a [`SemanticSegmentationResult`](../../06-api-reference/type-aliases/SemanticSegmentationResult.md) object:

```typescript
type SemanticSegmentationResult<L extends PropertyKey = string> = {
  /** Output RGBA image buffer containing the colored segmentation mask */
  readonly buffer: ImageBuffer;
  /** Applied color map mapping each class label to its [R, G, B, A] tuple */
  readonly colormap?: ColorMap<L>;
};
```

### Color Mapping Behavior

- **Multi-class models** (e.g. `DEEPLAB_V3`, `LRASPP`): Performs an `argmax` over the class logits per pixel, then maps each class index to its corresponding `[R, G, B, A]` color tuple. The returned `colormap` contains the full active label-to-color mapping.
- **Single-class / binary models** (e.g. `SELFIE_SEGMENTATION`): Applies a `sigmoid` activation to the single output channel, scales probabilities to pixel intensity values (0–255), and returns an RGBA mask. No color map is applied, and `colormap` is `undefined`.

## Configuration & Color Maps

Pass an optional partial `colormap` object to `segment()` to customize how categories are colored:

```typescript
// Custom RGBA colors: [R, G, B, A] (values 0 - 255)
const result = await segmenter.segment(imageBuffer, {
  person: [255, 0, 0, 180], // Translucent red for person
  background: [0, 0, 0, 0], // Fully transparent for background
});
```

When omitted, multi-class models automatically generate high-contrast distinct colors with the first class (typically background) defaulting to transparent `[0, 0, 0, 0]`. If a partial map is provided, any labels omitted from it will default to being rendered as fully transparent.

## Imperative API

For background processing, headless pipelines, or manual lifecycle management outside React components, create the segmenter using [`createSemanticSegmenter`](../../06-api-reference/functions/createSemanticSegmenter.md):

```typescript
import { createSemanticSegmenter, models } from 'react-native-executorch';

const segmenter = await createSemanticSegmenter(
  models.semanticSegmentation.DEEPLAB_V3_RESNET50.DEFAULT
);

try {
  const result = await segmenter.segment(imageBuffer);
  console.log('Generated mask dimensions:', result.buffer.width, result.buffer.height);
} finally {
  // Always release native resources when finished
  segmenter.dispose();
}
```

## Real-Time & Worklet Execution

For high-throughput loops like live camera background removal or portrait mode effects, `createSemanticSegmenter` exposes a synchronous `segmentWorklet` function. This runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously inside a VisionCamera frame processor on the UI worklet thread
const result = segmenter.segmentWorklet(frameBuffer);
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

The library provides ready-to-use segmentation models from the [Software Mansion HuggingFace Semantic Segmentation Collection](https://huggingface.co/collections/software-mansion/semantic-segmentation), accessible via [`models.semanticSegmentation`](../../06-api-reference/variables/models.md#semanticsegmentation):

| Model                   | Variant                  | Size    | Platform / Acceleration   | Notes                                                                        |
| :---------------------- | :----------------------- | :------ | :------------------------ | :--------------------------------------------------------------------------- |
| **Selfie Segmentation** | `XNNPACK_FP32` (default) | 0.5 MB  | Universal (CPU)           | Ultra-lightweight portrait person vs background segmenter for front cameras. |
| Selfie Segmentation     | `COREML_FP16`            | ~0.3 MB | iOS (Neural Engine / GPU) | Accelerated via Apple Core ML on iOS 17+.                                    |
| **LRASPP MobileNetV3**  | `XNNPACK_INT8` (default) | 3.5 MB  | Universal (CPU)           | Lightweight 21-class Pascal VOC segmenter for real-time mobile use.          |
| LRASPP MobileNetV3      | `COREML_FP16`            | 6.5 MB  | iOS (Neural Engine / GPU) | Core ML accelerated Pascal VOC segmenter.                                    |
| **DeepLabV3 ResNet50**  | `XNNPACK_INT8` (default) | 42.4 MB | Universal (CPU)           | High-accuracy 21-class Pascal VOC segmenter.                                 |
| DeepLabV3 ResNet50      | `COREML_FP16`            | 79.6 MB | iOS (Neural Engine / GPU) | Accelerated via Apple Core ML on iOS 17+.                                    |

:::tip Using Custom Models
To use your own fine-tuned semantic segmentation `.pte` model, pass a [`SemanticSegmenterModel`](../../06-api-reference/type-aliases/SemanticSegmenterModel.md) configuration object to `useSemanticSegmenter` or `createSemanticSegmenter`:

```typescript
const customSegmenter = await createSemanticSegmenter({
  modelPath: 'https://example.com/my-segmentation.pte',
  modelOpts: {
    labels: ['background', 'road', 'sidewalk', 'building'],
    resizeMode: 'stretch',
    interpolation: 'linear',
    outInterpolation: 'lanczos',
    normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
  },
});
```

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](../../03-core-and-advanced/07-exporting-custom-models.md#using-a-built-in-pipeline).
:::

## API Reference

### Hooks & Pipelines

- [`useSemanticSegmenter()`](../../06-api-reference/functions/useSemanticSegmenter.md) — React hook for semantic segmenter downloading, state, and lifecycle.
- [`createSemanticSegmenter()`](../../06-api-reference/functions/createSemanticSegmenter.md) — Imperative factory for semantic segmentation pipelines.

### Types & Options

- [`SemanticSegmenter`](../../06-api-reference/type-aliases/SemanticSegmenter.md) — Semantic segmenter runner interface (`segment`, `segmentWorklet`).
- [`SemanticSegmentationResult`](../../06-api-reference/type-aliases/SemanticSegmentationResult.md) — Output structure containing `buffer` and `colormap`.
- [`ColorMap`](../../06-api-reference/type-aliases/ColorMap.md) — Map of label names to `[R, G, B, A]` tuples.
- [`SemanticSegmenterModel`](../../06-api-reference/type-aliases/SemanticSegmenterModel.md) — Model configuration spec for semantic segmenter pipelines.
- [`SemanticSegmenterOptions`](../../06-api-reference/type-aliases/SemanticSegmenterOptions.md) — Options defining labels, interpolation, and normalization.
- [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) — Input and output image buffer structure.

### Model Presets & Constants

- [`models.semanticSegmentation`](../../06-api-reference/variables/models.md#semanticsegmentation) — Pre-configured semantic segmentation models registry.
- [`PASCAL_VOC_LABELS`](../../06-api-reference/variables/PASCAL_VOC_LABELS.md) — List of 21 standard Pascal VOC class labels.
