#include "../Log.h"
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
  TestValue() { oss << std::boolalpha; }

  template <typename T>
  void testValueViaComparison(const T &value,
                              const std::string &expectedOutput) {
    printElement(oss, value);
    EXPECT_EQ(oss.str(), expectedOutput);
    clearOutputStream(oss);
  }

  template <typename T>
  void testValueViaRegex(const T &value, const std::string &expectedPattern) {
    printElement(oss, value);
    const std::regex pattern(expectedPattern);
    EXPECT_TRUE(std::regex_search(oss.str(), pattern))
        << "Expected pattern not found: " << expectedPattern;
    clearOutputStream(oss);
  }

  void setOutputStreamPresicion(int precision) noexcept {
    oss << std::fixed << std::setprecision(precision);
  }

private:
  std::ostringstream oss;
  void clearOutputStream(std::ostringstream &os) noexcept {
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

class Point final {
public:
  explicit constexpr Point(int x, int y) noexcept : x(x), y(y) {}

  // Overloading the << operator to make Point directly streamable
  friend std::ostream &operator<<(std::ostream &os, const Point &pt) noexcept {
    os << "Point(" << pt.x << ", " << pt.y << ")";
    return os;
  }

private:
  int x, y;
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

TEST_F(DirectStreamableElementsPrintTest, HandlesDoubles) {
  constexpr double roughlyPi = 3.14159;
  testValueViaComparison(roughlyPi, "3.14159");
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
  constexpr int presision = 1;
  setOutputStreamPresicion(presision);
  const std::complex<double> complexNumber = std::pow(1i, 2);
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

TEST_F(DirectStreamableElementsPrintTest, handlesStaticArrayOfChars) {
  constexpr char staticCharArray[] = "prompt tokens:";
  testValueViaComparison(staticCharArray, "prompt tokens:");
}

// log handles operator<<(&ostream) for std::tuple
TEST_F(DirectStreamableElementsPrintTest, HandlesStdTuple) {
  const std::tuple<int, std::string, double> tupleOfDifferentTypes = {
      42, "Tuple", 3.14};
  testValueViaComparison(tupleOfDifferentTypes, "<42, Tuple, 3.14>");

  // All empty or zero-initialized elements of tuple
  const std::tuple<std::string, int, float> zeroInitializedTuple = {"", 0,
                                                                    0.0f};
  testValueViaComparison(zeroInitializedTuple, "<, 0, 0>");

  // Nested tuple
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
  std::string pattern = R"(\[\s*)";
  // construct regex by adding each permutation
  pattern += R"((?:\(one, 1\),\s*\(one, 2\),\s*\(two, 2\)|)";
  pattern += R"(\(one, 1\),\s*\(two, 2\),\s*\(one, 2\)|)";
  pattern += R"(\(one, 2\),\s*\(one, 1\),\s*\(two, 2\)|)";
  pattern += R"(\(one, 2\),\s*\(two, 2\),\s*\(one, 1\)|)";
  pattern += R"(\(two, 2\),\s*\(one, 1\),\s*\(one, 2\)|)";
  pattern += R"(\(two, 2\),\s*\(one, 2\),\s*\(one, 1\))\s*\])";

  testValueViaRegex(unorderedMultimapStringToInt, pattern);
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
  const std::error_code errorCode =
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
  const auto x = UnsupportedClass();

  ASSERT_THROW({ printElement(oss, x); }, std::runtime_error);
}

} // namespace low_level_log_implementation

namespace rnexecutorch {

namespace high_level_log_implementation {

class BufferTest : public ::testing::Test {
protected:
  // Helper to validate the final output
  void validateBuffer(const std::string &result, const std::string &expected,
                      std::size_t expectedSize) {
    EXPECT_EQ(result, expected);
    EXPECT_EQ(result.size(), expectedSize);
    if (result.size() > expected.size()) {
      EXPECT_EQ(result.substr(expected.size()), "...");
    }
  }
};

TEST_F(BufferTest, MessageShorterThanLimit) {
  constexpr std::size_t smallLogLimit = 20;
  const std::string message = "Short message";
  auto result = getBuffer(message, smallLogLimit);
  validateBuffer(result, message, message.size());
}

TEST_F(BufferTest, MessageExactlyAtLimit) {
  // Creating a string with 1024 'a' characters
  constexpr std::size_t defaultLogLimit = 1024;
  const std::string message(defaultLogLimit, 'a');
  auto result = getBuffer(message, defaultLogLimit);
  validateBuffer(result, message, message.size());
}

TEST_F(BufferTest, MessageLongerThanLimit) {
  constexpr std::size_t defaultLogLimit = 1024;
  constexpr std::size_t sizeAboveLimit = 1050;
  // Creating a string longer than the limit
  const std::string message(sizeAboveLimit, 'a');
  const auto expected = std::string(defaultLogLimit, 'a') + "...";
  const auto result = getBuffer(message, defaultLogLimit);
  validateBuffer(result, expected, expected.size());
}

} // namespace high_level_log_implementation

class LoggingTest : public ::testing::Test {
protected:
  template <typename T>
  void testLoggingDoesNotChangeContainer(const T &original) {
    const auto copy = original; // Make a copy of the container
    log(LOG_LEVEL::Info, original);
    ASSERT_TRUE(check_if_same_content(original, copy))
        << "Logging modified the content of the container.";
  }

private:
  // == op for smart pointers compare addresses, check content maunally
  template <typename T>
  bool check_if_same_content(const std::shared_ptr<T> &a,
                             const std::shared_ptr<T> &b) const noexcept {
    if (!a || !b) {
      return a == b;
    }
    return *a == *b;
  }

  template <typename T>
  bool check_if_same_content(const T &original, const T &after) const noexcept {
    // Requires that T has an equality operator (operator==)
    return original == after;
  }
};

TEST_F(LoggingTest, LoggingDoesNotChangeSharedPtr) {
  const auto original = std::make_shared<int>(42);
  testLoggingDoesNotChangeContainer(original);
}

TEST_F(LoggingTest, LoggingDoesNotChangeQueue) {
  std::queue<int> original;
  original.push(1);
  original.push(2);
  original.push(3);
  testLoggingDoesNotChangeContainer(original);
}

TEST_F(LoggingTest, LoggingDoesNotChangeVector) {
  const std::vector<int> original = {1, 2, 3, 4, 5};
  testLoggingDoesNotChangeContainer(original);
}

TEST(LogFunctionTest, LoggingBasic) {
  EXPECT_NO_THROW(log(LOG_LEVEL::Debug, "Test123"));
}

TEST(LogFunctionTest, LoggingWithNonDefaultLogSize) {
  constexpr std::size_t sizeBiggerThanDefault = 2048;
  const auto testString = std::string(sizeBiggerThanDefault, 'a');
  EXPECT_NO_THROW(log<sizeBiggerThanDefault>(LOG_LEVEL::Info, testString));
}

TEST(LogFunctionTest, LoggingMoreThanOneElement) {
  constexpr auto testStringLiteral = "Test123";
  const auto testVector = std::vector<int>{1, 2, 3, 4};
  const auto testPair = std::pair<int, double>(1, 2.0);
  EXPECT_NO_THROW(
      log(LOG_LEVEL::Debug, testStringLiteral, testVector, testPair));
}

TEST(MovingSequencable, MovingSequencableTest) {
  std::priority_queue<int> q;
  q.push(1);
  q.push(2);
  q.push(3);

  log(LOG_LEVEL::Debug, q);
  ASSERT_EQ(q.size(), 3);
  const auto &cq = q;
  log(LOG_LEVEL::Debug, cq);
  ASSERT_EQ(cq.size(), 3);
  log(LOG_LEVEL::Debug, std::move(q));
  ASSERT_EQ(q.size(), 0);
}

} // namespace rnexecutorch

int main(int argc, char **argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
