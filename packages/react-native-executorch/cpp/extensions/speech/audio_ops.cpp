#include "audio_ops.h"

#include <algorithm>
#include <cmath>

#include "core/tensor.h"
#include "core/types.h"

namespace rnexecutorch::extensions::speech::audio {

namespace jsi = facebook::jsi;
using TensorHostObject = rnexecutorch::core::tensor::TensorHostObject;
using DType = rnexecutorch::core::DType;
using DSize = rnexecutorch::core::DSize;
using Shape = rnexecutorch::core::Shape;

void install_crop(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "crop";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &,
                     const jsi::Value *args, size_t count) -> jsi::Value {
        if (count < 3 || count > 4) {
            throw jsi::JSError(rt, "crop: Usage: crop(audioTensor, steps, threshold[, margin])");
        }
        if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "crop: Expected a Tensor as first argument");
        }
        if (!args[1].isNumber()) {
            throw jsi::JSError(rt, "crop: Expected a number for steps");
        }
        if (!args[2].isNumber()) {
            throw jsi::JSError(rt, "crop: Expected a number for threshold");
        }
        if (count >= 4 && !args[3].isNumber()) {
            throw jsi::JSError(rt, "crop: Expected a number for margin");
        }

        auto tensor = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);

        if (tensor->dtype_ != DType::float32) {
            throw jsi::JSError(rt, "crop: audio tensor must be float32");
        }

        auto steps = static_cast<uint32_t>(args[1].asNumber());
        auto threshold = static_cast<float>(args[2].asNumber());
        auto margin = static_cast<size_t>(count >= 4 ? args[3].asNumber() : 0);

        if (steps == 0) {
            throw jsi::JSError(rt, "crop: steps must be > 0");
        }

        // Helper function to find the beginning and the end of the speech.
        // NOTE: this should be changed in the future to an energy-based algorithm
        // after a bit of testing.
        auto findBound = [steps, threshold](const float *audio, size_t len,
                                            bool rev) -> size_t {
            if (!len)
                return 0;
            float sum = 0;
            size_t i = 0, idx = rev ? len - 1 : 0;
            int dir = rev ? -1 : 1;
            auto norm = [=](size_t j) {
                return std::max(0.0F, std::abs(audio[j]) - threshold);
            };
            while (i < len) {
                i++;
                sum += norm(idx);
                if (i > steps)
                    sum -= norm(rev ? idx + steps : idx - steps);
                if (i >= steps && sum / steps >= threshold)
                    return idx;
                idx += static_cast<size_t>(dir);
            }
            return rev ? 0 : len - 1;
        };

        auto *audio = reinterpret_cast<const float *>(tensor->data_);
        size_t length = tensor->numel_;

        size_t begin = findBound(audio, length, false);
        size_t end = findBound(audio, length, true);

        begin = (begin >= margin) ? begin - margin : 0;
        end = std::min(end + margin, length - 1);

        if (end < begin) {
            throw jsi::JSError(rt, "crop: resulting range is empty");
        }

        auto *viewData = tensor->data_ + begin * sizeof(float);
        Shape viewShape = {static_cast<DSize>(end - begin + 1)};

        // Thanks to the views, we can return a fully operational tensor,
        // without copying any data.
        auto view = std::make_shared<TensorHostObject>(
            viewData,
            std::move(viewShape),
            DType::float32);

        return jsi::Object::createFromHostObject(rt, view);
    };

    module.setProperty(
        rt, name,
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forAscii(rt, name), 4, fnBody));
}

} // namespace rnexecutorch::extensions::speech::audio
