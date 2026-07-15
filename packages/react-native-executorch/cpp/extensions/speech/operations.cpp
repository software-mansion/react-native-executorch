#include "operations.h"

#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <span>

#include "core/tensor.h"
#include "core/tensor_helpers.h"

namespace rnexecutorch::extensions::speech {
namespace jsi = facebook::jsi;
namespace conversions = rnexecutorch::core::conversions;
namespace tensor = rnexecutorch::core::tensor;
using rnexecutorch::core::types::DType;

// Slices a mono waveform into overlapping frames, applying per-frame
// mean-removal, a pre-emphasis filter and a Hann window, writing each frame into
// a zero-padded row of `dst`. Mirrors the reference FSMN-VAD feature extraction.
// The whole per-frame inner loop dominates the VAD pipeline (~85% of a detect()
// call on device), so it lives in native code per the extension guidelines.
void install_extractFrames(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "extractFrames";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 4) {
            throw jsi::JSError(rt, "Usage: extractFrames(waveform, hann, dst, options)");
        }

        auto waveform = tensor::fromJs(rt, "extractFrames: waveform", args[0], DType::float32, {"length"});
        auto hann = tensor::fromJs(rt, "extractFrames: hann", args[1], DType::float32, {"frameLength"});
        auto dst = tensor::fromJs(rt, "extractFrames: dst", args[2], DType::float32, {"frames", "fftLength"});

        auto options = conversions::asType<jsi::Object>(rt, "extractFrames: options", args[3]);
        auto numFrames = conversions::getRequiredProperty<uint64_t>(rt, "extractFrames", options, "numFrames");
        auto hopLength = conversions::getRequiredProperty<uint64_t>(rt, "extractFrames", options, "hopLength");
        auto preemphasis = conversions::getRequiredProperty<float>(rt, "extractFrames", options, "preemphasis");

        tensor::checkNotSameTensor(rt, "extractFrames: waveform", waveform, "extractFrames: hann", hann);
        tensor::checkNotSameTensor(rt, "extractFrames: waveform", waveform, "extractFrames: dst", dst);
        tensor::checkNotSameTensor(rt, "extractFrames: hann", hann, "extractFrames: dst", dst);
        auto waveLock = tensor::tryLockShared(rt, "extractFrames: waveform", waveform);
        auto hannLock = tensor::tryLockShared(rt, "extractFrames: hann", hann);
        auto dstLock = tensor::tryLockUnique(rt, "extractFrames: dst", dst);

        const auto frameLength = hann->numel_;
        const auto chunkFrames = static_cast<uint64_t>(dst->shape_[0]);
        const auto fftLength = static_cast<uint64_t>(dst->shape_[1]);
        if (frameLength > fftLength) {
            throw jsi::JSError(rt, "extractFrames: hann length exceeds dst fftLength");
        }
        if (numFrames > chunkFrames) {
            throw jsi::JSError(rt, "extractFrames: numFrames out of dst frame capacity");
        }

        if (numFrames > 0) {
            const uint64_t lastSample = (numFrames - 1) * hopLength + frameLength - 1;
            if (lastSample >= waveform->numel_) {
                throw jsi::JSError(rt, "extractFrames: frame window out of waveform bounds");
            }
        }

        const auto leftPad = (fftLength - frameLength) / 2;
        const std::span<const float> wave(reinterpret_cast<const float *>(waveform->data_.get()), waveform->numel_);
        const std::span<const float> win(reinterpret_cast<const float *>(hann->data_.get()), hann->numel_);
        const std::span<float> out(reinterpret_cast<float *>(dst->data_.get()), dst->numel_);

        // Zero the destination so intra-frame and trailing-row padding stay 0.
        std::ranges::fill(out, 0.0f);

        for (uint64_t f = 0; f < numFrames; ++f) {
            const auto frame = wave.subspan(static_cast<std::size_t>(f * hopLength), frameLength);
            const auto base = out.subspan(static_cast<std::size_t>(f * fftLength + leftPad), frameLength);

            float sum = 0.0f;
            for (const float sample : frame) {
                sum += sample;
            }
            const float mean = sum / static_cast<float>(frameLength);

            // Pre-emphasis of a mean-subtracted signal, (raw[j]-mean) -
            // c*(raw[j-1]-mean), equals raw[j] - c*raw[j-1] - mean*(1-c), so each
            // output reads only raw samples — no serial dependency, and the fused
            // mean-removal + pre-emphasis + Hann loop vectorizes.
            const float meanBias = mean * (1.0f - preemphasis);
            base[0] = (frame[0] - mean) * win[0];
            for (std::size_t j = 1; j < frameLength; ++j) {
                base[j] = (frame[j] - preemphasis * frame[j - 1] - meanBias) * win[j];
            }
        }

        return jsi::Value(rt, args[2]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 4, fnBody));
}
} // namespace rnexecutorch::extensions::speech
