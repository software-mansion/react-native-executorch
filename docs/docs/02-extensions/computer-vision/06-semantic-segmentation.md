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

<table className="showcase-table">
  <thead>
    <tr>
      <th>iOS</th>
      <th>Android</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <div className="device-phone iphone-chassis">
          <div className="device-screen iphone-screen">
            <video
              className="device-video"
              src="/react-native-executorch/media/semantic-segmentation-ios.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </div>
      </td>
      <td>
        <div className="device-phone s24-chassis">
          <div className="s24-camera-hole"></div>
          <div className="device-screen s24-screen">
            <video
              className="device-video"
              src="/react-native-executorch/media/semantic-segmentation-android.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </div>
      </td>
    </tr>
  </tbody>
</table>

## Quick Start

The [`useSemanticSegmenter`](../../06-api-reference/functions/useSemanticSegmenter.md) hook manages model downloading, initialization, and lifecycle:

```tsx
import { models, useSemanticSegmenter } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const segmenter = useSemanticSegmenter(models.semanticSegmentation.DEEPLAB_V3_RESNET50.DEFAULT);

  // Hook state:
  // segmenter.isReady          — true once model is downloaded and loaded in memory
  // segmenter.downloadProgress — 0 to 100 download progress
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

:::tip Full Interactive Example in Gallery App
See [`src/app/(screens)/semantic-segmentation.tsx`](<https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/(screens)/semantic-segmentation.tsx>) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen with photo picker, custom colormap blending, and latency tracking.
:::

## Output Format

[`segment()`](../../06-api-reference/type-aliases/SemanticSegmenter.md#segment) returns a [`SemanticSegmentationResult`](../../06-api-reference/type-aliases/SemanticSegmentationResult.md) object:

```typescript
type SemanticSegmentationResult<L extends PropertyKey = string> = {
  /** Output RGBA image buffer containing the colored segmentation mask */
  readonly buffer: ImageBuffer;
  /** Applied color map mapping each class label to its [R, G, B, A] tuple */
  readonly colormap?: ColorMap<L>;
};
```

### Color Mapping Behavior

- **Multi-class models** (e.g. [`DEEPLAB_V3`](../../06-api-reference/variables/models.md#semanticsegmentationdeeplab_v3_resnet50), [`LRASPP`](../../06-api-reference/variables/models.md#semanticsegmentationlraspp_mobilenet_v3_large)): Performs an [`argmax`](../../06-api-reference/react-native-executorch/namespaces/math/functions/argmax.md) over the class logits per pixel, then maps each class index to its corresponding `[R, G, B, A]` color tuple. The returned [`colormap`](../../06-api-reference/type-aliases/SemanticSegmentationResult.md#colormap) contains the full active label-to-color mapping.
- **Single-class / binary models** (e.g. [`SELFIE_SEGMENTATION`](../../06-api-reference/variables/models.md#semanticsegmentationselfie_segmentation)): Applies a [`sigmoid`](../../06-api-reference/react-native-executorch/namespaces/math/functions/sigmoid.md) activation to the single output channel, scales probabilities to pixel intensity values (0–255), and returns an RGBA mask. No color map is applied, and [`colormap`](../../06-api-reference/type-aliases/SemanticSegmentationResult.md#colormap) is `undefined`.

## Configuration & Color Maps

Pass an optional partial [`ColorMap`](../../06-api-reference/type-aliases/ColorMap.md) object to [`segment()`](../../06-api-reference/type-aliases/SemanticSegmenter.md#segment) to customize how categories are colored:

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
import { createSemanticSegmenter, download, models } from 'react-native-executorch';

// Download and cache model assets before creating the pipeline
const model = await download(models.semanticSegmentation.DEEPLAB_V3_RESNET50.DEFAULT);
const segmenter = await createSemanticSegmenter(model);

try {
  const result = await segmenter.segment(imageBuffer);
  console.log('Generated mask dimensions:', result.buffer.width, result.buffer.height);
} finally {
  // Always release native resources when finished
  segmenter.dispose();
}
```

## Synchronous Execution

For high-throughput loops like live camera background removal or portrait mode effects, [`createSemanticSegmenter`](../../06-api-reference/functions/createSemanticSegmenter.md) exposes a synchronous [`segmentWorklet`](../../06-api-reference/type-aliases/SemanticSegmenter.md#segmentworklet) function. This runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously inside a VisionCamera frame processor on the UI worklet thread
const result = segmenter.segmentWorklet(frameBuffer);
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

The library provides ready-to-use segmentation models from the [Software Mansion HuggingFace Semantic Segmentation Collection](https://huggingface.co/collections/software-mansion/semantic-segmentation), accessible via [`models.semanticSegmentation`](../../06-api-reference/variables/models.md#semanticsegmentation):

| Model Family            | Variants                                                                                                                                                                                                                                                                                                            | Classes / Labels                                                                          | Size Range         | Supported Backends             | Notes                                                                    |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------- | :----------------- | :----------------------------- | :----------------------------------------------------------------------- |
| **Selfie Segmentation** | [`Portrait`](../../06-api-reference/variables/models.md#semanticsegmentationselfie_segmentation), [`Landscape`](../../06-api-reference/variables/models.md#semanticsegmentationselfie_segmentation_landscape)                                                                                                       | Person / Background                                                                       | 0.5 MB – 0.6 MB    | XNNPACK (CPU), Core ML (Apple) | Real-time front-camera portrait background replacement and blur effects. |
| **LRASPP MobileNetV3**  | [See](../../06-api-reference/variables/models.md#semanticsegmentationlraspp_mobilenet_v3_large)                                                                                                                                                                                                                     | [`PASCAL_VOC_LABELS`](../../06-api-reference/variables/PASCAL_VOC_LABELS.md) (21 classes) | 3.4 MB – 12.3 MB   | XNNPACK (CPU), Core ML (Apple) | Lightweight multi-class scene segmentation with low CPU overhead.        |
| **DeepLabV3**           | [`ResNet50`](../../06-api-reference/variables/models.md#semanticsegmentationdeeplab_v3_resnet50), [`ResNet101`](../../06-api-reference/variables/models.md#semanticsegmentationdeeplab_v3_resnet101), [`MobileNetV3`](../../06-api-reference/variables/models.md#semanticsegmentationdeeplab_v3_mobilenet_v3_large) | [`PASCAL_VOC_LABELS`](../../06-api-reference/variables/PASCAL_VOC_LABELS.md) (21 classes) | 40.4 MB – 223.6 MB | XNNPACK (CPU), Core ML (Apple) | High-fidelity dense pixel classification for complex scenes.             |
| **FCN**                 | [`ResNet50`](../../06-api-reference/variables/models.md#semanticsegmentationfcn_resnet50), [`ResNet101`](../../06-api-reference/variables/models.md#semanticsegmentationfcn_resnet101)                                                                                                                              | [`PASCAL_VOC_LABELS`](../../06-api-reference/variables/PASCAL_VOC_LABELS.md) (21 classes) | 34.0 MB – 198.1 MB | XNNPACK (CPU), Core ML (Apple) | Fully Convolutional Networks baseline for dense multi-class parsing.     |

:::tip Using Custom Models
To use your own fine-tuned semantic segmentation `.pte` model, pass a [`SemanticSegmenterModel`](../../06-api-reference/type-aliases/SemanticSegmenterModel.md) configuration object to [`useSemanticSegmenter`](../../06-api-reference/functions/useSemanticSegmenter.md) or [`createSemanticSegmenter`](../../06-api-reference/functions/createSemanticSegmenter.md):

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

- [`SemanticSegmenter`](../../06-api-reference/type-aliases/SemanticSegmenter.md) — Semantic segmenter runner interface (`segment`, [`segmentWorklet`](../../06-api-reference/type-aliases/SemanticSegmenter.md#segmentworklet)).
- [`SemanticSegmentationResult`](../../06-api-reference/type-aliases/SemanticSegmentationResult.md) — Output structure containing `buffer` and `colormap`.
- [`ColorMap`](../../06-api-reference/type-aliases/ColorMap.md) — Map of label names to `[R, G, B, A]` tuples.
- [`SemanticSegmenterModel`](../../06-api-reference/type-aliases/SemanticSegmenterModel.md) — Model configuration spec for semantic segmenter pipelines.
- [`SemanticSegmenterOptions`](../../06-api-reference/type-aliases/SemanticSegmenterOptions.md) — Options defining labels, interpolation, and normalization.
- [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) — Input and output image buffer structure.

### Model Presets & Constants

- [`models.semanticSegmentation`](../../06-api-reference/variables/models.md#semanticsegmentation) — Pre-configured semantic segmentation models registry.
- [`PASCAL_VOC_LABELS`](../../06-api-reference/variables/PASCAL_VOC_LABELS.md) — List of 21 standard Pascal VOC class labels.
