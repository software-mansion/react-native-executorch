# Optical Character Recognition (OCR)

Optical Character Recognition (OCR) detects and extracts text from images. The pipeline identifies text regions with oriented quadrilateral boundaries ([`Quad`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/Quad)) and transcribes their characters in reading order (top-to-bottom, left-to-right columns).

It is used for document digitizing, receipt scanning, license plate reading, sign translation, and invoice processing. Because inference runs entirely on-device with zero network latency, sensitive documents never leave the phone.

| iOS                                                                      | Android                                                                      |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| [](/react-native-executorch/media/optical-character-recognition-ios.mp4) | [](/react-native-executorch/media/optical-character-recognition-android.mp4) |

## Quick Start[​](#quick-start "Direct link to Quick Start")

The [`useOpticalCharacterRecognizer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useOpticalCharacterRecognizer) hook manages model downloading, character set loading, and lifecycle:

```tsx
import { models, useOpticalCharacterRecognizer } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const ocr = useOpticalCharacterRecognizer(models.ocr.PADDLE.PPOCRV6_SMALL.DEFAULT);

  // Hook state:
  // ocr.isReady          — true once model and charset are downloaded and loaded
  // ocr.downloadProgress — 0 to 100 download progress
  // ocr.error            — Error instance if download or load failed
  // ocr.resource         — resolved config with all URLs replaced by local file paths

  const handleRecognize = async (imageBuffer: ImageBuffer) => {
    if (!ocr.isReady || !ocr.recognizeCharacters) return;

    // Run inference on background thread
    const textLines = await ocr.recognizeCharacters(imageBuffer, {
      confidenceThreshold: 0.5,
    });
    console.log('Recognized lines:', textLines);
  };

  // Trigger handleRecognize from an image picker, button press, or camera frame
}

```

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Full Interactive Example in Gallery App

See [`src/app/(screens)/ocr.tsx`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/\(screens\)/ocr.tsx) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen with photo picker, oriented text bounding boxes, and latency tracking.

## Output Format[​](#output-format "Direct link to Output Format")

[`recognizeCharacters()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PaddleOcr#recognizecharacters) returns an array of [`OcrDetection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/OcrDetection) objects in natural reading order:

```typescript
type OcrDetection = {
  /** Transcribed text string */
  readonly text: string;
  /** Mean per-character probability score (between 0.0 and 1.0) */
  readonly confidence: number;
  /**
   * Oriented quadrilateral corners in pixel coordinates:
   * top-left, top-right, bottom-right, bottom-left
   */
  readonly quad: Quad;
};

```

Example result:

```typescript
[
  {
    text: 'RECEIPT TOTAL: $42.50',
    confidence: 0.96,
    quad: [
      { x: 45.0, y: 120.5 },
      { x: 380.2, y: 122.0 },
      { x: 380.0, y: 155.4 },
      { x: 44.8, y: 154.0 },
    ],
  },
];

```

## Configuration & Options[​](#configuration--options "Direct link to Configuration & Options")

Pass a [`RecognizeCharactersOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/RecognizeCharactersOptions) object to [`recognizeCharacters()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PaddleOcr#recognizecharacters):

| Option                                                                                                                                                     | Type     | Default | Description                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------- | --------------------------------------------------------------- |
| [`confidenceThreshold`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/RecognizeCharactersOptions#confidencethreshold) | `number` | `0.5`   | Minimum mean confidence score for a text region to be returned. |

## Imperative API[​](#imperative-api "Direct link to Imperative API")

For background processing, document scanners, or manual lifecycle management outside React components, create the pipeline using [`createPaddleOcr`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createPaddleOcr):

```typescript
import { createPaddleOcr, download, models } from 'react-native-executorch';

// Download and cache model assets before creating the pipeline
const model = await download(models.ocr.PADDLE.PPOCRV6_SMALL.DEFAULT);
const ocr = await createPaddleOcr(model);

try {
  const lines = await ocr.recognizeCharacters(imageBuffer, {
    confidenceThreshold: 0.5,
  });
  console.log('Recognized text:', lines.map((l) => l.text).join('\n'));
} finally {
  // Always release native resources when finished
  ocr.dispose();
}

```

## Synchronous Execution[​](#synchronous-execution "Direct link to Synchronous Execution")

For high-throughput loops or live camera text detection, [`createPaddleOcr`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createPaddleOcr) exposes a synchronous [`recognizeCharactersWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PaddleOcr#recognizecharactersworklet) function. This runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously inside a worklet runtime
const lines = ocr.recognizeCharactersWorklet(frameBuffer, {
  confidenceThreshold: 0.5,
});

```

See [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models[​](#available-models "Direct link to Available Models")

The library provides mixed-precision fused PP-OCRv6 models from the [Software Mansion HuggingFace OCR Collection](https://huggingface.co/collections/software-mansion/ocr), available in [`models.ocr`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#ocr):

| Model Family       | Variants                                                                                                             | Size Range       | Supported Backends                               | Notes                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| **PP-OCRv6 Small** | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#ocrpaddleppocrv6_small) | 7.9 MB – 25.0 MB | XNNPACK (CPU), Core ML (Apple), Vulkan (Android) | Full end-to-end on-device text detection & recognition in a single pipeline. |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Legacy CRAFT Models & Future EasyOCR Package

The HuggingFace OCR collection may also list legacy **CRAFT** text detector models. Direct CRAFT support has been deprecated in core `react-native-executorch` in favor of the significantly faster and lighter fused **PP-OCRv6** pipeline. Advanced EasyOCR-style recognition features will be introduced in a dedicated companion package.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Using Custom Models

To use your own custom-trained PaddleOCR `.pte` model and character set, pass a [`PaddleOcrModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PaddleOcrModel) configuration object to [`useOpticalCharacterRecognizer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useOpticalCharacterRecognizer) or [`createPaddleOcr`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createPaddleOcr):

```typescript
const customOcr = await createPaddleOcr({
  modelPath: 'https://example.com/my-ocr.pte',
  charsetPath: 'https://example.com/charset.json',
  modelOpts: {
    defaultConfidenceThreshold: 0.5,
  },
});

```

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md#using-a-built-in-pipeline).

## API Reference[​](#api-reference "Direct link to API Reference")

### Hooks & Pipelines[​](#hooks--pipelines "Direct link to Hooks & Pipelines")

* [`useOpticalCharacterRecognizer()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useOpticalCharacterRecognizer) — React hook for OCR model downloading, state, and lifecycle.
* [`createPaddleOcr()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createPaddleOcr) — Imperative factory for PP-OCRv6 pipelines.

### Types & Options[​](#types--options "Direct link to Types & Options")

* [`PaddleOcr`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PaddleOcr) — OCR runner interface ([`recognizeCharacters`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PaddleOcr#recognizecharacters), [`recognizeCharactersWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PaddleOcr#recognizecharactersworklet), `dispose`).
* [`OcrDetection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/OcrDetection) — Single recognized text line with [`text`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/OcrDetection#text), [`confidence`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/OcrDetection#confidence), and [`quad`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/OcrDetection#quad).
* [`RecognizeCharactersOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/RecognizeCharactersOptions) — Inference options (`confidenceThreshold`).
* [`PaddleOcrModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PaddleOcrModel) — Model configuration spec with `modelPath` and `charsetPath`.
* [`PaddleOcrModelOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PaddleOcrModelOptions) — Model options (`defaultConfidenceThreshold`).
* [`Quad`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/Quad) — Oriented 4-corner polygon tuple `[Point, Point, Point, Point]` in pixel coordinates (`top-left`, `top-right`, `bottom-right`, `bottom-left`).
* [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer) — Input image buffer structure.

### Model Presets[​](#model-presets "Direct link to Model Presets")

* [`models.ocr`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#ocr) — Pre-configured OCR models registry.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/cv/tasks/paddleOcr.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/rne-rewrite/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts)
