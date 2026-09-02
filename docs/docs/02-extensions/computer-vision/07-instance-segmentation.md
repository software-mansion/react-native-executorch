---
title: Instance Segmentation
slug: /extensions/instance-segmentation
description: 'Detect, classify, and extract pixel-accurate binary masks for individual object instances using models like FastSAM, YOLO26 Seg, and RF-DETR.'
keywords:
  [
    react native,
    instance segmentation,
    mask extraction,
    bounding box,
    fastsam,
    yolo26 seg,
    rfdetr seg,
    coco,
    mobile ml,
    on-device ai,
  ]
---

# Instance Segmentation

Instance segmentation combines object detection and semantic segmentation. For every detected individual object in an image, the pipeline predicts its bounding box, category label, detection confidence, and a pixel-accurate binary mask cropped to the instance bounds.

Unlike semantic segmentation (which groups all pixels of the same category into a single collective mask), instance segmentation distinguishes between separate instances of the same class (e.g. `person #1`, `person #2`). It powers interactive photo cutouts, object isolation, background effects, AR occlusions, and automated video editing.

<!-- GIF DEMO PLACEHOLDER: Place instance segmentation demo gif here, e.g. ![Instance Segmentation Demo](./media/instance-segmentation.gif) -->

## Quick Start

The [`useInstanceSegmenter`](../../06-api-reference/functions/useInstanceSegmenter.md) hook manages model downloading, initialization, and lifecycle:

```tsx
import { models, useInstanceSegmenter } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const segmenter = useInstanceSegmenter(models.instanceSegmentation.FASTSAM.S.DEFAULT);

  // Hook state:
  // segmenter.isReady          — true once model is downloaded and loaded in memory
  // segmenter.downloadProgress — 0.0 to 1.0 download progress
  // segmenter.error            — Error instance if download or load failed

  const handleSegment = async (imageBuffer: ImageBuffer) => {
    if (!segmenter.isReady || !segmenter.segmentInstances) return;

    // Run inference on background thread
    const instances = await segmenter.segmentInstances(imageBuffer, {
      confidenceThreshold: 0.5,
      iouThreshold: 0.9,
      maskThreshold: 0.5,
    });
    console.log('Detected instances:', instances);
  };

  // Trigger handleSegment from an image picker, button press, or camera frame
}
```

:::tip Full Interactive Example in Gallery App
See [`src/app/(screens)/instance-segmentation.tsx`](<https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/(screens)/instance-segmentation.tsx>) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen with photo picker, colored instance polygon overlays, and latency tracking.
:::

## Output Format

`segmentInstances()` returns an array of [`InstanceSegmentationResult`](../../06-api-reference/type-aliases/InstanceSegmentationResult.md) objects:

```typescript
type InstanceSegmentationResult<F extends BoxFormat = 'xyxy', L = string> = {
  /** Scaled bounding box coordinates matching the input image resolution */
  readonly box: BoundingBox<F>;
  /** Binary mask buffer cropped to the instance bounding box */
  readonly mask: ImageBuffer;
  /** Predicted instance class label */
  readonly label: L;
  /** Confidence score of the detection (between 0.0 and 1.0) */
  readonly confidence: number;
};
```

Example result:

```json
[
  {
    "box": { "format": "xyxy", "xmin": 50.0, "ymin": 120.0, "xmax": 280.0, "ymax": 450.0 },
    "label": "person",
    "confidence": 0.92,
    "mask": { "width": 230, "height": 330, "format": "rgba", "data": "..." }
  }
]
```

## Configuration & Options

Pass a [`SegmentInstancesOptions`](../../06-api-reference/type-aliases/SegmentInstancesOptions.md) object to `segmentInstances()` to override model defaults:

| Option                | Type     | Default                    | Description                                              |
| :-------------------- | :------- | :------------------------- | :------------------------------------------------------- |
| `confidenceThreshold` | `number` | Model default (e.g. `0.5`) | Minimum confidence score for an instance to be retained. |
| `iouThreshold`        | `number` | Model default (e.g. `0.9`) | Non-Maximum Suppression (NMS) IoU overlap threshold.     |
| `maskThreshold`       | `number` | Model default (e.g. `0.5`) | Probability threshold for binary mask creation.          |

## Imperative API

For background processing, headless pipelines, or manual lifecycle management outside React components, create the segmenter pipeline using [`createInstanceSegmenter`](../../06-api-reference/functions/createInstanceSegmenter.md):

```typescript
import { createInstanceSegmenter, download, models } from 'react-native-executorch';

// Download and cache model assets before creating the pipeline
const model = await download(models.instanceSegmentation.FASTSAM.S.DEFAULT);
const segmenter = await createInstanceSegmenter(model);

try {
  const instances = await segmenter.segmentInstances(imageBuffer, {
    confidenceThreshold: 0.4,
  });
  console.log('Found instances:', instances.length);
} finally {
  // Always release native resources when finished
  segmenter.dispose();
}
```

## Synchronous Execution

For real-time camera tracking or live object cutouts, `createInstanceSegmenter` exposes a synchronous `segmentInstancesWorklet` function. This runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously inside a VisionCamera frame processor on the UI worklet thread
const instances = segmenter.segmentInstancesWorklet(frameBuffer, {
  confidenceThreshold: 0.5,
});
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

The library provides ready-to-use instance segmentation models from the [Software Mansion HuggingFace Instance Segmentation Collection](https://huggingface.co/collections/software-mansion/instance-segmentation), accessible via [`models.instanceSegmentation`](../../06-api-reference/variables/models.md#instancesegmentation):

| Model Family         | Variants                                                                                                                                                       | Dataset / Vocabulary        | Size Range         | Supported Backends             | Notes                                                                         |
| :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------- | :----------------- | :----------------------------- | :---------------------------------------------------------------------------- |
| **FastSAM**          | [See](../../06-api-reference/variables/models.md#instancesegmentationfastsams), [See](../../06-api-reference/variables/models.md#instancesegmentationfastsamx) | Open-world promptable masks | 23.1 MB – 275.7 MB | XNNPACK (CPU), Core ML (Apple) | Segment Anything Model optimized for zero-shot object mask extraction.        |
| **RF-DETR Nano Seg** | [See](../../06-api-reference/variables/models.md#instancesegmentationrfdetr_nano)                                                                              | COCO (80 classes)           | 59.5 MB – 118.3 MB | XNNPACK (CPU), Core ML (Apple) | DINOv2-based detection & instance segmentation transformer.                   |
| **YOLO26 Seg**       | [See](../../06-api-reference/variables/models.md#instancesegmentationyolo26)                                                                                   | COCO (80 classes)           | 10.6 MB – 240.0 MB | XNNPACK (CPU), Core ML (Apple) | Real-time simultaneous object detection and polygon instance mask extraction. |

:::tip Using Custom Models
To use your own fine-tuned instance segmentation `.pte` model, pass an [`InstanceSegmenterModel`](../../06-api-reference/type-aliases/InstanceSegmenterModel.md) configuration object to `useInstanceSegmenter` or `createInstanceSegmenter`:

```typescript
const customSegmenter = await createInstanceSegmenter({
  modelPath: 'https://example.com/my-instance-seg.pte',
  modelOpts: {
    labels: ['bottle', 'cup', 'can'],
    boxFormat: 'xyxy',
    resizeMode: 'stretch',
    interpolation: 'linear',
    normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
    defaultConfidenceThreshold: 0.5,
    defaultIouThreshold: 0.8,
    defaultMaskThreshold: 0.5,
  },
});
```

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](../../03-core-and-advanced/07-exporting-custom-models.md#using-a-built-in-pipeline).
:::

## API Reference

### Hooks & Pipelines

- [`useInstanceSegmenter()`](../../06-api-reference/functions/useInstanceSegmenter.md) — React hook for instance segmenter downloading, state, and lifecycle.
- [`createInstanceSegmenter()`](../../06-api-reference/functions/createInstanceSegmenter.md) — Imperative factory for instance segmentation pipelines.

### Types & Options

- [`InstanceSegmenter`](../../06-api-reference/type-aliases/InstanceSegmenter.md) — Instance segmenter runner interface (`segmentInstances`, `segmentInstancesWorklet`).
- [`InstanceSegmentationResult`](../../06-api-reference/type-aliases/InstanceSegmentationResult.md) — Result structure with `box`, `mask`, `label`, and `confidence`.
- [`SegmentInstancesOptions`](../../06-api-reference/type-aliases/SegmentInstancesOptions.md) — Inference options (`confidenceThreshold`, `iouThreshold`, `maskThreshold`).
- [`InstanceSegmenterModel`](../../06-api-reference/type-aliases/InstanceSegmenterModel.md) — Model configuration spec for instance segmenter pipelines.
- [`InstanceSegmenterOptions`](../../06-api-reference/type-aliases/InstanceSegmenterOptions.md) — Options defining labels, box format, and thresholds.
- [`BoundingBox`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/BoundingBox.md) — Bounding box structure.
- [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) — Input and mask image buffer structure.

### Model Presets

- [`models.instanceSegmentation`](../../06-api-reference/variables/models.md#instancesegmentation) — Pre-configured instance segmentation models registry.
