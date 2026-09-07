# Image Classification

Image classification analyzes an input image and predicts the most likely visual categories it belongs to, along with confidence scores for each prediction. Unlike object detection (which locates multiple items with bounding boxes), classification evaluates the image as a whole.

It is ideal for visual search, photo organization, quality inspection, and accessibility tagging. Because inference runs entirely on-device, images never leave the user's phone.

| iOS                                                             | Android                                                             |
| --------------------------------------------------------------- | ------------------------------------------------------------------- |
| [](/react-native-executorch/media/image-classification-ios.mp4) | [](/react-native-executorch/media/image-classification-android.mp4) |

## Quick Start[​](#quick-start "Direct link to Quick Start")

The [`useClassifier`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useClassifier) hook handles model downloading, initialization, and lifecycle management:

```tsx
import { models, useClassifier } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const classifier = useClassifier(models.classification.EFFICIENTNET_V2_S.DEFAULT);

  // Hook state:
  // classifier.isReady          — true once model is downloaded and loaded in memory
  // classifier.downloadProgress — 0 to 100 download progress
  // classifier.error            — Error instance if download or load failed
  // classifier.resource         — resolved config with all URLs replaced by local file paths

  const handleClassify = async (imageBuffer: ImageBuffer) => {
    if (!classifier.isReady || !classifier.classify) return;

    // Run inference on background thread
    const predictions = await classifier.classify(imageBuffer, { topk: 3 });
    console.log('Top prediction:', predictions[0]);
  };

  // Trigger handleClassify from an image picker, button press, or camera frame
}

```

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Full Interactive Example in Gallery App

See [`src/app/(screens)/image-classification.tsx`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/\(screens\)/image-classification.tsx) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen with photo picker, result overlays, and latency tracking.

## Output Format[​](#output-format "Direct link to Output Format")

[`classify()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Classifier#classify) returns an array of [`Classification`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Classification) objects sorted from highest to lowest confidence:

```typescript
type Classification<L = string> = {
  /** The predicted class label string */
  readonly label: L;
  /** Normalized confidence score between 0.0 and 1.0 */
  readonly confidence: number;
};

```

Example result:

```typescript
[
  { label: 'golden_retriever', confidence: 0.912 },
  { label: 'cocker_spaniel', confidence: 0.043 },
  { label: 'labrador_retriever', confidence: 0.018 },
];

```

## Configuration & Options[​](#configuration--options "Direct link to Configuration & Options")

Pass a [`ClassifyOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ClassifyOptions) object to [`classify()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Classifier#classify):

| Option                                                                                                            | Type     | Default     | Description                                                                                               |
| ----------------------------------------------------------------------------------------------------------------- | -------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| [`topk`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ClassifyOptions#topk) | `number` | `undefined` | Maximum number of top-scoring predictions to return. When omitted, returns all classes in the vocabulary. |

## Imperative API[​](#imperative-api "Direct link to Imperative API")

For background jobs, headless services, or manual lifecycle management outside React components, instantiate the pipeline directly with [`createClassifier`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createClassifier):

```typescript
import { createClassifier, download, models } from 'react-native-executorch';

// Download and cache model assets before creating the pipeline
const model = await download(models.classification.EFFICIENTNET_V2_S.DEFAULT);
const classifier = await createClassifier(model);

try {
  const results = await classifier.classify(imageBuffer, { topk: 5 });
  console.log('Top prediction:', results[0]);
} finally {
  // Always release native resources when finished
  classifier.dispose();
}

```

## Synchronous Execution[​](#synchronous-execution "Direct link to Synchronous Execution")

For high-throughput loops like camera frame processors, [`createClassifier`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createClassifier) exposes a synchronous [`classifyWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Classifier#classifyworklet) function. This executes directly inside a worklet runtime without Promise scheduling overhead:

```typescript
// Called synchronously inside a VisionCamera frame processor on the UI worklet thread
const results = classifier.classifyWorklet(frameBuffer, { topk: 1 });

```

See [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) for details on dispatching tasks and sharing models across threads.

## Available Models[​](#available-models "Direct link to Available Models")

The library provides ready-to-use models from the [Software Mansion HuggingFace Classification Collection](https://huggingface.co/collections/software-mansion/classification), pre-configured with ImageNet-1k vocabulary and normalization parameters in [`models.classification`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#classification):

| Model Family         | Variants                                                                                                                      | Size Range        | Supported Backends             | Dataset / Vocabulary                                                                                                                     | Notes                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **EfficientNetV2-S** | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#classificationefficientnet_v2_s) | 21.9 MB – 81.7 MB | XNNPACK (CPU), Core ML (Apple) | [`IMAGENET1K_LABELS`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/IMAGENET1K_LABELS) (1,000 classes) | Fast, lightweight general image recognition and tagging on mobile. |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Using Custom Models

To use your own fine-tuned classification `.pte` model, pass a [`ClassifierModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ClassifierModel) configuration object to [`useClassifier`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useClassifier) or [`createClassifier`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createClassifier):

```typescript
const customClassifier = await createClassifier({
  modelPath: 'https://example.com/my-model.pte',
  modelOpts: {
    resizeMode: 'stretch',
    interpolation: 'linear',
    normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
    labels: ['cat', 'dog', 'bird'],
  },
});

```

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md#using-a-built-in-pipeline).

## API Reference[​](#api-reference "Direct link to API Reference")

### Hooks & Pipelines[​](#hooks--pipelines "Direct link to Hooks & Pipelines")

* [`useClassifier()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useClassifier) — React hook for model downloading, inference state, and automatic memory cleanup.
* [`createClassifier()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createClassifier) — Imperative factory for background jobs, services, and worklet execution.

### Types & Options[​](#types--options "Direct link to Types & Options")

* [`Classifier`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Classifier) — Classifier task runner interface with `classify` and [`classifyWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Classifier#classifyworklet).
* [`Classification`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Classification) — Result prediction object with [`label`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Classification#label) and [`confidence`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Classification#confidence).
* [`ClassifyOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ClassifyOptions) — Configuration options for the `classify` call (`topk`).
* [`ClassifierModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ClassifierModel) — Model configuration spec for custom and preset models.
* [`ClassifierOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ClassifierOptions) — Preprocessing and label vocabulary configuration.
* [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer) — Input image buffer structure (`data`, `width`, `height`, `format`).

### Model Presets[​](#model-presets "Direct link to Model Presets")

* [`models.classification`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#classification) — Pre-configured classification models registry.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/cv/tasks/classification.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/rne-rewrite/packages/react-native-executorch/src/extensions/cv/tasks/classification.ts)
