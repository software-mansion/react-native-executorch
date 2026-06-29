#include "duration.h"

#include <cmath>
#include <numeric>
#include <queue>
#include <utility>

#include "core/tensor.h"

namespace mylib::extensions::speech::kokoro {

namespace jsi = facebook::jsi;
using TensorHostObject = rnexecutorch::core::tensor::TensorHostObject;
using DType = rnexecutorch::core::DType;

void install_sumDurations(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "sumDurations";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &,
                     const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1) {
            throw jsi::JSError(rt,
                               "sumDurations: Usage: sumDurations(durationsTensor)");
        }
        if (!args[0].isObject() ||
            !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "sumDurations: Expected a Tensor");
        }

        auto tensor = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);

        if (tensor->dtype_ != DType::int64) {
            throw jsi::JSError(rt, "sumDurations: tensor must be int64");
        }

        std::shared_lock<std::shared_mutex> lock(tensor->mutex_, std::try_to_lock);
        if (!lock.owns_lock()) {
            throw jsi::JSError(rt, "sumDurations: tensor is currently in use");
        }

        auto *data = reinterpret_cast<const int64_t *>(tensor->data_);
        int64_t sum = std::accumulate(data, data + tensor->numel_, int64_t{0});

        return jsi::Value(static_cast<double>(sum));
    };

    module.setProperty(
        rt, name,
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forAscii(rt, name), 1, fnBody));
}

void install_scaleDurations(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "scaleDurations";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &,
                     const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw jsi::JSError(rt, "scaleDurations: Usage: scaleDurations(durationsTensor, nTokens, targetDuration)");
        }
        if (!args[0].isObject() ||
            !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "scaleDurations: Expected a Tensor as first argument");
        }
        if (!args[1].isNumber()) {
            throw jsi::JSError(rt, "scaleDurations: Expected a number for nTokens");
        }
        if (!args[2].isNumber()) {
            throw jsi::JSError(rt, "scaleDurations: Expected a number for targetDuration");
        }

        auto tensor = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);

        if (tensor->dtype_ != DType::int64) {
            throw jsi::JSError(rt, "scaleDurations: tensor must be int64");
        }

        auto nTokens = static_cast<size_t>(args[1].asNumber());
        auto targetDuration = static_cast<int64_t>(args[2].asNumber());

        if (nTokens == 0 || tensor->numel_ < nTokens) {
            throw jsi::JSError(rt, "scaleDurations: nTokens out of range");
        }

        std::unique_lock<std::shared_mutex> lock(tensor->mutex_, std::try_to_lock);
        if (!lock.owns_lock()) {
            throw jsi::JSError(rt, "scaleDurations: tensor is currently in use");
        }

        auto *data = reinterpret_cast<int64_t *>(tensor->data_);
        int64_t totalDur = std::accumulate(data, data + nTokens, int64_t{0});

        if (totalDur == 0) {
            throw jsi::JSError(rt, "scaleDurations: total duration is zero");
        }

        float scaleFactor = static_cast<float>(targetDuration) /
                            static_cast<float>(totalDur);
        bool shrinking = scaleFactor < 1.0F;

        std::priority_queue<std::pair<float, size_t>> remainders;
        int64_t scaledSum = 0;
        for (size_t i = 0; i < nTokens; i++) {
            float scaled = scaleFactor * static_cast<float>(data[i]);
            float remainder = shrinking ? std::ceil(scaled) - scaled
                                        : scaled - std::floor(scaled);

            data[i] = static_cast<int64_t>(shrinking ? std::ceil(scaled)
                                                     : std::floor(scaled));
            scaledSum += data[i];
            remainders.emplace(remainder, i);
        }

        int64_t diff = std::abs(targetDuration - scaledSum);
        for (int64_t i = 0; i < diff; i++) {
            auto [_, idx] = remainders.top();
            data[idx] += shrinking ? -1 : 1;
            remainders.pop();
        }

        return jsi::Value::undefined();
    };

    module.setProperty(
        rt, name,
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forAscii(rt, name), 3, fnBody));
}

void install_expandDurations(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "expandDurations";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &,
                     const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) {
            throw jsi::JSError(rt,
                               "expandDurations: Usage: expandDurations(durationsTensor, outputTensor)");
        }
        if (!args[0].isObject() ||
            !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "expandDurations: Expected a Tensor as first argument");
        }
        if (!args[1].isObject() ||
            !args[1].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "expandDurations: Expected a Tensor as second argument");
        }

        auto durations = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto output = args[1].asObject(rt).getHostObject<TensorHostObject>(rt);

        if (durations->dtype_ != DType::int64) {
            throw jsi::JSError(rt, "expandDurations: durations tensor must be int64");
        }
        if (output->dtype_ != DType::int64) {
            throw jsi::JSError(rt, "expandDurations: output tensor must be int64");
        }

        std::shared_lock<std::shared_mutex> srcLock(durations->mutex_, std::try_to_lock);
        if (!srcLock.owns_lock()) {
            throw jsi::JSError(rt, "expandDurations: durations tensor is currently in use");
        }

        std::unique_lock<std::shared_mutex> dstLock(output->mutex_, std::try_to_lock);
        if (!dstLock.owns_lock()) {
            throw jsi::JSError(rt, "expandDurations: output tensor is currently in use");
        }

        auto *src = reinterpret_cast<const int64_t *>(durations->data_);
        auto *dst = reinterpret_cast<int64_t *>(output->data_);
        const size_t nTokens = durations->numel_;

        int64_t total = std::accumulate(src, src + nTokens, int64_t{0});
        if (output->numel_ < static_cast<size_t>(total)) {
            throw jsi::JSError(rt,
                               "expandDurations: output tensor too small, need at least " +
                                   std::to_string(total));
        }

        size_t offset = 0;
        for (size_t i = 0; i < nTokens; i++) {
            int64_t count = src[i];
            std::fill(dst + offset, dst + offset + count,
                      static_cast<int64_t>(i));
            offset += static_cast<size_t>(count);
        }

        return jsi::Value::undefined();
    };

    module.setProperty(
        rt, name,
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forAscii(rt, name), 2, fnBody));
}

} // namespace mylib::extensions::speech::kokoro
