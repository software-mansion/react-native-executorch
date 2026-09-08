# Real-Time Camera Processing

React Native ExecuTorch models can process live camera streams directly on-device with zero cloud dependencies. By combining [VisionCamera v5](https://visioncamera.margelo.com), [VisionCamera Resizer](https://github.com/mrousavy/react-native-vision-camera/tree/main/packages/react-native-vision-camera-resizer), and [`react-native-worklets`](https://docs.swmansion.com/react-native-worklets/), live camera frames are scaled and converted on the GPU directly into an [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer), processed synchronously inside the camera frame processor worklet, and dispatched back to the React JavaScript thread via [`scheduleOnRN`](https://docs.swmansion.com/react-native-worklets/docs/threading/scheduleOnRN/) with zero thread-switching or promise overhead.

<!-- -->

| iOS                                                           | Android                                                           |
| ------------------------------------------------------------- | ----------------------------------------------------------------- |
| [](/react-native-executorch/media/camera-integration-ios.mp4) | [](/react-native-executorch/media/camera-integration-android.mp4) |

## Quick Start[​](#quick-start "Direct link to Quick Start")

### 1. Installation[​](#1-installation "Direct link to 1. Installation")

Install VisionCamera v5 along with its resizer, worklets, and Nitro Modules dependencies (`react-native-worklets` is already installed as a peer dependency of `react-native-executorch`):

* npm
* yarn
* pnpm

```bash
npm install react-native-vision-camera react-native-vision-camera-resizer react-native-vision-camera-worklets react-native-nitro-modules

```

```bash
yarn add react-native-vision-camera react-native-vision-camera-resizer react-native-vision-camera-worklets react-native-nitro-modules

```

```bash
pnpm add react-native-vision-camera react-native-vision-camera-resizer react-native-vision-camera-worklets react-native-nitro-modules

```

Make sure you configure camera permissions in your project.

### 2. The `useFrameOutput` Pipeline[​](#2-the-useframeoutput-pipeline "Direct link to 2-the-useframeoutput-pipeline")

#### Imports & Constants[​](#imports--constants "Direct link to Imports & Constants")

Import the model hooks, VisionCamera frame processing utilities, GPU resizer, and worklets scheduler, and define the model's expected input dimensions:

```tsx
import { models, useObjectDetector } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

import { useFrameOutput } from 'react-native-vision-camera';
import { type GPUFrame, useResizer } from 'react-native-vision-camera-resizer';
import { scheduleOnRN } from 'react-native-worklets';

const INPUT_SIZE = { width: 384, height: 384 };

```

#### Model & GPU Resizer Setup[​](#model--gpu-resizer-setup "Direct link to Model & GPU Resizer Setup")

Initialize the [`useObjectDetector`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useObjectDetector) hook to obtain its synchronous [`detectObjectsWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useObjectDetector#detectobjectsworklet) method, and configure [`useResizer`](https://github.com/mrousavy/react-native-vision-camera/tree/main/packages/react-native-vision-camera-resizer) to crop and convert incoming camera frames directly on the GPU to match the model's required input resolution:

```tsx
const detector = useObjectDetector(models.objectDetection.YOLO26.NANO.SIZE_384.DEFAULT);
const { detectObjectsWorklet } = detector;

const { resizer } = useResizer({
  ...INPUT_SIZE,
  channelOrder: 'rgb',
  dataType: 'uint8',
  scaleMode: 'cover',
  pixelLayout: 'interleaved', // provides 'hwc' layout expected by ImageBuffer
});

```

#### Frame Processing Loop[​](#frame-processing-loop "Direct link to Frame Processing Loop")

Process each frame inside [`useFrameOutput`](https://visioncamera.margelo.com/docs/camera-outputs). The [`resizer`](https://github.com/mrousavy/react-native-vision-camera/tree/main/packages/react-native-vision-camera-resizer) converts the frame on the GPU, wraps it in an [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer), runs inference synchronously on the worklet thread, and posts the results back to React with [`scheduleOnRN`](https://docs.swmansion.com/react-native-worklets/docs/threading/scheduleOnRN/):

```tsx
const frameOutput = useFrameOutput({
  pixelFormat: 'yuv',
  dropFramesWhileBusy: true,
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
  orientationSource="interface"
  outputs={[frameOutput]}
  resizeMode="cover"
/>

```

Connecting `frameOutput` through the `outputs` prop attaches your processing pipeline directly to the active camera session. Because inference runs inside the worklet runtime with `dropFramesWhileBusy: true`, the camera preview continues rendering smoothly at hardware display refresh rates without UI stutter. VisionCamera allows combining `frameOutput` with interactive camera controls (such as tap-to-focus, zoom, and exposure bias) as well as other capture outputs. See the [VisionCamera Camera Outputs documentation](https://visioncamera.margelo.com/docs/camera-outputs) for full configuration options.

### 3. Transforming Model Coordinates to Screen Space[​](#3-transforming-model-coordinates-to-screen-space "Direct link to 3. Transforming Model Coordinates to Screen Space")

Vision models predict spatial outputs—such as bounding boxes (object detection), skeletal landmarks (pose estimation), segmentation masks, or text bounding polygons (OCR)—relative to the model's resized input tensor coordinate space (e.g. 384×384). To render overlays, markers, or contours accurately over the camera viewfinder, coordinate transformations must account for:

* **Landscape-Native Sensors**: Physical camera sensors are mounted in landscape orientation. In portrait mode, the sensor frame's width and height dimensions are inverted relative to screen space.
* **Compound Aspect-Fill Scaling**: Both the GPU resizer (`useResizer` with `scaleMode: 'cover'`) and the camera viewfinder (`<Camera resizeMode="cover" />`) typically apply aspect-fill cropping. The overlay mapping needs to account for the compound scaling factor and centering offsets between the model tensor and the rendered viewfinder canvas.
* **Coordinate Remapping**: Mapping normalized or pixel `(x, y)` coordinates from the cropped tensor space back onto the visible camera viewport coordinates.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Reference Implementation in Gallery App

See [`src/app/(screens)/realtime-object-detection.tsx`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/src/app/\(screens\)/realtime-object-detection.tsx) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete reference implementation of viewport coordinate transforms, orientation normalization, and real-time visual overlays.

## Performance & Best Practices[​](#performance--best-practices "Direct link to Performance & Best Practices")

* **Always Dispose Frames in `finally`**: Both VisionCamera frames and GPU resizer textures represent native memory allocations. Always call `resized?.dispose()` and `frame.dispose()` inside a `finally` block to prevent leaks and crashes.
* **Enable `dropFramesWhileBusy: true`**: Skips incoming camera sensor frames while inference is running, preventing queue buildup and ensuring real-time responsiveness.
* **Avoid `enablePhysicalBufferRotation`**: Keep this prop `false` (the default) to avoid unnecessary extra buffer allocations and potential GPU memory issues on Android.
* **Match Orientation to UI**: Use `orientationSource="interface"` when your app's UI is locked in portrait so that the camera preview and overlays stay anchored to screen coordinates.
* **Use `pixelFormat: 'yuv'`**: Recommended for maximum Android camera compatibility across devices. The GPU resizer efficiently converts YUV to RGB before passing it to the model.
* **Match Resizer Settings to `ImageBuffer`**: Configure `useResizer` with `channelOrder: 'rgb'`, `pixelLayout: 'interleaved'`, and `dataType: 'uint8'` to match ExecuTorch's expected format.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Hardware, Thermal & Battery Impact

Continuous neural network inference on live camera streams is computationally intensive. Operating the camera sensor, GPU resizer, and ExecuTorch runtime simultaneously puts high sustained load on the mobile SoC, leading to increased battery consumption and device heating (thermal throttling) during extended sessions.

To keep your app responsive and battery-efficient:

* **Activate on demand**: Only enable the camera and frame processing when actively needed, and disable camera capture when the screen unmounts or the app moves to the background.
* **Select mobile-optimized models**: Prefer lightweight models designed for real-time mobile inference over larger, computationally heavy architectures.
* **Throttle inference when appropriate**: If your feature does not strictly require 30+ FPS evaluation, skip frames or enforce a minimum time interval between inferences in your worklet to reduce thermal pressure.

## Next Steps[​](#next-steps "Direct link to Next Steps")

* [Object Detection](https://docs.swmansion.com/react-native-executorch/docs/extensions/object-detection.md) — Detection models, COCO labels, and threshold options.
* [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) — Threading model, worklet runtimes, and zero-copy host objects.
