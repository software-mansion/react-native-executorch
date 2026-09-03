---
title: Neural Style Transfer
slug: /extensions/style-transfer
description: 'Apply artistic styles like Candy, Mosaic, Rain Princess, and Udnie to photos and camera frames on-device in real time.'
keywords:
  [
    react native,
    style transfer,
    artistic filters,
    photo stylization,
    neural style transfer,
    candy,
    mosaic,
    rain princess,
    udnie,
    mobile ml,
    on-device ai,
  ]
---

# Neural Style Transfer

Neural style transfer renders an input image in the artistic style of another image (such as famous paintings or pattern textures) while preserving the semantic content and structure of the original photo.

Because the models run locally in real time on mobile hardware accelerators, you can apply artistic filters to live camera frames or photos without uploading user media to external servers.

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
              src="/react-native-executorch/media/style-transfer-ios.mp4"
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
              src="/react-native-executorch/media/style-transfer-android.mp4"
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

The [`useStyleTransfer`](../../06-api-reference/functions/useStyleTransfer.md) hook manages model downloading, initialization, and lifecycle:

```tsx
import { models, useStyleTransfer } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const styleTransfer = useStyleTransfer(models.styleTransfer.CANDY.DEFAULT);

  // Hook state:
  // styleTransfer.isReady          — true once model is downloaded and loaded in memory
  // styleTransfer.downloadProgress — 0 to 100 download progress
  // styleTransfer.error            — Error instance if download or load failed
  // styleTransfer.resource         — resolved config with all URLs replaced by local file paths

  const handleTransfer = async (imageBuffer: ImageBuffer) => {
    if (!styleTransfer.isReady || !styleTransfer.transferStyle) return;

    // Run inference on background thread
    const styledBuffer = await styleTransfer.transferStyle(imageBuffer);
    console.log('Styled image dimensions:', styledBuffer.width, styledBuffer.height);
  };

  // Trigger handleTransfer from an image picker, button press, or camera frame
}
```

:::tip Full Interactive Example in Gallery App
See [`src/app/(screens)/style-transfer.tsx`](<https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/(screens)/style-transfer.tsx>) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen with photo picker, side-by-side style comparisons, and latency tracking.
:::

## Output Format

[`transferStyle()`](../../06-api-reference/type-aliases/StyleTransfer.md#transferstyle) returns an [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) object containing the styled RGBA image rendered at the input dimensions:

```typescript
type ImageBuffer = {
  readonly width: number;
  readonly height: number;
  readonly format: 'rgba';
  readonly data: Uint8Array;
};
```

The resulting buffer contains raw uncompressed RGBA pixel bytes that can be rendered directly via React Native Skia or passed into subsequent processing steps.

## Imperative API

For background photo processing, headless workflows, or manual lifecycle management outside React components, create the pipeline using [`createStyleTransfer`](../../06-api-reference/functions/createStyleTransfer.md):

```typescript
import { createStyleTransfer, download, models } from 'react-native-executorch';

// Download and cache model assets before creating the pipeline
const model = await download(models.styleTransfer.CANDY.DEFAULT);
const styleTransfer = await createStyleTransfer(model);

try {
  const styledBuffer = await styleTransfer.transferStyle(imageBuffer);
  console.log('Styled output byte length:', styledBuffer.data.byteLength);
} finally {
  // Always release native resources when finished
  styleTransfer.dispose();
}
```

## Synchronous Execution

For high-throughput loops like live viewfinder styling or video recording, [`createStyleTransfer`](../../06-api-reference/functions/createStyleTransfer.md) exposes a synchronous [`transferStyleWorklet`](../../06-api-reference/type-aliases/StyleTransfer.md#transferstyleworklet) function. This runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously inside a VisionCamera frame processor on the UI worklet thread
const styledBuffer = styleTransfer.transferStyleWorklet(frameBuffer);
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

The library provides ready-to-use style transfer models from the [Software Mansion HuggingFace Style Transfer Collection](https://huggingface.co/collections/software-mansion/style-transfer), available in [`models.styleTransfer`](../../06-api-reference/variables/models.md#styletransfer):

| Model Family      | Variants                                                                     | Size Range      | Supported Backends             | Notes                                                 |
| :---------------- | :--------------------------------------------------------------------------- | :-------------- | :----------------------------- | :---------------------------------------------------- |
| **Candy**         | [See](../../06-api-reference/variables/models.md#styletransfercandy)         | 1.8 MB – 6.5 MB | XNNPACK (CPU), Core ML (Apple) | Vibrant, colorful candy aesthetic with bold outlines. |
| **Mosaic**        | [See](../../06-api-reference/variables/models.md#styletransfermosaic)        | 1.8 MB – 6.5 MB | XNNPACK (CPU), Core ML (Apple) | Classical geometric tile mosaic texture.              |
| **Rain Princess** | [See](../../06-api-reference/variables/models.md#styletransferrain_princess) | 1.8 MB – 6.5 MB | XNNPACK (CPU), Core ML (Apple) | Painterly expressionist oil painting style.           |
| **Udnie**         | [See](../../06-api-reference/variables/models.md#styletransferudnie)         | 1.8 MB – 6.5 MB | XNNPACK (CPU), Core ML (Apple) | Francis Picabia abstract modernist art style.         |

:::tip Using Custom Models
To use your own trained feed-forward style transfer `.pte` model, pass a [`StyleTransferModel`](../../06-api-reference/type-aliases/StyleTransferModel.md) configuration object to [`useStyleTransfer`](../../06-api-reference/functions/useStyleTransfer.md) or [`createStyleTransfer`](../../06-api-reference/functions/createStyleTransfer.md):

```typescript
const customStyleTransfer = await createStyleTransfer({
  modelPath: 'https://example.com/my-style.pte',
  modelOpts: {
    resizeMode: 'stretch',
    interpolation: 'linear',
    outInterpolation: 'lanczos',
    normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
    outNormalizeOpts: { alpha: 255.0, beta: 0.0 },
  },
});
```

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](../../03-core-and-advanced/07-exporting-custom-models.md#using-a-built-in-pipeline).
:::

## API Reference

### Hooks & Pipelines

- [`useStyleTransfer()`](../../06-api-reference/functions/useStyleTransfer.md) — React hook for style transfer model downloading, state, and lifecycle.
- [`createStyleTransfer()`](../../06-api-reference/functions/createStyleTransfer.md) — Imperative factory for style transfer pipelines.

### Types & Options

- [`StyleTransfer`](../../06-api-reference/type-aliases/StyleTransfer.md) — Style transfer runner interface (`transferStyle`, [`transferStyleWorklet`](../../06-api-reference/type-aliases/StyleTransfer.md#transferstyleworklet)).
- [`StyleTransferModel`](../../06-api-reference/type-aliases/StyleTransferModel.md) — Model configuration spec for style transfer models.
- [`StyleTransferOptions`](../../06-api-reference/type-aliases/StyleTransferOptions.md) — Options defining normalization, interpolation, and resize modes.
- [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) — Input and output image buffer structure.

### Model Presets

- [`models.styleTransfer`](../../06-api-reference/variables/models.md#styletransfer) — Pre-configured artistic style transfer models registry.

:::info Source Code
View the implementation on GitHub:

- [`src/extensions/cv/tasks/styleTransfer.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/rne-rewrite/packages/react-native-executorch/src/extensions/cv/tasks/styleTransfer.ts)
  :::
