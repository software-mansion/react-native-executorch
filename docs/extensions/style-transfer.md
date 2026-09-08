# Neural Style Transfer

Neural style transfer renders an input image in the artistic style of another image (such as famous paintings or pattern textures) while preserving the semantic content and structure of the original photo.

Because the models run locally in real time on mobile hardware accelerators, you can apply artistic filters to live camera frames or photos without uploading user media to external servers.

| iOS                                                       | Android                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| [](/react-native-executorch/media/style-transfer-ios.mp4) | [](/react-native-executorch/media/style-transfer-android.mp4) |

## Quick Start[​](#quick-start "Direct link to Quick Start")

The [`useStyleTransfer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useStyleTransfer) hook manages model downloading, initialization, and lifecycle:

```tsx
import { models, useStyleTransfer } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const styler = useStyleTransfer(models.styleTransfer.CANDY.DEFAULT);

  // Hook state:
  // styler.isReady          — true once model is downloaded and loaded in memory
  // styler.downloadProgress — 0 to 100 download progress
  // styler.error            — Error instance if download or load failed
  // styler.resource         — resolved config with all URLs replaced by local file paths

  const handleTransfer = async (imageBuffer: ImageBuffer) => {
    if (!styler.isReady || !styler.transferStyle) return;

    // Run inference on background thread
    const styledBuffer = await styler.transferStyle(imageBuffer);
    console.log('Styled image dimensions:', styledBuffer.width, styledBuffer.height);
  };

  // Trigger handleTransfer from an image picker, button press, or camera frame
}

```

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Full Interactive Example in Gallery App

See [`src/app/(screens)/style-transfer.tsx`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/\(screens\)/style-transfer.tsx) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen with photo picker, side-by-side style comparisons, and latency tracking.

## Output Format[​](#output-format "Direct link to Output Format")

[`transferStyle()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/StyleTransfer#transferstyle) returns an [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer) object containing the styled RGBA image rendered at the input dimensions:

```typescript
type ImageBuffer = {
  readonly width: number;
  readonly height: number;
  readonly format: 'rgba';
  readonly data: Uint8Array;
};

```

The resulting buffer contains raw uncompressed RGBA pixel bytes that can be rendered directly via React Native Skia or passed into subsequent processing steps.

## Imperative API[​](#imperative-api "Direct link to Imperative API")

For background photo processing, headless workflows, or manual lifecycle management outside React components, create the pipeline using [`createStyleTransfer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createStyleTransfer):

```typescript
import { createStyleTransfer, download, models } from 'react-native-executorch';

// Download and cache model assets before creating the pipeline
const model = await download(models.styleTransfer.CANDY.DEFAULT);
const styler = await createStyleTransfer(model);

try {
  const styledBuffer = await styler.transferStyle(imageBuffer);
  console.log('Styled output byte length:', styledBuffer.data.byteLength);
} finally {
  // Always release native resources when finished
  styler.dispose();
}

```

## Synchronous Execution[​](#synchronous-execution "Direct link to Synchronous Execution")

For high-throughput loops like live viewfinder styling or video recording, [`createStyleTransfer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createStyleTransfer) exposes a synchronous [`transferStyleWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/StyleTransfer#transferstyleworklet) function. This runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously inside a VisionCamera frame processor on the UI worklet thread
const styledBuffer = styler.transferStyleWorklet(frameBuffer);

```

See [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models[​](#available-models "Direct link to Available Models")

The library provides ready-to-use style transfer models from the [Software Mansion HuggingFace Style Transfer Collection](https://huggingface.co/collections/software-mansion/style-transfer), available in [`models.styleTransfer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#styletransfer):

| Model Family      | Variants                                                                                                                 | Size Range      | Supported Backends             | Notes                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------- | ------------------------------ | ----------------------------------------------------- |
| **Candy**         | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#styletransfercandy)         | 1.8 MB – 6.5 MB | XNNPACK (CPU), Core ML (Apple) | Vibrant, colorful candy aesthetic with bold outlines. |
| **Mosaic**        | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#styletransfermosaic)        | 1.8 MB – 6.5 MB | XNNPACK (CPU), Core ML (Apple) | Classical geometric tile mosaic texture.              |
| **Rain Princess** | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#styletransferrain_princess) | 1.8 MB – 6.5 MB | XNNPACK (CPU), Core ML (Apple) | Painterly expressionist oil painting style.           |
| **Udnie**         | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#styletransferudnie)         | 1.8 MB – 6.5 MB | XNNPACK (CPU), Core ML (Apple) | Francis Picabia abstract modernist art style.         |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Using Custom Models

To use your own trained feed-forward style transfer `.pte` model, pass a [`StyleTransferModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/StyleTransferModel) configuration object to [`useStyleTransfer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useStyleTransfer) or [`createStyleTransfer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createStyleTransfer):

```typescript
const customStyler = await createStyleTransfer({
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

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md#using-a-built-in-pipeline).

## API Reference[​](#api-reference "Direct link to API Reference")

### Hooks & Pipelines[​](#hooks--pipelines "Direct link to Hooks & Pipelines")

* [`useStyleTransfer()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useStyleTransfer) — React hook for style transfer model downloading, state, and lifecycle.
* [`createStyleTransfer()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createStyleTransfer) — Imperative factory for style transfer pipelines.

### Types & Options[​](#types--options "Direct link to Types & Options")

* [`StyleTransfer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/StyleTransfer) — Style transfer runner interface (`transferStyle`, [`transferStyleWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/StyleTransfer#transferstyleworklet)).
* [`StyleTransferModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/StyleTransferModel) — Model configuration spec for style transfer models.
* [`StyleTransferOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/StyleTransferOptions) — Options defining normalization, interpolation, and resize modes.
* [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer) — Input and output image buffer structure.

### Model Presets[​](#model-presets "Direct link to Model Presets")

* [`models.styleTransfer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#styletransfer) — Pre-configured artistic style transfer models registry.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/cv/tasks/styleTransfer.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/styleTransfer.ts)
