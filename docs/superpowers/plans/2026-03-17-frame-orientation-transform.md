# Frame Orientation Transform Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform all vision model outputs (bboxes, masks, pixel buffers) from raw camera buffer space to screen space using orientation metadata, eliminating the need for `enablePhysicalBufferRotation`.

**Architecture:** A new JSI-free `FrameTransform` utility applies inverse transforms to model outputs. `VisionModule.ts` passes `orientation`, `isMirrored`, `frameWidth`, `frameHeight` in `frameData`. Each model's `generateFromFrame` reads these via `VisionModel::extractFrameOrientation` (or directly for OCR) and transforms its output before returning.

**Tech Stack:** C++ (OpenCV, JSI), TypeScript (React Native Worklets, Vision Camera v5)

**Spec:** `docs/superpowers/specs/2026-03-17-frame-orientation-transform-design.md`

---

## Chunk 1: `FrameTransform` utility (JSI-free)

### Task 1: Create `FrameTransform.h` and `FrameTransform.cpp`

**Files:**
- Create: `packages/react-native-executorch/common/rnexecutorch/utils/FrameTransform.h`
- Create: `packages/react-native-executorch/common/rnexecutorch/utils/FrameTransform.cpp`
- Create: `packages/react-native-executorch/common/rnexecutorch/tests/unit/FrameTransformTest.cpp`
- Modify: `packages/react-native-executorch/common/rnexecutorch/tests/CMakeLists.txt`

**Context:** `FrameTransform.h` must NOT include `<jsi/jsi.h>` — it needs to be usable in unit tests that don't have JSI stubs. Tests are Android-only GoogleTest (the CMakeLists.txt starts with `if(NOT ANDROID_ABI)`). Look at `tests/unit/FrameProcessorTest.cpp` for the existing test style.

- [ ] **Step 1: Write the failing test file**

Create `packages/react-native-executorch/common/rnexecutorch/tests/unit/FrameTransformTest.cpp`:

```cpp
#include <gtest/gtest.h>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/utils/FrameTransform.h>

using namespace rnexecutorch::utils;

static FrameOrientation makeOrient(const std::string &o, bool mirrored,
                                   int w, int h) {
  return {o, mirrored, w, h};
}

// ============================================================================
// transformBbox — "up" (no-op)
// ============================================================================
TEST(TransformBboxUp, NoOpWhenOrientationIsUp) {
  auto orient = makeOrient("up", false, 640, 480);
  float x1 = 10, y1 = 20, x2 = 100, y2 = 200;
  transformBbox(x1, y1, x2, y2, orient);
  EXPECT_FLOAT_EQ(x1, 10);
  EXPECT_FLOAT_EQ(y1, 20);
  EXPECT_FLOAT_EQ(x2, 100);
  EXPECT_FLOAT_EQ(y2, 200);
}

// ============================================================================
// transformBbox — "right" (CCW: new_x=y, new_y=frameW-x)
// Raw frame w=480, h=640. Box (10,20)-(100,200):
//   new_x1=y1=20, new_y1=w-x2=480-100=380
//   new_x2=y2=200, new_y2=w-x1=480-10=470
// ============================================================================
TEST(TransformBboxRight, AppliesCCWRotation) {
  auto orient = makeOrient("right", false, 480, 640);
  float x1 = 10, y1 = 20, x2 = 100, y2 = 200;
  transformBbox(x1, y1, x2, y2, orient);
  EXPECT_FLOAT_EQ(x1, 20);
  EXPECT_FLOAT_EQ(y1, 380);
  EXPECT_FLOAT_EQ(x2, 200);
  EXPECT_FLOAT_EQ(y2, 470);
}

// ============================================================================
// transformBbox — "left" (CW: new_x=frameH-y, new_y=x)
// Raw frame w=480, h=640. Box (10,20)-(100,200):
//   new_x1=h-y2=640-200=440, new_y1=x1=10
//   new_x2=h-y1=640-20=620,  new_y2=x2=100
// ============================================================================
TEST(TransformBboxLeft, AppliesCWRotation) {
  auto orient = makeOrient("left", false, 480, 640);
  float x1 = 10, y1 = 20, x2 = 100, y2 = 200;
  transformBbox(x1, y1, x2, y2, orient);
  EXPECT_FLOAT_EQ(x1, 440);
  EXPECT_FLOAT_EQ(y1, 10);
  EXPECT_FLOAT_EQ(x2, 620);
  EXPECT_FLOAT_EQ(y2, 100);
}

// ============================================================================
// transformBbox — "down" (180°: new_x=w-x, new_y=h-y)
// w=640, h=480. Box (10,20)-(100,200) → (540,280)-(630,460)
// ============================================================================
TEST(TransformBboxDown, Applies180Rotation) {
  auto orient = makeOrient("down", false, 640, 480);
  float x1 = 10, y1 = 20, x2 = 100, y2 = 200;
  transformBbox(x1, y1, x2, y2, orient);
  EXPECT_FLOAT_EQ(x1, 540);
  EXPECT_FLOAT_EQ(y1, 280);
  EXPECT_FLOAT_EQ(x2, 630);
  EXPECT_FLOAT_EQ(y2, 460);
}

// ============================================================================
// transformBbox — isMirrored=true with "up"
// Flip: new_x = w - x. w=640. Box (10,20)-(100,200) → (540,20)-(630,200)
// ============================================================================
TEST(TransformBboxMirrored, FlipsHorizontallyBeforeRotation) {
  auto orient = makeOrient("up", true, 640, 480);
  float x1 = 10, y1 = 20, x2 = 100, y2 = 200;
  transformBbox(x1, y1, x2, y2, orient);
  EXPECT_FLOAT_EQ(x1, 540);
  EXPECT_FLOAT_EQ(y1, 20);
  EXPECT_FLOAT_EQ(x2, 630);
  EXPECT_FLOAT_EQ(y2, 200);
}

// ============================================================================
// transformMat — "up" (no-op: same dimensions)
// ============================================================================
TEST(TransformMatUp, SameDimensions) {
  cv::Mat input(480, 640, CV_8UC3, cv::Scalar(1, 2, 3));
  auto orient = makeOrient("up", false, 640, 480);
  cv::Mat result = transformMat(input, orient);
  EXPECT_EQ(result.rows, 480);
  EXPECT_EQ(result.cols, 640);
}

// ============================================================================
// transformMat — "right" (CCW: rows and cols swap)
// Input 640 rows × 480 cols → output 480 rows × 640 cols
// ============================================================================
TEST(TransformMatRight, SwapsDimensions) {
  cv::Mat input(640, 480, CV_8UC3);
  auto orient = makeOrient("right", false, 480, 640);
  cv::Mat result = transformMat(input, orient);
  EXPECT_EQ(result.rows, 480);
  EXPECT_EQ(result.cols, 640);
}

// ============================================================================
// transformMat — "left" (CW: rows and cols swap)
// ============================================================================
TEST(TransformMatLeft, SwapsDimensions) {
  cv::Mat input(640, 480, CV_8UC3);
  auto orient = makeOrient("left", false, 480, 640);
  cv::Mat result = transformMat(input, orient);
  EXPECT_EQ(result.rows, 480);
  EXPECT_EQ(result.cols, 640);
}

// ============================================================================
// transformMat — "down" (180°: same dimensions)
// ============================================================================
TEST(TransformMatDown, SameDimensions) {
  cv::Mat input(480, 640, CV_8UC3);
  auto orient = makeOrient("down", false, 640, 480);
  cv::Mat result = transformMat(input, orient);
  EXPECT_EQ(result.rows, 480);
  EXPECT_EQ(result.cols, 640);
}

// ============================================================================
// transformMat — isMirrored (flip then rotate)
// 1×2 mat: left=(255,0,0), right=(0,0,255). After H-flip: left=(0,0,255), right=(255,0,0)
// ============================================================================
TEST(TransformMatMirrored, FlipsBeforeRotation) {
  cv::Mat input(1, 2, CV_8UC3);
  input.at<cv::Vec3b>(0, 0) = {255, 0, 0};
  input.at<cv::Vec3b>(0, 1) = {0, 0, 255};
  auto orient = makeOrient("up", true, 2, 1);
  cv::Mat result = transformMat(input, orient);
  EXPECT_EQ(result.at<cv::Vec3b>(0, 0), (cv::Vec3b{0, 0, 255}));
  EXPECT_EQ(result.at<cv::Vec3b>(0, 1), (cv::Vec3b{255, 0, 0}));
}

// ============================================================================
// transformPoints — "up" (no-op)
// ============================================================================
TEST(TransformPointsUp, NoOp) {
  struct Pt { float x; float y; };
  std::array<Pt, 4> pts = {{{10,20},{30,20},{30,40},{10,40}}};
  auto orient = makeOrient("up", false, 640, 480);
  transformPoints(pts, orient);
  EXPECT_FLOAT_EQ(pts[0].x, 10);
  EXPECT_FLOAT_EQ(pts[0].y, 20);
  EXPECT_FLOAT_EQ(pts[2].x, 30);
  EXPECT_FLOAT_EQ(pts[2].y, 40);
}

// ============================================================================
// transformPoints — "right" (CCW per point: new_x=y, new_y=w-x)
// w=480. Point (10,20) → (20, 470)
// ============================================================================
TEST(TransformPointsRight, AppliesCCWPerPoint) {
  struct Pt { float x; float y; };
  std::array<Pt, 4> pts = {{{10,20},{10,20},{10,20},{10,20}}};
  auto orient = makeOrient("right", false, 480, 640);
  transformPoints(pts, orient);
  EXPECT_FLOAT_EQ(pts[0].x, 20);
  EXPECT_FLOAT_EQ(pts[0].y, 470);
}
```

- [ ] **Step 2: Register the test in CMakeLists.txt**

In `packages/react-native-executorch/common/rnexecutorch/tests/CMakeLists.txt`, add after the `FrameProcessorTests` entry (after line 166):

```cmake
add_rn_test(FrameTransformTests unit/FrameTransformTest.cpp
    SOURCES
        ${RNEXECUTORCH_DIR}/utils/FrameTransform.cpp
    LIBS opencv_deps
)
```

**Important:** Do NOT add `jsi` or `android` to LIBS — this test must be JSI-free.

- [ ] **Step 3: Attempt to build — confirm test fails to compile (header missing)**

```bash
cd apps/computer-vision/android
./gradlew :react-native-executorch:runFrameTransformTests 2>&1 | head -30
```

Expected: compile error — `rnexecutorch/utils/FrameTransform.h` not found.

- [ ] **Step 4: Create `FrameTransform.h`**

Create `packages/react-native-executorch/common/rnexecutorch/utils/FrameTransform.h`:

```cpp
#pragma once

// NOTE: This header must NOT include <jsi/jsi.h> — it is used in JSI-free unit tests.

#include <array>
#include <string>
#include <opencv2/opencv.hpp>

namespace rnexecutorch::utils {

struct FrameOrientation {
  std::string orientation; // "up"|"right"|"left"|"down"
  bool isMirrored;
  int frameWidth;  // raw frame width (sensor native, before any rotation)
  int frameHeight; // raw frame height (sensor native, before any rotation)
};

/**
 * @brief Transform a bounding box from raw frame pixel space to screen space.
 *
 * Applies flip (if isMirrored) then inverse rotation based on orientation.
 * Coordinates are absolute pixels in the raw frame (not normalized [0,1]).
 * x1/y1 = top-left corner, x2/y2 = bottom-right corner.
 * After transform, x1<=x2 and y1<=y2 are guaranteed.
 */
void transformBbox(float &x1, float &y1, float &x2, float &y2,
                   const FrameOrientation &orient);

/**
 * @brief Rotate/flip a cv::Mat from raw frame space to screen space.
 *
 * Returns a new mat (does not modify input).
 * For right/left orientations, output rows/cols are swapped vs input.
 */
cv::Mat transformMat(const cv::Mat &mat, const FrameOrientation &orient);

/**
 * @brief Transform 4-point bbox from raw frame pixel space to screen space.
 *
 * Templated on point type — requires P to have float x and y members.
 * Applies same flip-then-rotate logic as transformBbox, per point.
 * Template implementation in header (required for templates).
 */
template <typename P>
void transformPoints(std::array<P, 4> &points,
                     const FrameOrientation &orient) {
  const float w = static_cast<float>(orient.frameWidth);
  const float h = static_cast<float>(orient.frameHeight);

  for (auto &p : points) {
    float x = p.x;
    float y = p.y;

    // Flip first
    if (orient.isMirrored) {
      x = w - x;
    }

    // Then apply inverse rotation
    float nx = x, ny = y;
    if (orient.orientation == "right") {
      // CCW: new_x = y, new_y = w - x
      nx = y;
      ny = w - x;
    } else if (orient.orientation == "left") {
      // CW: new_x = h - y, new_y = x
      nx = h - y;
      ny = x;
    } else if (orient.orientation == "down") {
      nx = w - x;
      ny = h - y;
    }
    // "up": no-op

    p.x = nx;
    p.y = ny;
  }
}

} // namespace rnexecutorch::utils
```

- [ ] **Step 5: Build again — confirm tests fail at link (no .cpp yet)**

```bash
./gradlew :react-native-executorch:runFrameTransformTests 2>&1 | head -30
```

Expected: linker error — `transformBbox` and `transformMat` undefined.

- [ ] **Step 6: Create `FrameTransform.cpp`**

Create `packages/react-native-executorch/common/rnexecutorch/utils/FrameTransform.cpp`:

```cpp
#include "FrameTransform.h"

namespace rnexecutorch::utils {

void transformBbox(float &x1, float &y1, float &x2, float &y2,
                   const FrameOrientation &orient) {
  const float w = static_cast<float>(orient.frameWidth);
  const float h = static_cast<float>(orient.frameHeight);

  // Flip horizontally first
  if (orient.isMirrored) {
    float nx1 = w - x2;
    float nx2 = w - x1;
    x1 = nx1;
    x2 = nx2;
  }

  // Apply inverse rotation
  if (orient.orientation == "up") {
    // no-op
  } else if (orient.orientation == "right") {
    // CCW: new_x = y, new_y = w - x
    float nx1 = y1, ny1 = w - x2;
    float nx2 = y2, ny2 = w - x1;
    x1 = nx1; y1 = ny1;
    x2 = nx2; y2 = ny2;
  } else if (orient.orientation == "left") {
    // CW: new_x = h - y, new_y = x
    float nx1 = h - y2, ny1 = x1;
    float nx2 = h - y1, ny2 = x2;
    x1 = nx1; y1 = ny1;
    x2 = nx2; y2 = ny2;
  } else { // "down"
    float nx1 = w - x2, ny1 = h - y2;
    float nx2 = w - x1, ny2 = h - y1;
    x1 = nx1; y1 = ny1;
    x2 = nx2; y2 = ny2;
  }
}

cv::Mat transformMat(const cv::Mat &mat, const FrameOrientation &orient) {
  cv::Mat result = mat.clone();

  // Flip first
  if (orient.isMirrored) {
    cv::flip(result, result, 1);
  }

  // Apply inverse rotation
  if (orient.orientation == "up") {
    // no-op
  } else if (orient.orientation == "right") {
    cv::rotate(result, result, cv::ROTATE_90_COUNTERCLOCKWISE);
  } else if (orient.orientation == "left") {
    cv::rotate(result, result, cv::ROTATE_90_CLOCKWISE);
  } else { // "down"
    cv::rotate(result, result, cv::ROTATE_180);
  }

  return result;
}

} // namespace rnexecutorch::utils
```

- [ ] **Step 7: Build and run FrameTransformTests — all tests must pass**

```bash
./gradlew :react-native-executorch:runFrameTransformTests
```

Expected: all tests pass.

---

## Chunk 2: VisionModule.ts + SegmentationResult dimensions

### Task 2: Pass orientation metadata from JS and add dimensions to `SegmentationResult`

**Files:**
- Modify: `packages/react-native-executorch/src/modules/computer_vision/VisionModule.ts:73-87`
- Modify: `packages/react-native-executorch/common/rnexecutorch/models/semantic_segmentation/Types.h`
- Modify: `packages/react-native-executorch/common/rnexecutorch/models/semantic_segmentation/BaseSemanticSegmentation.cpp`

**Context for `SegmentationResult` change:** The `SegmentationResult` struct (in `Types.h`) currently has no width/height fields. To reconstruct a `cv::Mat` in `generateFromFrame` for the orientation transform, we need to know the actual output dimensions (not assume square). We add `outputWidth` and `outputHeight` to `SegmentationResult` and set them in `computeResult`.

- [ ] **Step 1: Add `outputWidth`/`outputHeight` to `SegmentationResult` in `Types.h`**

In `packages/react-native-executorch/common/rnexecutorch/models/semantic_segmentation/Types.h`:

```cpp
struct SegmentationResult {
  std::shared_ptr<OwningArrayBuffer> argmax;
  std::shared_ptr<
      std::unordered_map<std::string, std::shared_ptr<OwningArrayBuffer>>>
      classBuffers;
  int outputWidth = 0;   // width of argmax/class buffers in pixels
  int outputHeight = 0;  // height of argmax/class buffers in pixels
};
```

- [ ] **Step 2: Set `outputWidth`/`outputHeight` in `computeResult`**

In `BaseSemanticSegmentation.cpp`, in `computeResult` (around line 210, after the resize step), add before the `return`:

After the resize block (lines 197-209), the final dimensions are either `originalSize` (if `resize=true`) or `outputSize` (if `resize=false`). Add:

```cpp
// Set output dimensions on result before returning
SegmentationResult result;
result.argmax = argmax;
result.classBuffers = buffersToReturn;

if (resize) {
  result.outputWidth = originalSize.width;
  result.outputHeight = originalSize.height;
} else {
  result.outputWidth = static_cast<int>(outputW);
  result.outputHeight = static_cast<int>(outputH);
}
return result;
```

Check the existing return statement at the end of `computeResult` and replace it with the above. The existing code likely does something like `return {argmax, buffersToReturn}` — verify the exact line and replace.

- [ ] **Step 3: Update `frameData` in `VisionModule.ts`**

In `packages/react-native-executorch/src/modules/computer_vision/VisionModule.ts`, update `runOnFrame`:

```typescript
nativeBuffer = frame.getNativeBuffer();
const frameData = {
  nativeBuffer: nativeBuffer.pointer,
  orientation: frame.orientation,
  isMirrored: frame.isMirrored,
  frameWidth: frame.width,
  frameHeight: frame.height,
};
return nativeGenerateFromFrame(frameData, ...args);
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd packages/react-native-executorch
yarn tsc --noEmit
```

Expected: no errors.

---

## Chunk 3: `VisionModel::extractFrameOrientation`

### Task 3: Add JSI orientation reader to `VisionModel`

**Files:**
- Modify: `packages/react-native-executorch/common/rnexecutorch/models/VisionModel.h`
- Modify: `packages/react-native-executorch/common/rnexecutorch/models/VisionModel.cpp`

**Context:** All vision model subclasses (`ObjectDetection`, `BaseSemanticSegmentation`, `StyleTransfer`) inherit from `VisionModel`. Adding a protected helper here avoids duplicating JSI reading code. `OCR` does NOT inherit from `VisionModel`, so it will call a free function instead (Task 7).

- [ ] **Step 1: Add declaration to `VisionModel.h`**

Add `#include <rnexecutorch/utils/FrameTransform.h>` at the top of `VisionModel.h` (alongside existing includes). Then add to the `protected` section:

```cpp
/**
 * @brief Read orientation metadata from JSI frameData object.
 *
 * Reads orientation, isMirrored, frameWidth, frameHeight.
 * Falls back to "up"/false/0/0 if fields are absent (e.g. when
 * enablePhysicalBufferRotation is used — transform will then be a no-op).
 */
utils::FrameOrientation extractFrameOrientation(
    jsi::Runtime &runtime, const jsi::Value &frameData) const;
```

- [ ] **Step 2: Implement in `VisionModel.cpp`**

Add `#include <rnexecutorch/utils/FrameTransform.h>` to `VisionModel.cpp` (it's already included via `VisionModel.h` but be explicit). Then add:

```cpp
utils::FrameOrientation VisionModel::extractFrameOrientation(
    jsi::Runtime &runtime, const jsi::Value &frameData) const {
  auto obj = frameData.asObject(runtime);

  std::string orientation = "up";
  if (obj.hasProperty(runtime, "orientation")) {
    auto val = obj.getProperty(runtime, "orientation");
    if (val.isString()) orientation = val.getString(runtime).utf8(runtime);
  }

  bool isMirrored = false;
  if (obj.hasProperty(runtime, "isMirrored")) {
    auto val = obj.getProperty(runtime, "isMirrored");
    if (val.isBool()) isMirrored = val.getBool();
  }

  int frameWidth = 0;
  if (obj.hasProperty(runtime, "frameWidth")) {
    auto val = obj.getProperty(runtime, "frameWidth");
    if (val.isNumber()) frameWidth = static_cast<int>(val.asNumber());
  }

  int frameHeight = 0;
  if (obj.hasProperty(runtime, "frameHeight")) {
    auto val = obj.getProperty(runtime, "frameHeight");
    if (val.isNumber()) frameHeight = static_cast<int>(val.asNumber());
  }

  return {orientation, isMirrored, frameWidth, frameHeight};
}
```

---

## Chunk 4: ObjectDetection — transform bboxes

### Task 4: Apply `transformBbox` in `ObjectDetection::generateFromFrame`

**Files:**
- Modify: `packages/react-native-executorch/common/rnexecutorch/models/object_detection/ObjectDetection.cpp`

**Context:** `generateFromFrame` is at line ~131 of `ObjectDetection.cpp`. It calls `extractFromFrame` then `runInference`. `runInference` → `postprocess` scales bboxes to original frame pixel space. After `runInference` returns, apply `transformBbox` to each detection.

- [ ] **Step 1: Add `#include` to `ObjectDetection.cpp`**

```cpp
#include <rnexecutorch/utils/FrameTransform.h>
```

- [ ] **Step 2: Update `generateFromFrame` in `ObjectDetection.cpp`**

Replace the existing `generateFromFrame`:

```cpp
std::vector<types::Detection>
ObjectDetection::generateFromFrame(jsi::Runtime &runtime,
                                   const jsi::Value &frameData,
                                   double detectionThreshold) {
  auto orient = extractFrameOrientation(runtime, frameData);
  cv::Mat frame = extractFromFrame(runtime, frameData);
  auto detections = runInference(frame, detectionThreshold);
  for (auto &det : detections) {
    utils::transformBbox(det.x1, det.y1, det.x2, det.y2, orient);
  }
  return detections;
}
```

- [ ] **Step 3: Build and run `ObjectDetectionTests` to confirm no regressions**

```bash
./gradlew :react-native-executorch:runObjectDetectionTests
```

---

## Chunk 5: SemanticSegmentation — transform mask

### Task 5: Apply `transformMat` in `BaseSemanticSegmentation::generateFromFrame`

**Files:**
- Modify: `packages/react-native-executorch/common/rnexecutorch/models/semantic_segmentation/BaseSemanticSegmentation.cpp`

**Context:** `generateFromFrame` (line 94) calls `extractFromFrame` then `runInference`. After Chunk 2, `SegmentationResult` has `outputWidth`/`outputHeight`. We use these to reconstruct `cv::Mat` with correct dimensions for the transform.

- [ ] **Step 1: Add `#include` to `BaseSemanticSegmentation.cpp`**

```cpp
#include <rnexecutorch/utils/FrameTransform.h>
```

- [ ] **Step 2: Update `generateFromFrame` in `BaseSemanticSegmentation.cpp`**

Replace `generateFromFrame` (lines 94-100):

```cpp
semantic_segmentation::SegmentationResult
BaseSemanticSegmentation::generateFromFrame(
    jsi::Runtime &runtime, const jsi::Value &frameData,
    std::set<std::string, std::less<>> classesOfInterest, bool resize) {
  auto orient = extractFrameOrientation(runtime, frameData);
  cv::Mat frame = extractFromFrame(runtime, frameData);
  auto result = runInference(frame, frame.size(), classesOfInterest, resize);

  const int w = result.outputWidth;
  const int h = result.outputHeight;

  // Transform argmax mask
  if (result.argmax && w > 0 && h > 0) {
    cv::Mat argmaxMat(h, w, CV_32SC1, result.argmax->data());
    cv::Mat transformed = utils::transformMat(argmaxMat, orient);
    result.argmax = std::make_shared<OwningArrayBuffer>(
        transformed.data,
        static_cast<size_t>(transformed.total() * transformed.elemSize()));
  }

  // Transform each class probability buffer
  if (result.classBuffers && w > 0 && h > 0) {
    for (auto &[label, buf] : *result.classBuffers) {
      cv::Mat classMat(h, w, CV_32FC1, buf->data());
      cv::Mat transformed = utils::transformMat(classMat, orient);
      buf = std::make_shared<OwningArrayBuffer>(
          transformed.data,
          static_cast<size_t>(transformed.total() * transformed.elemSize()));
    }
  }

  return result;
}
```

**Note:** `OwningArrayBuffer(const void*, size_t)` copies the data — verified from `OwningArrayBuffer.h`. The `transformed` mat goes out of scope after the copy, which is safe.

---

## Chunk 6: StyleTransfer — transform output image

### Task 6: Apply `transformMat` in `StyleTransfer::generateFromFrame`

**Files:**
- Modify: `packages/react-native-executorch/common/rnexecutorch/models/style_transfer/StyleTransfer.cpp`

**Context:** `generateFromFrame` (lines 82-87) calls `extractFromFrame` → `runInference(frame, modelInputSize())` → `toPixelDataResult`. The output mat from `runInference` is at model resolution. We apply `transformMat` between `runInference` and `toPixelDataResult`. `toPixelDataResult` reads dimensions from the mat — it will correctly pick up swapped dimensions after transform.

- [ ] **Step 1: Add `#include` to `StyleTransfer.cpp`**

```cpp
#include <rnexecutorch/utils/FrameTransform.h>
```

- [ ] **Step 2: Update `generateFromFrame` in `StyleTransfer.cpp`**

```cpp
PixelDataResult StyleTransfer::generateFromFrame(jsi::Runtime &runtime,
                                                  const jsi::Value &frameData) {
  auto orient = extractFrameOrientation(runtime, frameData);
  cv::Mat frame = extractFromFrame(runtime, frameData);
  cv::Mat output = runInference(frame, modelInputSize());
  cv::Mat oriented = utils::transformMat(output, orient);
  return toPixelDataResult(oriented);
}
```

---

## Chunk 7: OCR — transform 4-point bboxes

### Task 7: Apply `transformPoints` in `OCR::generateFromFrame`

**Files:**
- Modify: `packages/react-native-executorch/common/rnexecutorch/models/ocr/OCR.cpp`
- Modify: `packages/react-native-executorch/common/rnexecutorch/tests/CMakeLists.txt` (add FrameTransform.cpp to OCRTests sources)

**Context:** `OCR` does NOT inherit from `VisionModel` — it has its own `inference_mutex_` and uses `frameToMat` directly. OCR calls `FrameTransform` utilities directly from `OCR.cpp`. `OCRDetection::bbox` is `std::array<types::Point, 4>` where `types::Point` has `float x, y` — compatible with the `transformPoints` template.

- [ ] **Step 1: Add `#include` to `OCR.cpp`**

```cpp
#include <rnexecutorch/utils/FrameTransform.h>
```

- [ ] **Step 2: Update `generateFromFrame` in `OCR.cpp`**

In `OCR::generateFromFrame`, read orientation directly from `frameData` using the same JSI pattern as `VisionModel::extractFrameOrientation`, then call `transformPoints` on each detection's bbox:

```cpp
std::vector<types::OCRDetection>
OCR::generateFromFrame(jsi::Runtime &runtime, const jsi::Value &frameData) {
  // Read orientation metadata
  utils::FrameOrientation orient;
  {
    auto obj = frameData.asObject(runtime);
    std::string orientation = "up";
    if (obj.hasProperty(runtime, "orientation")) {
      auto val = obj.getProperty(runtime, "orientation");
      if (val.isString()) orientation = val.getString(runtime).utf8(runtime);
    }
    bool isMirrored = false;
    if (obj.hasProperty(runtime, "isMirrored")) {
      auto val = obj.getProperty(runtime, "isMirrored");
      if (val.isBool()) isMirrored = val.getBool();
    }
    int frameWidth = 0;
    if (obj.hasProperty(runtime, "frameWidth")) {
      auto val = obj.getProperty(runtime, "frameWidth");
      if (val.isNumber()) frameWidth = static_cast<int>(val.asNumber());
    }
    int frameHeight = 0;
    if (obj.hasProperty(runtime, "frameHeight")) {
      auto val = obj.getProperty(runtime, "frameHeight");
      if (val.isNumber()) frameHeight = static_cast<int>(val.asNumber());
    }
    orient = {orientation, isMirrored, frameWidth, frameHeight};
  }

  cv::Mat frame = ::rnexecutorch::utils::frameToMat(runtime, frameData);
  cv::Mat bgr;
#ifdef __APPLE__
  cv::cvtColor(frame, bgr, cv::COLOR_BGRA2BGR);
#elif defined(__ANDROID__)
  cv::cvtColor(frame, bgr, cv::COLOR_RGBA2BGR);
#else
  throw RnExecutorchError(
      RnExecutorchErrorCode::PlatformNotSupported,
      "generateFromFrame is not supported on this platform");
#endif
  auto detections = runInference(bgr);
  for (auto &det : detections) {
    utils::transformPoints(det.bbox, orient);
  }
  return detections;
}
```

- [ ] **Step 3: Add `FrameTransform.cpp` to `OCRTests` in `CMakeLists.txt`**

Find the `add_rn_test(OCRTests ...)` entry in `tests/CMakeLists.txt` and add `${RNEXECUTORCH_DIR}/utils/FrameTransform.cpp` to its SOURCES list.

- [ ] **Step 4: Build and run `OCRTests`**

```bash
./gradlew :react-native-executorch:runOCRTests
```

---

## Chunk 8: Demo app — remove `enablePhysicalBufferRotation`

### Task 8: Update demo app task components

**Files:**
- Modify: `apps/computer-vision/components/vision_camera/tasks/ClassificationTask.tsx`
- Modify: `apps/computer-vision/components/vision_camera/tasks/ObjectDetectionTask.tsx`
- Modify: `apps/computer-vision/components/vision_camera/tasks/SegmentationTask.tsx`

- [ ] **Step 1: Remove `enablePhysicalBufferRotation: true` from all three `useFrameOutput` calls**

In each file, delete the line `enablePhysicalBufferRotation: true,` from the `useFrameOutput` options.

- [ ] **Step 2: Verify `scaleX: -1` is present in ObjectDetection and Segmentation**

`ObjectDetectionTask.tsx` render must have:
```tsx
style={[
  StyleSheet.absoluteFill,
  cameraPosition === 'front' && { transform: [{ scaleX: -1 }] },
]}
```
Same pattern in `SegmentationTask.tsx`. Do not remove these.

- [ ] **Step 3: Build and manually test on Android and iOS**

Test matrix:
- Android back camera, portrait: boxes/masks aligned
- Android front camera, portrait: boxes/masks aligned and overlay mirrored
- iOS back camera, portrait: boxes/masks aligned
- iOS front camera, portrait: boxes/masks aligned and overlay mirrored

---

## Chunk 9: `FrameProcessor.h` doc comment cleanup

### Task 9: Update stale doc comment

**Files:**
- Modify: `packages/react-native-executorch/common/rnexecutorch/utils/FrameProcessor.h:21-27`

- [ ] **Step 1: Replace the `frameToMat` doc comment**

In `FrameProcessor.h`, replace the doc comment above `frameToMat`:

```cpp
/**
 * @brief Extract a raw RGB cv::Mat from a VisionCamera frameData JSI object.
 *
 * Does not apply any orientation correction — use FrameTransform utilities
 * on the model output to convert coordinates/buffers to screen space.
 * Callers are responsible for any further colour space conversion.
 */
```
