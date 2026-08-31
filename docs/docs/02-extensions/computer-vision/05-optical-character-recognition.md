---
title: Optical Character Recognition (OCR)
slug: /extensions/optical-character-recognition
description: 'Detect and recognize text lines in images using on-device mixed-precision PaddleOCR (PP-OCRv6).'
keywords:
  [
    react native,
    ocr,
    optical character recognition,
    text recognition,
    text detection,
    mobile ml,
    on-device ai,
  ]
---

# Optical Character Recognition (OCR)

Optical Character Recognition (OCR) detects and extracts text from images. The pipeline identifies text regions with oriented quadrilateral boundaries (`Quad`) and transcribes their characters in reading order (top-to-bottom, left-to-right columns).

It is used for document digitizing, receipt scanning, license plate reading, sign translation, and invoice processing. Because inference runs entirely on-device with zero network latency, sensitive documents never leave the phone.

<!-- GIF DEMO PLACEHOLDER: Place OCR text recognition demo gif here, e.g. ![OCR Text Recognition Demo](./media/ocr.gif) -->

## Quick Start

The [`useOpticalCharacterRecognizer`](../../06-api-reference/functions/useOpticalCharacterRecognizer.md) hook manages model downloading, character set loading, and lifecycle:

```tsx
import { models, useOpticalCharacterRecognizer } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const ocr = useOpticalCharacterRecognizer(models.ocr.PADDLE.PPOCRV6_SMALL.DEFAULT);

  // Hook state:
  // ocr.isReady          — true once model and charset are downloaded and loaded
  // ocr.downloadProgress — 0.0 to 1.0 download progress
  // ocr.error            — Error instance if download or load failed

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

<!-- TODO: Update gallery URL once repo is moved to software-mansion organization -->

:::tip Full Interactive Example in Gallery App
See [`src/app/ocr.tsx`](https://github.com/barhanc/react-native-executorch-gallery/blob/main/src/app/ocr.tsx) in the [React Native ExecuTorch Gallery](https://github.com/barhanc/react-native-executorch-gallery) for a complete, runnable screen with photo picker, oriented text bounding boxes, and latency tracking.
:::

## Output Format

`recognizeCharacters()` returns an array of [`OcrDetection`](../../06-api-reference/type-aliases/OcrDetection.md) objects in natural reading order:

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

```json
[
  {
    "text": "RECEIPT TOTAL: $42.50",
    "confidence": 0.96,
    "quad": {
      "tl": { "x": 45.0, "y": 120.5 },
      "tr": { "x": 380.2, "y": 122.0 },
      "br": { "x": 380.0, "y": 155.4 },
      "bl": { "x": 44.8, "y": 154.0 }
    }
  }
]
```

## Configuration & Options

Pass a [`RecognizeCharactersOptions`](../../06-api-reference/type-aliases/RecognizeCharactersOptions.md) object to `recognizeCharacters()`:

| Option                | Type     | Default | Description                                                     |
| :-------------------- | :------- | :------ | :-------------------------------------------------------------- |
| `confidenceThreshold` | `number` | `0.5`   | Minimum mean confidence score for a text region to be returned. |

## Imperative API

For background processing, document scanners, or manual lifecycle management outside React components, create the pipeline using [`createPaddleOcr`](../../06-api-reference/functions/createPaddleOcr.md):

```typescript
import { createPaddleOcr, models } from 'react-native-executorch';

const ocr = await createPaddleOcr(models.ocr.PADDLE.PPOCRV6_SMALL.DEFAULT);

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

## Real-Time & Worklet Execution

For high-throughput loops or live camera text detection, `createPaddleOcr` exposes a synchronous `recognizeCharactersWorklet` function. This runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously inside a worklet runtime
const lines = ocr.recognizeCharactersWorklet(frameBuffer, {
  confidenceThreshold: 0.5,
});
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

The library provides mixed-precision fused PP-OCRv6 models from the [Software Mansion HuggingFace OCR Collection](https://huggingface.co/collections/software-mansion/ocr), available in [`models.ocr`](../../06-api-reference/variables/models.md#ocr):

| Model              | Variant             | Size    | Platform / Acceleration   | Notes                                                                 |
| :----------------- | :------------------ | :------ | :------------------------ | :-------------------------------------------------------------------- |
| **PP-OCRv6 Small** | `XNNPACK` (default) | 23.9 MB | Universal (CPU)           | INT8 DBNet text detector paired with FP32 SVTR text recognizer.       |
| PP-OCRv6 Small     | `COREML`            | 8.3 MB  | iOS (Neural Engine / GPU) | Accelerated via Apple Core ML on iOS 17+.                             |
| PP-OCRv6 Small     | `VULKAN`            | 26.2 MB | Android (GPU)             | GPU-accelerated text detection and recognition on Android via Vulkan. |

:::tip Using Custom Models
To use your own custom-trained PaddleOCR `.pte` model and character set, pass a [`PaddleOcrModel`](../../06-api-reference/type-aliases/PaddleOcrModel.md) configuration object to `useOpticalCharacterRecognizer` or `createPaddleOcr`:

```typescript
const customOcr = await createPaddleOcr({
  modelPath: 'https://example.com/my-ocr.pte',
  charsetPath: 'https://example.com/charset.json',
  modelOpts: {
    defaultConfidenceThreshold: 0.5,
  },
});
```

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](../../03-core-and-advanced/07-exporting-custom-models.md#using-a-built-in-pipeline).
:::

## API Reference

### Hooks & Pipelines

- [`useOpticalCharacterRecognizer()`](../../06-api-reference/functions/useOpticalCharacterRecognizer.md) — React hook for OCR model downloading, state, and lifecycle.
- [`createPaddleOcr()`](../../06-api-reference/functions/createPaddleOcr.md) — Imperative factory for PP-OCRv6 pipelines.

### Types & Options

- [`PaddleOcr`](../../06-api-reference/type-aliases/PaddleOcr.md) — OCR runner interface (`recognizeCharacters`, `recognizeCharactersWorklet`).
- [`OcrDetection`](../../06-api-reference/type-aliases/OcrDetection.md) — Single recognized text line with `text`, `confidence`, and `quad`.
- [`RecognizeCharactersOptions`](../../06-api-reference/type-aliases/RecognizeCharactersOptions.md) — Inference options (`confidenceThreshold`).
- [`PaddleOcrModel`](../../06-api-reference/type-aliases/PaddleOcrModel.md) — Model configuration spec with `modelPath` and `charsetPath`.
- [`PaddleOcrModelOptions`](../../06-api-reference/type-aliases/PaddleOcrModelOptions.md) — Model options (`defaultConfidenceThreshold`).
- [`Quad`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/Quad.md) — Oriented quadrilateral corner coordinates (`tl`, `tr`, `br`, `bl`).
- [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) — Input image buffer structure.

### Model Presets

- [`models.ocr`](../../06-api-reference/variables/models.md#ocr) — Pre-configured OCR models registry.
