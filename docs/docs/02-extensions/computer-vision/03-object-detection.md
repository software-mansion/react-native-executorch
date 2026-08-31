---
title: Object Detection
slug: /extensions/object-detection
description: 'Locate and classify multiple objects in images with bounding boxes using real-time models like SSDLite, YOLO26, and RF-DETR.'
keywords:
  [
    react native,
    object detection,
    bounding box,
    ssdlite,
    yolo,
    yolo26,
    rfdetr,
    coco,
    mobile ml,
    on-device ai,
  ]
---

# Object Detection

Object detection locates and classifies multiple objects within an image. For every detected item, the model predicts its category label, confidence score, and exact bounding box coordinates scaled to the original image dimensions.

Unlike image classification (which predicts a single label for the entire scene), object detection tells you both **what** objects are present and **where** they are located. It is used for real-time camera tracking, retail item recognition, document scanning, robotics, and augmented reality.

<!-- GIF DEMO PLACEHOLDER: Place object detection demo gif here, e.g. ![Object Detection Demo](./media/object-detection.gif) -->

## Quick Start

The [`useObjectDetector`](../../06-api-reference/functions/useObjectDetector.md) hook manages model downloading, initialization, and lifecycle:

```tsx
import { models, useObjectDetector } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const detector = useObjectDetector(models.objectDetection.SSDLITE320_MOBILENET_V3_LARGE.DEFAULT);

  // Hook state:
  // detector.isReady          — true once model is downloaded and loaded in memory
  // detector.downloadProgress — 0.0 to 1.0 download progress
  // detector.error            — Error instance if download or load failed

  const handleDetect = async (imageBuffer: ImageBuffer) => {
    if (!detector.isReady || !detector.detectObjects) return;

    // Run inference on background thread
    const detections = await detector.detectObjects(imageBuffer, {
      confidenceThreshold: 0.5,
      iouThreshold: 0.55,
    });
    console.log('Detected objects:', detections);
  };

  // Trigger handleDetect from an image picker, button press, or camera frame
}
```

<!-- TODO: Update gallery URL once repo is moved to software-mansion organization -->

:::tip Full Interactive Example in Gallery App
See [`src/app/object-detection.tsx`](https://github.com/barhanc/react-native-executorch-gallery/blob/main/src/app/object-detection.tsx) in the [React Native ExecuTorch Gallery](https://github.com/barhanc/react-native-executorch-gallery) for a complete, runnable screen with photo picker, bounding box overlays, and latency tracking.
:::

## Output Format

`detectObjects()` returns an array of [`ObjectDetection`](../../06-api-reference/type-aliases/ObjectDetection.md) objects:

```typescript
type ObjectDetection<F extends BoxFormat = 'xyxy', L = string> = {
  /** Scaled bounding box coordinates matching the input image dimensions */
  readonly box: BoundingBox<F>;
  /** Predicted object class label */
  readonly label: L;
  /** Confidence score of the detection (between 0.0 and 1.0) */
  readonly confidence: number;
};
```

For `'xyxy'` format (default), `box` contains pixel coordinates:

```json
[
  {
    "box": { "format": "xyxy", "xmin": 34.5, "ymin": 112.0, "xmax": 240.2, "ymax": 380.7 },
    "label": "dog",
    "confidence": 0.89
  },
  {
    "box": { "format": "xyxy", "xmin": 310.0, "ymin": 85.3, "xmax": 520.1, "ymax": 410.0 },
    "label": "person",
    "confidence": 0.94
  }
]
```

## Configuration & Options

Pass a [`DetectObjectsOptions`](../../06-api-reference/type-aliases/DetectObjectsOptions.md) object to `detectObjects()` to override model defaults:

| Option                | Type     | Default                     | Description                                                                                                              |
| :-------------------- | :------- | :-------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| `confidenceThreshold` | `number` | Model default (e.g. `0.5`)  | Minimum confidence score for a box to be retained (0.0 to 1.0).                                                          |
| `iouThreshold`        | `number` | Model default (e.g. `0.55`) | Intersection over Union (IoU) threshold for Non-Maximum Suppression (NMS). Lower values suppress more overlapping boxes. |

## Imperative API

For background tasks or headless usage outside React components, create the detector using [`createObjectDetector`](../../06-api-reference/functions/createObjectDetector.md):

```typescript
import { createObjectDetector, download, models } from 'react-native-executorch';

// Download and cache model assets before creating the pipeline
const model = await download(models.objectDetection.SSDLITE320_MOBILENET_V3_LARGE.DEFAULT);
const detector = await createObjectDetector(model);

try {
  const detections = await detector.detectObjects(imageBuffer, {
    confidenceThreshold: 0.4,
  });
  console.log('Detections:', detections);
} finally {
  // Always release native resources when finished
  detector.dispose();
}
```

## Synchronous Execution

For high-throughput loops like camera frame processors, `createObjectDetector` exposes a synchronous `detectObjectsWorklet` function. This runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously inside a VisionCamera frame processor on the UI worklet thread
const detections = detector.detectObjectsWorklet(frameBuffer, {
  confidenceThreshold: 0.5,
});
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

The library provides ready-to-use detectors from the [Software Mansion HuggingFace Object Detection Collection](https://huggingface.co/collections/software-mansion/object-detection), trained on the 80-category COCO dataset and available in [`models.objectDetection`](../../06-api-reference/variables/models.md#objectdetection):

| Model Family               | Variants / Resolutions                       | Size Range         | Supported Backends             | Dataset / Vocabulary | Best For                                                                              |
| :------------------------- | :------------------------------------------- | :----------------- | :----------------------------- | :------------------- | :------------------------------------------------------------------------------------ |
| **SSDLite320 MobileNetV3** | `320x320`                                    | 8.1 MB – 13.3 MB   | CPU (XNNPACK), Apple (Core ML) | COCO (80 classes)    | Ultra-lightweight detector with highest frame rates on low-end devices.               |
| **RF-DETR Nano**           | `DINOv2 Detection`                           | 52.2 MB – 106.4 MB | CPU (XNNPACK), Apple (Core ML) | COCO (80 classes)    | DINOv2-based detection transformer with superior small-object accuracy.               |
| **YOLO26**                 | `Nano`, `Small`, `Medium`, `Large`, `XLarge` | 5.4 MB – 212.9 MB  | CPU (XNNPACK), Apple (Core ML) | COCO (80 classes)    | Scalable real-time detection family across 384x384, 512x512, and 640x640 resolutions. |

:::tip Using Custom Models
To use your own fine-tuned object detection `.pte` model, pass an [`ObjectDetectorModel`](../../06-api-reference/type-aliases/ObjectDetectorModel.md) configuration object to `useObjectDetector` or `createObjectDetector`:

```typescript
const customDetector = await createObjectDetector({
  modelPath: 'https://example.com/my-detector.pte',
  modelOpts: {
    labels: ['hardhat', 'vest', 'boots'],
    boxFormat: 'xyxy',
    resizeMode: 'stretch',
    interpolation: 'linear',
    normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
    defaultConfidenceThreshold: 0.4,
    defaultIouThreshold: 0.5,
  },
});
```

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](../../03-core-and-advanced/07-exporting-custom-models.md#using-a-built-in-pipeline).
:::

## API Reference

### Hooks & Pipelines

- [`useObjectDetector()`](../../06-api-reference/functions/useObjectDetector.md) — React hook for object detector downloading, state, and lifecycle.
- [`createObjectDetector()`](../../06-api-reference/functions/createObjectDetector.md) — Imperative factory for object detector task pipelines.

### Types & Options

- [`ObjectDetector`](../../06-api-reference/type-aliases/ObjectDetector.md) — Object detector instance interface (`detectObjects`, `detectObjectsWorklet`).
- [`ObjectDetection`](../../06-api-reference/type-aliases/ObjectDetection.md) — Single detection result with `box`, `label`, and `confidence`.
- [`DetectObjectsOptions`](../../06-api-reference/type-aliases/DetectObjectsOptions.md) — Inference options (`confidenceThreshold`, `iouThreshold`).
- [`ObjectDetectorModel`](../../06-api-reference/type-aliases/ObjectDetectorModel.md) — Object detector configuration spec.
- [`ObjectDetectorOptions`](../../06-api-reference/type-aliases/ObjectDetectorOptions.md) — Options defining labels, box format, and normalization.
- [`BoundingBox`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/BoundingBox.md) — Generic bounding box structure.
- [`BoxFormat`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/BoxFormat.md) — Coordinate formats (`'xyxy'`, `'xywh'`, `'cxcywh'`).
- [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) — Input image buffer structure.

### Model Presets

- [`models.objectDetection`](../../06-api-reference/variables/models.md#objectdetection) — Pre-configured object detection models registry.
