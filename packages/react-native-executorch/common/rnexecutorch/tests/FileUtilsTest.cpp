#include "../data_processing/FileUtils.h"
#include <fstream>
#include <gtest/gtest.h>
#include <iostream>

#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>

namespace rnexecutorch::file_utils {
class FileIOTest : public ::testing::Test {
protected:
  std::string tempFileName = "temp_test_file.txt";

  void SetUp() override {
    std::ofstream out(tempFileName, std::ios::binary);
    out << "Hello, world";
    out.close();
  }

  void TearDown() override {
    std::remove(tempFileName.c_str());
  }
};

TEST_F(FileIOTest, LoadBytesFromFileSuccessfully) {
  std::string data = loadBytesFromFile(tempFileName);
  EXPECT_EQ(data, "Hello, world");
}

TEST_F(FileIOTest, LoadBytesFromFileFailOnNonExistentFile) {
  EXPECT_THROW(
      { loadBytesFromFile("non_existent_file.txt"); }, RnExecutorchError);
}
} // namespace rnexecutorch::file_utils
