#include "Log.h"
#include <gtest/gtest.h>

#include <array>
#include <cmath>
#include <complex>
#include <deque>
#include <forward_list>
#include <fstream>
#include <functional>
#include <list>
#include <map>
#include <queue>
#include <regex>
#include <set>
#include <stack>
#include <stdexcept>
#include <string_view>
#include <unordered_map>
#include <unordered_set>
#include <vector>

namespace low_level_log_implementation {

class TestValue : public ::testing::Test {
protected:
  std::ostringstream oss;

  template <typename T>
  void testValueViaComparison(const T &value,
                              const std::string &expectedOutput) {
    printElement(oss, value);
    EXPECT_EQ(oss.str(), expectedOutput);
    oss.str("");
    oss.clear();
  }

  template <typename Container>
  void testValueViaRegex(const Container &container,
                         const std::string &expectedPattern) {
    printElement(oss, container);
    std::regex pattern(expectedPattern);
    EXPECT_TRUE(std::regex_search(oss.str(), pattern))
        << "Expected pattern not found: " << expectedPattern;
    oss.str("");
    oss.clear();
  }
};

class DirectStreamableElementsPrintTest : public TestValue {};

class ContainerPrintTest : public TestValue {};

class NestedContainerPrintTest : public TestValue {};

class EgdeCasesPrintTest : public TestValue {};

class SmartPointerPrintTest : public TestValue {};

class OptionalPrintTest : public TestValue {};

class VariantPrintTest : public TestValue {};

class ErrorHandlingPrintTest : public TestValue {};

class FileSystemPrintTest : public TestValue {};

class UnsupportedLoggingTest : public ::testing::Test {};

class Point {
public:
  int x, y;

  constexpr Point(int x, int y) : x(x), y(y) {}

  // Overloading the << operator to make Point directly streamable
  friend std::ostream &operator<<(std::ostream &os, const Point &pt) {
    os << "Point(" << pt.x << ", " << pt.y << ")";
    return os;
  }
};

TEST_F(DirectStreamableElementsPrintTest, HandlesIntegers) {
  testValueViaComparison(123, "123");
}

TEST_F(DirectStreamableElementsPrintTest, HandlesStrings) {
  testValueViaComparison(std::string("Hello World"), "Hello World");
}

TEST_F(DirectStreamableElementsPrintTest, HandlesStringViews) {
  testValueViaComparison(std::string_view("Hello World"), "Hello World");
}

TEST_F(DirectStreamableElementsPrintTest, HandlesFloats) {
  testValueViaComparison(3.14159, "3.14159");
}

TEST_F(DirectStreamableElementsPrintTest, HandlesBooleans) {
  testValueViaComparison(true, "true");
  testValueViaComparison(false, "false");
}

TEST_F(DirectStreamableElementsPrintTest, HandlesChar) {
  testValueViaComparison('a', "a");
}

TEST_F(DirectStreamableElementsPrintTest, HandlesCharPointer) {
  const char *word = "Hello World";
  testValueViaComparison(word, "Hello World");
}

TEST_F(DirectStreamableElementsPrintTest, HandlesComplexNumbers) {
  using namespace std::complex_literals;
  oss << std::fixed << std::setprecision(1);
  std::complex<double> complexNumber = std::pow(1i, 2);
  testValueViaComparison(complexNumber, "(-1.0,0.0)");
}

TEST_F(DirectStreamableElementsPrintTest, HandlesPoint) {
  constexpr Point point(3, 4);
  testValueViaComparison(point, "Point(3, 4)");
}

// log handles operator<<(&ostream) for std::pair
TEST_F(DirectStreamableElementsPrintTest, HandlesStdPair) {
  std::pair<int, std::string> pairOfIntAndString = {42, "Hello"};
  testValueViaComparison(pairOfIntAndString, "(42, Hello)");

  // Testing edge cases with pairs
  const std::pair<std::string, std::string> emptyPair = {"", ""};
  testValueViaComparison(emptyPair, "(, )");
}

// log handles operator<<(&ostream) for std::tuple
TEST_F(DirectStreamableElementsPrintTest, HandlesStdTuple) {
  const std::tuple<int, std::string, double> tupleOfDifferentTypes = {
      42, "Tuple", 3.14};
  testValueViaComparison(tupleOfDifferentTypes, "<42, Tuple, 3.14>");

  // Testing tuples with all empty or zero-initialized elements
  const std::tuple<std::string, int, float> zeroInitializedTuple = {"", 0,
                                                                    0.0f};
  testValueViaComparison(zeroInitializedTuple, "<, 0, 0>");

  // Testing nested tuple
  const std::tuple<int, std::pair<std::string, bool>, float> nestedTuple = {
      1, {"nested", true}, 2.5};
  testValueViaComparison(nestedTuple, "<1, (nested, true), 2.5>");
}

TEST_F(ContainerPrintTest, VectorIntTest) {
  const std::vector<int> vectorOfInts = {1, 2, 3, 4};
  testValueViaComparison(vectorOfInts, "[1, 2, 3, 4]");
}

TEST_F(ContainerPrintTest, ListDoubleTest) {
  const std::list<double> listOfDoubles = {1.1, 2.2, 3.3};
  testValueViaComparison(listOfDoubles, "[1.1, 2.2, 3.3]");
}

TEST_F(ContainerPrintTest, DequeStringTest) {
  const std::deque<std::string> dequeOfStrings = {"hello", "world"};
  testValueViaComparison(dequeOfStrings, "[hello, world]");
}

TEST_F(ContainerPrintTest, SetTest) {
  const std::set<std::string> setOfStrings = {"apple", "banana", "cherry"};
  testValueViaComparison(setOfStrings,
                         "[apple, banana, cherry]"); // Note: Sets are sorted
}

TEST_F(ContainerPrintTest, MapTest) {
  const std::map<std::string, int> mapStringToInt = {{"one", 1}, {"two", 2}};
  testValueViaComparison(mapStringToInt, "[(one, 1), (two, 2)]");
}

TEST_F(ContainerPrintTest, HandlesUnorderedSet) {
  const std::unordered_set<int> unorderedSetOfInts = {4, 3, 2, 1};
  // Pattern expects to find each element at least once in any order
  testValueViaRegex(unorderedSetOfInts, R"(.*1.*2.*3.*4.*)");
}

TEST_F(ContainerPrintTest, HandlesUnorderedMultimap) {
  const std::unordered_multimap<std::string, int> unorderedMultimapStringToInt =
      {{"one", 1}, {"one", 2}, {"two", 2}};
  // Construct a regex pattern that captures each permutation once.
  printElement(oss, unorderedMultimapStringToInt);
  const std::string result =
      oss.str(); // Store the output of the print in a string

  // Check against each permutation explicitly
  bool matchFound = result == "[(one, 1), (one, 2), (two, 2)]" ||
                    result == "[(one, 1), (two, 2), (one, 2)]" ||
                    result == "[(one, 2), (one, 1), (two, 2)]" ||
                    result == "[(one, 2), (two, 2), (one, 1)]" ||
                    result == "[(two, 2), (one, 1), (one, 2)]" ||
                    result == "[(two, 2), (one, 2), (one, 1)]";

  EXPECT_TRUE(matchFound)
      << "Output did not match any of the expected permutations.";
}

TEST_F(ContainerPrintTest, StackTest) {
  std::stack<int> stackOfInts;
  stackOfInts.push(1);
  stackOfInts.push(2);
  stackOfInts.push(3);
  testValueViaComparison(stackOfInts, "[3, 2, 1]"); // LIFO order
}

TEST_F(ContainerPrintTest, QueueTest) {
  std::queue<int> queueOfInts;
  queueOfInts.push(1);
  queueOfInts.push(2);
  queueOfInts.push(3);
  testValueViaComparison(queueOfInts, "[1, 2, 3]"); // FIFO order
}

TEST_F(ContainerPrintTest, PriorityQueueTest) {
  std::priority_queue<int> priorityQueueOfInts;
  priorityQueueOfInts.push(3);
  priorityQueueOfInts.push(1);
  priorityQueueOfInts.push(2);
  testValueViaComparison(priorityQueueOfInts,
                         "[3, 2, 1]"); // Output based on internal max-heap
}

TEST_F(ContainerPrintTest, HandlesArray) {
  constexpr std::array<int, 3> arrayOfInts = {1, 2, 3};
  testValueViaComparison(arrayOfInts, "[1, 2, 3]");
}

TEST_F(ContainerPrintTest, HandlesForwardList) {
  const std::forward_list<int> forwardListOfInts = {1, 2, 3};
  testValueViaComparison(forwardListOfInts, "[1, 2, 3]");
}

TEST_F(ContainerPrintTest, HandlesMultiset) {
  const std::multiset<int> multisetOfInts = {3, 2, 1, 2};
  testValueViaComparison(multisetOfInts,
                         "[1, 2, 2, 3]"); // Multiset elements are sorted
}

TEST_F(ContainerPrintTest, HandlesMultimap) {
  const std::multimap<std::string, int> multimapStringToInt = {
      {"one", 1}, {"one", 2}, {"two", 2}};
  testValueViaComparison(multimapStringToInt, "[(one, 1), (one, 2), (two, 2)]");
}

TEST_F(ContainerPrintTest, HandlesSpan) {
  std::vector<int> vectorOfInts = {1, 2, 3, 4};
  const std::span<int> spanOnVector(
      vectorOfInts.begin(), vectorOfInts.end()); // Create a span from a vector
  testValueViaComparison(spanOnVector, "[1, 2, 3, 4]");
}

TEST_F(ContainerPrintTest, HandlesStaticArray) {
  constexpr int staticArray[] = {1, 2, 3, 4, 5};
  testValueViaComparison(staticArray, "[1, 2, 3, 4, 5]");
}

TEST_F(NestedContainerPrintTest, HandlesListOfQueuesOfPoints) {
  std::list<std::queue<Point>> listOfQueues = {std::queue<Point>()};
  listOfQueues.front().push(Point(1, 1));
  listOfQueues.front().push(Point(2, 2));
  listOfQueues.front().push(Point(3, 3));
  testValueViaComparison(listOfQueues,
                         "[[Point(1, 1), Point(2, 2), Point(3, 3)]]");
}

TEST_F(NestedContainerPrintTest, HandlesNestedVectors) {
  const std::vector<std::vector<int>> nestedVector = {{1, 2}, {3, 4, 5}};
  testValueViaComparison(nestedVector, "[[1, 2], [3, 4, 5]]");
}

TEST_F(NestedContainerPrintTest, HandlesMapOfVectorOfPoints) {
  const std::map<std::string, std::vector<Point>> mapOfVectors = {
      {"first", {Point(1, 2)}}, {"second", {Point(3, 4), Point(5, 6)}}};
  testValueViaComparison(
      mapOfVectors,
      "[(first, [Point(1, 2)]), (second, [Point(3, 4), Point(5, 6)])]");
}

TEST_F(NestedContainerPrintTest, HandlesVectorOfMaps) {
  const std::vector<std::map<std::string, int>> vectorOfMaps = {
      {{"one", 1}, {"two", 2}}, {{"three", 3}, {"four", 4}}};
  // word "three" is lexicographically smaller than "four"
  testValueViaComparison(vectorOfMaps,
                         "[[(one, 1), (two, 2)], [(four, 4), (three, 3)]]");
}

TEST_F(NestedContainerPrintTest, HandlesComplexNestedStructures) {
  const std::vector<std::map<std::string, std::list<std::set<int>>>>
      complexNested = {{{"first", {{1, 2}, {3}}}, {"second", {{4}}}}};
  testValueViaComparison(complexNested,
                         "[[(first, [[1, 2], [3]]), (second, [[4]])]]");
}

TEST_F(EgdeCasesPrintTest, HandleEmptyContainer) {
  const std::vector<int> emptyVector{};
  testValueViaComparison(emptyVector, "[]");
}

TEST_F(SmartPointerPrintTest, HandlesSharedPtr) {
  const auto sharedPointer = std::make_shared<int>(10);
  testValueViaComparison(sharedPointer, "10");
}

TEST_F(SmartPointerPrintTest, HandlesWeakPtr) {
  auto sharedPointer = std::make_shared<int>(20);
  std::weak_ptr<int> weakPointer = sharedPointer;
  testValueViaComparison(weakPointer, "20");

  sharedPointer.reset(); // Reset shared_ptr to make the weak_ptr expire
  testValueViaComparison(weakPointer,
                         "expired"); // Test after the weak pointer has expired
}

TEST_F(SmartPointerPrintTest, HandlesUniquePtr) {
  const auto uniquePointer = std::make_unique<int>(30);
  testValueViaComparison(uniquePointer, "30");
}

TEST_F(OptionalPrintTest, HandlesOptional) {
  std::optional<int> optionalInt{40};
  testValueViaComparison(optionalInt, "Optional(40)");
  optionalInt.reset();
  testValueViaComparison(optionalInt, "nullopt");
}

TEST_F(VariantPrintTest, HandlesVariant) {
  std::variant<int, std::string> variantIntOrString = 10;
  testValueViaComparison(variantIntOrString, "Variant(10)");
  variantIntOrString = "Hello";
  testValueViaComparison(variantIntOrString, "Variant(Hello)");
}

TEST_F(ErrorHandlingPrintTest, HandlesErrorCode) {
  const auto errorCodeValue =
      std::make_error_code(std::errc::function_not_supported).value();
  std::error_code errorCode =
      make_error_code(std::errc::function_not_supported);
  testValueViaComparison(
      errorCode, "ErrorCode(" + std::to_string(errorCodeValue) + ", generic)");
}

TEST_F(ErrorHandlingPrintTest, HandlesExceptionPtr) {
  try {
    throw std::runtime_error("test error");
  } catch (...) {
    const std::exception_ptr exceptionPointer = std::current_exception();
    testValueViaComparison(exceptionPointer, "ExceptionPtr(\"test error\")");
  }
}

TEST_F(FileSystemPrintTest, HandlesPath) {
  const std::filesystem::path filePath = "/path/to/some/file.txt";
  testValueViaComparison(filePath, "Path(\"/path/to/some/file.txt\")");
}

TEST_F(FileSystemPrintTest, HandlesDirectoryIterator) {
  // Setup a temporary directory and files within
  std::filesystem::path directory =
      std::filesystem::temp_directory_path() / "test_dir";
  std::filesystem::create_directory(directory);

  std::ofstream(directory / "file1.txt");
  std::ofstream(directory / "file2.txt");

  std::filesystem::directory_iterator begin(directory);

  testValueViaRegex(
      begin,
      R"(Directory\["file1.txt", "file2.txt"\]|Directory\["file2.txt", "file1.txt"\])");

  // Cleanup
  std::filesystem::remove_all(directory);
}

TEST_F(UnsupportedLoggingTest, TestLoggingUnsupportedType) {
  std::ostringstream oss;
  class UnsupportedClass {};
  auto x = UnsupportedClass();

  ASSERT_THROW({ printElement(oss, x); }, std::runtime_error);
}

} // namespace low_level_log_implementation

namespace rnexecutorch {

namespace high_level_log_implementation {

class BufferTest : public ::testing::Test {};

// Test when the message is shorter than the maximum size
TEST_F(BufferTest, MessageShorterThanLimit) {
  std::ostringstream oss;
  oss << "Short message";
  const std::string result = getBuffer(oss, 1024);
  EXPECT_EQ(result, "Short message");
}

// Test when the message is exactly the maximum size
TEST_F(BufferTest, MessageExactlyAtLimit) {
  std::ostringstream oss;
  const std::string message(1024,
                            'a'); // Create a string with 1024 'a' characters
  oss << message;
  const std::string result = getBuffer(oss, 1024);
  EXPECT_EQ(result, message);
}

// Test when the message is longer than the maximum size
TEST_F(BufferTest, MessageLongerThanLimit) {
  std::ostringstream oss;
  const std::string message(1050, 'a');
  oss << message;
  const std::string result = getBuffer(oss, 1024);
  EXPECT_EQ(result.size(),
            1027); // Expecting 1024 characters plus the ellipsis "..."
  EXPECT_EQ(result.substr(1024), "...");
}

} // namespace high_level_log_implementation

template <typename T>
bool check_if_same_content(const std::shared_ptr<T> &a,
                           const std::shared_ptr<T> &b) {
  if (!a || !b) {  // Check for null pointers
    return a == b; // Both should be null to be considered equal
  }
  // Dereference and compare values
  return *a == *b;
}

template <typename T>
bool check_if_same_content(const T &original, const T &after) {
  return original ==
         after; // Requires that T has an equality operator (operator==)
}

TEST(LoggingTest, LoggingDoesNotChangeSharedPtr) {
  const auto original = std::make_shared<int>(42);
  const auto copy = std::make_shared<int>(*original);

  std::ostringstream oss;
  log(LOG_LEVEL::Info, original);

  ASSERT_TRUE(check_if_same_content(original, copy));
}

TEST(LoggingTest, LoggingDoesNotChangeQueue) {
  std::queue<int> original;
  original.push(1);
  original.push(2);
  original.push(3);

  auto copy = original;

  std::ostringstream oss;
  log(LOG_LEVEL::Info, original);

  ASSERT_TRUE(check_if_same_content(original, copy));
}

// Example test for vectors
TEST(LoggingTest, LoggingDoesNotChangeVector) {
  const std::vector<int> original = {1, 2, 3, 4, 5};
  auto copy = original;

  std::ostringstream oss;
  log(LOG_LEVEL::Info, original);

  ASSERT_TRUE(check_if_same_content(original, copy));
}

} // namespace rnexecutorch

int main(int argc, char **argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
