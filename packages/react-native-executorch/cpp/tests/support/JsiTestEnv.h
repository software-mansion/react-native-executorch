#pragma once

#include <memory>
#include <string>
#include <vector>

#include <gmock/gmock.h>
#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <jsi/jsi.h>

namespace rnexecutorch::tests {
namespace jsi = facebook::jsi;

/**
 * Test fixture that owns a real Hermes JavaScript runtime with the full
 * `rnexecutorch` native module installed under its production global name
 * (`__rnexecutorch_jsi__`).
 *
 * Tests drive the native code the same way the TypeScript layer does — through
 * JSI — so the JSI argument parsing, HostObject plumbing and JSError messages
 * are all under test, not bypassed.
 */
class JsiTestEnv : public ::testing::Test {
  public:
    /**
     * Evaluates a snippet of JavaScript in the fixture's runtime and returns the
     * value of its final expression.
     *
     * @param js The JavaScript source to evaluate.
     * @return The resulting JSI value.
     */
    jsi::Value eval(const std::string &js);

    /**
     * Evaluates a snippet of JavaScript and returns the result as a double.
     * Fails the test if the result is not a number.
     */
    double evalNumber(const std::string &js);

    /**
     * Evaluates a snippet of JavaScript and returns the result as a bool.
     * Fails the test if the result is not a boolean.
     */
    bool evalBool(const std::string &js);

    /**
     * Evaluates a snippet of JavaScript and returns the result as a UTF-8
     * string. Fails the test if the result is not a string.
     */
    std::string evalString(const std::string &js);

    /**
     * Evaluates a snippet of JavaScript expected to throw, and returns the
     * thrown error's `message`.
     *
     * Native code signals misuse with `jsi::JSError`, which surfaces in JS as a
     * regular catchable Error — this is the seam most negative tests assert on.
     *
     * @param js The JavaScript source expected to throw.
     * @return The `message` of the thrown value.
     */
    std::string evalThrowingMessage(const std::string &js);

    /**
     * Evaluates a JavaScript expression yielding a numeric array (or TypedArray)
     * and returns its elements as a vector of doubles.
     */
    std::vector<double> evalNumberArray(const std::string &js);

    /**
     * The underlying Hermes runtime, for tests that need to touch JSI directly
     * rather than going through JavaScript source.
     */
    jsi::Runtime &rt() { return *runtime_; }

  protected:
    void SetUp() override;
    void TearDown() override;

  private:
    std::unique_ptr<facebook::hermes::HermesRuntime> runtime_;
};

/**
 * Asserts that two floating point values are equal within `tolerance`, with a
 * failure message naming the index — intended for element-wise comparison of
 * tensor contents.
 */
::testing::AssertionResult almostEqual(const std::vector<double> &actual,
                                       const std::vector<double> &expected,
                                       double tolerance = 1e-6);

} // namespace rnexecutorch::tests
