# Pose & Keypoints

Pose estimation and keypoint detection locate specific anatomical landmarks on detected subjects — such as human skeletal joints (eyes, shoulders, elbows, wrists, hips, knees, ankles) or facial landmarks (eyes, nose tip, mouth, ears). Each prediction outputs a subject bounding box, detection confidence, and landmark coordinates scaled to the input image with individual landmark confidence scores.

Unlike basic object detection (which only returns box boundaries), keypoint detection tracks body posture, movement, and facial alignment. Common use cases include fitness/workout tracking, gesture controls, motion analysis, face alignment, and AR filters.

| iOS                                                           | Android                                                           |
| ------------------------------------------------------------- | ----------------------------------------------------------------- |
| [](/react-native-executorch/media/pose-and-keypoints-ios.mp4) | [](/react-native-executorch/media/pose-and-keypoints-android.mp4) |

## Quick Start[​](#quick-start "Direct link to Quick Start")

The [`useKeypointDetector`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useKeypointDetector) hook manages model downloading, initialization, and lifecycle:

```tsx
import { models, useKeypointDetector } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const detector = useKeypointDetector(models.keypointDetection.YOLO26_POSE.DEFAULT);

  // Hook state:
  // detector.isReady          — true once model is downloaded and loaded in memory
  // detector.downloadProgress — 0 to 100 download progress
  // detector.error            — Error instance if download or load failed
  // detector.resource         — resolved config with all URLs replaced by local file paths

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

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Full Interactive Example in Gallery App

See [`src/app/(screens)/keypoint-detection.tsx`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/\(screens\)/keypoint-detection.tsx) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen with photo picker, skeleton keypoint overlays, and latency tracking.

## Output Format[​](#output-format "Direct link to Output Format")

[`detectKeypoints()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KeypointDetector#detectkeypoints) returns an array of [`KeypointDetection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KeypointDetection) objects:

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

For human pose models ([`YOLO26_POSE`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#keypointdetectionyolo26_pose)), [`landmarks`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KeypointDetection#landmarks) includes 17 [`COCO_LANDMARKS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/COCO_LANDMARKS) body points:

```typescript
[
  {
    box: { format: 'xyxy', xmin: 45.2, ymin: 12.0, xmax: 310.5, ymax: 580.0 },
    confidence: 0.93,
    landmarks: {
      nose: { x: 178.4, y: 85.2, confidence: 0.97 },
      leftEye: { x: 190.1, y: 75.4, confidence: 0.95 },
      rightEye: { x: 165.8, y: 76.0, confidence: 0.94 },
      leftEar: { x: 205.3, y: 80.1, confidence: 0.91 },
      rightEar: { x: 150.2, y: 81.0, confidence: 0.9 },
      // ... 12 more COCO landmarks (shoulders → ankles)
    },
  },
];

```

For face models ([`BLAZEFACE`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#keypointdetectionblazeface)), [`landmarks`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KeypointDetection#landmarks) includes 6 facial points from [`BLAZEFACE_LANDMARKS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/BLAZEFACE_LANDMARKS): `leftEye`, `rightEye`, `noseTip`, `mouthCenter`, `leftEar`, `rightEar`.

## Configuration & Options[​](#configuration--options "Direct link to Configuration & Options")

Pass a [`DetectKeypointsOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DetectKeypointsOptions) object to [`detectKeypoints()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KeypointDetector#detectkeypoints) to override model defaults:

| Option                                                                                                                                                 | Type     | Default                     | Description                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | --------------------------- | --------------------------------------------------------------- |
| [`confidenceThreshold`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DetectKeypointsOptions#confidencethreshold) | `number` | Model default (e.g. `0.25`) | Minimum confidence score for a detected subject to be retained. |
| [`iouThreshold`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DetectKeypointsOptions#iouthreshold)               | `number` | Model default (e.g. `0.7`)  | Non-Maximum Suppression (NMS) IoU overlap threshold.            |

## Imperative API[​](#imperative-api "Direct link to Imperative API")

For background tasks, headless services, or manual lifecycle management outside React components, create the detector using [`createKeypointDetector`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createKeypointDetector):

```typescript
import { createKeypointDetector, download, models } from 'react-native-executorch';

// Download and cache model assets before creating the pipeline
const model = await download(models.keypointDetection.YOLO26_POSE.DEFAULT);
const detector = await createKeypointDetector(model);

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

## Synchronous Execution[​](#synchronous-execution "Direct link to Synchronous Execution")

For real-time camera tracking and live fitness apps, [`createKeypointDetector`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createKeypointDetector) exposes a synchronous [`detectKeypointsWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KeypointDetector#detectkeypointsworklet) function. This runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously inside a VisionCamera frame processor on the UI worklet thread
const poses = detector.detectKeypointsWorklet(frameBuffer, {
  confidenceThreshold: 0.3,
});

```

See [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models[​](#available-models "Direct link to Available Models")

The library provides ready-to-use pose and landmark detectors from the [Software Mansion HuggingFace Pose Estimation Collection](https://huggingface.co/collections/software-mansion/keypoint-detection), available in [`models.keypointDetection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#keypointdetection):

| Model Family            | Variants                                                                                                                       | Keypoints Detected                                                                                                                                      | Size Range          | Supported Backends                          | Notes                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **MediaPipe BlazeFace** | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#keypointdetectionblazeface)       | [`BLAZEFACE_LANDMARKS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/BLAZEFACE_LANDMARKS) (6 facial landmarks + box) | 0.6 MB              | XNNPACK (CPU)                               | Ultra-lightweight face bounding box & eye/ear/nose/mouth keypoint tracking (sub-millisecond). |
| **YOLO26 Pose**         | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#keypointdetectionyolo26_pose)     | [`COCO_LANDMARKS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/COCO_LANDMARKS) (17 body keypoints)                  | 11.4 MB             | XNNPACK (CPU), Core ML (Apple)              | Real-time multi-person full-body skeletal tracking across multiple input resolutions.         |
| **RF-DETR Keypoint**    | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#keypointdetectionrfdetr_keypoint) | [`COCO_LANDMARKS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/COCO_LANDMARKS) (17 body keypoints)                  | 138.6 MB – 140.9 MB | XNNPACK (CPU), Core ML (Apple), MLX (Apple) | High-accuracy body keypoint detection transformer for complex, occluded poses.                |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Using Custom Models

To use your own fine-tuned pose or landmark detection `.pte` model, pass a [`KeypointDetectorModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KeypointDetectorModel) configuration object to [`useKeypointDetector`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useKeypointDetector) or [`createKeypointDetector`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createKeypointDetector):

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

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md#using-a-built-in-pipeline).

## API Reference[​](#api-reference "Direct link to API Reference")

### Hooks & Pipelines[​](#hooks--pipelines "Direct link to Hooks & Pipelines")

* [`useKeypointDetector()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useKeypointDetector) — React hook for keypoint detector downloading, state, and lifecycle.
* [`createKeypointDetector()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createKeypointDetector) — Imperative factory for keypoint and pose detection pipelines.

### Types & Options[​](#types--options "Direct link to Types & Options")

* [`KeypointDetector`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KeypointDetector) — Keypoint detector runner interface (`detectKeypoints`, [`detectKeypointsWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KeypointDetector#detectkeypointsworklet)).
* [`KeypointDetection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KeypointDetection) — Detection result structure containing `box`, `confidence`, and `landmarks`.
* [`DetectKeypointsOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DetectKeypointsOptions) — Detection options (`confidenceThreshold`, `iouThreshold`).
* [`KeypointDetectorModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KeypointDetectorModel) — Model configuration spec for pose and landmark models.
* [`KeypointDetectorOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/KeypointDetectorOptions) — Options defining landmark names, box format, and normalization.
* [`Landmarks`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Landmarks) — Record of landmark names mapped to `{ x, y, confidence }`.
* [`BoundingBox`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/BoundingBox) — Bounding box structure.
* [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer) — Input image buffer structure.

### Model Presets & Constants[​](#model-presets--constants "Direct link to Model Presets & Constants")

* [`models.keypointDetection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#keypointdetection) — Pre-configured keypoint and pose models registry.
* [`COCO_LANDMARKS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/COCO_LANDMARKS) — List of 17 standard COCO skeletal body keypoints.
* [`BLAZEFACE_LANDMARKS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/BLAZEFACE_LANDMARKS) — List of 6 standard BlazeFace facial landmarks.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/cv/tasks/keypointDetection.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts)
