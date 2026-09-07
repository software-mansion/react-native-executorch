# Instance Segmentation

Instance segmentation combines object detection and semantic segmentation. For every detected individual object in an image, the pipeline predicts its bounding box, category label, detection confidence, and a pixel-accurate binary mask cropped to the instance bounds.

Unlike semantic segmentation (which groups all pixels of the same category into a single collective mask), instance segmentation distinguishes between separate instances of the same class (e.g. `person #1`, `person #2`). It powers interactive photo cutouts, object isolation, background effects, AR occlusions, and automated video editing.

| iOS                                                              | Android                                                              |
| ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| [](/react-native-executorch/media/instance-segmentation-ios.mp4) | [](/react-native-executorch/media/instance-segmentation-android.mp4) |

## Quick Start[​](#quick-start "Direct link to Quick Start")

The [`useInstanceSegmenter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useInstanceSegmenter) hook manages model downloading, initialization, and lifecycle:

```tsx
import { models, useInstanceSegmenter } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const segmenter = useInstanceSegmenter(models.instanceSegmentation.FASTSAM.S.DEFAULT);

  // Hook state:
  // segmenter.isReady          — true once model is downloaded and loaded in memory
  // segmenter.downloadProgress — 0 to 100 download progress
  // segmenter.error            — Error instance if download or load failed
  // segmenter.resource         — resolved config with all URLs replaced by local file paths

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

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Full Interactive Example in Gallery App

See [`src/app/(screens)/instance-segmentation.tsx`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/\(screens\)/instance-segmentation.tsx) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen with photo picker, colored instance polygon overlays, and latency tracking.

## Output Format[​](#output-format "Direct link to Output Format")

[`segmentInstances()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/InstanceSegmenter#segmentinstances) returns an array of [`InstanceSegmentationResult`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/InstanceSegmentationResult) objects:

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

```typescript
[
  {
    box: { format: 'xyxy', xmin: 50.0, ymin: 120.0, xmax: 280.0, ymax: 450.0 },
    label: 'person',
    confidence: 0.92,
    mask: { width: 230, height: 330, format: 'rgba' /* data: Uint8Array */ },
  },
];

```

## Configuration & Options[​](#configuration--options "Direct link to Configuration & Options")

Pass a [`SegmentInstancesOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SegmentInstancesOptions) object to [`segmentInstances()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/InstanceSegmenter#segmentinstances) to override model defaults:

| Option                                                                                                                                                  | Type     | Default                    | Description                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------- | -------------------------------------------------------- |
| [`confidenceThreshold`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SegmentInstancesOptions#confidencethreshold) | `number` | Model default (e.g. `0.5`) | Minimum confidence score for an instance to be retained. |
| [`iouThreshold`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SegmentInstancesOptions#iouthreshold)               | `number` | Model default (e.g. `0.9`) | Non-Maximum Suppression (NMS) IoU overlap threshold.     |
| [`maskThreshold`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SegmentInstancesOptions#maskthreshold)             | `number` | Model default (e.g. `0.5`) | Probability threshold for binary mask creation.          |

## Imperative API[​](#imperative-api "Direct link to Imperative API")

For background processing, headless pipelines, or manual lifecycle management outside React components, create the segmenter pipeline using [`createInstanceSegmenter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createInstanceSegmenter):

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

## Synchronous Execution[​](#synchronous-execution "Direct link to Synchronous Execution")

For real-time camera tracking or live object cutouts, [`createInstanceSegmenter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createInstanceSegmenter) exposes a synchronous [`segmentInstancesWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/InstanceSegmenter#segmentinstancesworklet) function. This runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously inside a VisionCamera frame processor on the UI worklet thread
const instances = segmenter.segmentInstancesWorklet(frameBuffer, {
  confidenceThreshold: 0.5,
});

```

See [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models[​](#available-models "Direct link to Available Models")

The library provides ready-to-use instance segmentation models from the [Software Mansion HuggingFace Instance Segmentation Collection](https://huggingface.co/collections/software-mansion/instance-segmentation), accessible via [`models.instanceSegmentation`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#instancesegmentation):

| Model Family         | Variants                                                                                                                                                                                                                                                        | Dataset / Vocabulary                                                                                                                  | Size Range         | Supported Backends             | Notes                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------ | ----------------------------------------------------------------------------- |
| **FastSAM**          | [`Small`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#instancesegmentationfastsams), [`XLarge`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#instancesegmentationfastsamx) | Open-world promptable masks                                                                                                           | 23.1 MB – 275.7 MB | XNNPACK (CPU), Core ML (Apple) | Segment Anything Model optimized for zero-shot object mask extraction.        |
| **RF-DETR Nano Seg** | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#instancesegmentationrfdetr_nano)                                                                                                                                   | [`COCO_CLASSES`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/COCO_CLASSES) (80 classes)           | 59.5 MB – 118.3 MB | XNNPACK (CPU), Core ML (Apple) | DINOv2-based detection & instance segmentation transformer.                   |
| **YOLO26 Seg**       | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#instancesegmentationyolo26)                                                                                                                                        | [`COCO_CLASSES_YOLO`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/COCO_CLASSES_YOLO) (80 classes) | 10.6 MB – 240.0 MB | XNNPACK (CPU), Core ML (Apple) | Real-time simultaneous object detection and polygon instance mask extraction. |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Using Custom Models

To use your own fine-tuned instance segmentation `.pte` model, pass an [`InstanceSegmenterModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/InstanceSegmenterModel) configuration object to [`useInstanceSegmenter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useInstanceSegmenter) or [`createInstanceSegmenter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createInstanceSegmenter):

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

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md#using-a-built-in-pipeline).

## API Reference[​](#api-reference "Direct link to API Reference")

### Hooks & Pipelines[​](#hooks--pipelines "Direct link to Hooks & Pipelines")

* [`useInstanceSegmenter()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useInstanceSegmenter) — React hook for instance segmenter downloading, state, and lifecycle.
* [`createInstanceSegmenter()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createInstanceSegmenter) — Imperative factory for instance segmentation pipelines.

### Types & Options[​](#types--options "Direct link to Types & Options")

* [`InstanceSegmenter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/InstanceSegmenter) — Instance segmenter runner interface (`segmentInstances`, [`segmentInstancesWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/InstanceSegmenter#segmentinstancesworklet)).
* [`InstanceSegmentationResult`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/InstanceSegmentationResult) — Result structure with `box`, `mask`, `label`, and `confidence`.
* [`SegmentInstancesOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SegmentInstancesOptions) — Inference options (`confidenceThreshold`, `iouThreshold`, `maskThreshold`).
* [`InstanceSegmenterModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/InstanceSegmenterModel) — Model configuration spec for instance segmenter pipelines.
* [`InstanceSegmenterOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/InstanceSegmenterOptions) — Options defining labels, box format, and thresholds.
* [`BoundingBox`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/BoundingBox) — Bounding box structure.
* [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer) — Input and mask image buffer structure.

### Model Presets[​](#model-presets "Direct link to Model Presets")

* [`models.instanceSegmentation`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#instancesegmentation) — Pre-configured instance segmentation models registry.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/cv/tasks/instanceSegmentation.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts)
