#include "image_ops.h"

#include <algorithm>
#include <cmath>
#include <numeric>
#include <optional>
#include <stdexcept>
#include <utility>

#include <opencv2/imgproc.hpp>

#include "core/dtype.h"
#include "core/tensor.h"
#include "core/tensor_helpers.h"
#include "utils.h"

namespace rnexecutorch::extensions::cv::image_ops {
namespace jsi = facebook::jsi;
namespace tensor = rnexecutorch::core::tensor;
namespace conversions = rnexecutorch::core::conversions;

using rnexecutorch::core::types::DType;

namespace {
int interpToFlag(const std::string &interp) {
    if (interp == "nearest") {
        return ::cv::INTER_NEAREST;
    }
    if (interp == "area") {
        return ::cv::INTER_AREA;
    }
    if (interp == "linear") {
        return ::cv::INTER_LINEAR;
    }
    if (interp == "cubic") {
        return ::cv::INTER_CUBIC;
    }
    if (interp == "lanczos") {
        return ::cv::INTER_LANCZOS4;
    }
    throw std::invalid_argument("unsupported interpolation '" + interp + "'");
}

struct FitBox {
    int32_t w, h, offX, offY;
};

FitBox computeFit(int32_t srcW, int32_t srcH, int32_t dstW, int32_t dstH, bool inner) {
    const double scaleW = static_cast<double>(dstW) / srcW;
    const double scaleH = static_cast<double>(dstH) / srcH;
    const double scale = inner ? std::min(scaleW, scaleH) : std::max(scaleW, scaleH);

    const auto w = static_cast<int32_t>(std::round(srcW * scale));
    const auto h = static_cast<int32_t>(std::round(srcH * scale));
    const int32_t sign = inner ? 1 : -1; // letterbox centers padding, crop centers the crop
    return {.w = w, .h = h, .offX = sign * (dstW - w) / 2, .offY = sign * (dstH - h) / 2};
}
} // namespace

void install_resize(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "resize";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw jsi::JSError(rt, "Usage: resize(src, dst, options)");
        }

        auto src = tensor::fromJs(rt, "resize: src", args[0], std::nullopt, tensor::SymbolicShape{"H", "W", "C"});
        auto dst = tensor::fromJs(rt, "resize: dst", args[1], src->dtype_, tensor::SymbolicShape{"H'", "W'", src->shape_[2]});

        tensor::checkNotSameTensor(rt, "resize: src", src, "resize: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "resize: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "resize: dst", dst);

        const auto opts = args[2].asObject(rt);
        const auto mode = conversions::getRequiredProperty<std::string>(rt, "resize: options", opts, "mode");
        const auto interp = conversions::getRequiredProperty<std::string>(rt, "resize: options", opts, "interpolation");
        const auto padValue = conversions::getRequiredProperty<double>(rt, "resize: options", opts, "padValue");

        const int32_t srcH = src->shape_[0];
        const int32_t srcW = src->shape_[1];
        const int32_t channels = src->shape_[2];
        const int32_t dstH = dst->shape_[0];
        const int32_t dstW = dst->shape_[1];

        int cvType{};
        int interpFlag{};
        try {
            cvType = CV_MAKETYPE(dtypeToCvDepth(src->dtype_), channels);
            interpFlag = interpToFlag(interp);
        } catch (const std::exception &e) {
            throw jsi::JSError(rt, "resize: " + std::string(e.what()));
        }

        try {
            const ::cv::Mat srcMat(srcH, srcW, cvType, src->data_.get());
            ::cv::Mat dstMat(dstH, dstW, cvType, dst->data_.get());

            if (mode == "stretch") {
                ::cv::resize(srcMat, dstMat, dstMat.size(), 0, 0, interpFlag);
            } else if (mode == "letterbox") {
                const FitBox fit = computeFit(srcW, srcH, dstW, dstH, /*inner=*/true);

                dstMat.setTo(::cv::Scalar::all(padValue));
                ::cv::Mat roi = dstMat(::cv::Rect(fit.offX, fit.offY, fit.w, fit.h));
                ::cv::resize(srcMat, roi, roi.size(), 0, 0, interpFlag);
            } else if (mode == "crop") {
                const FitBox fit = computeFit(srcW, srcH, dstW, dstH, /*inner=*/false);

                ::cv::Mat scaled;
                ::cv::resize(srcMat, scaled, ::cv::Size(fit.w, fit.h), 0, 0, interpFlag);
                scaled(::cv::Rect(fit.offX, fit.offY, dstW, dstH)).copyTo(dstMat);
            } else {
                throw jsi::JSError(rt, "resize: unknown mode '" + mode + "'. Use 'stretch', 'letterbox', or 'crop'");
            }
        } catch (const jsi::JSError &) {
            throw;
        } catch (const std::exception &e) {
            throw jsi::JSError(rt, "resize: " + std::string(e.what()));
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, fnBody));
}

namespace {
int codeToColorConversionFlag(const std::string &code) {
    if (code == "RGBA2RGB") {
        return ::cv::COLOR_RGBA2RGB;
    }
    if (code == "RGBA2BGR") {
        return ::cv::COLOR_RGBA2BGR;
    }
    if (code == "RGBA2BGRA") {
        return ::cv::COLOR_RGBA2BGRA;
    }
    if (code == "BGRA2RGBA") {
        return ::cv::COLOR_BGRA2RGBA;
    }
    if (code == "BGRA2RGB") {
        return ::cv::COLOR_BGRA2RGB;
    }
    if (code == "BGRA2BGR") {
        return ::cv::COLOR_BGRA2BGR;
    }
    if (code == "RGB2BGR") {
        return ::cv::COLOR_RGB2BGR;
    }
    if (code == "BGR2RGB") {
        return ::cv::COLOR_BGR2RGB;
    }
    if (code == "RGB2RGBA") {
        return ::cv::COLOR_RGB2RGBA;
    }
    if (code == "BGR2RGBA") {
        return ::cv::COLOR_BGR2RGBA;
    }
    if (code == "RGB2BGRA") {
        return ::cv::COLOR_RGB2BGRA;
    }
    if (code == "BGR2BGRA") {
        return ::cv::COLOR_BGR2BGRA;
    }
    if (code == "RGB2GRAY") {
        return ::cv::COLOR_RGB2GRAY;
    }
    if (code == "RGBA2GRAY") {
        return ::cv::COLOR_RGBA2GRAY;
    }
    if (code == "BGR2GRAY") {
        return ::cv::COLOR_BGR2GRAY;
    }
    if (code == "BGRA2GRAY") {
        return ::cv::COLOR_BGRA2GRAY;
    }
    if (code == "GRAY2RGBA") {
        return ::cv::COLOR_GRAY2RGBA;
    }
    if (code == "GRAY2RGB") {
        return ::cv::COLOR_GRAY2RGB;
    }
    if (code == "GRAY2BGR") {
        return ::cv::COLOR_GRAY2BGR;
    }
    if (code == "GRAY2BGRA") {
        return ::cv::COLOR_GRAY2BGRA;
    }
    throw std::invalid_argument("cvtColor: unsupported color conversion code '" + code + "'");
}
} // namespace

void install_cvtColor(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "cvtColor";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw jsi::JSError(rt, "Usage: cvtColor(src, dst, code)");
        }

        auto src = tensor::fromJs(rt, "cvtColor: src", args[0], std::nullopt, tensor::SymbolicShape{"H", "W", "C"});
        auto dst = tensor::fromJs(rt, "cvtColor: dst", args[1], src->dtype_, tensor::SymbolicShape{src->shape_[0], src->shape_[1], "C'"});

        tensor::checkNotSameTensor(rt, "cvtColor: src", src, "cvtColor: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "cvtColor: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "cvtColor: dst", dst);

        const int32_t srcH = src->shape_[0];
        const int32_t srcW = src->shape_[1];
        const int32_t srcC = src->shape_[2];
        const int32_t dstC = dst->shape_[2];

        auto code = conversions::asType<std::string>(rt, "cvtColor: code", args[2]);

        int cvSrcType{};
        int cvDstType{};
        int flag{};
        try {
            cvSrcType = CV_MAKETYPE(dtypeToCvDepth(src->dtype_), srcC);
            cvDstType = CV_MAKETYPE(dtypeToCvDepth(dst->dtype_), dstC);
            flag = codeToColorConversionFlag(code);

            const ::cv::Mat srcMat(srcH, srcW, cvSrcType, src->data_.get());
            ::cv::Mat dstMat(srcH, srcW, cvDstType, dst->data_.get());

            ::cv::cvtColor(srcMat, dstMat, flag);
        } catch (const std::exception &e) {
            throw jsi::JSError(rt, "cvtColor: " + std::string(e.what()));
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, fnBody));
}

void install_toChannelsFirst(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "toChannelsFirst";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) {
            throw jsi::JSError(rt, "Usage: toChannelsFirst(src, dst)");
        }

        auto src = tensor::fromJs(rt, "toChannelsFirst: src", args[0], std::nullopt, tensor::SymbolicShape{"H", "W", "C"});
        auto dst = tensor::fromJs(rt, "toChannelsFirst: dst", args[1], src->dtype_, tensor::SymbolicShape{src->shape_[2], src->shape_[0], src->shape_[1]});

        tensor::checkNotSameTensor(rt, "toChannelsFirst: src", src, "toChannelsFirst: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "toChannelsFirst: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "toChannelsFirst: dst", dst);

        const int32_t srcH = src->shape_[0];
        const int32_t srcW = src->shape_[1];
        const int32_t srcC = src->shape_[2];

        try {
            const int cvType = CV_MAKETYPE(dtypeToCvDepth(src->dtype_), srcC);

            const ::cv::Mat srcMat(srcH, srcW, cvType, src->data_.get());
            std::vector<::cv::Mat> channels;
            ::cv::split(srcMat, channels);

            const size_t hw = static_cast<size_t>(srcH) * static_cast<size_t>(srcW);
            const size_t elemSize = rnexecutorch::core::types::elementSize(src->dtype_);
            uint8_t *dstPtr = dst->data_.get();

            for (size_t i = 0; std::cmp_less(i, srcC); ++i) {
                std::memcpy(dstPtr + i * hw * elemSize, channels[i].data, hw * elemSize);
            }
        } catch (const std::exception &e) {
            throw jsi::JSError(rt, "toChannelsFirst: " + std::string(e.what()));
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 2, fnBody));
}

void install_toChannelsLast(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "toChannelsLast";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) {
            throw jsi::JSError(rt, "Usage: toChannelsLast(src, dst)");
        }

        auto src = tensor::fromJs(rt, "toChannelsLast: src", args[0], std::nullopt, tensor::SymbolicShape{"C", "H", "W"});
        auto dst = tensor::fromJs(rt, "toChannelsLast: dst", args[1], src->dtype_, tensor::SymbolicShape{src->shape_[1], src->shape_[2], src->shape_[0]});

        tensor::checkNotSameTensor(rt, "toChannelsLast: src", src, "toChannelsLast: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "toChannelsLast: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "toChannelsLast: dst", dst);

        const int32_t srcC = src->shape_[0];
        const int32_t srcH = src->shape_[1];
        const int32_t srcW = src->shape_[2];

        try {
            const int cvDepth = dtypeToCvDepth(src->dtype_);

            const size_t hw = static_cast<size_t>(srcH) * static_cast<size_t>(srcW);
            const size_t elemSize = rnexecutorch::core::types::elementSize(src->dtype_);
            uint8_t *srcPtr = src->data_.get();

            std::vector<::cv::Mat> channels;
            for (size_t i = 0; std::cmp_less(i, srcC); ++i) {
                channels.emplace_back(srcH, srcW, cvDepth, srcPtr + i * hw * elemSize);
            }

            ::cv::Mat dstMat(srcH, srcW, CV_MAKETYPE(cvDepth, srcC), dst->data_.get());
            ::cv::merge(channels, dstMat);
        } catch (const std::exception &e) {
            throw jsi::JSError(rt, "toChannelsLast: " + std::string(e.what()));
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 2, fnBody));
}

void install_normalize(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "normalize";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw jsi::JSError(rt, "Usage: normalize(src, dst, options)");
        }

        auto src = tensor::fromJs(rt, "normalize: src", args[0], std::nullopt, tensor::SymbolicShape{"C", "H", "W"});
        auto dst = tensor::fromJs(rt, "normalize: dst", args[1], std::nullopt, src->shape_);

        tensor::checkNotSameTensor(rt, "normalize: src", src, "normalize: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "normalize: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "normalize: dst", dst);

        auto opts = args[2].asObject(rt);

        const int32_t c = src->shape_[0];
        const int32_t h = src->shape_[1];
        const int32_t w = src->shape_[2];

        auto getNormalizeOption = [&](const char *optName) -> std::vector<double> {
            auto val = conversions::getRequiredProperty<jsi::Value>(rt, "normalize", opts, optName);
            std::vector<double> result(static_cast<size_t>(c));
            if (val.isNumber()) {
                std::ranges::fill(result, val.asNumber());
            } else {
                auto arr = conversions::asVector<double>(rt, std::format("normalize: options.{}", optName), val);
                if (arr.size() != static_cast<size_t>(c)) {
                    throw jsi::JSError(rt, std::format("normalize: options.{} array length must be exactly equal to channels", optName));
                }
                result = std::move(arr);
            }
            return result;
        };

        std::vector<double> alpha = getNormalizeOption("alpha");
        std::vector<double> beta = getNormalizeOption("beta");

        try {
            const int srcDepthType = dtypeToCvDepth(src->dtype_);
            const int dstDepthType = dtypeToCvDepth(dst->dtype_);

            const size_t srcElemSize = rnexecutorch::core::types::elementSize(src->dtype_);
            const size_t dstElemSize = rnexecutorch::core::types::elementSize(dst->dtype_);
            uint8_t *srcPtr = src->data_.get();
            uint8_t *dstPtr = dst->data_.get();

            const size_t plane = static_cast<size_t>(h) * static_cast<size_t>(w);
            for (size_t ch = 0; std::cmp_less(ch, c); ++ch) {
                const ::cv::Mat srcChannel(h, w, srcDepthType, srcPtr + ch * plane * srcElemSize);
                ::cv::Mat dstChannel(h, w, dstDepthType, dstPtr + ch * plane * dstElemSize);

                srcChannel.convertTo(dstChannel, dstDepthType, alpha[ch], beta[ch]);
            }
        } catch (const std::exception &e) {
            throw jsi::JSError(rt, "normalize: " + std::string(e.what()));
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, fnBody));
}

void install_applyColormap(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "applyColormap";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw jsi::JSError(rt, "Usage: applyColormap(src, dst, colormap)");
        }

        if (!args[2].isObject() || !args[2].asObject(rt).isArray(rt)) {
            throw jsi::JSError(rt, "applyColormap: colormap must be an array");
        }

        auto src = tensor::fromJs(rt, "applyColormap: src", args[0], DType::int32, std::nullopt);
        auto dst = tensor::fromJs(rt, "applyColormap: dst", args[1], DType::uint8, std::nullopt);

        tensor::checkNotSameTensor(rt, "applyColormap: src", src, "applyColormap: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "applyColormap: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "applyColormap: dst", dst);

        constexpr size_t numRgbaChannels = 4;
        if (dst->numel_ != src->numel_ * numRgbaChannels) {
            throw jsi::JSError(rt, "applyColormap: dst must have exactly 4 times the number of elements as src (RGBA channels)");
        }

        auto colormapArray = args[2].asObject(rt).asArray(rt);
        const size_t numColors = colormapArray.size(rt);
        std::vector<std::array<uint8_t, numRgbaChannels>> lut(numColors);
        for (size_t i = 0; i < numColors; ++i) {
            auto colorVec = conversions::asVector<uint8_t>(rt, "applyColormap: colormap entry", colormapArray.getValueAtIndex(rt, i));
            if (colorVec.size() != numRgbaChannels) {
                throw jsi::JSError(rt, "applyColormap: colormap entry must be an RGBA color array of size 4");
            }
            for (size_t c = 0; c < numRgbaChannels; ++c) {
                lut[i][c] = colorVec[c];
            }
        }

        const size_t pixels = src->numel_;

        const auto *srcData = reinterpret_cast<const int32_t *>(src->data_.get());
        uint8_t *dstData = dst->data_.get();

        for (size_t i = 0; i < pixels; ++i) {
            const int32_t idx = srcData[i];
            if (idx < 0 || std::cmp_greater_equal(idx, numColors)) {
                throw jsi::JSError(rt, "applyColormap: tensor contains class index (" +
                                           std::to_string(idx) + ") that exceeds provided colormap size (" +
                                           std::to_string(numColors) + ")");
            }
            for (size_t c = 0; c < numRgbaChannels; ++c) {
                dstData[i * numRgbaChannels + c] = lut[static_cast<size_t>(idx)][c];
            }
        }

        return jsi::Value(rt, args[1]);
    };
    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, fnBody));
}
} // namespace rnexecutorch::extensions::cv::image_ops
