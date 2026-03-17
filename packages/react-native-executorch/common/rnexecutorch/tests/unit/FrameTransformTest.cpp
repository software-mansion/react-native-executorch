#include <gtest/gtest.h>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/utils/FrameTransform.h>

using namespace rnexecutorch::utils;

static FrameOrientation makeOrient(const std::string &o, bool mirrored,
                                   int w, int h) {
  return {o, mirrored, w, h};
}

// ============================================================================
// transformBbox — "up" (no-op: sensor native = landscape-left)
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
// transformBbox — "down" (180°: landscape-right)
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
// transformBbox — "left" (CCW: portrait → new_x=y, new_y=w-x)
// Raw frame w=480, h=640 (landscape sensor). Box (10,20)-(100,200):
//   new_x1=y1=20, new_y1=w-x2=480-100=380
//   new_x2=y2=200, new_y2=w-x1=480-10=470
// ============================================================================
TEST(TransformBboxLeft, AppliesCCWRotation) {
  auto orient = makeOrient("left", false, 480, 640);
  float x1 = 10, y1 = 20, x2 = 100, y2 = 200;
  transformBbox(x1, y1, x2, y2, orient);
  EXPECT_FLOAT_EQ(x1, 20);
  EXPECT_FLOAT_EQ(y1, 380);
  EXPECT_FLOAT_EQ(x2, 200);
  EXPECT_FLOAT_EQ(y2, 470);
}

// ============================================================================
// transformBbox — "right" (CW: upside-down portrait → new_x=h-y, new_y=x)
// Raw frame w=480, h=640. Box (10,20)-(100,200):
//   new_x1=h-y2=640-200=440, new_y1=x1=10
//   new_x2=h-y1=640-20=620,  new_y2=x2=100
// ============================================================================
TEST(TransformBboxRight, AppliesCWRotation) {
  auto orient = makeOrient("right", false, 480, 640);
  float x1 = 10, y1 = 20, x2 = 100, y2 = 200;
  transformBbox(x1, y1, x2, y2, orient);
  EXPECT_FLOAT_EQ(x1, 440);
  EXPECT_FLOAT_EQ(y1, 10);
  EXPECT_FLOAT_EQ(x2, 620);
  EXPECT_FLOAT_EQ(y2, 100);
}

// ============================================================================
// transformBbox — isMirrored=true with "up" (no-op orientation)
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
// transformMat — "up" (no-op: sensor native = landscape-left)
// ============================================================================
TEST(TransformMatUp, NoOpWhenOrientationIsUp) {
  cv::Mat input(480, 640, CV_8UC3, cv::Scalar(1, 2, 3));
  auto orient = makeOrient("up", false, 640, 480);
  cv::Mat result = transformMat(input, orient);
  EXPECT_EQ(result.rows, 480);
  EXPECT_EQ(result.cols, 640);
}

// ============================================================================
// transformMat — "down" (180°: landscape-right, same dimensions)
// 1x2 mat: (0,0)=R, (0,1)=B → after 180°: (0,0)=B, (0,1)=R
// ============================================================================
TEST(TransformMatDown, SameDimensionsAndPixels) {
  cv::Mat input(1, 2, CV_8UC3);
  input.at<cv::Vec3b>(0, 0) = {255, 0, 0}; // R on left
  input.at<cv::Vec3b>(0, 1) = {0, 0, 255}; // B on right
  auto orient = makeOrient("down", false, 2, 1);
  cv::Mat result = transformMat(input, orient);
  EXPECT_EQ(result.rows, 1);
  EXPECT_EQ(result.cols, 2);
  EXPECT_EQ(result.at<cv::Vec3b>(0, 0), (cv::Vec3b{0, 0, 255})); // B
  EXPECT_EQ(result.at<cv::Vec3b>(0, 1), (cv::Vec3b{255, 0, 0})); // R
}

// ============================================================================
// transformMat — "left" (CCW: portrait, rows and cols swap)
// 2 rows x 1 col: (0,0)=R, (1,0)=B → after CCW: 1 row x 2 cols
// After ROTATE_90_CCW: result(0,0)=B, result(0,1)=R
// ============================================================================
TEST(TransformMatLeft, SwapsDimensionsAndPixels) {
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

// ============================================================================
// transformMat — "right" (CW: upside-down portrait, rows and cols swap)
// 2 rows x 1 col: (0,0)=R, (1,0)=B → after CW: 1 row x 2 cols
// After ROTATE_90_CW: result(0,0)=R, result(0,1)=B
// ============================================================================
TEST(TransformMatRight, SwapsDimensionsAndPixels) {
  cv::Mat input(2, 1, CV_8UC3);
  input.at<cv::Vec3b>(0, 0) = {255, 0, 0}; // R at top
  input.at<cv::Vec3b>(1, 0) = {0, 0, 255}; // B at bottom
  auto orient = makeOrient("right", false, 1, 2);
  cv::Mat result = transformMat(input, orient);
  EXPECT_EQ(result.rows, 1);
  EXPECT_EQ(result.cols, 2);
  EXPECT_EQ(result.at<cv::Vec3b>(0, 0), (cv::Vec3b{255, 0, 0})); // R
  EXPECT_EQ(result.at<cv::Vec3b>(0, 1), (cv::Vec3b{0, 0, 255})); // B
}

// ============================================================================
// transformMat — isMirrored (flip then rotate, using "up" = no-op orientation)
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
// transformPoints — "up" (no-op: sensor native = landscape-left)
// ============================================================================
TEST(TransformPointsUp, NoOp) {
  struct Pt { float x; float y; };
  std::array<Pt, 4> pts = {{{10,20},{30,40},{50,60},{70,80}}};
  auto orient = makeOrient("up", false, 640, 480);
  transformPoints(pts, orient);
  EXPECT_FLOAT_EQ(pts[0].x, 10); EXPECT_FLOAT_EQ(pts[0].y, 20);
  EXPECT_FLOAT_EQ(pts[1].x, 30); EXPECT_FLOAT_EQ(pts[1].y, 40);
  EXPECT_FLOAT_EQ(pts[2].x, 50); EXPECT_FLOAT_EQ(pts[2].y, 60);
  EXPECT_FLOAT_EQ(pts[3].x, 70); EXPECT_FLOAT_EQ(pts[3].y, 80);
}

// ============================================================================
// transformPoints — "down" (180° per point: new_x=w-x, new_y=h-y)
// w=480, h=640. Point (10,20) → (470, 620), (50,60) → (430, 580)
// ============================================================================
TEST(TransformPointsDown, Applies180PerPoint) {
  struct Pt { float x; float y; };
  std::array<Pt, 4> pts = {{{10,20},{30,40},{50,60},{70,80}}};
  auto orient = makeOrient("down", false, 480, 640);
  transformPoints(pts, orient);
  EXPECT_FLOAT_EQ(pts[0].x, 470);  // 480-10=470
  EXPECT_FLOAT_EQ(pts[0].y, 620);  // 640-20=620
  EXPECT_FLOAT_EQ(pts[1].x, 450);  // 480-30=450
  EXPECT_FLOAT_EQ(pts[1].y, 600);  // 640-40=600
  EXPECT_FLOAT_EQ(pts[2].x, 430);  // 480-50=430
  EXPECT_FLOAT_EQ(pts[2].y, 580);  // 640-60=580
  EXPECT_FLOAT_EQ(pts[3].x, 410);  // 480-70=410
  EXPECT_FLOAT_EQ(pts[3].y, 560);  // 640-80=560
}

// ============================================================================
// transformPoints — "left" (CCW per point: new_x=y, new_y=w-x)
// w=480. Point (10,20) → (20, 470), (30,40) → (40, 450)
// ============================================================================
TEST(TransformPointsLeft, AppliesCCWPerPoint) {
  struct Pt { float x; float y; };
  std::array<Pt, 4> pts = {{{10,20},{30,40},{50,60},{70,80}}};
  auto orient = makeOrient("left", false, 480, 640);
  transformPoints(pts, orient);
  EXPECT_FLOAT_EQ(pts[0].x, 20);   // y=20
  EXPECT_FLOAT_EQ(pts[0].y, 470);  // 480-10=470
  EXPECT_FLOAT_EQ(pts[1].x, 40);   // y=40
  EXPECT_FLOAT_EQ(pts[1].y, 450);  // 480-30=450
  EXPECT_FLOAT_EQ(pts[2].x, 60);   // y=60
  EXPECT_FLOAT_EQ(pts[2].y, 430);  // 480-50=430
  EXPECT_FLOAT_EQ(pts[3].x, 80);   // y=80
  EXPECT_FLOAT_EQ(pts[3].y, 410);  // 480-70=410
}

// ============================================================================
// transformPoints — "right" (CW per point: new_x=h-y, new_y=x)
// h=640. Point (10,20) → (620, 10), (30,40) → (600, 30)
// ============================================================================
TEST(TransformPointsRight, AppliesCWPerPoint) {
  struct Pt { float x; float y; };
  std::array<Pt, 4> pts = {{{10,20},{30,40},{50,60},{70,80}}};
  auto orient = makeOrient("right", false, 480, 640);
  transformPoints(pts, orient);
  EXPECT_FLOAT_EQ(pts[0].x, 620);  // 640-20=620
  EXPECT_FLOAT_EQ(pts[0].y, 10);
  EXPECT_FLOAT_EQ(pts[1].x, 600);  // 640-40=600
  EXPECT_FLOAT_EQ(pts[1].y, 30);
  EXPECT_FLOAT_EQ(pts[2].x, 580);  // 640-60=580
  EXPECT_FLOAT_EQ(pts[2].y, 50);
  EXPECT_FLOAT_EQ(pts[3].x, 560);  // 640-80=560
  EXPECT_FLOAT_EQ(pts[3].y, 70);
}

// ============================================================================
// transformPoints — isMirrored=true with "up" (no-op orientation)
// Flip: new_x = w - x. w=480. Point (10,20) → (470,20), (70,80) → (410,80)
// ============================================================================
TEST(TransformPointsMirrored, FlipsHorizontallyBeforeRotation) {
  struct Pt { float x; float y; };
  std::array<Pt, 4> pts = {{{10,20},{30,40},{50,60},{70,80}}};
  auto orient = makeOrient("up", true, 480, 640);
  transformPoints(pts, orient);
  EXPECT_FLOAT_EQ(pts[0].x, 470);  // 480-10=470
  EXPECT_FLOAT_EQ(pts[0].y, 20);
  EXPECT_FLOAT_EQ(pts[1].x, 450);  // 480-30=450
  EXPECT_FLOAT_EQ(pts[1].y, 40);
  EXPECT_FLOAT_EQ(pts[2].x, 430);  // 480-50=430
  EXPECT_FLOAT_EQ(pts[2].y, 60);
  EXPECT_FLOAT_EQ(pts[3].x, 410);  // 480-70=410
  EXPECT_FLOAT_EQ(pts[3].y, 80);
}
