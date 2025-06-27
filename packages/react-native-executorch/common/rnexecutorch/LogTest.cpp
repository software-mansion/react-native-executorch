#include "Log.h"
#include <gtest/gtest.h>

#include <array>
#include <deque>
#include <forward_list>
#include <functional>
#include <list>
#include <map>
#include <queue>
#include <regex>
#include <set>
#include <stack>
#include <string_view>
#include <unordered_map>
#include <unordered_set>
#include <vector>

class DirectStreamableElementsPrintTest : public ::testing::Test {
protected:
  std::ostringstream oss;

  template <typename T>
  void testValuePrint(const T &value, const std::string &expectedOutput) {
    low_level_log_implementation::printElement(oss, value);
    EXPECT_EQ(oss.str(), expectedOutput);
    oss.str("");
    oss.clear();
  }
};

class ContainerPrintTest : public ::testing::Test {
protected:
  std::ostringstream oss;

  template <typename Container>
  void testContainerPrint(const Container &container,
                          const std::string &expectedOutput) {
    low_level_log_implementation::printElement(oss, container);
    EXPECT_EQ(oss.str(), expectedOutput);
    oss.str("");
    oss.clear();
  }

  template <typename Container>
  void testUnorderedContainerPresence(const Container &container,
                                      const std::string &expectedPattern) {
    low_level_log_implementation::printElement(oss, container);
    std::regex pattern(expectedPattern);
    std::cout << oss.str() << std::endl;
    EXPECT_TRUE(std::regex_search(oss.str(), pattern))
        << "Expected pattern not found: " << expectedPattern;
    oss.str("");
    oss.clear();
  }
};

class NestedContainerPrintTest : public ContainerPrintTest {};

class EgdeCasesPrintTest : public ContainerPrintTest {};

class Point {
public:
  int x, y;

  Point(int x, int y) : x(x), y(y) {}

  // Overloading the << operator to make Point directly streamable
  friend std::ostream &operator<<(std::ostream &os, const Point &pt) {
    os << "Point(" << pt.x << ", " << pt.y << ")";
    return os;
  }
};

TEST_F(DirectStreamableElementsPrintTest, HandlesIntegers) {
  testValuePrint(123, "123");
}

TEST_F(DirectStreamableElementsPrintTest, HandlesStrings) {
  testValuePrint(std::string("Hello World"), "Hello World");
}

TEST_F(DirectStreamableElementsPrintTest, HandlesStringViews) {
  testValuePrint(std::string_view("Hello World"), "Hello World");
}

TEST_F(DirectStreamableElementsPrintTest, HandlesFloats) {
  testValuePrint(3.14159, "3.14159");
}

TEST_F(DirectStreamableElementsPrintTest, HandlesBooleans) {
  testValuePrint(true, "true");
  testValuePrint(false, "false");
}

TEST_F(DirectStreamableElementsPrintTest, HandlesChar) {
  testValuePrint('a', "a");
}

TEST_F(DirectStreamableElementsPrintTest, HandlesPoint) {
  Point point(3, 4);
  testValuePrint(point, "Point(3, 4)");
}

// log handles operator<<(&ostream) for std::pair
TEST_F(DirectStreamableElementsPrintTest, HandlesStdPair) {
  std::pair<int, std::string> myPair = {42, "Hello"};
  testValuePrint(myPair, "(42, Hello)");

  // Testing edge cases with pairs
  std::pair<std::string, std::string> emptyPair = {"", ""};
  testValuePrint(emptyPair, "(, )");
}

// log handles operator<<(&ostream) for std::pair
TEST_F(DirectStreamableElementsPrintTest, HandlesStdTuple) {
  std::tuple<int, std::string, double> myTuple = {42, "Tuple", 3.14};
  testValuePrint(myTuple, "<42, Tuple, 3.14>");

  // Testing tuples with all empty or zero-initialized elements
  std::tuple<std::string, int, float> zeroInitializedTuple = {"", 0, 0.0f};
  testValuePrint(zeroInitializedTuple, "<, 0, 0>");

  // Testing nested tuple
  std::tuple<int, std::pair<std::string, bool>, float> nestedTuple = {
      1, {"nested", true}, 2.5};
  testValuePrint(nestedTuple, "<1, (nested, true), 2.5>");
}

TEST_F(ContainerPrintTest, VectorIntTest) {
  std::vector<int> vec = {1, 2, 3, 4};
  testContainerPrint(vec, "[1, 2, 3, 4]");
}

TEST_F(ContainerPrintTest, ListDoubleTest) {
  std::list<double> lst = {1.1, 2.2, 3.3};
  testContainerPrint(lst, "[1.1, 2.2, 3.3]");
}

TEST_F(ContainerPrintTest, DequeStringTest) {
  std::deque<std::string> deq = {"hello", "world"};
  testContainerPrint(deq, "[hello, world]");
}

TEST_F(ContainerPrintTest, SetTest) {
  std::set<std::string> st = {"apple", "banana", "cherry"};
  testContainerPrint(st, "[apple, banana, cherry]"); // Note: Sets are sorted
}

TEST_F(ContainerPrintTest, MapTest) {
  std::map<std::string, int> mp = {{"one", 1}, {"two", 2}};
  testContainerPrint(mp, "[(one, 1), (two, 2)]");
}

TEST_F(ContainerPrintTest, HandlesUnorderedSet) {
  std::unordered_set<int> ust = {4, 3, 2, 1};
  // Pattern expects to find each element at least once in any order
  testUnorderedContainerPresence(ust, R"(.*1.*2.*3.*4.*)");
}

TEST_F(ContainerPrintTest, HandlesUnorderedMultimap) {
  std::unordered_multimap<std::string, int> ummap = {
      {"one", 1}, {"one", 2}, {"two", 2}};
  // Construct a regex pattern that captures each permutation once.
  low_level_log_implementation::printElement(oss, ummap);
  std::string result = oss.str(); // Store the output of the print in a string
  // std::cout << result << std::endl;

  // Check against each permutation explicitly
  bool match_found = result == "[(one, 1), (one, 2), (two, 2)]" ||
                     result == "[(one, 1), (two, 2), (one, 2)]" ||
                     result == "[(one, 2), (one, 1), (two, 2)]" ||
                     result == "[(one, 2), (two, 2), (one, 1)]" ||
                     result == "[(two, 2), (one, 1), (one, 2)]" ||
                     result == "[(two, 2), (one, 2), (one, 1)]";

  EXPECT_TRUE(match_found)
      << "Output did not match any of the expected permutations.";
}

TEST_F(ContainerPrintTest, StackTest) {
  std::stack<int> stk;
  stk.push(1);
  stk.push(2);
  stk.push(3);
  testContainerPrint(stk, "[3, 2, 1]"); // LIFO order
}

TEST_F(ContainerPrintTest, QueueTest) {
  std::queue<int> que;
  que.push(1);
  que.push(2);
  que.push(3);
  testContainerPrint(que, "[1, 2, 3]"); // FIFO order
}

TEST_F(ContainerPrintTest, PriorityQueueTest) {
  std::priority_queue<int> pq;
  pq.push(3);
  pq.push(1);
  pq.push(2);
  testContainerPrint(pq, "[3, 2, 1]"); // Output based on internal max-heap
}

TEST_F(ContainerPrintTest, HandlesArray) {
  std::array<int, 3> arr = {1, 2, 3};
  testContainerPrint(arr, "[1, 2, 3]");
}

TEST_F(ContainerPrintTest, HandlesForwardList) {
  std::forward_list<int> flist = {1, 2, 3};
  testContainerPrint(flist, "[1, 2, 3]");
}

TEST_F(ContainerPrintTest, HandlesMultiset) {
  std::multiset<int> mset = {3, 2, 1, 2};
  testContainerPrint(mset, "[1, 2, 2, 3]"); // Multiset elements are sorted
}

TEST_F(ContainerPrintTest, HandlesMultimap) {
  std::multimap<std::string, int> mmap = {{"one", 1}, {"one", 2}, {"two", 2}};
  testContainerPrint(mmap, "[(one, 1), (one, 2), (two, 2)]");
}

TEST_F(ContainerPrintTest, HandlesSpan) {
  std::vector<int> vec = {1, 2, 3, 4};
  std::span<int> sp(vec.begin(), vec.end()); // Create a span from a vector
  testContainerPrint(sp, "[1, 2, 3, 4]");
}

TEST_F(NestedContainerPrintTest, HandlesListOfQueuesOfPoints) {
  std::list<std::queue<Point>> listOfQueues = {std::queue<Point>()};
  listOfQueues.front().push(Point(1, 1));
  listOfQueues.front().push(Point(2, 2));
  listOfQueues.front().push(Point(3, 3));
  testContainerPrint(listOfQueues, "[[Point(1, 1), Point(2, 2), Point(3, 3)]]");
}

TEST_F(NestedContainerPrintTest, HandlesNestedVectors) {
  std::vector<std::vector<int>> nestedVec = {{1, 2}, {3, 4, 5}};
  testContainerPrint(nestedVec, "[[1, 2], [3, 4, 5]]");
}

TEST_F(NestedContainerPrintTest, HandlesMapOfVectorOfPoints) {
  std::map<std::string, std::vector<Point>> mapOfVectors = {
      {"first", {Point(1, 2)}}, {"second", {Point(3, 4), Point(5, 6)}}};
  testContainerPrint(
      mapOfVectors,
      "[(first, [Point(1, 2)]), (second, [Point(3, 4), Point(5, 6)])]");
}

TEST_F(NestedContainerPrintTest, HandlesVectorOfMaps) {
  std::vector<std::map<std::string, int>> vectorOfMaps = {
      {{"one", 1}, {"two", 2}}, {{"three", 3}, {"four", 4}}};
  // word "three" is lexicographically smaller than "four"
  testContainerPrint(vectorOfMaps,
                     "[[(one, 1), (two, 2)], [(four, 4), (three, 3)]]");
}

TEST_F(NestedContainerPrintTest, HandlesComplexNestedStructures) {
  std::vector<std::map<std::string, std::list<std::set<int>>>> complexNested = {
      {{"first", {{1, 2}, {3}}}, {"second", {{4}}}}};
  testContainerPrint(complexNested,
                     "[[(first, [[1, 2], [3]]), (second, [[4]])]]");
}

TEST_F(EgdeCasesPrintTest, HandleEmptyContainer) {
  std::vector<int> emptyVector{};
  testContainerPrint(emptyVector, "[]");
}

int main(int argc, char **argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}