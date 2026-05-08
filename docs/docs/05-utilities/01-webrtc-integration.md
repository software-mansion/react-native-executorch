---
title: Fishjam Usage
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::danger
This integration is currently in beta.
:::

## Overview

Starting from v0.9.0, you can use `react-native-executorch` powered background blur integration in your [Fishjam](https://fishjam.io) applications. The package `react-native-executorch-webrtc` exposes a hook, which returns a middleware for your camera streams. We plan to extend this to other models, such as text to speech, speech to text, or other vision models in the future.

## Installation

Install the package with your package manager of choice. Make sure to also have `react-native-executorch` and a resource fetcher adapter installed (see [Getting Started](../01-fundamentals/01-getting-started.md)).

<Tabs>
  <TabItem value="npm" label="NPM">

    ```bash
    npm install react-native-executorch-webrtc
    ```

  </TabItem>
  <TabItem value="pnpm" label="PNPM">

    ```bash
    pnpm install react-native-executorch-webrtc
    ```

  </TabItem>
  <TabItem value="yarn" label="YARN">

    ```bash
    yarn add react-native-executorch-webrtc
    ```

  </TabItem>
</Tabs>

The following peer dependencies must also be installed in your app:

- `@fishjam-cloud/react-native-client`
- `@fishjam-cloud/react-native-webrtc`
- `react-native-executorch`

## Usage

The integration is built around the `SELFIE_SEGMENTATION` model that we export from `react-native-executorch`. It's the only model we currently support and tune for — the blur pipeline expects its specific input shape and output classes, so other segmentation models will not work correctly.

Use `ResourceFetcher` together with `SELFIE_SEGMENTATION.modelSource` to download (and cache) the model, then pass the resulting path to `useBackgroundBlur`. The returned `blurMiddleware` plugs into Fishjam's `cameraTrackMiddleware`.

```tsx
import { useEffect, useState } from 'react';
import { Button, Text } from 'react-native';
import { ResourceFetcher, SELFIE_SEGMENTATION } from 'react-native-executorch';
import { useBackgroundBlur } from 'react-native-executorch-webrtc';
import { useCamera } from '@fishjam-cloud/react-native-client';

function VideoCall() {
  const [modelUri, setModelUri] = useState<string | null>(null);

  useEffect(() => {
    ResourceFetcher.fetch(() => {}, SELFIE_SEGMENTATION.modelSource).then(
      (paths) => paths?.[0] && setModelUri(paths[0])
    );
  }, []);

  // Wait for the model to be available before mounting the hook —
  // useBackgroundBlur expects a real path, not an empty string.
  if (!modelUri) {
    return <Text>Downloading model…</Text>;
  }

  return <VideoCallWithBlur modelUri={modelUri} />;
}

function VideoCallWithBlur({ modelUri }: { modelUri: string }) {
  const [blurEnabled, setBlurEnabled] = useState(true);

  const { blurMiddleware } = useBackgroundBlur({
    modelUri,
    blurRadius: 15,
  });

  useCamera({
    cameraTrackMiddleware: blurEnabled ? blurMiddleware : undefined,
  });

  return (
    <Button
      title={blurEnabled ? 'Disable Blur' : 'Enable Blur'}
      onPress={() => setBlurEnabled(!blurEnabled)}
    />
  );
}
```

## API

### `useBackgroundBlur(options)`

| Option       | Type     | Description                                                                |
| ------------ | -------- | -------------------------------------------------------------------------- |
| `modelUri`   | `string` | **Required.** Path or `file://` URI to the segmentation `.pte` model.      |
| `blurRadius` | `number` | Optional. Gaussian blur sigma applied to the background. Defaults to `12`. |

Returns:

| Field            | Type              | Description                                                    |
| ---------------- | ----------------- | -------------------------------------------------------------- |
| `blurMiddleware` | `TrackMiddleware` | Pass to `useCamera({ cameraTrackMiddleware })` to enable blur. |

The hook initializes the native processor on mount and releases it on unmount, so you don't need to manage its lifecycle manually.
