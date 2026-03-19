#include <gtest/gtest.h>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/utils/FrameTransform.h>

using namespace rnexecutorch::utils;

static FrameOrientation makeOrient(const std::string &o, bool mirrored) {
  return {o, mirrored};
}

// ============================================================================
// rotateFrameForModel — rotates sensor-native frame so model sees upright image.
//
//   "up"    (landscape-left)       → no rotation
//   "left"  (portrait upright)     → CW
//   "right" (portrait upside-down) → CCW
//   "down"  (landscape-right)      → 180°
// ============================================================================

// "up" → no rotation. 480×640 stays 480×640.
TEST(RotateFrameForModel, Up_NoRotation) {
  cv::Mat input(480, 640, CV_8UC3, cv::Scalar(1, 2, 3));
  cv::Mat result = rotateFrameForModel(input, makeOrient("up", false));
  EXPECT_EQ(result.rows, 480);
  EXPECT_EQ(result.cols, 640);
}

// "up" → no rotation. Verify pixel values preserved.
TEST(RotateFrameForModel, Up_PixelsPreserved) {
  cv::Mat input(1, 2, CV_8UC3);
  input.at<cv::Vec3b>(0, 0) = {255, 0, 0};
  input.at<cv::Vec3b>(0, 1) = {0, 0, 255};
  cv::Mat result = rotateFrameForModel(input, makeOrient("up", false));
  EXPECT_EQ(result.at<cv::Vec3b>(0, 0), (cv::Vec3b{255, 0, 0}));
  EXPECT_EQ(result.at<cv::Vec3b>(0, 1), (cv::Vec3b{0, 0, 255}));
}

// "left" → CW. 480×640 becomes 640×480.
TEST(RotateFrameForModel, Left_CW) {
  cv::Mat input(480, 640, CV_8UC3, cv::Scalar(1, 2, 3));
  cv::Mat result = rotateFrameForModel(input, makeOrient("left", false));
  EXPECT_EQ(result.rows, 640);
  EXPECT_EQ(result.cols, 480);
}

// "left" → CW pixel check. 1×2 [R, B] → 2×1 [R; B].
// CW takes bottom-of-left-col to top: (0,0)→(0,0), (0,1)→(1,0).
TEST(RotateFrameForModel, Left_CW_Pixels) {
  cv::Mat input(1, 2, CV_8UC3);
  input.at<cv::Vec3b>(0, 0) = {255, 0, 0}; // R left
  input.at<cv::Vec3b>(0, 1) = {0, 0, 255}; // B right
  cv::Mat result = rotateFrameForModel(input, makeOrient("left", false));
  EXPECT_EQ(result.rows, 2);
  EXPECT_EQ(result.cols, 1);
  EXPECT_EQ(result.at<cv::Vec3b>(0, 0), (cv::Vec3b{255, 0, 0})); // R
  EXPECT_EQ(result.at<cv::Vec3b>(1, 0), (cv::Vec3b{0, 0, 255})); // B
}

// "right" → CCW. 480×640 becomes 640×480.
TEST(RotateFrameForModel, Right_CCW) {
  cv::Mat input(480, 640, CV_8UC3, cv::Scalar(1, 2, 3));
  cv::Mat result = rotateFrameForModel(input, makeOrient("right", false));
  EXPECT_EQ(result.rows, 640);
  EXPECT_EQ(result.cols, 480);
}

// "right" → CCW pixel check. 1×2 [R, B] → 2×1 [B; R].
// CCW takes top-of-right-col to top: (0,1)→(0,0), (0,0)→(1,0).
TEST(RotateFrameForModel, Right_CCW_Pixels) {
  cv::Mat input(1, 2, CV_8UC3);
  input.at<cv::Vec3b>(0, 0) = {255, 0, 0}; // R left
  input.at<cv::Vec3b>(0, 1) = {0, 0, 255}; // B right
  cv::Mat result = rotateFrameForModel(input, makeOrient("right", false));
  EXPECT_EQ(result.rows, 2);
  EXPECT_EQ(result.cols, 1);
  EXPECT_EQ(result.at<cv::Vec3b>(0, 0), (cv::Vec3b{0, 0, 255})); // B
  EXPECT_EQ(result.at<cv::Vec3b>(1, 0), (cv::Vec3b{255, 0, 0})); // R
}

// "down" → 180°. 480×640 stays 480×640.
TEST(RotateFrameForModel, Down_180) {
  cv::Mat input(480, 640, CV_8UC3, cv::Scalar(1, 2, 3));
  cv::Mat result = rotateFrameForModel(input, makeOrient("down", false));
  EXPECT_EQ(result.rows, 480);
  EXPECT_EQ(result.cols, 640);
}

// "down" → 180° pixel check. 1×2 [R, B] → 1×2 [B, R].
TEST(RotateFrameForModel, Down_180_Pixels) {
  cv::Mat input(1, 2, CV_8UC3);
  input.at<cv::Vec3b>(0, 0) = {255, 0, 0};
  input.at<cv::Vec3b>(0, 1) = {0, 0, 255};
  cv::Mat result = rotateFrameForModel(input, makeOrient("down", false));
  EXPECT_EQ(result.at<cv::Vec3b>(0, 0), (cv::Vec3b{0, 0, 255})); // B
  EXPECT_EQ(result.at<cv::Vec3b>(0, 1), (cv::Vec3b{255, 0, 0})); // R
}

// isMirrored + "up" → flip only. 1×2 [R, B] → 1×2 [B, R].
TEST(RotateFrameForModel, Mirrored_Up_FlipOnly) {
  cv::Mat input(1, 2, CV_8UC3);
  input.at<cv::Vec3b>(0, 0) = {255, 0, 0};
  input.at<cv::Vec3b>(0, 1) = {0, 0, 255};
  cv::Mat result = rotateFrameForModel(input, makeOrient("up", true));
  EXPECT_EQ(result.rows, 1);
  EXPECT_EQ(result.cols, 2);
  EXPECT_EQ(result.at<cv::Vec3b>(0, 0), (cv::Vec3b{0, 0, 255})); // B
  EXPECT_EQ(result.at<cv::Vec3b>(0, 1), (cv::Vec3b{255, 0, 0})); // R
}

// isMirrored + "left" → flip then CW.
// 1×2 [R, B] → flip → [B, R] → CW → 2×1 [B; R].
TEST(RotateFrameForModel, Mirrored_Left_FlipThenCW) {
  cv::Mat input(1, 2, CV_8UC3);
  input.at<cv::Vec3b>(0, 0) = {255, 0, 0};
  input.at<cv::Vec3b>(0, 1) = {0, 0, 255};
  cv::Mat result = rotateFrameForModel(input, makeOrient("left", true));
  EXPECT_EQ(result.rows, 2);
  EXPECT_EQ(result.cols, 1);
  EXPECT_EQ(result.at<cv::Vec3b>(0, 0), (cv::Vec3b{0, 0, 255})); // B
  EXPECT_EQ(result.at<cv::Vec3b>(1, 0), (cv::Vec3b{255, 0, 0})); // R
}

// Does not modify input.
TEST(RotateFrameForModel, DoesNotModifyInput) {
  cv::Mat input(1, 2, CV_8UC3);
  input.at<cv::Vec3b>(0, 0) = {255, 0, 0};
  input.at<cv::Vec3b>(0, 1) = {0, 0, 255};
  cv::Mat inputCopy = input.clone();
  rotateFrameForModel(input, makeOrient("left", true));
  EXPECT_EQ(input.at<cv::Vec3b>(0, 0), inputCopy.at<cv::Vec3b>(0, 0));
  EXPECT_EQ(input.at<cv::Vec3b>(0, 1), inputCopy.at<cv::Vec3b>(0, 1));
}

// ============================================================================
// inverseRotateMat — inverse of rotateFrameForModel for matrices.
//
//   "up"    → CW   (undo no-op: landscape→portrait for screen)
//   "left"  → no-op (already in screen space after CW model rotation)
//   "right" → 180°  (undo CCW)
//   "down"  → CCW   (undo 180°)
// ============================================================================

// "left" → no-op. Same dims.
TEST(InverseRotateMat, Left_NoOp) {
  cv::Mat input(640, 480, CV_8UC3, cv::Scalar(1, 2, 3));
  cv::Mat result = inverseRotateMat(input, makeOrient("left", false));
  EXPECT_EQ(result.rows, 640);
  EXPECT_EQ(result.cols, 480);
}

// "up" → CW. 480×640 becomes 640×480.
TEST(InverseRotateMat, Up_CW) {
  cv::Mat input(480, 640, CV_8UC3, cv::Scalar(1, 2, 3));
  cv::Mat result = inverseRotateMat(input, makeOrient("up", false));
  EXPECT_EQ(result.rows, 640);
  EXPECT_EQ(result.cols, 480);
}

// "right" → 180°. Same dims.
TEST(InverseRotateMat, Right_180) {
  cv::Mat input(640, 480, CV_8UC3, cv::Scalar(1, 2, 3));
  cv::Mat result = inverseRotateMat(input, makeOrient("right", false));
  EXPECT_EQ(result.rows, 640);
  EXPECT_EQ(result.cols, 480);
}

// "down" → CCW. 480×640 becomes 640×480.
TEST(InverseRotateMat, Down_CCW) {
  cv::Mat input(480, 640, CV_8UC3, cv::Scalar(1, 2, 3));
  cv::Mat result = inverseRotateMat(input, makeOrient("down", false));
  EXPECT_EQ(result.rows, 640);
  EXPECT_EQ(result.cols, 480);
}

// Round-trip: rotateFrameForModel then inverseRotateMat restores pixel content.
// Use "left" (CW then no-op for inverse on Android).
TEST(InverseRotateMat, RoundTrip_Left) {
  cv::Mat input(2, 3, CV_8UC3);
  input.at<cv::Vec3b>(0, 0) = {10, 20, 30};
  input.at<cv::Vec3b>(0, 1) = {40, 50, 60};
  input.at<cv::Vec3b>(0, 2) = {70, 80, 90};
  input.at<cv::Vec3b>(1, 0) = {100, 110, 120};
  input.at<cv::Vec3b>(1, 1) = {130, 140, 150};
  input.at<cv::Vec3b>(1, 2) = {160, 170, 180};

  cv::Mat rotated = rotateFrameForModel(input, makeOrient("left", false));
  // "left" → CW: 2×3 → 3×2
  EXPECT_EQ(rotated.rows, 3);
  EXPECT_EQ(rotated.cols, 2);

  cv::Mat restored = inverseRotateMat(rotated, makeOrient("left", false));
  // "left" inverse → no-op on Android, so restored is still 3×2.
  // The inverse undoes the model rotation to get back to sensor-native layout
  // which for "left" means the CW was the model rotation, and inverse is no-op
  // because the model output is already in screen orientation.
  // On Android: left inverse = no-op, so result stays as rotated.
  EXPECT_EQ(restored.rows, 3);
  EXPECT_EQ(restored.cols, 2);
}

// Does not modify input.
TEST(InverseRotateMat, DoesNotModifyInput) {
  cv::Mat input(1, 2, CV_8UC3);
  input.at<cv::Vec3b>(0, 0) = {255, 0, 0};
  input.at<cv::Vec3b>(0, 1) = {0, 0, 255};
  cv::Mat inputCopy = input.clone();
  inverseRotateMat(input, makeOrient("up", false));
  EXPECT_EQ(input.at<cv::Vec3b>(0, 0), inputCopy.at<cv::Vec3b>(0, 0));
  EXPECT_EQ(input.at<cv::Vec3b>(0, 1), inputCopy.at<cv::Vec3b>(0, 1));
}

// ============================================================================
// inverseRotateBbox — inverse of rotateFrameForModel for axis-aligned bboxes.
//
// rW/rH = rotated frame dimensions (after rotateFrameForModel).
// On Android (no __APPLE__), isMirrored is ignored.
//
// Formulas (same as inverseRotatePoints per-corner, but preserves x1<=x2, y1<=y2):
//   "up"    → CW:  nx1=h-y2, ny1=x1, nx2=h-y1, ny2=x2
//   "right" → 180°: nx1=w-x2, ny1=h-y2, nx2=w-x1, ny2=h-y1
//   "down"  → CCW: nx1=y1, ny1=w-x2, nx2=y2, ny2=w-x1
//   "left"  → no-op
// ============================================================================

// "left" → no-op. Box unchanged.
TEST(InverseRotateBbox, Left_NoOp) {
  float x1 = 10, y1 = 20, x2 = 100, y2 = 200;
  inverseRotateBbox(x1, y1, x2, y2, makeOrient("left", false), 640, 480);
  EXPECT_FLOAT_EQ(x1, 10);
  EXPECT_FLOAT_EQ(y1, 20);
  EXPECT_FLOAT_EQ(x2, 100);
  EXPECT_FLOAT_EQ(y2, 200);
}

// "up" → CW. rW=640, rH=480. Box (10,20)-(100,200):
//   nx1=480-200=280, ny1=10, nx2=480-20=460, ny2=100
TEST(InverseRotateBbox, Up_CW) {
  float x1 = 10, y1 = 20, x2 = 100, y2 = 200;
  inverseRotateBbox(x1, y1, x2, y2, makeOrient("up", false), 640, 480);
  EXPECT_FLOAT_EQ(x1, 280);
  EXPECT_FLOAT_EQ(y1, 10);
  EXPECT_FLOAT_EQ(x2, 460);
  EXPECT_FLOAT_EQ(y2, 100);
}

// "right" → 180°. rW=480, rH=640. Box (10,20)-(100,200):
//   nx1=480-100=380, ny1=640-200=440, nx2=480-10=470, ny2=640-20=620
TEST(InverseRotateBbox, Right_180) {
  float x1 = 10, y1 = 20, x2 = 100, y2 = 200;
  inverseRotateBbox(x1, y1, x2, y2, makeOrient("right", false), 480, 640);
  EXPECT_FLOAT_EQ(x1, 380);
  EXPECT_FLOAT_EQ(y1, 440);
  EXPECT_FLOAT_EQ(x2, 470);
  EXPECT_FLOAT_EQ(y2, 620);
}

// "down" → CCW. rW=640, rH=480. Box (10,20)-(100,200):
//   nx1=20, ny1=640-100=540, nx2=200, ny2=640-10=630
TEST(InverseRotateBbox, Down_CCW) {
  float x1 = 10, y1 = 20, x2 = 100, y2 = 200;
  inverseRotateBbox(x1, y1, x2, y2, makeOrient("down", false), 640, 480);
  EXPECT_FLOAT_EQ(x1, 20);
  EXPECT_FLOAT_EQ(y1, 540);
  EXPECT_FLOAT_EQ(x2, 200);
  EXPECT_FLOAT_EQ(y2, 630);
}

// Guarantees x1<=x2 and y1<=y2 after transform.
TEST(InverseRotateBbox, OutputOrdered) {
  float x1 = 50, y1 = 50, x2 = 150, y2 = 250;
  inverseRotateBbox(x1, y1, x2, y2, makeOrient("up", false), 640, 480);
  EXPECT_LE(x1, x2);
  EXPECT_LE(y1, y2);
}

// ============================================================================
// inverseRotatePoints — inverse of rotateFrameForModel for 4-point bboxes.
//
// Same formulas as inverseRotateBbox but applied per-point (no reordering).
// On Android (no __APPLE__), isMirrored is ignored.
// ============================================================================

struct Pt {
  float x;
  float y;
};

// "left" → no-op. Points unchanged.
TEST(InverseRotatePoints, Left_NoOp) {
  std::array<Pt, 4> pts = {{{10, 20}, {30, 40}, {50, 60}, {70, 80}}};
  inverseRotatePoints(pts, makeOrient("left", false), 640, 480);
  EXPECT_FLOAT_EQ(pts[0].x, 10);
  EXPECT_FLOAT_EQ(pts[0].y, 20);
  EXPECT_FLOAT_EQ(pts[1].x, 30);
  EXPECT_FLOAT_EQ(pts[1].y, 40);
  EXPECT_FLOAT_EQ(pts[2].x, 50);
  EXPECT_FLOAT_EQ(pts[2].y, 60);
  EXPECT_FLOAT_EQ(pts[3].x, 70);
  EXPECT_FLOAT_EQ(pts[3].y, 80);
}

// "up" → CW per point. rW=640, rH=480. pt(10,20): nx=480-20=460, ny=10.
TEST(InverseRotatePoints, Up_CW) {
  std::array<Pt, 4> pts = {{{10, 20}, {30, 40}, {50, 60}, {70, 80}}};
  inverseRotatePoints(pts, makeOrient("up", false), 640, 480);
  EXPECT_FLOAT_EQ(pts[0].x, 460);
  EXPECT_FLOAT_EQ(pts[0].y, 10);
  EXPECT_FLOAT_EQ(pts[1].x, 440);
  EXPECT_FLOAT_EQ(pts[1].y, 30);
  EXPECT_FLOAT_EQ(pts[2].x, 420);
  EXPECT_FLOAT_EQ(pts[2].y, 50);
  EXPECT_FLOAT_EQ(pts[3].x, 400);
  EXPECT_FLOAT_EQ(pts[3].y, 70);
}

// "right" → 180° per point. rW=480, rH=640. pt(10,20): nx=480-10=470, ny=640-20=620.
TEST(InverseRotatePoints, Right_180) {
  std::array<Pt, 4> pts = {{{10, 20}, {30, 40}, {50, 60}, {70, 80}}};
  inverseRotatePoints(pts, makeOrient("right", false), 480, 640);
  EXPECT_FLOAT_EQ(pts[0].x, 470);
  EXPECT_FLOAT_EQ(pts[0].y, 620);
  EXPECT_FLOAT_EQ(pts[1].x, 450);
  EXPECT_FLOAT_EQ(pts[1].y, 600);
  EXPECT_FLOAT_EQ(pts[2].x, 430);
  EXPECT_FLOAT_EQ(pts[2].y, 580);
  EXPECT_FLOAT_EQ(pts[3].x, 410);
  EXPECT_FLOAT_EQ(pts[3].y, 560);
}

// "down" → CCW per point. rW=640, rH=480. pt(10,20): nx=20, ny=640-10=630.
TEST(InverseRotatePoints, Down_CCW) {
  std::array<Pt, 4> pts = {{{10, 20}, {30, 40}, {50, 60}, {70, 80}}};
  inverseRotatePoints(pts, makeOrient("down", false), 640, 480);
  EXPECT_FLOAT_EQ(pts[0].x, 20);
  EXPECT_FLOAT_EQ(pts[0].y, 630);
  EXPECT_FLOAT_EQ(pts[1].x, 40);
  EXPECT_FLOAT_EQ(pts[1].y, 610);
  EXPECT_FLOAT_EQ(pts[2].x, 60);
  EXPECT_FLOAT_EQ(pts[2].y, 590);
  EXPECT_FLOAT_EQ(pts[3].x, 80);
  EXPECT_FLOAT_EQ(pts[3].y, 570);
}
