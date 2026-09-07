#pragma once

#include <cstdint>
#include <memory>
#include <optional>
#include <string>
#include <string_view>
#include <vector>

#include <functional>

#include <gmock/gmock.h>
#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <jsi/jsi.h>

#include "core/error.h"

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
     * The JavaScript-visible shape of a failure raised by the native layer.
     *
     * `core/error.h` is the only place that turns a native exception into a JS
     * value, and it always produces an Error carrying `name`, `code` and — when
     * the failure came out of the ExecuTorch runtime — `etRuntimeErrorCode`.
     * Those fields are the contract `isRnExecuTorchError` reads on the
     * TypeScript side, so tests assert on them rather than on the message alone.
     */
    struct ThrownError {
        /** `error.name`; "RnExecuTorchError" for anything raised by the guard. */
        std::string name;
        /** `error.message`. */
        std::string message;
        /** `error.code`, or empty when the thrown value carries none. */
        std::string code;
        /** `error.etRuntimeErrorCode`, present only for ExecuTorch failures. */
        std::optional<int32_t> etRuntimeErrorCode;
    };

    /**
     * Evaluates a snippet of JavaScript expected to throw, and returns the
     * thrown error's JS-visible fields.
     *
     * @param js The JavaScript source expected to throw.
     * @return The thrown value's name, message, code and ExecuTorch error code.
     */
    ThrownError evalThrowing(const std::string &js);

    /**
     * Evaluates a snippet of JavaScript expected to throw, and returns the
     * thrown error's `message`. Shorthand for `evalThrowing(js).message`.
     *
     * @param js The JavaScript source expected to throw.
     * @return The `message` of the thrown value.
     */
    std::string evalThrowingMessage(const std::string &js);

    /**
     * Evaluates a snippet of JavaScript expected to throw, and returns the
     * thrown error's `code`. Shorthand for `evalThrowing(js).code`.
     *
     * @param js The JavaScript source expected to throw.
     * @return The `code` of the thrown value, or "" when it carries none.
     */
    std::string evalThrowingCode(const std::string &js);

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

/**
 * Asserts that `error` is an `RnExecuTorchError` carrying `expectedCode`, whose
 * message contains `messageSubstring`.
 *
 * Every negative test in the suite goes through this so a throw site that loses
 * its code — by throwing a bare `jsi::JSError`, or by escaping the guard — fails
 * the assertion instead of passing on the message alone.
 */
::testing::AssertionResult isCodedError(const JsiTestEnv::ThrownError &error,
                                        std::string_view expectedCode,
                                        std::string_view messageSubstring);

/**
 * Asserts that `fn` throws an `RnExecuTorchException` carrying `expectedCode`,
 * whose message contains `messageSubstring`.
 *
 * The JSI counterpart of this is `isCodedError`. This one is for the pieces
 * called directly rather than through a guarded host function — conversions,
 * dtype parsing and schema validation all throw before any runtime is involved.
 */
::testing::AssertionResult throwsCoded(const std::function<void()> &fn,
                                       core::error::RnExecuTorchErrorCode expectedCode,
                                       std::string_view messageSubstring = "");

} // namespace rnexecutorch::tests
