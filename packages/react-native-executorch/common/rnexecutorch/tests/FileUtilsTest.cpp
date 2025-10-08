#include "../data_processing/FileUtils.h"
#include <fstream>
#include <gtest/gtest.h>
#include <iostream>

namespace rnexecutorch::file_utils {
// Test Fixture
class FileIOTest : public ::testing::Test {
protected:
  std::string tempFileName = "temp_test_file.txt";

  void SetUp() override {
    // Create a file with some content
    std::ofstream out(tempFileName, std::ios::binary);
    out << "Hello, world";
    out.close();
  }

  void TearDown() override {
    // Delete the file
    std::remove(tempFileName.c_str());
  }
};

// Positive Test Case
TEST_F(FileIOTest, LoadBytesFromFileSuccessfully) {
  std::string data = loadBytesFromFile(tempFileName);
  EXPECT_EQ(data, "Hello, world");
}

// Negative Test Case
TEST_F(FileIOTest, LoadBytesFromFileFailOnNonExistentFile) {
  EXPECT_THROW(
      { loadBytesFromFile("non_existent_file.txt"); }, std::runtime_error);
}
} // namespace rnexecutorch::file_utils
