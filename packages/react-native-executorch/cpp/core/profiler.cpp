#include "profiler.h"

#include <mutex>
#include <unordered_map>

#include "error.h"

namespace rnexecutorch::core::profiler {
namespace jsi = facebook::jsi;

namespace {
struct MethodTotals {
    int64_t count = 0;
    int64_t nanos = 0;
};

// Process-global rather than per-Model, because the caller that wants these
// numbers is timing a pipeline and never sees the Model the pipeline loaded.
// Only one model is loaded at a time in that setting, so keying by method name
// is enough to tell a Whisper `encode` from its `decode`.
std::mutex &mutex() {
    static std::mutex instance;
    return instance;
}

std::unordered_map<std::string, MethodTotals> &totals() {
    static std::unordered_map<std::string, MethodTotals> instance;
    return instance;
}
} // namespace

void record(const std::string &methodName, int64_t nanos) {
    const std::lock_guard<std::mutex> lock(mutex());
    auto &entry = totals()[methodName];
    entry.count += 1;
    entry.nanos += nanos;
}

void install_executionProfile(jsi::Runtime &rt, jsi::Object &module) {
    {
        const auto *name = "getExecutionProfile";
        auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value * /*args*/,
                         size_t count) -> jsi::Value {
            if (count != 0) {
                throw error::InvalidArgument("getExecutionProfile: Usage: getExecutionProfile()");
            }

            const std::lock_guard<std::mutex> lock(mutex());
            auto result = jsi::Object(rt);
            for (const auto &[methodName, entry] : totals()) {
                auto methodResult = jsi::Object(rt);
                methodResult.setProperty(rt, "count", jsi::Value(static_cast<double>(entry.count)));
                // Milliseconds as a double: the underlying clock is nanoseconds
                // and a double holds that exactly well past any plausible run,
                // so a sub-millisecond inference is not rounded to zero the way
                // the integer-millisecond profiling log rounds it.
                methodResult.setProperty(rt, "totalMs", jsi::Value(static_cast<double>(entry.nanos) / 1e6));
                result.setProperty(rt, jsi::PropNameID::forUtf8(rt, methodName), methodResult);
            }
            return result;
        };
        auto fn = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 0, error::guarded(fnBody));
        module.setProperty(rt, name, fn);
    }

    {
        const auto *name = "resetExecutionProfile";
        auto fnBody = [](jsi::Runtime & /*rt*/, const jsi::Value & /*thisVal*/, const jsi::Value * /*args*/,
                         size_t count) -> jsi::Value {
            if (count != 0) {
                throw error::InvalidArgument("resetExecutionProfile: Usage: resetExecutionProfile()");
            }
            const std::lock_guard<std::mutex> lock(mutex());
            totals().clear();
            return jsi::Value::undefined();
        };
        auto fn = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 0, error::guarded(fnBody));
        module.setProperty(rt, name, fn);
    }
}
} // namespace rnexecutorch::core::profiler
