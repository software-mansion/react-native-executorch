#include "profiler.h"

#include <mutex>
#include <unordered_map>

#include "conversions.h"
#include "error.h"

namespace rnexecutorch::core::profiler {
namespace jsi = facebook::jsi;

namespace {
struct MethodTotals {
    int64_t count = 0;
    int64_t nanos = 0;
};

using ModelTotals = std::unordered_map<std::string, MethodTotals>;

class Totals {
public:
    void record(const std::string &modelPath, const std::string &methodName, int64_t nanos) {
        const std::scoped_lock lock(mutex_);
        auto &entry = totals_[modelPath][methodName];
        entry.count += 1;
        entry.nanos += nanos;
    }

    std::unordered_map<std::string, ModelTotals> get() {
        const std::scoped_lock lock(mutex_);
        return totals_;
    }

    ModelTotals get(const std::string &modelPath) {
        const std::scoped_lock lock(mutex_);
        auto it = totals_.find(modelPath);
        return it == totals_.end() ? ModelTotals{} : it->second;
    }

    void clear() {
        const std::scoped_lock lock(mutex_);
        totals_.clear();
    }

private:
    std::mutex mutex_;
    std::unordered_map<std::string, ModelTotals> totals_;
};

// Process-global rather than per-Model, because a caller timing a pipeline
// never sees the Models the pipeline loaded.
// NOLINTNEXTLINE(cppcoreguidelines-avoid-non-const-global-variables): synchronized internally.
Totals totals;

jsi::Object toJs(jsi::Runtime &rt, const ModelTotals &modelTotals) {
    auto result = jsi::Object(rt);
    for (const auto &[methodName, entry] : modelTotals) {
        auto methodResult = jsi::Object(rt);
        methodResult.setProperty(rt, "count", jsi::Value(static_cast<double>(entry.count)));
        methodResult.setProperty(rt, "totalMs", jsi::Value(static_cast<double>(entry.nanos) / 1e6));
        result.setProperty(rt, jsi::PropNameID::forUtf8(rt, methodName), methodResult);
    }
    return result;
}
} // namespace

void record(const std::string &modelPath, const std::string &methodName, int64_t nanos) {
    totals.record(modelPath, methodName, nanos);
}

void install_profiler(jsi::Runtime &rt, jsi::Object &module) {
    jsi::Object profilerModule(rt);

    {
        const auto *name = "get";
        auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count > 1) {
                throw error::InvalidArgument("profiler.get: Usage: get(modelPath?)");
            }

            if (count == 1 && !args[0].isUndefined()) {
                auto modelPath = conversions::asType<std::string>(rt, "profiler.get: modelPath", args[0]);
                return toJs(rt, totals.get(modelPath));
            }

            auto result = jsi::Object(rt);
            for (const auto &[modelPath, modelTotals] : totals.get()) {
                result.setProperty(rt, jsi::PropNameID::forUtf8(rt, modelPath), toJs(rt, modelTotals));
            }
            return result;
        };
        auto fn = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 1, error::guarded(fnBody));
        profilerModule.setProperty(rt, name, fn);
    }

    {
        const auto *name = "reset";
        auto fnBody = [](jsi::Runtime & /*rt*/, const jsi::Value & /*thisVal*/, const jsi::Value * /*args*/, size_t count) -> jsi::Value {
            if (count != 0) {
                throw error::InvalidArgument("profiler.reset: Usage: reset()");
            }
            totals.clear();
            return jsi::Value::undefined();
        };
        auto fn = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 0, error::guarded(fnBody));
        profilerModule.setProperty(rt, name, fn);
    }

    module.setProperty(rt, "profiler", profilerModule);
}
} // namespace rnexecutorch::core::profiler
