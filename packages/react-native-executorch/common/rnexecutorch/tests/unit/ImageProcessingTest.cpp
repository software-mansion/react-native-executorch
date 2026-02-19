#include "../data_processing/ImageProcessing.h"
#include <gtest/gtest.h>
#include <opencv2/opencv.hpp>
#include <string>

#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>

const std::string RAW_BASE64_JPEG =
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP////////////////////////////////////////"
    "//////////////////////////////////////////////2wBDAf//////////////////////"
    "////////////////////////////////////////////////////////////////"
    "wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/"
    "xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAQAAAAAAAAAAAAAAAAAAAAH/"
    "xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwC/gAf/2Q==";

namespace rnexecutorch::image_processing {
TEST(ReadImageTest, WorksWithWholeUriBase64) {
  std::string dataUri = "data:image/jpeg;base64," + RAW_BASE64_JPEG;

  cv::Mat image;
  ASSERT_NO_THROW({ image = readImage(dataUri); });

  EXPECT_FALSE(image.empty());
  EXPECT_EQ(image.rows, 1);
  EXPECT_EQ(image.cols, 1);
}

TEST(ReadImageTest, WorksWithRawBase64Content) {
  cv::Mat image;
  ASSERT_NO_THROW({ image = readImage(RAW_BASE64_JPEG); });

  EXPECT_FALSE(image.empty());
  EXPECT_EQ(image.rows, 1);
  EXPECT_EQ(image.cols, 1);
}

TEST(ReadImageTest, FailsForInvalidBase64UriFormat) {
  std::string invalidUri =
      "data:image/jpeg;base64,extra,comma," + RAW_BASE64_JPEG;

  EXPECT_THROW({ readImage(invalidUri); }, RnExecutorchError);

  try {
    readImage(invalidUri);
  } catch (const RnExecutorchError &e) {
    EXPECT_EQ(e.getNumericCode(),
              static_cast<int32_t>(RnExecutorchErrorCode::FileReadFailed));
  }
}

TEST(ReadImageTest, FailsForInvalidBase64Data) {
  std::string badDataUri = "data:image/jpeg;base64,NOT_A_VALID_IMAGE_DATA";

  EXPECT_THROW({ readImage(badDataUri); }, RnExecutorchError);

  try {
    readImage(badDataUri);
  } catch (const RnExecutorchError &e) {
    EXPECT_STREQ(e.what(), "Read image error: invalid argument");
  }
}
} // namespace rnexecutorch::image_processing