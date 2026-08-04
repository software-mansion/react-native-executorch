#include "JsiTestEnv.h"

#include <cmath>
#include <format>
#include <utility>

#include "RnExecutorch.h"

namespace rnexecutorch::tests {

namespace {
/**
 * Hermes requires a source URL for stack traces; tests have no real file so a
 * stable placeholder keeps error messages readable.
 */
constexpr const char *kSourceUrl = "rnexecutorch-tests.js";
} // namespace

void JsiTestEnv::SetUp() {
    runtime_ = facebook::hermes::makeHermesRuntime();
    rnexecutorch::install(*runtime_);
}

void JsiTestEnv::TearDown() {
    // Drop the runtime between tests so each case gets a clean global object and
    // any HostObject the previous test leaked is collected here rather than
    // surfacing as an unrelated failure later.
    runtime_.reset();
}

jsi::Value JsiTestEnv::eval(const std::string &js) {
    // Wrapping in an IIFE lets tests use `const`/`return` freely and makes the
    // final expression the completion value regardless of statement form.
    auto source = std::format("(function() {{ {} }})()", js);
    return runtime_->evaluateJavaScript(
        std::make_unique<jsi::StringBuffer>(source), kSourceUrl);
}

double JsiTestEnv::evalNumber(const std::string &js) {
    auto value = eval(js);
    EXPECT_TRUE(value.isNumber()) << "expected a number from: " << js;
    return value.isNumber() ? value.getNumber() : std::nan("");
}

bool JsiTestEnv::evalBool(const std::string &js) {
    auto value = eval(js);
    EXPECT_TRUE(value.isBool()) << "expected a boolean from: " << js;
    return value.isBool() && value.getBool();
}

std::string JsiTestEnv::evalString(const std::string &js) {
    auto value = eval(js);
    EXPECT_TRUE(value.isString()) << "expected a string from: " << js;
    return value.isString() ? value.getString(*runtime_).utf8(*runtime_) : "";
}

std::string JsiTestEnv::evalThrowingMessage(const std::string &js) {
    // Catching in JS rather than around evaluateJavaScript keeps the assertion
    // on the JS-visible error, which is exactly what the TS layer sees.
    auto source = std::format(R"(
        (function() {{
            try {{
                (function() {{ {} }})();
            }} catch (e) {{
                return String(e && e.message !== undefined ? e.message : e);
            }}
            return null;
        }})()
    )",
                              js);

    auto value = runtime_->evaluateJavaScript(
        std::make_unique<jsi::StringBuffer>(source), kSourceUrl);

    if (value.isNull()) {
        ADD_FAILURE() << "expected the snippet to throw, but it returned normally: " << js;
        return "";
    }
    return value.getString(*runtime_).utf8(*runtime_);
}

std::vector<double> JsiTestEnv::evalNumberArray(const std::string &js) {
    auto value = eval(js);
    if (!value.isObject()) {
        ADD_FAILURE() << "expected an array-like object from: " << js;
        return {};
    }

    auto object = value.getObject(*runtime_);
    // TypedArrays are not jsi::Array, so read through the generic `length` +
    // indexed-property path which works for both.
    auto lengthValue = object.getProperty(*runtime_, "length");
    if (!lengthValue.isNumber()) {
        ADD_FAILURE() << "expected an array-like object with a numeric length from: " << js;
        return {};
    }

    const auto length = static_cast<size_t>(lengthValue.getNumber());
    std::vector<double> result;
    result.reserve(length);
    for (size_t i = 0; i < length; ++i) {
        auto element = object.getProperty(*runtime_, jsi::PropNameID::forUtf8(*runtime_, std::to_string(i)));
        result.push_back(element.isNumber() ? element.getNumber() : std::nan(""));
    }
    return result;
}

::testing::AssertionResult almostEqual(const std::vector<double> &actual,
                                       const std::vector<double> &expected,
                                       double tolerance) {
    if (actual.size() != expected.size()) {
        return ::testing::AssertionFailure()
               << "size mismatch: actual " << actual.size()
               << " vs expected " << expected.size();
    }

    for (size_t i = 0; i < actual.size(); ++i) {
        if (std::isnan(actual[i]) != std::isnan(expected[i]) ||
            (!std::isnan(expected[i]) && std::abs(actual[i] - expected[i]) > tolerance)) {
            return ::testing::AssertionFailure()
                   << "element " << i << " differs: actual " << actual[i]
                   << " vs expected " << expected[i]
                   << " (tolerance " << tolerance << ")";
        }
    }
    return ::testing::AssertionSuccess();
}

} // namespace rnexecutorch::tests
