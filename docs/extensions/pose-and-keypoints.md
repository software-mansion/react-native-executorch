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

See [`src/app/(screens)/keypoint-detection.tsx`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/v0.1.0/src/app/\(screens\)/keypoint-detection.tsx) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery/tree/v0.1.0) for a complete, runnable screen with photo picker, skeleton keypoint overlays, and latency tracking.

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

Models that regress depth add a `depth` to each landmark, on the same scale as `x` and negative towards the camera. It is `undefined` for the flat models.

## Face Mesh[​](#face-mesh "Direct link to Face Mesh")

[`FACEMESH`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#keypointdetectionfacemesh) is the dense counterpart to BlazeFace: 468 3-D vertices over a single face, keyed by their index in MediaPipe's canonical face model (see [`FACEMESH_LANDMARKS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/FACEMESH_LANDMARKS)), so any lip/eye/oval index list published for MediaPipe Face Mesh applies unchanged.

It differs from the other models on this page in two ways. It does not search an image for faces — it expects one already-cropped, face-filling image and always returns exactly one result, whose `box` is the hull of the mesh rather than a detection. And its `confidence` is a face-presence score for the whole crop, while each landmark's own `confidence` is a constant `1`. Feeding it a whole photo rather than a crop drops that score below the default `0.5` threshold on most faces, even ones filling the frame, and `detectKeypoints` then returns an empty array.

```typescript
import { createKeypointDetector, download, models } from 'react-native-executorch';

const detector = await createKeypointDetector(
  await download(models.keypointDetection.BLAZEFACE.DEFAULT)
);
const mesh = await createKeypointDetector(
  await download(models.keypointDetection.FACEMESH.DEFAULT)
);

const [face] = await detector.detectKeypoints(imageBuffer);
if (face) {
  const crop = cropToFace(imageBuffer, face); // see below
  const [result] = await mesh.detectKeypoints(crop.buffer);
  const point = result?.landmarks[33]; // { x, y, confidence: 1, depth }, in crop pixels
  if (point) console.log(crop.toSource(point.x, point.y)); // in imageBuffer pixels
}

```

Like MediaPipe, crop a square 1.5x the detector's box and rotate it so the eyes are level: the mesh expects an upright face, and an axis-aligned crop of a tilted head drifts \~5 px at 30 degrees and loses the face near 90. An [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer) is plain HWC bytes, so this is a resample loop:

```typescript
import type { BlazeFaceLandmark, KeypointDetection } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

const SIZE = 192; // the mesh's input side

function cropToFace(src: ImageBuffer, face: KeypointDetection<'xyxy', BlazeFaceLandmark>) {
  const { box, landmarks } = face;
  const { leftEye, rightEye } = landmarks;
  const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  const cx = (box.xmin + box.xmax) / 2;
  const cy = (box.ymin + box.ymax) / 2;
  const scale = (Math.max(box.xmax - box.xmin, box.ymax - box.ymin) * 1.5) / SIZE;

  // Crop pixel -> source pixel. Also maps the mesh's landmarks back.
  const toSource = (x: number, y: number) => {
    const dx = (x - SIZE / 2) * scale;
    const dy = (y - SIZE / 2) * scale;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
  };

  const channels = src.data.length / (src.width * src.height);
  const data = new Uint8Array(SIZE * SIZE * channels);
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const { x, y } = toSource(col + 0.5, row + 0.5);
      const sx = Math.floor(x);
      const sy = Math.floor(y);
      if (sx < 0 || sy < 0 || sx >= src.width || sy >= src.height) continue;
      const from = (sy * src.width + sx) * channels;
      data.set(src.data.subarray(from, from + channels), (row * SIZE + col) * channels);
    }
  }
  return { buffer: { ...src, data, width: SIZE, height: SIZE }, toSource, scale };
}

```

In the example above we use nearest-pixel sampling to keep it concise.

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

| Model Family            | Variants                                                                                                                       | Keypoints Detected                                                                                                                                      | Size Range          | Supported Backends             | Notes                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------ | --------------------------------------------------------------------------------------------- |
| **MediaPipe BlazeFace** | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#keypointdetectionblazeface)       | [`BLAZEFACE_LANDMARKS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/BLAZEFACE_LANDMARKS) (6 facial landmarks + box) | 0.6 MB              | XNNPACK (CPU)                  | Ultra-lightweight face bounding box & eye/ear/nose/mouth keypoint tracking (sub-millisecond). |
| **MediaPipe Face Mesh** | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#keypointdetectionfacemesh)        | [`FACEMESH_LANDMARKS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/FACEMESH_LANDMARKS) (468 3-D mesh vertices)      | 1.6 MB – 2.5 MB     | XNNPACK (CPU), Core ML (Apple) | Dense single-face mesh from a 192x192 crop; needs a face detector in front of it.             |
| **YOLO26 Pose**         | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#keypointdetectionyolo26_pose)     | [`COCO_LANDMARKS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/COCO_LANDMARKS) (17 body keypoints)                  | 11.4 MB             | XNNPACK (CPU), Core ML (Apple) | Real-time multi-person full-body skeletal tracking across multiple input resolutions.         |
| **RF-DETR Keypoint**    | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#keypointdetectionrfdetr_keypoint) | [`COCO_LANDMARKS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/COCO_LANDMARKS) (17 body keypoints)                  | 138.6 MB – 140.9 MB | XNNPACK (CPU), Core ML (Apple) | High-accuracy body keypoint detection transformer for complex, occluded poses.                |

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
* [`Landmarks`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Landmarks) — Record of landmark names mapped to a [`Landmark`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Landmark).
* [`Landmark`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Landmark) — One landmark: `x`, `y`, `confidence`, and `z` for models that regress depth.
* [`BoundingBox`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/BoundingBox) — Bounding box structure.
* [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer) — Input image buffer structure.

### Model Presets & Constants[​](#model-presets--constants "Direct link to Model Presets & Constants")

* [`models.keypointDetection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#keypointdetection) — Pre-configured keypoint and pose models registry.
* [`COCO_LANDMARKS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/COCO_LANDMARKS) — List of 17 standard COCO skeletal body keypoints.
* [`BLAZEFACE_LANDMARKS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/BLAZEFACE_LANDMARKS) — List of 6 standard BlazeFace facial landmarks.
* [`FACEMESH_LANDMARKS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/FACEMESH_LANDMARKS) — The 468 Face Mesh vertex indices.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/cv/tasks/keypointDetection.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts)
