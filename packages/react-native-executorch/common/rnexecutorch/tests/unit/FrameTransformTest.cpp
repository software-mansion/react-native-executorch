#include <gtest/gtest.h>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/utils/FrameTransform.h>

using namespace rnexecutorch::utils;

static FrameOrientation makeOrient(const std::string &o, bool mirrored,
                                   int w, int h) {
  return {o, mirrored, w, h};
}

// ============================================================================
// transformBbox — always applies CW rotation regardless of orientation.
// The orientation string is ignored; these tests confirm orientation-invariance.
//
// CW formula: nx1=h-y2, ny1=x1, nx2=h-y1, ny2=x2
// ============================================================================

// w=640, h=480. Box (10,20)-(100,200):
//   CW: nx1=480-200=280, ny1=10, nx2=480-20=460, ny2=100
TEST(TransformBbox, AppliesCWRegardlessOfOrientation_Up) {
  auto orient = makeOrient("up", false, 640, 480);
  float x1 = 10, y1 = 20, x2 = 100, y2 = 200;
  transformBbox(x1, y1, x2, y2, orient);
  EXPECT_FLOAT_EQ(x1, 280);
  EXPECT_FLOAT_EQ(y1, 10);
  EXPECT_FLOAT_EQ(x2, 460);
  EXPECT_FLOAT_EQ(y2, 100);
}

// Same frame size and box as "up" — same result.
TEST(TransformBbox, AppliesCWRegardlessOfOrientation_Down) {
  auto orient = makeOrient("down", false, 640, 480);
  float x1 = 10, y1 = 20, x2 = 100, y2 = 200;
  transformBbox(x1, y1, x2, y2, orient);
  EXPECT_FLOAT_EQ(x1, 280);
  EXPECT_FLOAT_EQ(y1, 10);
  EXPECT_FLOAT_EQ(x2, 460);
  EXPECT_FLOAT_EQ(y2, 100);
}

// w=480, h=640. Box (10,20)-(100,200):
//   CW: nx1=640-200=440, ny1=10, nx2=640-20=620, ny2=100
TEST(TransformBbox, AppliesCWRegardlessOfOrientation_Left) {
  auto orient = makeOrient("left", false, 480, 640);
  float x1 = 10, y1 = 20, x2 = 100, y2 = 200;
  transformBbox(x1, y1, x2, y2, orient);
  EXPECT_FLOAT_EQ(x1, 440);
  EXPECT_FLOAT_EQ(y1, 10);
  EXPECT_FLOAT_EQ(x2, 620);
  EXPECT_FLOAT_EQ(y2, 100);
}

// Same frame size as "left" — same result.
TEST(TransformBbox, AppliesCWRegardlessOfOrientation_Right) {
  auto orient = makeOrient("right", false, 480, 640);
  float x1 = 10, y1 = 20, x2 = 100, y2 = 200;
  transformBbox(x1, y1, x2, y2, orient);
  EXPECT_FLOAT_EQ(x1, 440);
  EXPECT_FLOAT_EQ(y1, 10);
  EXPECT_FLOAT_EQ(x2, 620);
  EXPECT_FLOAT_EQ(y2, 100);
}

// isMirrored=true: flip H first, then CW.
// w=640, h=480. Flip: x1=640-100=540, x2=640-10=630.
// CW: nx1=480-200=280, ny1=540, nx2=480-20=460, ny2=630.
TEST(TransformBbox, FlipsHorizontallyThenCW) {
  auto orient = makeOrient("up", true, 640, 480);
  float x1 = 10, y1 = 20, x2 = 100, y2 = 200;
  transformBbox(x1, y1, x2, y2, orient);
  EXPECT_FLOAT_EQ(x1, 280);
  EXPECT_FLOAT_EQ(y1, 540);
  EXPECT_FLOAT_EQ(x2, 460);
  EXPECT_FLOAT_EQ(y2, 630);
}

// ============================================================================
// transformMat — always applies CW rotation regardless of orientation.
//
// CW on R×C input → C×R output.
// ============================================================================

// 480-row × 640-col input → CW → 640-row × 480-col output.
TEST(TransformMat, AppliesCWRegardlessOfOrientation_Up) {
  cv::Mat input(480, 640, CV_8UC3, cv::Scalar(1, 2, 3));
  auto orient = makeOrient("up", false, 640, 480);
  cv::Mat result = transformMat(input, orient);
  EXPECT_EQ(result.rows, 640);
  EXPECT_EQ(result.cols, 480);
}

// 1-row × 2-col input → CW → 2-row × 1-col output.
// CW: result(0,0)=src(0,1)=B, result(1,0)=src(0,0)=R.
TEST(TransformMat, AppliesCWRegardlessOfOrientation_Down) {
  cv::Mat input(1, 2, CV_8UC3);
  input.at<cv::Vec3b>(0, 0) = {255, 0, 0}; // R on left
  input.at<cv::Vec3b>(0, 1) = {0, 0, 255}; // B on right
  auto orient = makeOrient("down", false, 2, 1);
  cv::Mat result = transformMat(input, orient);
  EXPECT_EQ(result.rows, 2);
  EXPECT_EQ(result.cols, 1);
  EXPECT_EQ(result.at<cv::Vec3b>(0, 0), (cv::Vec3b{0, 0, 255})); // B
  EXPECT_EQ(result.at<cv::Vec3b>(1, 0), (cv::Vec3b{255, 0, 0})); // R
}

// 2-row × 1-col input → CW → 1-row × 2-col output.
// CW: result(0,0)=src(1,0)=B, result(0,1)=src(0,0)=R.
TEST(TransformMat, AppliesCWRegardlessOfOrientation_Left) {
  cv::Mat input(2, 1, CV_8UC3);
  input.at<cv::Vec3b>(0, 0) = {255, 0, 0}; // R at top
  input.at<cv::Vec3b>(1, 0) = {0, 0, 255}; // B at bottom
  auto orient = makeOrient("left", false, 1, 2);
  cv::Mat result = transformMat(input, orient);
  EXPECT_EQ(result.rows, 1);
  EXPECT_EQ(result.cols, 2);
  EXPECT_EQ(result.at<cv::Vec3b>(0, 0), (cv::Vec3b{0, 0, 255})); // B
  EXPECT_EQ(result.at<cv::Vec3b>(0, 1), (cv::Vec3b{255, 0, 0})); // R
}

// Same 2-row × 1-col input → same CW result as "left".
TEST(TransformMat, AppliesCWRegardlessOfOrientation_Right) {
  cv::Mat input(2, 1, CV_8UC3);
  input.at<cv::Vec3b>(0, 0) = {255, 0, 0}; // R at top
  input.at<cv::Vec3b>(1, 0) = {0, 0, 255}; // B at bottom
  auto orient = makeOrient("right", false, 1, 2);
  cv::Mat result = transformMat(input, orient);
  EXPECT_EQ(result.rows, 1);
  EXPECT_EQ(result.cols, 2);
  EXPECT_EQ(result.at<cv::Vec3b>(0, 0), (cv::Vec3b{0, 0, 255})); // B
  EXPECT_EQ(result.at<cv::Vec3b>(0, 1), (cv::Vec3b{255, 0, 0})); // R
}

// isMirrored=true: flip H first, then CW.
// 1×2 input: left=R, right=B. After H-flip: left=B, right=R.
// CW on 1×2→2×1: result(0,0)=flipped(0,1)=R, result(1,0)=flipped(0,0)=B.
TEST(TransformMat, FlipsHorizontallyThenCW) {
  cv::Mat input(1, 2, CV_8UC3);
  input.at<cv::Vec3b>(0, 0) = {255, 0, 0}; // R
  input.at<cv::Vec3b>(0, 1) = {0, 0, 255}; // B
  auto orient = makeOrient("up", true, 2, 1);
  cv::Mat result = transformMat(input, orient);
  EXPECT_EQ(result.rows, 2);
  EXPECT_EQ(result.cols, 1);
  EXPECT_EQ(result.at<cv::Vec3b>(0, 0), (cv::Vec3b{255, 0, 0})); // R
  EXPECT_EQ(result.at<cv::Vec3b>(1, 0), (cv::Vec3b{0, 0, 255})); // B
}

// ============================================================================
// transformPoints — always applies CW rotation regardless of orientation.
//
// CW formula per point: p.x = h - p.y, p.y = old_p.x
// ============================================================================

// w=640, h=480. pt(10,20): p.x=480-20=460, p.y=10.
TEST(TransformPoints, AppliesCWRegardlessOfOrientation_Up) {
  struct Pt { float x; float y; };
  std::array<Pt, 4> pts = {{{10,20},{30,40},{50,60},{70,80}}};
  auto orient = makeOrient("up", false, 640, 480);
  transformPoints(pts, orient);
  EXPECT_FLOAT_EQ(pts[0].x, 460); EXPECT_FLOAT_EQ(pts[0].y, 10);
  EXPECT_FLOAT_EQ(pts[1].x, 440); EXPECT_FLOAT_EQ(pts[1].y, 30);
  EXPECT_FLOAT_EQ(pts[2].x, 420); EXPECT_FLOAT_EQ(pts[2].y, 50);
  EXPECT_FLOAT_EQ(pts[3].x, 400); EXPECT_FLOAT_EQ(pts[3].y, 70);
}

// w=480, h=640. pt(10,20): p.x=640-20=620, p.y=10. Same for all orientations with same h.
TEST(TransformPoints, AppliesCWRegardlessOfOrientation_Down) {
  struct Pt { float x; float y; };
  std::array<Pt, 4> pts = {{{10,20},{30,40},{50,60},{70,80}}};
  auto orient = makeOrient("down", false, 480, 640);
  transformPoints(pts, orient);
  EXPECT_FLOAT_EQ(pts[0].x, 620); EXPECT_FLOAT_EQ(pts[0].y, 10);
  EXPECT_FLOAT_EQ(pts[1].x, 600); EXPECT_FLOAT_EQ(pts[1].y, 30);
  EXPECT_FLOAT_EQ(pts[2].x, 580); EXPECT_FLOAT_EQ(pts[2].y, 50);
  EXPECT_FLOAT_EQ(pts[3].x, 560); EXPECT_FLOAT_EQ(pts[3].y, 70);
}

TEST(TransformPoints, AppliesCWRegardlessOfOrientation_Left) {
  struct Pt { float x; float y; };
  std::array<Pt, 4> pts = {{{10,20},{30,40},{50,60},{70,80}}};
  auto orient = makeOrient("left", false, 480, 640);
  transformPoints(pts, orient);
  EXPECT_FLOAT_EQ(pts[0].x, 620); EXPECT_FLOAT_EQ(pts[0].y, 10);
  EXPECT_FLOAT_EQ(pts[1].x, 600); EXPECT_FLOAT_EQ(pts[1].y, 30);
  EXPECT_FLOAT_EQ(pts[2].x, 580); EXPECT_FLOAT_EQ(pts[2].y, 50);
  EXPECT_FLOAT_EQ(pts[3].x, 560); EXPECT_FLOAT_EQ(pts[3].y, 70);
}

TEST(TransformPoints, AppliesCWRegardlessOfOrientation_Right) {
  struct Pt { float x; float y; };
  std::array<Pt, 4> pts = {{{10,20},{30,40},{50,60},{70,80}}};
  auto orient = makeOrient("right", false, 480, 640);
  transformPoints(pts, orient);
  EXPECT_FLOAT_EQ(pts[0].x, 620); EXPECT_FLOAT_EQ(pts[0].y, 10);
  EXPECT_FLOAT_EQ(pts[1].x, 600); EXPECT_FLOAT_EQ(pts[1].y, 30);
  EXPECT_FLOAT_EQ(pts[2].x, 580); EXPECT_FLOAT_EQ(pts[2].y, 50);
  EXPECT_FLOAT_EQ(pts[3].x, 560); EXPECT_FLOAT_EQ(pts[3].y, 70);
}

// isMirrored=true: flip H first (p.x = w - p.x), then CW.
// w=480, h=640. pt(10,20): flip→x=470; CW: p.x=640-20=620, p.y=470.
TEST(TransformPoints, FlipsHorizontallyThenCW) {
  struct Pt { float x; float y; };
  std::array<Pt, 4> pts = {{{10,20},{30,40},{50,60},{70,80}}};
  auto orient = makeOrient("up", true, 480, 640);
  transformPoints(pts, orient);
  EXPECT_FLOAT_EQ(pts[0].x, 620); EXPECT_FLOAT_EQ(pts[0].y, 470); // 480-10=470
  EXPECT_FLOAT_EQ(pts[1].x, 600); EXPECT_FLOAT_EQ(pts[1].y, 450); // 480-30=450
  EXPECT_FLOAT_EQ(pts[2].x, 580); EXPECT_FLOAT_EQ(pts[2].y, 430); // 480-50=430
  EXPECT_FLOAT_EQ(pts[3].x, 560); EXPECT_FLOAT_EQ(pts[3].y, 410); // 480-70=410
}
