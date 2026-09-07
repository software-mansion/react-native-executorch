#include <algorithm>
#include <fstream>
#include <regex>
#include <sstream>
#include <string>
#include <vector>

#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "core/error.h"
#include "support/JsiTestEnv.h"

namespace rnexecutorch::tests {
namespace {

using ::testing::HasSubstr;

namespace error = rnexecutorch::core::error;
using error::RnExecuTorchErrorCode;

// Every code in the X-macro list, so a code added to error.h without a string
// mapping (or without its TypeScript counterpart) fails the suite below.
constexpr RnExecuTorchErrorCode kAllCodes[] = {
    RnExecuTorchErrorCode::LoadFailed,
    RnExecuTorchErrorCode::ExecutionFailed,
    RnExecuTorchErrorCode::SchemaMismatch,
    RnExecuTorchErrorCode::InvalidArgument,
    RnExecuTorchErrorCode::InvalidState,
    RnExecuTorchErrorCode::ResourceDisposed,
    RnExecuTorchErrorCode::ResourceBusy,
    RnExecuTorchErrorCode::DownloadFailed,
    RnExecuTorchErrorCode::DownloadAborted,
    RnExecuTorchErrorCode::Unknown,
};

TEST(Error, MapsEveryCodeToItsWireString) {
    EXPECT_STREQ(error::errorCodeToString(RnExecuTorchErrorCode::LoadFailed), "LOAD_FAILED");
    EXPECT_STREQ(error::errorCodeToString(RnExecuTorchErrorCode::ExecutionFailed), "EXECUTION_FAILED");
    EXPECT_STREQ(error::errorCodeToString(RnExecuTorchErrorCode::SchemaMismatch), "SCHEMA_MISMATCH");
    EXPECT_STREQ(error::errorCodeToString(RnExecuTorchErrorCode::InvalidArgument), "INVALID_ARGUMENT");
    EXPECT_STREQ(error::errorCodeToString(RnExecuTorchErrorCode::InvalidState), "INVALID_STATE");
    EXPECT_STREQ(error::errorCodeToString(RnExecuTorchErrorCode::ResourceDisposed), "RESOURCE_DISPOSED");
    EXPECT_STREQ(error::errorCodeToString(RnExecuTorchErrorCode::ResourceBusy), "RESOURCE_BUSY");
    EXPECT_STREQ(error::errorCodeToString(RnExecuTorchErrorCode::DownloadFailed), "DOWNLOAD_FAILED");
    EXPECT_STREQ(error::errorCodeToString(RnExecuTorchErrorCode::DownloadAborted), "DOWNLOAD_ABORTED");
    EXPECT_STREQ(error::errorCodeToString(RnExecuTorchErrorCode::Unknown), "UNKNOWN");
}

// error.h says src/core/error.ts is the source of truth and that the two lists
// are kept in sync by hand. This is what makes that claim checkable: a code
// added on one side and forgotten on the other fails here rather than reaching
// an app as an unmatchable string.
TEST(Error, CodeListMatchesTypeScript) {
    std::ifstream file(RNE_ERROR_TS_SOURCE);
    ASSERT_TRUE(file.is_open()) << "cannot open " << RNE_ERROR_TS_SOURCE;

    std::stringstream buffer;
    buffer << file.rdbuf();
    const std::string source = buffer.str();

    const auto listStart = source.find("VALID_ERROR_CODES = [");
    ASSERT_NE(listStart, std::string::npos) << "VALID_ERROR_CODES not found in error.ts";
    const auto listEnd = source.find(']', listStart);
    ASSERT_NE(listEnd, std::string::npos);
    const std::string list = source.substr(listStart, listEnd - listStart);

    std::vector<std::string> tsCodes;
    const std::regex entry(R"('([A-Z_]+)')");
    for (auto it = std::sregex_iterator(list.begin(), list.end(), entry);
         it != std::sregex_iterator(); ++it) {
        tsCodes.push_back((*it)[1].str());
    }

    std::vector<std::string> cppCodes;
    cppCodes.reserve(std::size(kAllCodes));
    for (auto code : kAllCodes) {
        cppCodes.emplace_back(error::errorCodeToString(code));
    }

    // Order is not part of the contract, only membership.
    std::ranges::sort(tsCodes);
    std::ranges::sort(cppCodes);
    EXPECT_EQ(cppCodes, tsCodes);
}

TEST(Error, FactoriesCarryTheirCode) {
    const auto invalid = error::InvalidArgument("bad input");
    EXPECT_EQ(invalid.code_, RnExecuTorchErrorCode::InvalidArgument);
    EXPECT_STREQ(invalid.what(), "bad input");
    EXPECT_FALSE(invalid.etRuntimeErrorCode_.has_value());

    // The ExecuTorch code is only attached when a failure actually came out of
    // the runtime, so it stays apart from our own classification.
    const auto load = error::LoadFailed("no file", executorch::runtime::Error::AccessFailed);
    EXPECT_EQ(load.code_, RnExecuTorchErrorCode::LoadFailed);
    ASSERT_TRUE(load.etRuntimeErrorCode_.has_value());
    EXPECT_EQ(*load.etRuntimeErrorCode_,
              static_cast<int32_t>(executorch::runtime::Error::AccessFailed));
}

class ErrorJsTest : public JsiTestEnv {};

// The JS-visible shape of a failure: an Error named RnExecuTorchError carrying
// `code`. This is what isRnExecuTorchError narrows on.
TEST_F(ErrorJsTest, SurfacesAsCodedJavaScriptError) {
    auto thrown = evalThrowing("__rnexecutorch_jsi__.math.sigmoid();");

    EXPECT_EQ(thrown.name, "RnExecuTorchError");
    EXPECT_EQ(thrown.code, "INVALID_ARGUMENT");
    EXPECT_THAT(thrown.message, HasSubstr("Usage: sigmoid(src, dst)"));
    EXPECT_TRUE(evalBool("try { __rnexecutorch_jsi__.math.sigmoid(); } "
                         "catch (e) { return e instanceof Error; } return false;"));
}

TEST_F(ErrorJsTest, AttachesExecuTorchCodeWhenTheRuntimeFailed) {
    auto thrown = evalThrowing("__rnexecutorch_jsi__.loadModel('/definitely/not/a/model.pte');");

    EXPECT_TRUE(isCodedError(thrown, "LOAD_FAILED", "/definitely/not/a/model.pte"));
    // Diagnostic only — upstream's numbering moves independently of ours, so the
    // contract is that the field is there, not what it equals.
    EXPECT_TRUE(thrown.etRuntimeErrorCode.has_value());
}

TEST_F(ErrorJsTest, OmitsExecuTorchCodeForOurOwnFailures) {
    auto thrown = evalThrowing("__rnexecutorch_jsi__.loadModel(42);");

    EXPECT_TRUE(isCodedError(thrown, "INVALID_ARGUMENT", "must be a string"));
    EXPECT_FALSE(thrown.etRuntimeErrorCode.has_value());
}

// A JS error raised inside a callback the native layer invoked is already a
// JavaScript value; the guard rethrows it untouched rather than relabelling it
// as an RnExecuTorchError. `getRequiredProperty` reads options through JSI, so a
// throwing getter runs user code inside the host function.
TEST_F(ErrorJsTest, PassesJavaScriptErrorsThrough) {
    auto thrown = evalThrowing(R"(
        const waveform = __rnexecutorch_jsi__.createTensor([16], 'float32');
        const hann = __rnexecutorch_jsi__.createTensor([4], 'float32');
        const dst = __rnexecutorch_jsi__.createTensor([2, 4], 'float32');
        const options = {
            hopLength: 2,
            preemphasis: 0,
            get numFrames() { throw new TypeError('from JavaScript'); },
        };
        __rnexecutorch_jsi__.speech.extractFrames(waveform, hann, dst, options);
    )");

    EXPECT_EQ(thrown.message, "from JavaScript");
    EXPECT_EQ(thrown.name, "TypeError");
    EXPECT_EQ(thrown.code, "");
}

// dtype parsing throws from deep inside createTensor rather than at the host
// function boundary, so this covers the guard catching an exception raised
// below the call site.
TEST_F(ErrorJsTest, CodesFailuresRaisedBelowTheHostFunction) {
    auto thrown = evalThrowing("__rnexecutorch_jsi__.createTensor([2], 'float64');");

    EXPECT_TRUE(isCodedError(thrown, "INVALID_ARGUMENT", "Unsupported dtype: 'float64'"));
}

} // namespace
} // namespace rnexecutorch::tests
