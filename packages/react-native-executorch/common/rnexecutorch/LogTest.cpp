#include "Log.h"
#include <gtest/gtest.h>

TEST(PrintElementTest, HandlesIntegers) {
  int number = 123;
  std::ostringstream oss;
  log_implementation::print_element(oss, number);
  EXPECT_EQ(oss.str(), "123");
}

TEST(PrintElementTest, HandlesStrings) {
  std::string message = "Hello World";
  std::ostringstream oss;
  log_implementation::print_element(oss, message);
  EXPECT_EQ(oss.str(), "Hello World");
}

TEST(PrintElementTest, HandlesSingleElementQueue) {
  std::queue<int> q;
  q.push(42);

  std::ostringstream oss;
  log_implementation::print_element(oss, q);

  EXPECT_EQ(oss.str(), "[42]");
}

TEST(PrintElementTest, HandlesMultipleElementQueue) {
  std::queue<int> q;
  q.push(10);
  q.push(20);
  q.push(30);

  std::ostringstream oss;
  log_implementation::print_element(oss, q);

  EXPECT_EQ(oss.str(), "[10, 20, 30]");
}

TEST(PrintElementTest, HandlesNestedContainers) {
  std::queue<std::vector<int>> q;
  q.push({1, 2, 3});
  q.push({4, 5});

  std::ostringstream oss;
  log_implementation::print_element(oss, q);

  EXPECT_EQ(oss.str(), "[[1, 2, 3], [4, 5]]");
}

TEST(PrintElementTest, HandlesVectorOfInts) {
  std::vector<int> vec = {1, 2, 3, 4};
  std::ostringstream oss;
  log_implementation::print_element(oss, vec);
  EXPECT_EQ(oss.str(), "[1, 2, 3, 4]");
}

TEST(PrintElementTest, HandlesVectorOfVectors) {
  std::vector<std::vector<int>> nestedVec = {{1, 2}, {3, 4}};
  std::ostringstream oss;
  log_implementation::print_element(oss, nestedVec);
  EXPECT_EQ(oss.str(), "[[1, 2], [3, 4]]");
}

TEST(PrintElementTest, HandlesMap) {
  std::map<std::string, int> mapData = {{"one", 1}, {"two", 2}};
  std::ostringstream oss;
  log_implementation::print_element(oss, mapData);
  EXPECT_EQ(oss.str(), "[(one, 1), (two, 2)]");
}

TEST(PrintElementTest, HandlesEmptyVector) {
  std::vector<int> emptyVec;
  std::ostringstream oss;
  log_implementation::print_element(oss, emptyVec);
  EXPECT_EQ(oss.str(), "[]");
}

TEST(PrintElementTest, HandlesSingleElementVector) {
  std::vector<int> singleElementVec = {42};
  std::ostringstream oss;
  log_implementation::print_element(oss, singleElementVec);
  EXPECT_EQ(oss.str(), "[42]");
}

int main(int argc, char **argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}