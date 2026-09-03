---
title: Real-Time Camera Processing
slug: /extensions/camera-integration
description: 'Run real-time on-device computer vision models on live camera feeds using VisionCamera v5 and ExecuTorch synchronous worklets.'
keywords:
  [
    react native,
    vision camera,
    camera integration,
    real-time,
    frame processor,
    worklets,
    gpu resizer,
    on-device ai,
  ]
---

# Real-Time Camera Processing

React Native ExecuTorch models can process live camera streams directly on-device with zero cloud dependencies. By combining [VisionCamera v5](https://visioncamera.margelo.com), [VisionCamera Resizer](https://github.com/mrousavy/react-native-vision-camera/tree/main/packages/react-native-vision-camera-resizer), and [`react-native-worklets`](https://docs.swmansion.com/react-native-worklets/), live camera frames are scaled and converted on the GPU directly into an [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md), processed synchronously inside the camera frame processor worklet, and dispatched back to the React JavaScript thread via [`scheduleOnRN`](https://docs.swmansion.com/react-native-worklets/docs/threading/scheduleOnRN/) with zero thread-switching or promise overhead.

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<!-- GIF DEMO PLACEHOLDER: Place real-time camera processing demo gif here, e.g. ![Real-Time Camera Processing Demo](./media/camera-integration.gif) -->

## Quick Start

### 1. Installation

Install VisionCamera v5 along with its resizer, worklets, and Nitro Modules dependencies (`react-native-worklets` is already installed as a peer dependency of `react-native-executorch`):

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm">

```bash
npm install react-native-vision-camera react-native-vision-camera-resizer react-native-vision-camera-worklets react-native-nitro-modules
```

  </TabItem>
  <TabItem value="yarn" label="yarn">

```bash
yarn add react-native-vision-camera react-native-vision-camera-resizer react-native-vision-camera-worklets react-native-nitro-modules
```

  </TabItem>
  <TabItem value="pnpm" label="pnpm">

```bash
pnpm add react-native-vision-camera react-native-vision-camera-resizer react-native-vision-camera-worklets react-native-nitro-modules
```

  </TabItem>
</Tabs>

Make sure you configure camera permissions in your project.

### 2. The `useFrameOutput` Pipeline

#### Imports & Constants

Import the model hooks, VisionCamera frame processing utilities, GPU resizer, and worklets scheduler, and define the model's expected input dimensions:

```tsx
import { models, useObjectDetector } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

import { useFrameOutput } from 'react-native-vision-camera';
import { type GPUFrame, useResizer } from 'react-native-vision-camera-resizer';
import { scheduleOnRN } from 'react-native-worklets';

const INPUT_SIZE = { width: 320, height: 320 };
```

#### Model & GPU Resizer Setup

Initialize the [`useObjectDetector`](../../06-api-reference/functions/useObjectDetector.md) hook to obtain its synchronous [`detectObjectsWorklet`](../../06-api-reference/functions/useObjectDetector.md#detectobjectsworklet) method, and configure [`useResizer`](https://github.com/mrousavy/react-native-vision-camera/tree/main/packages/react-native-vision-camera-resizer) to crop and convert incoming camera frames directly on the GPU to match the model's required input resolution:

```tsx
const detector = useObjectDetector(models.objectDetection.SSDLITE320_MOBILENET_V3_LARGE.DEFAULT);
const { detectObjectsWorklet } = detector;

const { resizer } = useResizer({
  ...INPUT_SIZE,
  channelOrder: 'rgb',
  dataType: 'uint8',
  scaleMode: 'cover',
  pixelLayout: 'interleaved', // provides 'hwc' layout expected by ImageBuffer
});
```

#### Frame Processing Loop

Process each frame inside [`useFrameOutput`](https://visioncamera.margelo.com/docs/camera-outputs). The [`resizer`](https://github.com/mrousavy/react-native-vision-camera/tree/main/packages/react-native-vision-camera-resizer) converts the frame on the GPU, wraps it in an [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md), runs inference synchronously on the worklet thread, and posts the results back to React with [`scheduleOnRN`](https://docs.swmansion.com/react-native-worklets/docs/threading/scheduleOnRN/):

```tsx
const frameOutput = useFrameOutput({
  pixelFormat: 'yuv',
  dropFramesWhileBusy: true,
  enablePhysicalBufferRotation: true,
  onFrame(frame) {
    'worklet';
    if (!resizer || !detectObjectsWorklet) {
      frame.dispose();
      return;
    }

    let resized: GPUFrame | undefined;
    try {
      // 1. Hardware-accelerated resize & YUV -> RGB conversion on GPU
      resized = resizer.resize(frame);

      const data = new Uint8Array(resized.getPixelBuffer());
      const input: ImageBuffer = { data, ...INPUT_SIZE, format: 'rgb', layout: 'hwc' };

      // 2. Synchronous model inference on worklet thread
      const results = detectObjectsWorklet(input);

      // 3. Dispatch back to React thread
      scheduleOnRN(setDetections, results);
    } catch {
      // Ignore errors when camera unmounts or frame closes mid-flight
    } finally {
      // 4. Always dispose both frames
      resized?.dispose();
      frame.dispose();
    }
  },
});
```

Pass `frameOutput` to the `<Camera />` component via the `outputs` prop:

```tsx
<Camera
  style={StyleSheet.absoluteFill}
  device={device}
  isActive={isActive}
  outputs={[frameOutput]}
  resizeMode="cover"
/>
```

Connecting `frameOutput` through the `outputs` prop attaches your processing pipeline directly to the active camera session. Because inference runs inside the worklet runtime with `dropFramesWhileBusy: true`, the camera preview continues rendering smoothly at hardware display refresh rates without UI stutter. VisionCamera allows combining `frameOutput` with interactive camera controls (such as tap-to-focus, zoom, and exposure bias) as well as other capture outputs. See the [VisionCamera Camera Outputs documentation](https://visioncamera.margelo.com/docs/camera-outputs) for full configuration options.

:::tip Full Interactive Example in Gallery App
See [`src/app/(screens)/realtime-object-detection.tsx`](<https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/(screens)/realtime-object-detection.tsx>) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen with live camera feed, bounding box overlays, and latency tracking.
:::

## Performance & Best Practices

- **Always Dispose Frames in `finally` & Catch Teardown Errors**: Frames created by VisionCamera and the GPU resizer represent scarce native memory and hardware texture allocations. Always call `resized?.dispose()` and `frame.dispose()` inside a `finally` block. Wrap the processing block in a `catch` to safely absorb errors caused by frames being closed mid-flight when the camera component unmounts.
- **Enable `dropFramesWhileBusy: true`**: Skips incoming camera sensor frames while inference is actively running, preventing queue buildup and ensuring real-time latency.
- **Enable `enablePhysicalBufferRotation: true`**: Automatically rotates the sensor buffer to match physical device orientation before reaching the GPU resizer, eliminating manual image rotation logic.
- **Match Resizer Settings to `ImageBuffer`**: ExecuTorch CV models expect interleaved RGB memory. Configure `useResizer` with `channelOrder: 'rgb'`, `pixelLayout: 'interleaved'`, `dataType: 'uint8'`, and `scaleMode: 'cover'`.

:::warning Hardware, Thermal & Battery Impact
Continuous neural network inference on live camera streams is computationally intensive. Operating the camera sensor, GPU resizer, and ExecuTorch runtime simultaneously puts high sustained load on the mobile SoC, leading to increased battery consumption and device heating (thermal throttling) during extended sessions.

To keep your app responsive and battery-efficient:

- **Activate on demand**: Only enable the camera and frame processing when actively needed, and disable camera capture when the screen unmounts or the app moves to the background.
- **Select mobile-optimized models**: Prefer lightweight models designed for real-time mobile inference over larger, computationally heavy architectures.
- **Throttle inference when appropriate**: If your feature does not strictly require 30+ FPS evaluation, skip frames or enforce a minimum time interval between inferences in your worklet to reduce thermal pressure.

:::

## Next Steps

- [Object Detection](./03-object-detection.md) — Detection models, COCO labels, and threshold options.
- [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) — Threading model, worklet runtimes, and zero-copy host objects.
