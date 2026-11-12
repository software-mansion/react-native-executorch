#include <array>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <format>
#include <thread>

#include "core/data_loader.h"
#include "support/JsiTestEnv.h"

namespace rnexecutorch::tests {
namespace {
using core::data_loader::LoadSession;
using core::error::RnExecuTorchErrorCode;
using executorch::runtime::DataLoader;
using executorch::runtime::Error;
using DataLoaderTest = JsiTestEnv;

const DataLoader::SegmentInfo kSegment{DataLoader::SegmentInfo::Type::Program};

TEST_F(DataLoaderTest, BuffersOwnCopiesAfterSessionAndRuntimeAreDestroyed) {
    auto owner = facebook::hermes::makeHermesRuntime();
    std::unique_ptr<DataLoader> loader;
    auto original = owner->evaluateJavaScript(std::make_unique<jsi::StringBuffer>(R"(
        ({ size() { return 4; }, load(offset, length) {
            return new Uint8Array([10, 20, 30, 40]).buffer.slice(offset, offset + length);
        } })
    )"),
                                              "loader.js");
    auto loaded = [&] {
        LoadSession session(*owner);
        loader = session.create("reader", original);
        return loader->load(1, 2, kSegment);
    }();
    original = jsi::Value::undefined();
    owner.reset();

    ASSERT_TRUE(loaded.ok());
    EXPECT_EQ(reinterpret_cast<uintptr_t>(loaded->data()) % alignof(std::max_align_t), 0u);
    const std::array<uint8_t, 2> expected{20, 30};
    EXPECT_EQ(std::memcmp(loaded->data(), expected.data(), expected.size()), 0);
    // Even a live native adapter cannot call back into the destroyed runtime.
    EXPECT_EQ(loader->load(0, 1, kSegment).error(), Error::InvalidState);
    EXPECT_EQ(loader->size().get(), 4u);

    // Freeing loaded buffers and adapters needs no originating JS runtime.
    std::thread cleanup([buffer = std::move(loaded.get()), adapter = std::move(loader)]() mutable {
        buffer.Free();
        adapter.reset();
    });
    cleanup.join();
}

TEST_F(DataLoaderTest, LoadIntoCopiesDirectlyAndPreservesTheCallbackReceiver) {
    LoadSession session(rt());
    auto reader = eval(R"(
        return { bytes: new Uint8Array([1, 2, 3, 4]),
            size() { return this.bytes.byteLength; },
            load(offset, length) { return this.bytes.buffer.slice(offset, offset + length); }
        };
    )");
    auto loader = session.create("reader", reader);
    std::array<uint8_t, 2> destination{};
    EXPECT_EQ(loader->load_into(1, 2, kSegment, destination.data()), Error::Ok);
    EXPECT_EQ(destination, (std::array<uint8_t, 2>{2, 3}));
    EXPECT_EQ(loader->load_into(0, 1, kSegment, nullptr), Error::InvalidArgument);
    EXPECT_EQ(loader->load(4, 0, kSegment)->size(), 0u);
    session.rethrowIfFailed();
}

TEST_F(DataLoaderTest, RejectsOutOfBoundsReadsBeforeCallingJs) {
    LoadSession session(rt());
    auto reader = eval("return { size: () => 4, load: () => { throw new Error('must not run'); } };");
    auto loader = session.create("reader", reader);
    EXPECT_EQ(loader->load(5, 0, kSegment).error(), Error::InvalidArgument);
    EXPECT_EQ(loader->load(3, 2, kSegment).error(), Error::InvalidArgument);
    EXPECT_EQ(loader->load(1, SIZE_MAX, kSegment).error(), Error::InvalidArgument);
    EXPECT_NO_THROW(session.rethrowIfFailed());
}

TEST_F(DataLoaderTest, WorkerThreadsCannotAccessJsCallbacks) {
    LoadSession session(rt());
    auto reader = eval("return { size: () => 4, load: () => { throw new Error('must not run'); } };");
    auto loader = session.create("reader", reader);
    Error result = Error::Ok;
    std::thread worker([&] { result = loader->load(0, 1, kSegment).error(); });
    worker.join();
    EXPECT_EQ(result, Error::InvalidState);
    EXPECT_NO_THROW(session.rethrowIfFailed());
}

TEST_F(DataLoaderTest, PreservesOriginalCallbackExceptionsAndStopsFurtherReads) {
    LoadSession session(rt());
    auto reader = eval("return { size: () => 4, load: () => { throw new Error('read failed'); } };");
    auto loader = session.create("reader", reader);
    EXPECT_EQ(loader->load(0, 1, kSegment).error(), Error::AccessFailed);
    EXPECT_EQ(loader->load(0, 1, kSegment).error(), Error::AccessFailed);
    try {
        session.rethrowIfFailed();
        FAIL() << "expected the original callback error";
    } catch (const jsi::JSError &e) {
        EXPECT_THAT(e.getMessage(), ::testing::HasSubstr("read failed"));
    }
}

TEST_F(DataLoaderTest, RejectsWrongLengthAndNonBufferResults) {
    for (const auto *body : {"new ArrayBuffer(2)", "Promise.resolve(new ArrayBuffer(1))"}) {
        LoadSession session(rt());
        auto reader = eval(std::format("return {{ size: () => 4, load: () => {} }};", body));
        auto loader = session.create("reader", reader);
        EXPECT_EQ(loader->load(0, 1, kSegment).error(), Error::AccessFailed);
        EXPECT_TRUE(throwsCoded([&] { session.rethrowIfFailed(); }, RnExecuTorchErrorCode::InvalidArgument));
    }
}

TEST_F(DataLoaderTest, RejectsInvalidSizesAndMalformedReaders) {
    for (const auto *value : {"-1", "1.5", "NaN", "Infinity", "18446744073709551616"}) {
        LoadSession session(rt());
        auto reader = eval(std::format("return {{ size: () => {}, load: () => new ArrayBuffer(0) }};", value));
        EXPECT_TRUE(throwsCoded([&] { session.create("reader", reader); }, RnExecuTorchErrorCode::InvalidArgument));
    }
    LoadSession session(rt());
    auto reader = eval("return { size: () => 4 };");
    EXPECT_TRUE(throwsCoded([&] { session.create("reader", reader); }, RnExecuTorchErrorCode::InvalidArgument));
}

TEST_F(DataLoaderTest, ExceptionalExitAlsoDetachesCallbacks) {
    std::unique_ptr<DataLoader> loader;
    EXPECT_TRUE(throwsCoded([&] {
        LoadSession session(rt());
        auto reader = eval("return { size: () => 4, load: () => new ArrayBuffer(0) };");
        loader = session.create("reader", reader);
        EXPECT_EQ(loader->load(0, 1, kSegment).error(), Error::AccessFailed);
        session.rethrowIfFailed();
    },
                            RnExecuTorchErrorCode::InvalidArgument));
    EXPECT_EQ(loader->load(0, 1, kSegment).error(), Error::InvalidState);
}

TEST_F(DataLoaderTest, LoadModelRejectsLazyCallbackSourcesBeforeCallingThem) {
    auto thrown = evalThrowing(R"(
        __rnexecutorch_jsi__.loadModel({ programLoader: {
            size() { throw new Error('must not run'); },
            load() { throw new Error('must not run'); }
        } }, { eagerLoadMethods: false });
    )");
    EXPECT_TRUE(isCodedError(thrown, "INVALID_ARGUMENT", "require eagerLoadMethods: true"));
}

TEST_F(DataLoaderTest, LoadModelRejectsIncompleteAndMalformedSources) {
    for (const auto *source : {"{}", "new ArrayBuffer(4)", "{programPath: 'x'}",
                               "{programPath: 'x', dataMapPath: []}", "{programPath: 'x', dataMapPath: ['']}",
                               "{programPath: 'x', programLoader: {}}", "{programLoader: {}, dataMapPath: 'x'}"}) {
        EXPECT_TRUE(isCodedError(evalThrowing(std::format("__rnexecutorch_jsi__.loadModel({});", source)),
                                 "INVALID_ARGUMENT", ""));
    }
}

TEST_F(DataLoaderTest, LoadModelPrefersThePathPairOverCallbackLoaders) {
    auto thrown = evalThrowing(R"(
        __rnexecutorch_jsi__.loadModel({
            programPath: '/nonexistent/rne-program.pte',
            dataMapPath: '/nonexistent/rne-weights.ptd',
            programLoader: {
                size() { throw new Error('callback must not run'); },
                load() { throw new Error('callback must not run'); }
            }
        });
    )");
    EXPECT_TRUE(isCodedError(thrown, "LOAD_FAILED", "rne-program.pte"));
}

TEST_F(DataLoaderTest, LoadModelPreservesInitializationCallbackErrors) {
    auto thrown = evalThrowing(R"(
        __rnexecutorch_jsi__.loadModel({ programLoader: {
            size() { return 64; }, load() { throw new Error('decrypt failed'); }
        } });
    )");
    EXPECT_THAT(thrown.message, ::testing::HasSubstr("decrypt failed"));
}

} // namespace
} // namespace rnexecutorch::tests
