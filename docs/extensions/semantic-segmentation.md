# Semantic Segmentation

Semantic segmentation classifies every individual pixel of an input image into a designated category label (e.g. background, person, vehicle, dog). The pipeline produces a pixel-aligned segmentation mask matching the input dimensions.

Unlike object detection (which outputs rectangular bounding boxes), semantic segmentation delivers precise pixel boundaries. It powers photo portrait effects, background blur/replacement, scene parsing, medical imaging, and autonomous navigation.

| iOS                                                              | Android                                                              |
| ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| [](/react-native-executorch/media/semantic-segmentation-ios.mp4) | [](/react-native-executorch/media/semantic-segmentation-android.mp4) |

## Quick Start[​](#quick-start "Direct link to Quick Start")

The [`useSemanticSegmenter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useSemanticSegmenter) hook manages model downloading, initialization, and lifecycle:

```tsx
import { models, useSemanticSegmenter } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const segmenter = useSemanticSegmenter(models.semanticSegmentation.DEEPLAB_V3_RESNET50.DEFAULT);

  // Hook state:
  // segmenter.isReady          — true once model is downloaded and loaded in memory
  // segmenter.downloadProgress — 0 to 100 download progress
  // segmenter.error            — Error instance if download or load failed
  // segmenter.resource         — resolved config with all URLs replaced by local file paths

  const handleSegment = async (imageBuffer: ImageBuffer) => {
    if (!segmenter.isReady || !segmenter.segment) return;

    // Run inference on background thread
    const result = await segmenter.segment(imageBuffer);
    console.log('Output mask buffer:', result.buffer);
  };

  // Trigger handleSegment from an image picker, button press, or camera frame
}

```

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Full Interactive Example in Gallery App

See [`src/app/(screens)/semantic-segmentation.tsx`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/\(screens\)/semantic-segmentation.tsx) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen with photo picker, custom colormap blending, and latency tracking.

## Output Format[​](#output-format "Direct link to Output Format")

[`segment()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SemanticSegmenter#segment) returns a [`SemanticSegmentationResult`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SemanticSegmentationResult) object:

```typescript
type SemanticSegmentationResult<L extends PropertyKey = string> = {
  /** Output RGBA image buffer containing the colored segmentation mask */
  readonly buffer: ImageBuffer;
  /** Applied color map mapping each class label to its [R, G, B, A] tuple */
  readonly colormap?: ColorMap<L>;
};

```

### Color Mapping Behavior[​](#color-mapping-behavior "Direct link to Color Mapping Behavior")

* **Multi-class models** (e.g. [`DEEPLAB_V3`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#semanticsegmentationdeeplab_v3_resnet50), [`LRASPP`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#semanticsegmentationlraspp_mobilenet_v3_large)): Performs an [`argmax`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/argmax) over the class logits per pixel, then maps each class index to its corresponding `[R, G, B, A]` color tuple. The returned [`colormap`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SemanticSegmentationResult#colormap) contains the full active label-to-color mapping.
* **Single-class / binary models** (e.g. [`SELFIE_SEGMENTATION`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#semanticsegmentationselfie_segmentation)): Applies a [`sigmoid`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/math/functions/sigmoid) activation to the single output channel, scales probabilities to pixel intensity values (0–255), and returns an RGBA mask. No color map is applied, and [`colormap`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SemanticSegmentationResult#colormap) is `undefined`.

## Configuration & Color Maps[​](#configuration--color-maps "Direct link to Configuration & Color Maps")

Pass an optional partial [`ColorMap`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ColorMap) object to [`segment()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SemanticSegmenter#segment) to customize how categories are colored:

```typescript
// Custom RGBA colors: [R, G, B, A] (values 0 - 255)
const result = await segmenter.segment(imageBuffer, {
  person: [255, 0, 0, 180], // Translucent red for person
  background: [0, 0, 0, 0], // Fully transparent for background
});

```

When omitted, multi-class models automatically generate high-contrast distinct colors with the first class (typically background) defaulting to transparent `[0, 0, 0, 0]`. If a partial map is provided, any labels omitted from it will default to being rendered as fully transparent.

## Imperative API[​](#imperative-api "Direct link to Imperative API")

For background processing, headless pipelines, or manual lifecycle management outside React components, create the segmenter using [`createSemanticSegmenter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createSemanticSegmenter):

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

## Synchronous Execution[​](#synchronous-execution "Direct link to Synchronous Execution")

For high-throughput loops like live camera background removal or portrait mode effects, [`createSemanticSegmenter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createSemanticSegmenter) exposes a synchronous [`segmentWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SemanticSegmenter#segmentworklet) function. This runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously inside a VisionCamera frame processor on the UI worklet thread
const result = segmenter.segmentWorklet(frameBuffer);

```

See [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models[​](#available-models "Direct link to Available Models")

The library provides ready-to-use segmentation models from the [Software Mansion HuggingFace Semantic Segmentation Collection](https://huggingface.co/collections/software-mansion/semantic-segmentation), accessible via [`models.semanticSegmentation`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#semanticsegmentation):

| Model Family            | Variants                                                                                                                                                                                                                                                                                                                                                                                                                                                | Classes / Labels                                                                                                                      | Size Range         | Supported Backends             | Notes                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------ | ------------------------------------------------------------------------ |
| **Selfie Segmentation** | [`Portrait`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#semanticsegmentationselfie_segmentation), [`Landscape`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#semanticsegmentationselfie_segmentation_landscape)                                                                                                                                                   | Person / Background                                                                                                                   | 0.5 MB – 0.6 MB    | XNNPACK (CPU), Core ML (Apple) | Real-time front-camera portrait background replacement and blur effects. |
| **LRASPP MobileNetV3**  | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#semanticsegmentationlraspp_mobilenet_v3_large)                                                                                                                                                                                                                                                                                                             | [`PASCAL_VOC_LABELS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/PASCAL_VOC_LABELS) (21 classes) | 3.4 MB – 12.3 MB   | XNNPACK (CPU), Core ML (Apple) | Lightweight multi-class scene segmentation with low CPU overhead.        |
| **DeepLabV3**           | [`ResNet50`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#semanticsegmentationdeeplab_v3_resnet50), [`ResNet101`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#semanticsegmentationdeeplab_v3_resnet101), [`MobileNetV3`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#semanticsegmentationdeeplab_v3_mobilenet_v3_large) | [`PASCAL_VOC_LABELS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/PASCAL_VOC_LABELS) (21 classes) | 40.4 MB – 223.6 MB | XNNPACK (CPU), Core ML (Apple) | High-fidelity dense pixel classification for complex scenes.             |
| **FCN**                 | [`ResNet50`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#semanticsegmentationfcn_resnet50), [`ResNet101`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#semanticsegmentationfcn_resnet101)                                                                                                                                                                          | [`PASCAL_VOC_LABELS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/PASCAL_VOC_LABELS) (21 classes) | 34.0 MB – 198.1 MB | XNNPACK (CPU), Core ML (Apple) | Fully Convolutional Networks baseline for dense multi-class parsing.     |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Using Custom Models

To use your own fine-tuned semantic segmentation `.pte` model, pass a [`SemanticSegmenterModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SemanticSegmenterModel) configuration object to [`useSemanticSegmenter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useSemanticSegmenter) or [`createSemanticSegmenter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createSemanticSegmenter):

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

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md#using-a-built-in-pipeline).

## API Reference[​](#api-reference "Direct link to API Reference")

### Hooks & Pipelines[​](#hooks--pipelines "Direct link to Hooks & Pipelines")

* [`useSemanticSegmenter()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useSemanticSegmenter) — React hook for semantic segmenter downloading, state, and lifecycle.
* [`createSemanticSegmenter()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createSemanticSegmenter) — Imperative factory for semantic segmentation pipelines.

### Types & Options[​](#types--options "Direct link to Types & Options")

* [`SemanticSegmenter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SemanticSegmenter) — Semantic segmenter runner interface (`segment`, [`segmentWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SemanticSegmenter#segmentworklet)).
* [`SemanticSegmentationResult`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SemanticSegmentationResult) — Output structure containing `buffer` and `colormap`.
* [`ColorMap`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ColorMap) — Map of label names to `[R, G, B, A]` tuples.
* [`SemanticSegmenterModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SemanticSegmenterModel) — Model configuration spec for semantic segmenter pipelines.
* [`SemanticSegmenterOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SemanticSegmenterOptions) — Options defining labels, interpolation, and normalization.
* [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer) — Input and output image buffer structure.

### Model Presets & Constants[​](#model-presets--constants "Direct link to Model Presets & Constants")

* [`models.semanticSegmentation`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#semanticsegmentation) — Pre-configured semantic segmentation models registry.
* [`PASCAL_VOC_LABELS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/PASCAL_VOC_LABELS) — List of 21 standard Pascal VOC class labels.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/cv/tasks/semanticSegmentation.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/rne-rewrite/packages/react-native-executorch/src/extensions/cv/tasks/semanticSegmentation.ts)
