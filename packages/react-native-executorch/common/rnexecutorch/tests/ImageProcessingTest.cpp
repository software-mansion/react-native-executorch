#include "data_processing/ImageProcessing.h"
#include <filesystem>
#include <gtest/gtest.h>
#include <opencv2/opencv.hpp>

namespace rnexecutorch::image_processing {

namespace fs = std::filesystem;

class ImageProcessingTests : public ::testing::Test {
protected:
  cv::Mat testImage;
  void SetUp() override {
    testImage = cv::Mat::ones(100, 100, CV_8UC3) * 255; // white test image
  }
};

// Test for saveToTempFile
TEST_F(ImageProcessingTests, SaveToTempFile) {
  std::string filePath = saveToTempFile(testImage);
  ASSERT_TRUE(filePath.starts_with("file://"));
  ASSERT_TRUE(filePath.ends_with(".png"));
  ASSERT_TRUE(fs::exists(filePath.substr(7)));
  ASSERT_NO_THROW(auto mat = cv::imread(filePath, cv::IMREAD_COLOR));
  ASSERT(!mat.empty());

  fs::remove(filePath.substr(7));
}

} // namespace rnexecutorch::image_processing