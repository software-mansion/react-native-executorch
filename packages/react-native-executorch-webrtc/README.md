# react-native-executorch-webrtc

ExecuTorch frame processor integration for react-native-webrtc.

Process WebRTC camera frames with ExecuTorch vision models in real-time.

## Installation

```bash
yarn add react-native-executorch-webrtc
```

**That's it!** The package auto-registers via React Native autolinking. No native code setup needed.

### Platform Support

- ✅ Android (auto-configured)
- 🚧 iOS (coming soon)

## Usage

### Basic Usage

Just import and use the hook - everything auto-registers:

```typescript
import { useWebRTCFrameProcessor } from 'react-native-executorch-webrtc';
import { RTCView, mediaDevices } from 'react-native-webrtc';

function WebRTCCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Enable ExecuTorch frame processing
  useWebRTCFrameProcessor(stream);

  useEffect(() => {
    async function startCamera() {
      const mediaStream = await mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      setStream(mediaStream);
    }
    startCamera();
  }, []);

  return <RTCView streamURL={stream?.toURL()} style={{ flex: 1 }} />;
}
```

### Manual Control

```typescript
import {
  enableFrameProcessor,
  disableFrameProcessor,
} from 'react-native-executorch-webrtc';

// Enable processing
const videoTrack = stream.getVideoTracks()[0];
enableFrameProcessor(videoTrack);

// Disable processing
disableFrameProcessor(videoTrack);
```

## API

### `useWebRTCFrameProcessor(stream, enabled?)`

React hook that automatically enables/disables frame processing.

**Parameters:**
- `stream`: `MediaStream | null | undefined` - The WebRTC media stream
- `enabled`: `boolean` (optional, default: `true`) - Whether to enable processing

### `enableFrameProcessor(videoTrack)`

Manually enable frame processing on a video track.

**Parameters:**
- `videoTrack`: `MediaStreamTrack` - The video track to process

### `disableFrameProcessor(videoTrack)`

Manually disable frame processing on a video track.

**Parameters:**
- `videoTrack`: `MediaStreamTrack` - The video track to stop processing

## Current Status

**✅ Implemented:**
- Android frame processor registration
- Frame info logging (FPS, resolution, etc.)
- TypeScript API and hooks

**🚧 Coming Soon:**
- ExecuTorch model integration
- Object detection on frames
- Segmentation on frames
- iOS support
- Result callbacks to JavaScript

## How It Works

1. The package registers a `VideoFrameProcessor` with react-native-webrtc
2. When enabled, every camera frame passes through the processor
3. The processor can run ExecuTorch models on each frame
4. Results are sent back to JavaScript (coming soon)

Currently, the processor logs frame information for debugging. Model inference integration is next.

## Example

See `apps/computer-vision` in the repo for a complete example.

## License

MIT
