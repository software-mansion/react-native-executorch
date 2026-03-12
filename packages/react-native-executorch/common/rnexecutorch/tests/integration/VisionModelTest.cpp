#include <executorch/runtime/core/exec_aten/exec_aten.h>
#include <gtest/gtest.h>
#include <memory>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/models/VisionModel.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models;
using executorch::aten::ScalarType;

// ============================================================================
// TestableVisionModel — exposes protected methods for testing
// ============================================================================
class TestableVisionModel : public VisionModel {
public:
  explicit TestableVisionModel(const std::string &path)
      : VisionModel(path, nullptr) {}

  cv::Mat preprocessPublic(const cv::Mat &img) const { return preprocess(img); }

  cv::Mat extractFromPixelsPublic(const JSTensorViewIn &v) const {
    return extractFromPixels(v);
  }

  void setInputShape(std::vector<int32_t> shape) {
    modelInputShape_ = std::move(shape);
  }
};

// Reuse the style_transfer .pte as a vehicle — we never call forward().
constexpr auto kModelPath = "style_transfer_candy_xnnpack_fp32.pte";

// ============================================================================
// preprocess() tests
// ============================================================================
class VisionModelPreprocessTest : public ::testing::Test {
protected:
  void SetUp() override {
    model = std::make_unique<TestableVisionModel>(kModelPath);
  }
  std::unique_ptr<TestableVisionModel> model;
};

TEST_F(VisionModelPreprocessTest, CorrectSizeImageReturnedAsIs) {
  model->setInputShape({1, 3, 64, 64});
  cv::Mat img(64, 64, CV_8UC3, cv::Scalar(100, 150, 200));
  auto result = model->preprocessPublic(img);
  EXPECT_EQ(result.size(), cv::Size(64, 64));
}

TEST_F(VisionModelPreprocessTest, CorrectSizeDataUnchanged) {
  model->setInputShape({1, 3, 8, 8});
  cv::Mat img(8, 8, CV_8UC3, cv::Scalar(255, 0, 0));
  auto result = model->preprocessPublic(img);
  auto pixel = result.at<cv::Vec3b>(0, 0);
  EXPECT_EQ(pixel[0], 255);
  EXPECT_EQ(pixel[1], 0);
  EXPECT_EQ(pixel[2], 0);
}

TEST_F(VisionModelPreprocessTest, LargerImageIsResizedDown) {
  model->setInputShape({1, 3, 32, 32});
  cv::Mat img(128, 128, CV_8UC3, cv::Scalar(0));
  auto result = model->preprocessPublic(img);
  EXPECT_EQ(result.size(), cv::Size(32, 32));
}

TEST_F(VisionModelPreprocessTest, SmallerImageIsResizedUp) {
  model->setInputShape({1, 3, 128, 128});
  cv::Mat img(32, 32, CV_8UC3, cv::Scalar(0));
  auto result = model->preprocessPublic(img);
  EXPECT_EQ(result.size(), cv::Size(128, 128));
}

TEST_F(VisionModelPreprocessTest, NonSquareTargetSize) {
  model->setInputShape({1, 3, 48, 96});
  cv::Mat img(200, 100, CV_8UC3, cv::Scalar(0));
  auto result = model->preprocessPublic(img);
  EXPECT_EQ(result.rows, 48);
  EXPECT_EQ(result.cols, 96);
}

// ============================================================================
// extractFromPixels() tests
// ============================================================================
class VisionModelExtractFromPixelsTest : public ::testing::Test {
protected:
  void SetUp() override {
    model = std::make_unique<TestableVisionModel>(kModelPath);
  }
  std::unique_ptr<TestableVisionModel> model;
};

TEST_F(VisionModelExtractFromPixelsTest, ValidInputReturnsCorrectDimensions) {
  std::vector<uint8_t> buf(64 * 64 * 3, 128);
  JSTensorViewIn view{buf.data(), {64, 64, 3}, ScalarType::Byte};
  auto mat = model->extractFromPixelsPublic(view);
  EXPECT_EQ(mat.rows, 64);
  EXPECT_EQ(mat.cols, 64);
  EXPECT_EQ(mat.channels(), 3);
}

TEST_F(VisionModelExtractFromPixelsTest, TwoDimensionalSizesThrows) {
  std::vector<uint8_t> buf(16, 0);
  JSTensorViewIn view{buf.data(), {4, 4}, ScalarType::Byte};
  EXPECT_THROW(model->extractFromPixelsPublic(view), RnExecutorchError);
}

TEST_F(VisionModelExtractFromPixelsTest, WrongChannelsThrows) {
  std::vector<uint8_t> buf(64, 0);
  JSTensorViewIn view{buf.data(), {4, 4, 4}, ScalarType::Byte};
  EXPECT_THROW(model->extractFromPixelsPublic(view), RnExecutorchError);
}

TEST_F(VisionModelExtractFromPixelsTest, WrongScalarTypeThrows) {
  std::vector<uint8_t> buf(48, 0);
  JSTensorViewIn view{buf.data(), {4, 4, 3}, ScalarType::Float};
  EXPECT_THROW(model->extractFromPixelsPublic(view), RnExecutorchError);
}
