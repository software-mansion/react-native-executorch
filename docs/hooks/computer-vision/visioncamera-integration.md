# VisionCamera Integration

React Native ExecuTorch vision models support real-time frame processing via [VisionCamera v5](https://react-native-vision-camera-v5-docs.vercel.app) using the `runOnFrame` worklet. This page explains how to set it up and what to watch out for.

## Prerequisites[​](#prerequisites "Direct link to Prerequisites")

Make sure you have the following packages installed:

* [`react-native-vision-camera`](https://react-native-vision-camera-v5-docs.vercel.app) v5
* [`react-native-worklets`](https://docs.swmansion.com/react-native-worklets/)

## Which models support runOnFrame?[​](#which-models-support-runonframe "Direct link to Which models support runOnFrame?")

The following hooks expose `runOnFrame`:

* [`useClassification`](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useClassification.md)
* [`useImageEmbeddings`](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useImageEmbeddings.md)
* [`useOCR`](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useOCR.md)
* [`useVerticalOCR`](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useVerticalOCR.md)
* [`useObjectDetection`](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useObjectDetection.md)
* [`useInstanceSegmentation`](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useInstanceSegmentation.md)
* [`useSemanticSegmentation`](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useSemanticSegmentation.md)
* [`useStyleTransfer`](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useStyleTransfer.md)

## runOnFrame vs forward[​](#runonframe-vs-forward "Direct link to runOnFrame vs forward")

|          | `runOnFrame`         | `forward`                  |
| -------- | -------------------- | -------------------------- |
| Thread   | JS (worklet)         | Background thread          |
| Input    | VisionCamera `Frame` | `string` URI / `PixelData` |
| Output   | Model result (sync)  | `Promise<result>`          |
| Use case | Real-time camera     | Single image               |

Use `runOnFrame` when you need to process every camera frame. Use `forward` for one-off image inference.

## How it works[​](#how-it-works "Direct link to How it works")

VisionCamera v5 delivers frames via [`useFrameOutput`](https://react-native-vision-camera-v5-docs.vercel.app/docs/frame-output). Inside the `onFrame` worklet you call `runOnFrame(frame, isFrontCamera)` synchronously, then use `scheduleOnRN` from `react-native-worklets` to post the result back to React state on the main thread.

The `isFrontCamera` parameter tells the native side whether the front camera is active so it can correctly mirror the results. The library handles all device orientation rotation internally — results are always returned in screen-space coordinates regardless of how the user holds their device.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

You **must** set `pixelFormat: 'rgb'` in `useFrameOutput`. Our extraction pipeline expects RGB pixel data — any other format (e.g. the default `yuv`) will produce incorrect results.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

`runOnFrame` is synchronous and runs on the JS worklet thread. For models with longer inference times, use `dropFramesWhileBusy: true` to skip frames and avoid blocking the camera pipeline. For more control, see VisionCamera's [async frame processing guide](https://react-native-vision-camera-v5-docs.vercel.app/docs/async-frame-processing).

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)note

Always call `frame.dispose()` after processing to release the frame buffer. Wrap your inference in a `try/finally` to ensure it's always called even if `runOnFrame` throws.

## Camera configuration[​](#camera-configuration "Direct link to Camera configuration")

The `Camera` component requires specific props for correct orientation handling:

```tsx
<Camera
  device={device}
  outputs={[frameOutput]}
  isActive
  orientationSource="device"
/>

```

* **`orientationSource="device"`** — ensures frame orientation metadata reflects the physical device orientation, which the library uses to rotate model inputs and outputs correctly.
* **Do not set `enablePhysicalBufferRotation`** — this prop must remain `false` (the default). If enabled, VisionCamera pre-rotates the pixel buffer, which conflicts with the library's own orientation handling and produces incorrect results.

## Full example (Object Detection)[​](#full-example-object-detection "Direct link to Full example (Object Detection)")

```tsx
import { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  Camera,
  Frame,
  useCameraDevices,
  useCameraPermission,
  useFrameOutput,
} from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';
import {
  Detection,
  useObjectDetection,
  SSDLITE_320_MOBILENET_V3_LARGE,
} from 'react-native-executorch';

export default function App() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const model = useObjectDetection({ model: SSDLITE_320_MOBILENET_V3_LARGE });
  const [detections, setDetections] = useState<Detection[]>([]);

  const detRof = model.runOnFrame;

  const updateDetections = useCallback((results: Detection[]) => {
    setDetections(results);
  }, []);

  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    dropFramesWhileBusy: true,
    onFrame: useCallback(
      (frame: Frame) => {
        'worklet';
        try {
          if (!detRof) return;
          const isFrontCamera = false; // using back camera
          const result = detRof(frame, isFrontCamera, 0.5);
          if (result) {
            scheduleOnRN(updateDetections, result);
          }
        } finally {
          frame.dispose();
        }
      },
      [detRof, updateDetections]
    ),
  });

  if (!hasPermission) {
    requestPermission();
    return null;
  }

  if (!device) return null;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        outputs={[frameOutput]}
        isActive
        orientationSource="device"
      />
      {detections.map((det, i) => (
        <Text key={i} style={styles.label}>
          {det.label} {(det.score * 100).toFixed(1)}%
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    color: 'white',
    fontSize: 16,
  },
});

```

For a complete example showing how to render bounding boxes, segmentation masks, OCR overlays, and style transfer results on top of the camera preview, see the [example app's VisionCamera tasks](https://github.com/software-mansion/react-native-executorch/tree/main/apps/computer-vision/components/vision_camera).

## Handling front/back camera[​](#handling-frontback-camera "Direct link to Handling front/back camera")

When switching between front and back cameras, you need to pass the correct `isFrontCamera` value to `runOnFrame`. Since worklets cannot read React state directly, use a `Synchronizable` from `react-native-worklets`:

```tsx
import { createSynchronizable } from 'react-native-worklets';

// Create outside the component so it's stable across renders
const cameraPositionSync = createSynchronizable<'front' | 'back'>('back');

export default function App() {
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>(
    'back'
  );

  // Keep the synchronizable in sync with React state
  useEffect(() => {
    cameraPositionSync.setBlocking(cameraPosition);
  }, [cameraPosition]);

  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    dropFramesWhileBusy: true,
    onFrame: useCallback((frame: Frame) => {
      'worklet';
      try {
        if (!runOnFrame) return;
        const isFrontCamera = cameraPositionSync.getDirty() === 'front';
        const result = runOnFrame(frame, isFrontCamera);
        // ... handle result
      } finally {
        frame.dispose();
      }
    }, []),
  });

  // ...
}

```

## Using the Module API[​](#using-the-module-api "Direct link to Using the Module API")

If you use the TypeScript Module API (e.g. `ClassificationModule`) directly instead of a hook, `runOnFrame` is a worklet function and **cannot** be passed directly to `useState` — React would invoke it as a state initializer. Use the functional updater form `() => module.runOnFrame`:

```tsx
import { useState, useEffect, useCallback } from 'react';
import { Text, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameOutput,
} from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';
import {
  ClassificationModule,
  EFFICIENTNET_V2_S,
} from 'react-native-executorch';

export default function App() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const [runOnFrame, setRunOnFrame] = useState<any>(null);
  const [topLabels, setTopLabels] = useState<any[]>([]);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    ClassificationModule.fromModelName(EFFICIENTNET_V2_S).then((module) => {
      // () => module.runOnFrame is required — passing module.runOnFrame directly
      // would cause React to call it as a state initializer function
      setRunOnFrame(() => module.runOnFrame);
    });
  }, []);

  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    dropFramesWhileBusy: true,
    onFrame: useCallback(
      (frame) => {
        'worklet';
        if (!runOnFrame) return;
        try {
          const isFrontCamera = false;
          const result = runOnFrame(frame, isFrontCamera);
          if (result) {
            const sorted = Object.entries(result)
              .map(([label, score]) => ({ label, score: score as number }))
              .sort((a, b) => b.score - a.score)
              .slice(0, 5);
            scheduleOnRN(setTopLabels, sorted);
          }
        } finally {
          frame.dispose();
        }
      },
      [runOnFrame]
    ),
  });

  if (!device || !hasPermission)
    return (
      <Text>
        {!hasPermission ? 'No camera permission' : 'No camera device'}
      </Text>
    );

  return (
    <View style={{ flex: 1 }}>
      <Camera
        style={{ flex: 1 }}
        outputs={[frameOutput]}
        isActive
        device={device}
        orientationSource="device"
      />
      <View style={{ position: 'absolute', bottom: 40, left: 16 }}>
        {topLabels.map(({ label, score }) => (
          <Text key={label} style={{ color: 'black', fontSize: 16 }}>
            {label}: {(score * 100).toFixed(1)}%
          </Text>
        ))}
      </View>
    </View>
  );
}

```

## Common issues[​](#common-issues "Direct link to Common issues")

#### Bounding boxes or masks are rotated / misaligned[​](#bounding-boxes-or-masks-are-rotated--misaligned "Direct link to Bounding boxes or masks are rotated / misaligned")

Make sure you have set `orientationSource="device"` on the `Camera` component. Without it, the frame orientation metadata won't match the actual device orientation, causing misaligned results.

Also verify that `enablePhysicalBufferRotation` is **not** set to `true` — this conflicts with the library's orientation handling.

#### Results look wrong or scrambled[​](#results-look-wrong-or-scrambled "Direct link to Results look wrong or scrambled")

You forgot to set `pixelFormat: 'rgb'`. The default VisionCamera pixel format is `yuv` — our frame extraction works only with RGB data.

#### Results are mirrored on front camera[​](#results-are-mirrored-on-front-camera "Direct link to Results are mirrored on front camera")

You are not passing `isFrontCamera: true` when using the front camera. See [Handling front/back camera](#handling-frontback-camera) above.

#### App freezes or camera drops frames[​](#app-freezes-or-camera-drops-frames "Direct link to App freezes or camera drops frames")

Your model's inference time exceeds the frame interval. Enable `dropFramesWhileBusy: true` in `useFrameOutput`, or move inference off the worklet thread using VisionCamera's [async frame processing](https://react-native-vision-camera-v5-docs.vercel.app/docs/async-frame-processing).

#### Memory leak / crash after many frames[​](#memory-leak--crash-after-many-frames "Direct link to Memory leak / crash after many frames")

You are not calling `frame.dispose()`. Always dispose the frame in a `finally` block.

#### `runOnFrame` is always null[​](#runonframe-is-always-null "Direct link to runonframe-is-always-null")

The model hasn't finished loading yet. Guard with `if (!runOnFrame) return` inside `onFrame`, or check `model.isReady` before enabling the camera.

#### TypeError: `module.runOnFrame` is not a function (Module API)[​](#typeerror-modulerunonframe-is-not-a-function-module-api "Direct link to typeerror-modulerunonframe-is-not-a-function-module-api")

You passed `module.runOnFrame` directly to `setState` instead of `() => module.runOnFrame`. React invoked it as a state initializer — see the [Module API section](#using-the-module-api) above.
