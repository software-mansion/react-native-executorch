# react-native-executorch-webrtc

Real-time background blur for Fishjam WebRTC applications, powered by ExecuTorch segmentation models.

This package provides GPU-accelerated background blur effects using on-device ExecuTorch models for foreground / background segmentation.

## Requirements

- iOS 13.0+
- Android SDK 26+
- Peer dependencies:
- `@fishjam-cloud/react-native-client`
- `@fishjam-cloud/react-native-webrtc`
- `react-native-executorch`

## Installation

```bash
yarn add react-native-executorch-webrtc
```

For iOS:
```bash
cd ios && pod install
```

## Usage

### With Fishjam SDK

```tsx
import { useBackgroundBlur } from 'react-native-executorch-webrtc';
import { useCamera } from '@fishjam-cloud/react-native-client';

function VideoCall() {
  const [blurEnabled, setBlurEnabled] = useState(true);

  const { blurMiddleware } = useBackgroundBlur({
    // NOTE: you can use React Native Executorch's Resource Fetcher to download model files
    modelUri: 'file:///path/to/selfie_segmenter.pte',
    blurRadius: 15,
  });

  const { toggleCamera } = useCamera({
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

React hook that provides camera track middleware for background blur.

**Options:**
- `modelUri`: `string` - Path to the ExecuTorch segmentation model (.pte file)
- `blurRadius`: `number` (optional, default: 12) - Blur intensity

**Returns:**
- `blurMiddleware`: `TrackMiddleware` - Middleware function for use with Fishjam's `useCamera`

### Blur Radius

The `blurRadius` can be updated dynamically without reinitializing:

```tsx
const { blurMiddleware } = useBackgroundBlur({
  modelUri: modelPath,
  blurRadius: intensity,
});
```

## Platform Notes

### iOS
Uses Core Image for GPU-accelerated blur compositing.

### Android
Uses OpenGL ES shaders for blur and compositing. OpenMP is used for parallel CPU operations.

## License

MIT
