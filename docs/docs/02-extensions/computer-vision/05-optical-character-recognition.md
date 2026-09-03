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

Optical Character Recognition (OCR) detects and extracts text from images. The pipeline identifies text regions with oriented quadrilateral boundaries ([`Quad`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/Quad.md)) and transcribes their characters in reading order (top-to-bottom, left-to-right columns).

It is used for document digitizing, receipt scanning, license plate reading, sign translation, and invoice processing. Because inference runs entirely on-device with zero network latency, sensitive documents never leave the phone.

<table className="showcase-table">
  <thead>
    <tr>
      <th>iOS</th>
      <th>Android</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <div className="device-phone iphone-chassis">
          <div className="device-screen iphone-screen">
            <video
              className="device-video"
              src="/react-native-executorch/media/optical-character-recognition-ios.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </div>
      </td>
      <td>
        <div className="device-phone s24-chassis">
          <div className="s24-camera-hole"></div>
          <div className="device-screen s24-screen">
            <video
              className="device-video"
              src="/react-native-executorch/media/optical-character-recognition-android.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </div>
      </td>
    </tr>
  </tbody>
</table>

## Quick Start

The [`useOpticalCharacterRecognizer`](../../06-api-reference/functions/useOpticalCharacterRecognizer.md) hook manages model downloading, character set loading, and lifecycle:

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

:::tip Full Interactive Example in Gallery App
See [`src/app/(screens)/ocr.tsx`](<https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/(screens)/ocr.tsx>) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen with photo picker, oriented text bounding boxes, and latency tracking.
:::

## Output Format

[`recognizeCharacters()`](../../06-api-reference/type-aliases/PaddleOcr.md#recognizecharacters) returns an array of [`OcrDetection`](../../06-api-reference/type-aliases/OcrDetection.md) objects in natural reading order:

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

## Configuration & Options

Pass a [`RecognizeCharactersOptions`](../../06-api-reference/type-aliases/RecognizeCharactersOptions.md) object to [`recognizeCharacters()`](../../06-api-reference/type-aliases/PaddleOcr.md#recognizecharacters):

| Option                                                                                                         | Type     | Default | Description                                                     |
| :------------------------------------------------------------------------------------------------------------- | :------- | :------ | :-------------------------------------------------------------- |
| [`confidenceThreshold`](../../06-api-reference/type-aliases/RecognizeCharactersOptions.md#confidencethreshold) | `number` | `0.5`   | Minimum mean confidence score for a text region to be returned. |

## Imperative API

For background processing, document scanners, or manual lifecycle management outside React components, create the pipeline using [`createPaddleOcr`](../../06-api-reference/functions/createPaddleOcr.md):

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

## Synchronous Execution

For high-throughput loops or live camera text detection, [`createPaddleOcr`](../../06-api-reference/functions/createPaddleOcr.md) exposes a synchronous [`recognizeCharactersWorklet`](../../06-api-reference/type-aliases/PaddleOcr.md#recognizecharactersworklet) function. This runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously inside a worklet runtime
const lines = ocr.recognizeCharactersWorklet(frameBuffer, {
  confidenceThreshold: 0.5,
});
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

The library provides mixed-precision fused PP-OCRv6 models from the [Software Mansion HuggingFace OCR Collection](https://huggingface.co/collections/software-mansion/ocr), available in [`models.ocr`](../../06-api-reference/variables/models.md#ocr):

| Model Family       | Variants                                                                 | Size Range       | Supported Backends                               | Notes                                                                        |
| :----------------- | :----------------------------------------------------------------------- | :--------------- | :----------------------------------------------- | :--------------------------------------------------------------------------- |
| **PP-OCRv6 Small** | [See](../../06-api-reference/variables/models.md#ocrpaddleppocrv6_small) | 7.9 MB – 25.0 MB | XNNPACK (CPU), Core ML (Apple), Vulkan (Android) | Full end-to-end on-device text detection & recognition in a single pipeline. |

:::note Legacy CRAFT Models & Future EasyOCR Package
The HuggingFace OCR collection may also list legacy **CRAFT** text detector models. Direct CRAFT support has been deprecated in core `react-native-executorch` in favor of the significantly faster and lighter fused **PP-OCRv6** pipeline. Advanced EasyOCR-style recognition features will be introduced in a dedicated companion package.
:::

:::tip Using Custom Models
To use your own custom-trained PaddleOCR `.pte` model and character set, pass a [`PaddleOcrModel`](../../06-api-reference/type-aliases/PaddleOcrModel.md) configuration object to [`useOpticalCharacterRecognizer`](../../06-api-reference/functions/useOpticalCharacterRecognizer.md) or [`createPaddleOcr`](../../06-api-reference/functions/createPaddleOcr.md):

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

- [`PaddleOcr`](../../06-api-reference/type-aliases/PaddleOcr.md) — OCR runner interface ([`recognizeCharacters`](../../06-api-reference/type-aliases/PaddleOcr.md#recognizecharacters), [`recognizeCharactersWorklet`](../../06-api-reference/type-aliases/PaddleOcr.md#recognizecharactersworklet), `dispose`).
- [`OcrDetection`](../../06-api-reference/type-aliases/OcrDetection.md) — Single recognized text line with [`text`](../../06-api-reference/type-aliases/OcrDetection.md#text), [`confidence`](../../06-api-reference/type-aliases/OcrDetection.md#confidence), and [`quad`](../../06-api-reference/type-aliases/OcrDetection.md#quad).
- [`RecognizeCharactersOptions`](../../06-api-reference/type-aliases/RecognizeCharactersOptions.md) — Inference options (`confidenceThreshold`).
- [`PaddleOcrModel`](../../06-api-reference/type-aliases/PaddleOcrModel.md) — Model configuration spec with `modelPath` and `charsetPath`.
- [`PaddleOcrModelOptions`](../../06-api-reference/type-aliases/PaddleOcrModelOptions.md) — Model options (`defaultConfidenceThreshold`).
- [`Quad`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/Quad.md) — Oriented 4-corner polygon tuple `[Point, Point, Point, Point]` in pixel coordinates (`top-left`, `top-right`, `bottom-right`, `bottom-left`).
- [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) — Input image buffer structure.

### Model Presets

- [`models.ocr`](../../06-api-reference/variables/models.md#ocr) — Pre-configured OCR models registry.

:::info Source Code
View the implementation on GitHub:

- [`src/extensions/cv/tasks/paddleOcr.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/rne-rewrite/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts)
  :::
