#include <string>

#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "support/JsiTestEnv.h"

namespace rnexecutorch::tests {
namespace {

using ::testing::HasSubstr;

class UtilsTest : public JsiTestEnv {};

TEST_F(UtilsTest, ReportsRegisteredBackends) {
    // The host build links no delegate, so the registry is empty. What is under
    // test is the JSI shape the TS layer reads (a real Array of strings), which
    // an app queries to decide whether a Core ML / XNNPACK model can run at all.
    EXPECT_TRUE(evalBool("return Array.isArray(__rnexecutorch_jsi__.getExecuTorchRegisteredBackends());"));
    EXPECT_TRUE(evalBool(R"(
        const backends = __rnexecutorch_jsi__.getExecuTorchRegisteredBackends();
        return backends.every((name) => typeof name === 'string');
    )"));
}

TEST_F(UtilsTest, RejectsArgumentsToRegisteredBackends) {
    auto thrown = evalThrowing("__rnexecutorch_jsi__.getExecuTorchRegisteredBackends(1);");

    EXPECT_TRUE(isCodedError(thrown, "INVALID_ARGUMENT",
                             "Usage: getExecuTorchRegisteredBackends()"));
}

// isEmulator is a plain boolean property, not a function: the value is fixed for
// the lifetime of the process, and the download analytics path reads it on every
// fetch.
TEST_F(UtilsTest, ExposesIsEmulatorAsABoolean) {
    EXPECT_TRUE(evalBool("return typeof __rnexecutorch_jsi__.isEmulator === 'boolean';"));
    // Neither an Android emulator nor an iOS simulator: a host build is a real
    // machine, and the Apple branch resolves at compile time.
    EXPECT_FALSE(evalBool("return __rnexecutorch_jsi__.isEmulator;"));
}

TEST_F(UtilsTest, InstallsTheModuleUnderItsProductionName) {
    EXPECT_TRUE(evalBool("return typeof __rnexecutorch_jsi__ === 'object';"));

    // Every extension namespace the TS layer reaches for. A missing install()
    // call shows up here rather than as an undefined-is-not-a-function further
    // down some pipeline. `cv` is compiled in only with OpenCV, exactly as on
    // device.
#ifdef RNE_ENABLE_OPENCV
    EXPECT_TRUE(evalBool("return typeof __rnexecutorch_jsi__.cv === 'object';"));
#else
    EXPECT_TRUE(evalBool("return __rnexecutorch_jsi__.cv === undefined;"));
#endif

    for (const auto *name : {"math", "nlp", "speech", "llm"}) {
        EXPECT_TRUE(evalBool(std::string("return typeof __rnexecutorch_jsi__.") + name + " === 'object';"))
            << "missing extension namespace: " << name;
    }

    for (const auto *name : {"loadModel", "createTensor", "getExecuTorchRegisteredBackends"}) {
        EXPECT_TRUE(evalBool(std::string("return typeof __rnexecutorch_jsi__.") + name + " === 'function';"))
            << "missing core entry point: " << name;
    }
}

} // namespace
} // namespace rnexecutorch::tests
