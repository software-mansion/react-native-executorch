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

JsiTestEnv::ThrownError JsiTestEnv::evalThrowing(const std::string &js) {
    // Catching in JS rather than around evaluateJavaScript keeps the assertion
    // on the JS-visible error, which is exactly what the TS layer sees: the
    // guard in core/error.h throws a constructed Error object, so `name`,
    // `code` and `etRuntimeErrorCode` are readable only from JavaScript.
    auto source = std::format(R"(
        (function() {{
            try {{
                (function() {{ {} }})();
            }} catch (e) {{
                if (e === null || typeof e !== 'object') {{
                    return {{ name: '', message: String(e), code: '' }};
                }}
                return {{
                    name: e.name === undefined ? '' : String(e.name),
                    message: e.message === undefined ? String(e) : String(e.message),
                    code: e.code === undefined ? '' : String(e.code),
                    etRuntimeErrorCode: e.etRuntimeErrorCode,
                }};
            }}
            return null;
        }})()
    )",
                              js);

    auto value = runtime_->evaluateJavaScript(
        std::make_unique<jsi::StringBuffer>(source), kSourceUrl);

    if (!value.isObject()) {
        ADD_FAILURE() << "expected the snippet to throw, but it returned normally: " << js;
        return {};
    }

    auto object = value.getObject(*runtime_);
    auto readString = [&](const char *prop) {
        auto property = object.getProperty(*runtime_, prop);
        return property.isString() ? property.getString(*runtime_).utf8(*runtime_) : std::string();
    };

    ThrownError error;
    error.name = readString("name");
    error.message = readString("message");
    error.code = readString("code");

    auto etCode = object.getProperty(*runtime_, "etRuntimeErrorCode");
    if (etCode.isNumber()) {
        error.etRuntimeErrorCode = static_cast<int32_t>(etCode.getNumber());
    }
    return error;
}

std::string JsiTestEnv::evalThrowingMessage(const std::string &js) {
    return evalThrowing(js).message;
}

std::string JsiTestEnv::evalThrowingCode(const std::string &js) {
    return evalThrowing(js).code;
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

::testing::AssertionResult isCodedError(const JsiTestEnv::ThrownError &error,
                                        std::string_view expectedCode,
                                        std::string_view messageSubstring) {
    if (error.name != "RnExecuTorchError") {
        return ::testing::AssertionFailure()
               << "expected an RnExecuTorchError, got name \"" << error.name
               << "\" with message \"" << error.message << "\"";
    }
    if (error.code != expectedCode) {
        return ::testing::AssertionFailure()
               << "expected code \"" << expectedCode << "\", got \"" << error.code
               << "\" with message \"" << error.message << "\"";
    }
    if (error.message.find(messageSubstring) == std::string::npos) {
        return ::testing::AssertionFailure()
               << "expected the message to contain \"" << messageSubstring
               << "\", got \"" << error.message << "\"";
    }
    return ::testing::AssertionSuccess();
}

::testing::AssertionResult throwsCoded(const std::function<void()> &fn,
                                       core::error::RnExecuTorchErrorCode expectedCode,
                                       std::string_view messageSubstring) {
    try {
        fn();
    } catch (const core::error::RnExecuTorchException &e) {
        if (e.code_ != expectedCode) {
            return ::testing::AssertionFailure()
                   << "expected code " << core::error::errorCodeToString(expectedCode)
                   << ", got " << core::error::errorCodeToString(e.code_)
                   << " (" << e.what() << ")";
        }
        if (std::string_view(e.what()).find(messageSubstring) == std::string_view::npos) {
            return ::testing::AssertionFailure()
                   << "expected the message to contain \"" << messageSubstring
                   << "\", got \"" << e.what() << "\"";
        }
        return ::testing::AssertionSuccess();
    } catch (const std::exception &e) {
        return ::testing::AssertionFailure()
               << "expected an RnExecuTorchException, got: " << e.what();
    }
    return ::testing::AssertionFailure() << "expected a throw, but none happened";
}

} // namespace rnexecutorch::tests
