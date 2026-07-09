#include "operations.h"

#include <algorithm>
#include <cstdint>
#include <optional>

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
void install_frameWaveform(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "frameWaveform";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 7) {
            throw jsi::JSError(rt, "Usage: frameWaveform(waveform, hann, dst, startSample, numFrames, hopLength, preemphasis)");
        }

        auto waveform = tensor::fromJs(rt, "frameWaveform: waveform", args[0], DType::float32, std::nullopt);
        auto hann = tensor::fromJs(rt, "frameWaveform: hann", args[1], DType::float32, std::nullopt);
        auto dst = tensor::fromJs(rt, "frameWaveform: dst", args[2], DType::float32, std::nullopt);
        auto startSample = conversions::asType<int64_t>(rt, "frameWaveform: startSample", args[3]);
        auto numFrames = conversions::asType<int64_t>(rt, "frameWaveform: numFrames", args[4]);
        auto hopLength = conversions::asType<int64_t>(rt, "frameWaveform: hopLength", args[5]);
        auto preemphasis = static_cast<float>(conversions::asType<double>(rt, "frameWaveform: preemphasis", args[6]));

        tensor::checkNotSameTensor(rt, "frameWaveform: waveform", waveform, "frameWaveform: dst", dst);
        tensor::checkNotSameTensor(rt, "frameWaveform: hann", hann, "frameWaveform: dst", dst);
        auto waveLock = tensor::tryLockShared(rt, "frameWaveform: waveform", waveform);
        auto hannLock = tensor::tryLockShared(rt, "frameWaveform: hann", hann);
        auto dstLock = tensor::tryLockUnique(rt, "frameWaveform: dst", dst);

        if (dst->shape_.size() != 2) {
            throw jsi::JSError(rt, "frameWaveform: dst must be 2D [frames, fftLength]");
        }
        const auto frameLength = static_cast<int64_t>(hann->numel_);
        const int64_t chunkFrames = dst->shape_[0];
        const int64_t fftLength = dst->shape_[1];
        if (frameLength > fftLength) {
            throw jsi::JSError(rt, "frameWaveform: hann length exceeds dst fftLength");
        }
        if (numFrames < 0 || numFrames > chunkFrames) {
            throw jsi::JSError(rt, "frameWaveform: numFrames out of dst frame capacity");
        }

        const auto waveLen = static_cast<int64_t>(waveform->numel_);
        if (numFrames > 0) {
            const int64_t lastSample = startSample + (numFrames - 1) * hopLength + frameLength - 1;
            if (startSample < 0 || lastSample >= waveLen) {
                throw jsi::JSError(rt, "frameWaveform: frame window out of waveform bounds");
            }
        }

        const int64_t leftPad = (fftLength - frameLength) / 2;
        const auto *wave = reinterpret_cast<const float *>(waveform->data_.get());
        const auto *win = reinterpret_cast<const float *>(hann->data_.get());
        auto *out = reinterpret_cast<float *>(dst->data_.get());

        // Zero the full destination so both the intra-frame padding around each
        // window and any trailing padding rows (numFrames < chunkFrames) are 0.
        std::fill(out, out + dst->numel_, 0.0f);

        for (int64_t f = 0; f < numFrames; ++f) {
            float *base = out + f * fftLength + leftPad;
            const float *start = wave + startSample + f * hopLength;

            // Pass 1: mean over the raw window.
            float sum = 0.0f;
            for (int64_t j = 0; j < frameLength; ++j) {
                sum += start[j];
            }
            const float mean = sum / static_cast<float>(frameLength);

            // Pass 2: fused mean-removal + pre-emphasis + Hann. Pre-emphasis of a
            // mean-subtracted signal, `(raw[j]-mean) - c*(raw[j-1]-mean)`, equals
            // `raw[j] - c*raw[j-1] - mean*(1-c)`, so every output reads only raw
            // input samples — no serial dependency, and the loop vectorizes.
            const float meanBias = mean * (1.0f - preemphasis);
            base[0] = (start[0] - mean) * win[0];
            for (int64_t j = 1; j < frameLength; ++j) {
                base[j] = (start[j] - preemphasis * start[j - 1] - meanBias) * win[j];
            }
        }

        return jsi::Value(rt, args[2]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 7, fnBody));
}
} // namespace rnexecutorch::extensions::speech
