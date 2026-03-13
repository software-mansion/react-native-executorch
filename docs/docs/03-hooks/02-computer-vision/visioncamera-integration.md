---
title: VisionCamera Integration
---

React Native ExecuTorch vision models support real-time frame processing via [VisionCamera](https://react-native-vision-camera-v5-docs.vercel.app) using the `runOnFrame` worklet. This page explains how `runOnFrame` works and how to use it with any supported model.

## Which models support runOnFrame?

The following hooks expose `runOnFrame`:

- [`useClassification`](./useClassification.md)
- [`useImageEmbeddings`](./useImageEmbeddings.md)
- [`useOCR`](./useOCR.md)
- [`useVerticalOCR`](./useVerticalOCR.md)
- [`useObjectDetection`](./useObjectDetection.md)
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

:::warning
`runOnFrame` runs synchronously on the JS thread. Keep processing time low to avoid dropping camera frames.
:::

## Setup

`runOnFrame` is a stable worklet function exposed directly from the hook. Pass it to `useFrameProcessor` and guard with `model.isReady` — no need to store it in state:

```tsx
import { useFrameProcessor } from 'react-native-vision-camera';
import { useClassification, EFFICIENTNET_V2_S } from 'react-native-executorch';

export default function App() {
  const model = useClassification({ model: EFFICIENTNET_V2_S });

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      if (!model.isReady) return;

      model.runOnFrame(frame); // use the returned result
    },
    [model.isReady, model.runOnFrame]
  );

  return <Camera frameProcessor={frameProcessor} isActive device={device} />;
}
```

## Full example (Classification)

```tsx
import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { useClassification, EFFICIENTNET_V2_S } from 'react-native-executorch';

export default function App() {
  const device = useCameraDevice('back');
  const model = useClassification({ model: EFFICIENTNET_V2_S });
  const [topLabel, setTopLabel] = useState<string>('');

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      if (!model.isReady) return;

      const scores = model.runOnFrame(frame);
      const top = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
      if (top) setTopLabel(top[0]);
    },
    [model.isReady, model.runOnFrame]
  );

  if (!device) return null;

  return (
    <>
      <Camera
        style={styles.camera}
        device={device}
        isActive
        frameProcessor={frameProcessor}
      />
      <Text>{topLabel}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  camera: { flex: 1 },
});
```
