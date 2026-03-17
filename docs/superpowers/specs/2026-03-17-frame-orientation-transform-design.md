# Frame Orientation Transform Design

**Date:** 2026-03-17
**Branch:** @nk/vision-models-camera-integration

## Problem

Camera sensors always output frames in a fixed landscape orientation. The raw pixel buffer passed to ML models is therefore sideways relative to what the user sees on screen. This causes two issues:

1. **Model quality** — models see a rotated frame (suboptimal but accepted tradeoff, same as MLKit)
2. **Coordinate mismatch** — output coordinates (bboxes, masks) are in the raw buffer's coordinate space, not screen space. Overlays are drawn in the wrong position.

Previously this was solved with `enablePhysicalBufferRotation` (Vision Camera physically pre-rotates the pixel buffer). This is expensive — it allocates and copies a rotated buffer every frame at 30–60 fps.

## Goal

Follow the MLKit pattern: pass orientation as metadata, never physically rotate the buffer. Each model's C++ postprocessing applies an inverse coordinate transform to its output so results are always returned in **screen space** — ready to draw without any app-side coordinate handling.

## Approach

Pass `orientation`, `isMirrored`, `frameWidth`, and `frameHeight` from JS alongside the native buffer pointer. C++ postprocessing reads these and applies the inverse transform to output coordinates/buffers before returning to JS.

## Data Flow

```
frameData = {
  nativeBuffer: frame.getNativeBuffer().pointer,  // BigInt
  orientation: frame.orientation,                  // "up"|"right"|"left"|"down"
  isMirrored: frame.isMirrored,                   // boolean
  frameWidth: frame.width,                         // raw frame width in pixels (sensor native)
  frameHeight: frame.height,                       // raw frame height in pixels (sensor native)
}
──► nativeGenerateFromFrame(frameData, ...args) ──► C++ model
                                                          │
                                                          ▼
                                               postprocessing applies
                                               inverse transform
                                                          │
                                                          ▼
                                               results in screen space ──► JS
```

`frame.width` and `frame.height` are the raw sensor dimensions (e.g. 1280×720 for a landscape sensor, regardless of how the phone is held).

## Transform Order

The inverse transform must apply operations in the correct order:

1. **Flip first** (if `isMirrored=true`): flip horizontally
2. **Rotate second**: apply inverse rotation based on `orientation`

This matches the order Vision Camera uses internally and ensures correct results for all orientation+mirror combinations.

**Note on `isMirrored` in practice:** Vision Camera currently always reports `isMirrored=false` for both front and back cameras — the front camera preview is mirrored at the display layer, not in the pixel buffer. Therefore the C++ `isMirrored` path is a no-op in practice. The front camera overlay mirror (`scaleX: -1`) is handled at the app's render layer, not by the library. The `isMirrored` field is passed and handled for correctness and future compatibility.

## Inverse Rotation Logic

`orientation` describes how the raw buffer is rotated relative to screen space. To transform output coords from buffer space to screen space:

| orientation | meaning                          | inverse transform |
| ----------- | -------------------------------- | ----------------- |
| `up`        | buffer matches screen            | no-op             |
| `right`     | buffer rotated 90° CW vs screen  | rotate 90° CCW    |
| `left`      | buffer rotated 90° CCW vs screen | rotate 90° CW     |
| `down`      | buffer rotated 180° vs screen    | rotate 180°       |

**Known limitation:** When `orientation="down"` (phone held upside down), the model sees a 180° rotated frame and detection quality may degrade. The coordinate transform will still run correctly — but model output quality in this orientation is not guaranteed. This is an accepted tradeoff, consistent with the MLKit approach.

## New Utility: `FrameTransform.h/cpp`

**Location:** `packages/react-native-executorch/common/rnexecutorch/utils/`

```cpp
namespace rnexecutorch::utils {

struct FrameOrientation {
  std::string orientation; // "up"|"right"|"left"|"down"
  bool isMirrored;
  int frameWidth;   // raw frame width (sensor native, before any rotation)
  int frameHeight;  // raw frame height (sensor native, before any rotation)
};

// Transform a bounding box from raw frame pixel space to screen space.
// Coordinates are absolute pixels in the raw frame (not normalized [0,1]).
// x1/y1 = top-left, x2/y2 = bottom-right.
void transformBbox(float &x1, float &y1, float &x2, float &y2,
                   const FrameOrientation &orient);

// Transform 4-point bbox (OCR quadrilateral) from raw frame pixel space to screen space.
// Templated on point type — requires P to have float x and y members.
// This avoids cross-layer coupling with ocr::types::Point while still compiling at call sites.
template <typename P>
void transformPoints(std::array<P, 4> &points, const FrameOrientation &orient);

// Rotate/flip a cv::Mat (mask or image) from raw frame space to screen space.
// Returns a new mat; does not modify the input.
cv::Mat transformMat(const cv::Mat &mat,
                     const FrameOrientation &orient);

} // namespace rnexecutorch::utils
```

## Changes Per Model

### VisionModule.ts

Restore passing `orientation`, `isMirrored`, `frameWidth`, `frameHeight` in `frameData`:

```
const frameData = {
  nativeBuffer: nativeBuffer.pointer,
  orientation: frame.orientation,
  isMirrored: frame.isMirrored,
  frameWidth: frame.width,
  frameHeight: frame.height,
};
```

C++ reads these via JSI `getProperty` in each model's `generateFromFrame` handler (same pattern as existing `nativeBuffer` reading in `FrameProcessor.cpp`).

### ObjectDetection.cpp

- Bboxes are already in absolute raw frame pixel space after the existing `widthRatio`/`heightRatio` scaling step
- After NMS, call `transformBbox` on each `Detection`'s `x1, y1, x2, y2`

### BaseSemanticSegmentation.cpp

- The existing `resize=true` path resizes the argmax/class mats to `originalSize` (raw frame dimensions)
- `transformMat` must be applied **after** the resize step, using the already-resized mat
- When `orientation` is `right` or `left`, the output mat dimensions will swap (width↔height) — this is correct screen-space behavior
- For the `resize=false` path, `transformMat` is applied to the model-output-sized mat
- After `transformMat`, the result mat must be copied into a new `OwningArrayBuffer` (same pattern as the existing resize step — `transformMat` returns a new `cv::Mat` whose lifetime must not outlive its data). Do not reuse the existing `OwningArrayBuffer`.

### StyleTransfer

- `transformMat` is applied to the output pixel buffer `cv::Mat` after inference
- The output mat is at **model resolution** (not raw frame resolution) — `runInference` returns a mat sized to `modelInputSize()`. This is intentional: style transfer outputs a stylized image at model resolution, and the transform puts it in the correct screen orientation at that resolution.
- `PixelDataResult.width` and `PixelDataResult.height` are set from the transformed mat's dimensions (will swap for `right`/`left` orientations)

### OCR

- Call `transformPoints` on each `OCRDetection`'s 4-point bbox after detection postprocessing
- If `VerticalOCR` / `VerticalDetector` also returns 4-point bboxes, apply the same `transformPoints` call

### Classification

- No transform needed — classification returns label+score with no spatial coordinates

### FrameProcessor.h

- Update `frameToMat` doc comment — remove reference to `enablePhysicalBufferRotation`

### Demo App (apps/computer-vision)

- Remove `enablePhysicalBufferRotation: true` from all three task components
- Keep `scaleX: -1` overlay for front camera — this mirrors the overlay to match the mirrored camera preview (Vision Camera mirrors the preview at the display layer; the pixel buffer is not mirrored, so `isMirrored=false` from the library)
- Remove orientation-based `iw`/`ih` swap in ObjectDetectionTask (no longer needed — results already in screen space)

## How It Behaves With Different Camera Setups

| orientationSource | enablePhysicalBufferRotation | orientation value   | Result                                     |
| ----------------- | ---------------------------- | ------------------- | ------------------------------------------ |
| `interface`       | false (default)              | fixed (e.g. `left`) | ✓ transform runs, screen-space results     |
| `interface`       | true                         | always `up`         | ✓ transform is no-op, screen-space results |
| `device`          | false (default)              | rotates with device | ✓ transform runs for each orientation      |
| `device`          | true                         | always `up`         | ✓ transform is no-op, screen-space results |

All configurations produce correct screen-space results. `enablePhysicalBufferRotation` is no longer required but remains compatible.
