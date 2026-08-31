---
title: Pose & Keypoints
slug: /extensions/pose-and-keypoints
description: 'Detect skeletal body keypoints and facial landmarks in real time with bounding boxes using models like YOLO26 Pose and BlazeFace.'
keywords:
  [
    react native,
    pose estimation,
    keypoint detection,
    facial landmarks,
    body tracking,
    blazeface,
    yolo26 pose,
    coco landmarks,
    mobile ml,
    on-device ai,
  ]
---

# Pose & Keypoints

Pose estimation and keypoint detection locate specific anatomical landmarks on detected subjects — such as human skeletal joints (eyes, shoulders, elbows, wrists, hips, knees, ankles) or facial landmarks (eyes, nose tip, mouth, ears). Each prediction outputs a subject bounding box, detection confidence, and landmark coordinates scaled to the input image with individual landmark confidence scores.

Unlike basic object detection (which only returns box boundaries), keypoint detection tracks body posture, movement, and facial alignment. Common use cases include fitness/workout tracking, gesture controls, motion analysis, face alignment, and AR filters.

<!-- GIF DEMO PLACEHOLDER: Place pose & keypoint demo gif here, e.g. ![Pose Estimation Demo](./media/pose-and-keypoints.gif) -->

## Quick Start

The [`useKeypointDetector`](../../06-api-reference/functions/useKeypointDetector.md) hook manages model downloading, initialization, and lifecycle:

```tsx
import { models, useKeypointDetector } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const detector = useKeypointDetector(models.keypointDetection.YOLO26_POSE.DEFAULT);

  // Hook state:
  // detector.isReady          — true once model is downloaded and loaded in memory
  // detector.downloadProgress — 0.0 to 1.0 download progress
  // detector.error            — Error instance if download or load failed

  const handleDetect = async (imageBuffer: ImageBuffer) => {
    if (!detector.isReady || !detector.detectKeypoints) return;

    // Run inference on background thread
    const detections = await detector.detectKeypoints(imageBuffer, {
      confidenceThreshold: 0.25,
      iouThreshold: 0.7,
    });
    console.log('Detected poses:', detections);
  };

  // Trigger handleDetect from an image picker, button press, or camera frame
}
```

<!-- TODO: Update gallery URL once repo is moved to software-mansion organization -->

:::tip Full Interactive Example in Gallery App
See [`src/app/keypoint-detection.tsx`](https://github.com/barhanc/react-native-executorch-gallery/blob/main/src/app/keypoint-detection.tsx) in the [React Native ExecuTorch Gallery](https://github.com/barhanc/react-native-executorch-gallery) for a complete, runnable screen with photo picker, skeleton keypoint overlays, and latency tracking.
:::

## Output Format

`detectKeypoints()` returns an array of [`KeypointDetection`](../../06-api-reference/type-aliases/KeypointDetection.md) objects:

```typescript
type KeypointDetection<F extends BoxFormat = 'xyxy', L extends PropertyKey = string> = {
  /** Scaled bounding box coordinates matching the input image resolution */
  readonly box: BoundingBox<F>;
  /** Overall detection confidence score (between 0.0 and 1.0) */
  readonly confidence: number;
  /** Map of landmark names to their pixel coordinates and confidence scores */
  readonly landmarks: Record<L, { x: number; y: number; confidence: number }>;
};
```

For human pose models (`YOLO26_POSE`), `landmarks` includes 17 COCO body points:

```json
[
  {
    "box": { "format": "xyxy", "xmin": 45.2, "ymin": 12.0, "xmax": 310.5, "ymax": 580.0 },
    "confidence": 0.93,
    "landmarks": {
      "nose": { "x": 178.4, "y": 85.2, "confidence": 0.97 },
      "leftEye": { "x": 190.1, "y": 75.4, "confidence": 0.95 },
      "rightEye": { "x": 165.8, "y": 76.0, "confidence": 0.94 },
      "leftShoulder": { "x": 230.5, "y": 150.0, "confidence": 0.91 },
      "rightShoulder": { "x": 125.0, "y": 152.3, "confidence": 0.89 },
      "leftElbow": { "x": 260.0, "y": 230.1, "confidence": 0.88 },
      "leftWrist": { "x": 280.2, "y": 305.4, "confidence": 0.84 }
    }
  }
]
```

For face models (`BLAZEFACE`), `landmarks` includes 6 facial points: `leftEye`, `rightEye`, `noseTip`, `mouthCenter`, `leftEar`, `rightEar`.

## Configuration & Options

Pass a [`DetectKeypointsOptions`](../../06-api-reference/type-aliases/DetectKeypointsOptions.md) object to `detectKeypoints()` to override model defaults:

| Option                | Type     | Default                     | Description                                                     |
| :-------------------- | :------- | :-------------------------- | :-------------------------------------------------------------- |
| `confidenceThreshold` | `number` | Model default (e.g. `0.25`) | Minimum confidence score for a detected subject to be retained. |
| `iouThreshold`        | `number` | Model default (e.g. `0.7`)  | Non-Maximum Suppression (NMS) IoU overlap threshold.            |

## Imperative API

For background tasks, headless services, or manual lifecycle management outside React components, create the detector using [`createKeypointDetector`](../../06-api-reference/functions/createKeypointDetector.md):

```typescript
import { createKeypointDetector, models } from 'react-native-executorch';

const detector = await createKeypointDetector(models.keypointDetection.YOLO26_POSE.DEFAULT);

try {
  const poses = await detector.detectKeypoints(imageBuffer, {
    confidenceThreshold: 0.3,
  });
  console.log('Detected poses:', poses);
} finally {
  // Always release native resources when finished
  detector.dispose();
}
```

## Synchronous Execution

For real-time camera tracking and live fitness apps, `createKeypointDetector` exposes a synchronous `detectKeypointsWorklet` function. This runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously inside a VisionCamera frame processor on the UI worklet thread
const poses = detector.detectKeypointsWorklet(frameBuffer, {
  confidenceThreshold: 0.3,
});
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

The library provides ready-to-use pose and landmark detectors from the [Software Mansion HuggingFace Pose Estimation Collection](https://huggingface.co/collections/software-mansion/keypoint-detection), available in [`models.keypointDetection`](../../06-api-reference/variables/models.md#keypointdetection):

| Model                   | Variant                                     | Size          | Platform / Acceleration | Notes                                                                                             |
| :---------------------- | :------------------------------------------ | :------------ | :---------------------- | :------------------------------------------------------------------------------------------------ |
| **YOLO26 Pose**         | `XNNPACK_FP32` (default)                    | Multi-res     | Universal (CPU)         | Real-time human pose estimation (17 body keypoints) at 384x384, 512x512, and 640x640 resolutions. |
| **MediaPipe BlazeFace** | `XNNPACK_FP32` (default)                    | 0.65 MB       | Universal (CPU)         | Ultra-lightweight face detection and 6-point facial landmark locator.                             |
| **RF-DETR Keypoint**    | `XNNPACK_FP32` / `COREML_FP32` / `MLX_FP32` | Multi-backend | Universal / iOS / MLX   | DINOv2-based keypoint transformer with 17 body keypoints.                                         |

:::tip Using Custom Models
To use your own fine-tuned pose or landmark detection `.pte` model, pass a [`KeypointDetectorModel`](../../06-api-reference/type-aliases/KeypointDetectorModel.md) configuration object to `useKeypointDetector` or `createKeypointDetector`:

```typescript
const customDetector = await createKeypointDetector({
  modelPath: 'https://example.com/my-pose-model.pte',
  modelOpts: {
    landmarks: ['head', 'leftHand', 'rightHand'],
    boxFormat: 'xyxy',
    resizeMode: 'letterbox',
    interpolation: 'linear',
    normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
    defaultConfidenceThreshold: 0.3,
    defaultIouThreshold: 0.6,
  },
});
```

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](../../03-core-and-advanced/07-exporting-custom-models.md#using-a-built-in-pipeline).
:::

## API Reference

### Hooks & Pipelines

- [`useKeypointDetector()`](../../06-api-reference/functions/useKeypointDetector.md) — React hook for keypoint detector downloading, state, and lifecycle.
- [`createKeypointDetector()`](../../06-api-reference/functions/createKeypointDetector.md) — Imperative factory for keypoint and pose detection pipelines.

### Types & Options

- [`KeypointDetector`](../../06-api-reference/type-aliases/KeypointDetector.md) — Keypoint detector runner interface (`detectKeypoints`, `detectKeypointsWorklet`).
- [`KeypointDetection`](../../06-api-reference/type-aliases/KeypointDetection.md) — Detection result structure containing `box`, `confidence`, and `landmarks`.
- [`DetectKeypointsOptions`](../../06-api-reference/type-aliases/DetectKeypointsOptions.md) — Detection options (`confidenceThreshold`, `iouThreshold`).
- [`KeypointDetectorModel`](../../06-api-reference/type-aliases/KeypointDetectorModel.md) — Model configuration spec for pose and landmark models.
- [`KeypointDetectorOptions`](../../06-api-reference/type-aliases/KeypointDetectorOptions.md) — Options defining landmark names, box format, and normalization.
- [`Landmarks`](../../06-api-reference/type-aliases/Landmarks.md) — Record of landmark names mapped to `{ x, y, confidence }`.
- [`BoundingBox`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/BoundingBox.md) — Bounding box structure.
- [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) — Input image buffer structure.

### Model Presets & Constants

- [`models.keypointDetection`](../../06-api-reference/variables/models.md#keypointdetection) — Pre-configured keypoint and pose models registry.
- [`COCO_LANDMARKS`](../../06-api-reference/variables/COCO_LANDMARKS.md) — List of 17 standard COCO skeletal body keypoints.
- [`BLAZEFACE_LANDMARKS`](../../06-api-reference/variables/BLAZEFACE_LANDMARKS.md) — List of 6 standard BlazeFace facial landmarks.
