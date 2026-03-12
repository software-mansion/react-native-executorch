#include <executorch/runtime/core/exec_aten/exec_aten.h>
#include <gtest/gtest.h>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/utils/FrameProcessor.h>

using namespace rnexecutorch;
using namespace rnexecutorch::utils;
using executorch::aten::ScalarType;

static JSTensorViewIn makeValidView(std::vector<uint8_t> &buf, int32_t h,
                                    int32_t w) {
  buf.assign(static_cast<size_t>(h * w * 3), 128);
  return JSTensorViewIn{buf.data(), {h, w, 3}, ScalarType::Byte};
}

// ============================================================================
// Valid input
// ============================================================================
TEST(PixelsToMatValidInput, ProducesCorrectRows) {
  std::vector<uint8_t> buf;
  auto view = makeValidView(buf, 48, 64);
  EXPECT_EQ(pixelsToMat(view).rows, 48);
}

TEST(PixelsToMatValidInput, ProducesCorrectCols) {
  std::vector<uint8_t> buf;
  auto view = makeValidView(buf, 48, 64);
  EXPECT_EQ(pixelsToMat(view).cols, 64);
}

TEST(PixelsToMatValidInput, ProducesThreeChannelMat) {
  std::vector<uint8_t> buf;
  auto view = makeValidView(buf, 4, 4);
  EXPECT_EQ(pixelsToMat(view).channels(), 3);
}

TEST(PixelsToMatValidInput, MatTypeIsCV_8UC3) {
  std::vector<uint8_t> buf;
  auto view = makeValidView(buf, 4, 4);
  EXPECT_EQ(pixelsToMat(view).type(), CV_8UC3);
}

TEST(PixelsToMatValidInput, MatWrapsOriginalData) {
  std::vector<uint8_t> buf;
  auto view = makeValidView(buf, 4, 4);
  auto mat = pixelsToMat(view);
  EXPECT_EQ(mat.data, buf.data());
}

// ============================================================================
// Invalid sizes dimensionality
// ============================================================================
TEST(PixelsToMatInvalidSizes, TwoDimensionalThrows) {
  std::vector<uint8_t> buf(16, 0);
  JSTensorViewIn view{buf.data(), {4, 4}, ScalarType::Byte};
  EXPECT_THROW(pixelsToMat(view), RnExecutorchError);
}

TEST(PixelsToMatInvalidSizes, FourDimensionalThrows) {
  std::vector<uint8_t> buf(48, 0);
  JSTensorViewIn view{buf.data(), {1, 4, 4, 3}, ScalarType::Byte};
  EXPECT_THROW(pixelsToMat(view), RnExecutorchError);
}

TEST(PixelsToMatInvalidSizes, EmptySizesThrows) {
  std::vector<uint8_t> buf(4, 0);
  JSTensorViewIn view{buf.data(), {}, ScalarType::Byte};
  EXPECT_THROW(pixelsToMat(view), RnExecutorchError);
}

// ============================================================================
// Invalid channel count
// ============================================================================
TEST(PixelsToMatInvalidChannels, OneChannelThrows) {
  std::vector<uint8_t> buf(16, 0);
  JSTensorViewIn view{buf.data(), {4, 4, 1}, ScalarType::Byte};
  EXPECT_THROW(pixelsToMat(view), RnExecutorchError);
}

TEST(PixelsToMatInvalidChannels, FourChannelsThrows) {
  std::vector<uint8_t> buf(64, 0);
  JSTensorViewIn view{buf.data(), {4, 4, 4}, ScalarType::Byte};
  EXPECT_THROW(pixelsToMat(view), RnExecutorchError);
}

// ============================================================================
// Invalid scalar type
// ============================================================================
TEST(PixelsToMatInvalidScalarType, FloatScalarTypeThrows) {
  std::vector<uint8_t> buf(48, 0);
  JSTensorViewIn view{buf.data(), {4, 4, 3}, ScalarType::Float};
  EXPECT_THROW(pixelsToMat(view), RnExecutorchError);
}

TEST(PixelsToMatInvalidScalarType, IntScalarTypeThrows) {
  std::vector<uint8_t> buf(48, 0);
  JSTensorViewIn view{buf.data(), {4, 4, 3}, ScalarType::Int};
  EXPECT_THROW(pixelsToMat(view), RnExecutorchError);
}
