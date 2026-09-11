---
title: Face Mesh
slug: /extensions/face-mesh
description: 'Regress a dense 468-point 3D face mesh from a cropped face with MediaPipe Face Mesh, on device and in real time.'
keywords:
  [
    react native,
    face mesh,
    face landmarks,
    facial landmarks,
    468 landmarks,
    mediapipe,
    facemesh,
    ar filters,
    mobile ml,
    on-device ai,
  ]
---

# Face Mesh

Face mesh models regress a dense set of 3D landmarks over a single face — 468 points covering the jaw, lips, eyes, brows and the surface in between — along with a score saying how confident the model is that it was shown a face at all. Typical uses are AR filters and try-on, blendshape and expression analysis, gaze and head-pose estimation, and face alignment ahead of another model.

Unlike [Pose & Keypoints](./04-pose-and-keypoints.md), these models do not search an image for subjects. They expect one already-cropped face and return one mesh, so they are the second stage of a two-model pipeline: a face detector such as [`BLAZEFACE`](../../06-api-reference/variables/models.md#keypointdetectionblazeface) finds and crops the face, the mesh model describes it.

## Quick Start

The [`useFaceLandmarker`](../../06-api-reference/functions/useFaceLandmarker.md) hook manages model downloading, initialization, and lifecycle:

```tsx
import { models, useFaceLandmarker } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const mesh = useFaceLandmarker(models.faceLandmarks.FACEMESH.DEFAULT);

  // Hook state:
  // mesh.isReady          — true once model is downloaded and loaded in memory
  // mesh.downloadProgress — 0 to 100 download progress
  // mesh.error            — Error instance if download or load failed
  // mesh.resource         — resolved config with all URLs replaced by local file paths

  const handleDetect = async (faceCrop: ImageBuffer) => {
    if (!mesh.isReady || !mesh.detectFaceLandmarks) return;

    // Run inference on background thread
    const detection = await mesh.detectFaceLandmarks(faceCrop);
    if (detection === null) return; // no face in the crop

    console.log(detection.landmarks.length, 'landmarks at', detection.confidence);
  };

  // Trigger handleDetect from an image picker, button press, or camera frame
}
```

## Cropping a Face First

The mesh model's accuracy depends on being handed a tight, face-filling crop. An
[`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)
is plain HWC bytes, so cropping one to a detector's box is a row copy:

```typescript
import {
  createFaceLandmarker,
  createKeypointDetector,
  download,
  models,
} from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function cropToBox(
  src: ImageBuffer,
  box: { xmin: number; ymin: number; xmax: number; ymax: number }
) {
  const channels = src.data.length / (src.width * src.height);
  const x = Math.max(0, Math.round(box.xmin));
  const y = Math.max(0, Math.round(box.ymin));
  const width = Math.min(src.width, Math.round(box.xmax)) - x;
  const height = Math.min(src.height, Math.round(box.ymax)) - y;
  const data = new Uint8Array(width * height * channels);

  for (let row = 0; row < height; row++) {
    const from = ((y + row) * src.width + x) * channels;
    data.set(src.data.subarray(from, from + width * channels), row * width * channels);
  }
  return { ...src, data, width, height, offset: { x, y } };
}

const detector = await createKeypointDetector(
  await download(models.keypointDetection.BLAZEFACE.DEFAULT)
);
const mesh = await createFaceLandmarker(await download(models.faceLandmarks.FACEMESH.DEFAULT));

const [face] = await detector.detectKeypoints(imageBuffer);
if (face) {
  const crop = cropToBox(imageBuffer, face.box);
  const detection = await mesh.detectFaceLandmarks(crop);
  // Landmarks are in the crop's pixel space; add the crop offset for image space.
  const inImageSpace = detection?.landmarks.map((point) => ({
    ...point,
    x: point.x + crop.offset.x,
    y: point.y + crop.offset.y,
  }));
}
```

Squaring off the box and padding it by 20-25% before cropping matches how the
model was trained and noticeably steadies the mesh on tight detections.

## Output Format

[`detectFaceLandmarks()`](../../06-api-reference/type-aliases/FaceLandmarker.md#detectfacelandmarks) returns a [`FaceLandmarksDetection`](../../06-api-reference/type-aliases/FaceLandmarksDetection.md), or `null` when the face-presence score falls below the threshold:

```typescript
type FaceLandmarksDetection = {
  /** Face-presence score of the input (between 0.0 and 1.0) */
  readonly confidence: number;
  /** The mesh vertices, in the model's own landmark order */
  readonly landmarks: readonly { x: number; y: number; z: number }[];
};
```

`x` and `y` are pixel coordinates in the input image. `z` is a relative depth on roughly the same scale as `x`, centred on the middle of the head and negative towards the camera; it is useful for ordering vertices front-to-back, not as a metric distance.

```typescript
const detection = {
  confidence: 0.99,
  landmarks: [
    { x: 88.2, y: 108.6, z: -12.9 },
    { x: 88.0, y: 98.3, z: -15.4 },
    // ... 466 more, in MediaPipe's canonical face mesh order
  ],
};
```

The index of each vertex follows MediaPipe's [canonical face model](https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png), so any lip/eye/oval index list published for MediaPipe Face Mesh applies unchanged.

## Configuration & Options

Pass a [`DetectFaceLandmarksOptions`](../../06-api-reference/type-aliases/DetectFaceLandmarksOptions.md) object to [`detectFaceLandmarks()`](../../06-api-reference/type-aliases/FaceLandmarker.md#detectfacelandmarks) to override the model default:

| Option                                                                                                         | Type     | Default                    | Description                                                         |
| :------------------------------------------------------------------------------------------------------------- | :------- | :------------------------- | :------------------------------------------------------------------ |
| [`confidenceThreshold`](../../06-api-reference/type-aliases/DetectFaceLandmarksOptions.md#confidencethreshold) | `number` | Model default (e.g. `0.5`) | Minimum face-presence score to accept the result; below it, `null`. |

## Imperative API

For background tasks, headless services, or manual lifecycle management outside React components, create the runner using [`createFaceLandmarker`](../../06-api-reference/functions/createFaceLandmarker.md):

```typescript
import { createFaceLandmarker, download, models } from 'react-native-executorch';

// Download and cache model assets before creating the pipeline
const model = await download(models.faceLandmarks.FACEMESH.DEFAULT);
const mesh = await createFaceLandmarker(model);

try {
  const detection = await mesh.detectFaceLandmarks(faceCrop, { confidenceThreshold: 0.7 });
  console.log('Mesh:', detection?.landmarks);
} finally {
  // Always release native resources when finished
  mesh.dispose();
}
```

## Synchronous Execution

For real-time camera tracking and AR overlays, [`createFaceLandmarker`](../../06-api-reference/functions/createFaceLandmarker.md) exposes a synchronous [`detectFaceLandmarksWorklet`](../../06-api-reference/type-aliases/FaceLandmarker.md#detectfacelandmarksworklet) function. This runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously inside a VisionCamera frame processor on the UI worklet thread
const detection = mesh.detectFaceLandmarksWorklet(faceCrop);
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

Available in [`models.faceLandmarks`](../../06-api-reference/variables/models.md#facelandmarks):

| Model Family            | Variants                                                                | Landmarks       | Size            | Supported Backends             | Notes                                                                   |
| :---------------------- | :---------------------------------------------------------------------- | :-------------- | :-------------- | :----------------------------- | :---------------------------------------------------------------------- |
| **MediaPipe Face Mesh** | [See](../../06-api-reference/variables/models.md#facelandmarksfacemesh) | 468 3D vertices | 1.5 MB – 2.5 MB | XNNPACK (CPU), Core ML (Apple) | Dense single-face mesh from a 192x192 crop, plus a face-presence score. |

:::tip Using Custom Models
To use your own face mesh `.pte` model, pass a [`FaceLandmarkerModel`](../../06-api-reference/type-aliases/FaceLandmarkerModel.md) configuration object to [`useFaceLandmarker`](../../06-api-reference/functions/useFaceLandmarker.md) or [`createFaceLandmarker`](../../06-api-reference/functions/createFaceLandmarker.md):

```typescript
const customMesh = await createFaceLandmarker({
  modelPath: 'https://example.com/my-face-mesh.pte',
  modelOpts: {
    resizeMode: 'letterbox',
    interpolation: 'linear',
    normalizeOpts: { alpha: 1 / 127.5, beta: -1.0 },
    defaultConfidenceThreshold: 0.5,
  },
});
```

The pipeline expects `forward: [1, 3, H, W] -> (landmarks [N, 3], score [1])`, with landmark coordinates in the model's own input-pixel units and the score already in `[0, 1]`. It verifies those shapes at load time. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](../../03-core-and-advanced/07-exporting-custom-models.md#using-a-built-in-pipeline).
:::

## API Reference

### Hooks & Pipelines

- [`useFaceLandmarker()`](../../06-api-reference/functions/useFaceLandmarker.md) — React hook for face mesh downloading, state, and lifecycle.
- [`createFaceLandmarker()`](../../06-api-reference/functions/createFaceLandmarker.md) — Imperative factory for face mesh pipelines.

### Types & Options

- [`FaceLandmarker`](../../06-api-reference/type-aliases/FaceLandmarker.md) — Runner interface (`detectFaceLandmarks`, [`detectFaceLandmarksWorklet`](../../06-api-reference/type-aliases/FaceLandmarker.md#detectfacelandmarksworklet)).
- [`FaceLandmarksDetection`](../../06-api-reference/type-aliases/FaceLandmarksDetection.md) — Result structure containing `confidence` and `landmarks`.
- [`FaceLandmark`](../../06-api-reference/type-aliases/FaceLandmark.md) — A single mesh vertex (`x`, `y`, `z`).
- [`DetectFaceLandmarksOptions`](../../06-api-reference/type-aliases/DetectFaceLandmarksOptions.md) — Detection options (`confidenceThreshold`).
- [`FaceLandmarkerModel`](../../06-api-reference/type-aliases/FaceLandmarkerModel.md) — Model configuration spec for face mesh models.
- [`FaceLandmarkerOptions`](../../06-api-reference/type-aliases/FaceLandmarkerOptions.md) — Options defining preprocessing and the default threshold.
- [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) — Input image buffer structure.

### Model Presets & Constants

- [`models.faceLandmarks`](../../06-api-reference/variables/models.md#facelandmarks) — Pre-configured face mesh models registry.

:::info Source Code
View the implementation on GitHub:

- [`src/extensions/cv/tasks/faceLandmarks.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/extensions/cv/tasks/faceLandmarks.ts)
  :::
