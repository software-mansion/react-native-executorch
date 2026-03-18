---
title: VisionCamera Integration
---

React Native ExecuTorch vision models support real-time frame processing via [VisionCamera v5](https://react-native-vision-camera-v5-docs.vercel.app) using the `runOnFrame` worklet. This page explains how to set it up and what to watch out for.

## Prerequisites

Make sure you have the following packages installed:

- [`react-native-vision-camera`](https://react-native-vision-camera-v5-docs.vercel.app) v5
- [`react-native-worklets`](https://docs.swmansion.com/react-native-worklets/)

## Which models support runOnFrame?

The following hooks expose `runOnFrame`:

- [`useClassification`](./useClassification.md)
- [`useImageEmbeddings`](./useImageEmbeddings.md)
- [`useOCR`](./useOCR.md)
- [`useVerticalOCR`](./useVerticalOCR.md)
- [`useObjectDetection`](./useObjectDetection.md)
- [`useInstanceSegmentation`](./useInstanceSegmentation.md)
- [`useSemanticSegmentation`](./useSemanticSegmentation.md)
- [`useStyleTransfer`](./useStyleTransfer.md)

## runOnFrame vs forward

|          | `runOnFrame`         | `forward`                  |
| -------- | -------------------- | -------------------------- |
| Thread   | JS (worklet)         | Background thread          |
| Input    | VisionCamera `Frame` | `string` URI / `PixelData` |
| Output   | Model result (sync)  | `Promise<result>`          |
| Use case | Real-time camera     | Single image               |

Use `runOnFrame` when you need to process every camera frame. Use `forward` for one-off image inference.

## How it works

VisionCamera v5 delivers frames via [`useFrameOutput`](https://react-native-vision-camera-v5-docs.vercel.app/docs/frame-output). Inside the `onFrame` worklet you call `runOnFrame(frame)` synchronously, then use `scheduleOnRN` from `react-native-worklets` to post the result back to React state on the main thread.

:::warning
You **must** set `pixelFormat: 'rgb'` in `useFrameOutput`. Our extraction pipeline expect RGB pixel data — any other format (e.g. the default `yuv`) will produce incorrect results.
:::

:::warning
`runOnFrame` is synchronous and runs on the JS worklet thread. For models with longer inference times, use `dropFramesWhileBusy: true` to skip frames and avoid blocking the camera pipeline. For more control, see VisionCamera's [async frame processing guide](https://react-native-vision-camera-v5-docs.vercel.app/docs/async-frame-processing).
:::

:::note
Always call `frame.dispose()` after processing to release the frame buffer. Wrap your inference in a `try/finally` to ensure it's always called even if `runOnFrame` throws.
:::

## Full example (Classification)

```tsx
import { useState, useCallback } from 'react';
import { Text, StyleSheet } from 'react-native';
import {
  Camera,
  Frame,
  useCameraDevices,
  useCameraPermission,
  useFrameOutput,
} from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';
import { useClassification, EFFICIENTNET_V2_S } from 'react-native-executorch';

export default function App() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const model = useClassification({ model: EFFICIENTNET_V2_S });
  const [topLabel, setTopLabel] = useState('');

  // Extract runOnFrame so it can be captured by the useCallback dependency array
  const runOnFrame = model.runOnFrame;

  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    dropFramesWhileBusy: true,
    onFrame: useCallback(
      (frame: Frame) => {
        'worklet';
        if (!runOnFrame) return;
        try {
          const scores = runOnFrame(frame);
          if (scores) {
            let best = '';
            let bestScore = -1;
            for (const [label, score] of Object.entries(scores)) {
              if ((score as number) > bestScore) {
                bestScore = score as number;
                best = label;
              }
            }
            scheduleOnRN(setTopLabel, best);
          }
        } finally {
          frame.dispose();
        }
      },
      [runOnFrame]
    ),
  });

  if (!hasPermission) {
    requestPermission();
    return null;
  }

  if (!device) return null;

  return (
    <>
      <Camera
        style={styles.camera}
        device={device}
        outputs={[frameOutput]}
        isActive
      />
      <Text style={styles.label}>{topLabel}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  camera: { flex: 1 },
  label: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    color: 'white',
    fontSize: 20,
  },
});
```

## Using the Module API

If you use the TypeScript Module API (e.g. `ClassificationModule`) directly instead of a hook, `runOnFrame` is a worklet function and **cannot** be passed directly to `useState` — React would invoke it as a state initializer. Use the functional updater form `() => module.runOnFrame`:

```tsx
import { useState, useEffect, useCallback } from 'react';
import { Camera, useFrameOutput } from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';
import {
  ClassificationModule,
  EFFICIENTNET_V2_S,
} from 'react-native-executorch';

export default function App() {
  const [module] = useState(() => new ClassificationModule());
  const [runOnFrame, setRunOnFrame] = useState<typeof module.runOnFrame | null>(
    null
  );

  useEffect(() => {
    module.load(EFFICIENTNET_V2_S).then(() => {
      // () => module.runOnFrame is required — passing module.runOnFrame directly
      // would cause React to call it as a state initializer function
      setRunOnFrame(() => module.runOnFrame);
    });
  }, [module]);

  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    dropFramesWhileBusy: true,
    onFrame: useCallback(
      (frame) => {
        'worklet';
        if (!runOnFrame) return;
        try {
          const result = runOnFrame(frame);
          if (result) scheduleOnRN(setResult, result);
        } finally {
          frame.dispose();
        }
      },
      [runOnFrame]
    ),
  });

  return <Camera outputs={[frameOutput]} isActive device={device} />;
}
```

## Common issues

### Results look wrong or scrambled

You forgot to set `pixelFormat: 'rgb'`. The default VisionCamera pixel format is `yuv` — our frame extraction works only with RGB data.

### App freezes or camera drops frames

Your model's inference time exceeds the frame interval. Enable `dropFramesWhileBusy: true` in `useFrameOutput`, or move inference off the worklet thread using VisionCamera's [async frame processing](https://react-native-vision-camera-v5-docs.vercel.app/docs/async-frame-processing).

### Memory leak / crash after many frames

You are not calling `frame.dispose()`. Always dispose the frame in a `finally` block.

### `runOnFrame` is always null

The model hasn't finished loading yet. Guard with `if (!runOnFrame) return` inside `onFrame`, or check `model.isReady` before enabling the camera.

### TypeError: `module.runOnFrame` is not a function (Module API)

You passed `module.runOnFrame` directly to `setState` instead of `() => module.runOnFrame`. React invoked it as a state initializer — see the [Module API section](#using-the-module-api) above.
