# Object Detection

Object detection locates and classifies multiple objects within an image. For every detected item, the model predicts its category label, confidence score, and exact bounding box coordinates scaled to the original image dimensions.

Unlike image classification (which predicts a single label for the entire scene), object detection tells you both **what** objects are present and **where** they are located. It is used for real-time camera tracking, retail item recognition, document scanning, robotics, and augmented reality.

| iOS                                                         | Android                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------- |
| [](/react-native-executorch/media/object-detection-ios.mp4) | [](/react-native-executorch/media/object-detection-android.mp4) |

## Quick Start[​](#quick-start "Direct link to Quick Start")

The [`useObjectDetector`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useObjectDetector) hook manages model downloading, initialization, and lifecycle:

```tsx
import { models, useObjectDetector } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const detector = useObjectDetector(models.objectDetection.SSDLITE320_MOBILENET_V3_LARGE.DEFAULT);

  // Hook state:
  // detector.isReady          — true once model is downloaded and loaded in memory
  // detector.downloadProgress — 0 to 100 download progress
  // detector.error            — Error instance if download or load failed
  // detector.resource         — resolved config with all URLs replaced by local file paths

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

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Full Interactive Example in Gallery App

See [`src/app/(screens)/object-detection.tsx`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/\(screens\)/object-detection.tsx) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen with photo picker, bounding box overlays, and latency tracking.

## Output Format[​](#output-format "Direct link to Output Format")

[`detectObjects()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ObjectDetector#detectobjects) returns an array of [`ObjectDetection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ObjectDetection) objects:

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

For `'xyxy'` format (default), [`box`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ObjectDetection#box) contains pixel coordinates:

```typescript
[
  {
    box: { format: 'xyxy', xmin: 34.5, ymin: 112.0, xmax: 240.2, ymax: 380.7 },
    label: 'dog',
    confidence: 0.89,
  },
  {
    box: { format: 'xyxy', xmin: 310.0, ymin: 85.3, xmax: 520.1, ymax: 410.0 },
    label: 'person',
    confidence: 0.94,
  },
];

```

## Configuration & Options[​](#configuration--options "Direct link to Configuration & Options")

Pass a [`DetectObjectsOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DetectObjectsOptions) object to [`detectObjects()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ObjectDetector#detectobjects) to override model defaults:

| Option                                                                                                                                               | Type     | Default                     | Description                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [`confidenceThreshold`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DetectObjectsOptions#confidencethreshold) | `number` | Model default (e.g. `0.5`)  | Minimum confidence score for a box to be retained (0.0 to 1.0).                                                          |
| [`iouThreshold`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DetectObjectsOptions#iouthreshold)               | `number` | Model default (e.g. `0.55`) | Intersection over Union (IoU) threshold for Non-Maximum Suppression (NMS). Lower values suppress more overlapping boxes. |

## Imperative API[​](#imperative-api "Direct link to Imperative API")

For background tasks or headless usage outside React components, create the detector using [`createObjectDetector`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createObjectDetector):

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

## Synchronous Execution[​](#synchronous-execution "Direct link to Synchronous Execution")

For high-throughput loops like camera frame processors, [`createObjectDetector`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createObjectDetector) exposes a synchronous [`detectObjectsWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ObjectDetector#detectobjectsworklet) function. This runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously inside a VisionCamera frame processor on the UI worklet thread
const detections = detector.detectObjectsWorklet(frameBuffer, {
  confidenceThreshold: 0.5,
});

```

See [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models[​](#available-models "Direct link to Available Models")

The library provides ready-to-use detectors from the [Software Mansion HuggingFace Object Detection Collection](https://huggingface.co/collections/software-mansion/object-detection), trained on the 80-category COCO dataset and available in [`models.objectDetection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#objectdetection):

| Model Family               | Variants                                                                                                                                   | Size Range         | Supported Backends             | Dataset / Vocabulary                                                                                                                  | Notes                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **SSDLite320 MobileNetV3** | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#objectdetectionssdlite320_mobilenet_v3_large) | 8.1 MB – 13.3 MB   | XNNPACK (CPU), Core ML (Apple) | [`COCO_CLASSES`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/COCO_CLASSES) (80 classes)           | Ultra-lightweight detector with highest frame rates on low-end devices.               |
| **RF-DETR Nano**           | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#objectdetectionrfdetr_nano)                   | 52.2 MB – 106.4 MB | XNNPACK (CPU), Core ML (Apple) | [`COCO_CLASSES`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/COCO_CLASSES) (80 classes)           | DINOv2-based detection transformer with superior small-object accuracy.               |
| **YOLO26**                 | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#objectdetectionyolo26)                        | 5.4 MB – 212.9 MB  | XNNPACK (CPU), Core ML (Apple) | [`COCO_CLASSES_YOLO`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/COCO_CLASSES_YOLO) (80 classes) | Scalable real-time detection family across 384x384, 512x512, and 640x640 resolutions. |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Using Custom Models

To use your own fine-tuned object detection `.pte` model, pass an [`ObjectDetectorModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ObjectDetectorModel) configuration object to [`useObjectDetector`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useObjectDetector) or [`createObjectDetector`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createObjectDetector):

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

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md#using-a-built-in-pipeline).

## API Reference[​](#api-reference "Direct link to API Reference")

### Hooks & Pipelines[​](#hooks--pipelines "Direct link to Hooks & Pipelines")

* [`useObjectDetector()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useObjectDetector) — React hook for object detector downloading, state, and lifecycle.
* [`createObjectDetector()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createObjectDetector) — Imperative factory for object detector task pipelines.

### Types & Options[​](#types--options "Direct link to Types & Options")

* [`ObjectDetector`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ObjectDetector) — Object detector instance interface (`detectObjects`, [`detectObjectsWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ObjectDetector#detectobjectsworklet)).
* [`ObjectDetection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ObjectDetection) — Single detection result with `box`, `label`, and `confidence`.
* [`DetectObjectsOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DetectObjectsOptions) — Inference options (`confidenceThreshold`, `iouThreshold`).
* [`ObjectDetectorModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ObjectDetectorModel) — Object detector configuration spec.
* [`ObjectDetectorOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ObjectDetectorOptions) — Options defining labels, box format, and normalization.
* [`BoundingBox`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/BoundingBox) — Generic bounding box structure.
* [`BoxFormat`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/BoxFormat) — Coordinate formats (`'xyxy'`, `'xywh'`, `'cxcywh'`).
* [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer) — Input image buffer structure.

### Model Presets[​](#model-presets "Direct link to Model Presets")

* [`models.objectDetection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#objectdetection) — Pre-configured object detection models registry.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/cv/tasks/objectDetection.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/rne-rewrite/packages/react-native-executorch/src/extensions/cv/tasks/objectDetection.ts)
