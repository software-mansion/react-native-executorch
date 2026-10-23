#include "image_ops.h"

#include <algorithm>
#include <array>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <format>
#include <optional>
#include <span>
#include <stdexcept>
#include <utility>

#include "core/dtype.h"
#include "core/tensor.h"
#include "core/tensor_helpers.h"
#include "utils.h"

#include <opencv2/imgproc.hpp>

#include "core/error.h"
namespace {
namespace error = rnexecutorch::core::error;
} // namespace

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
    throw error::InvalidArgument(std::format("unsupported interpolation '{}'. Expected"
                                             " 'nearest', 'area', 'linear', 'cubic', or 'lanczos'",
                                             interp));
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
            throw error::InvalidArgument("resize: Usage: resize(src, dst, options)");
        }

        auto src = tensor::fromJs(rt, "resize: src", args[0], std::nullopt, {"H", "W", "C"});
        auto dst = tensor::fromJs(rt, "resize: dst", args[1], src->dtype_, {"H'", "W'", src->shape_[2]});

        tensor::checkNotSameTensor(rt, "resize: src", src, "resize: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "resize: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "resize: dst", dst);

        const auto opts = conversions::asType<jsi::Object>(rt, "resize: options", args[2]);
        const auto mode = conversions::getRequiredProperty<std::string>(rt, "resize: options", opts, "mode");
        const auto interp = conversions::getRequiredProperty<std::string>(rt, "resize: options", opts, "interpolation");
        const auto padValue = conversions::getRequiredProperty<double>(rt, "resize: options", opts, "padValue");

        if (mode != "stretch" && mode != "letterbox" && mode != "crop") {
            throw error::InvalidArgument(std::format("resize: unknown mode '{}'. Use 'stretch', 'letterbox', or 'crop'", mode));
        }

        const int32_t srcH = src->shape_[0];
        const int32_t srcW = src->shape_[1];
        const int32_t channels = src->shape_[2];
        const int32_t dstH = dst->shape_[0];
        const int32_t dstW = dst->shape_[1];

        const int cvType = CV_MAKETYPE(dtypeToCvDepth(src->dtype_), channels);
        const int interpFlag = interpToFlag(interp);

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
            }
        } catch (const std::exception &e) {
            throw error::Unknown("resize: " + std::string(e.what()));
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, error::guarded(fnBody)));
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
    throw error::InvalidArgument(std::format("cvtColor: unsupported color conversion code '{}'."
                                             " Common values are 'RGB2BGR', 'BGR2RGB', 'RGBA2RGB', 'RGB2GRAY', etc.",
                                             code));
}
} // namespace

void install_cvtColor(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "cvtColor";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw error::InvalidArgument("cvtColor: Usage: cvtColor(src, dst, code)");
        }

        auto src = tensor::fromJs(rt, "cvtColor: src", args[0], std::nullopt, {"H", "W", "C"});
        auto dst = tensor::fromJs(rt, "cvtColor: dst", args[1], src->dtype_, {src->shape_[0], src->shape_[1], "C'"});

        tensor::checkNotSameTensor(rt, "cvtColor: src", src, "cvtColor: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "cvtColor: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "cvtColor: dst", dst);

        const int32_t srcH = src->shape_[0];
        const int32_t srcW = src->shape_[1];
        const int32_t srcC = src->shape_[2];
        const int32_t dstC = dst->shape_[2];

        auto code = conversions::asType<std::string>(rt, "cvtColor: code", args[2]);

        const int cvSrcType = CV_MAKETYPE(dtypeToCvDepth(src->dtype_), srcC);
        const int cvDstType = CV_MAKETYPE(dtypeToCvDepth(dst->dtype_), dstC);
        const int flag = codeToColorConversionFlag(code);

        try {
            const ::cv::Mat srcMat(srcH, srcW, cvSrcType, src->data_.get());
            ::cv::Mat dstMat(srcH, srcW, cvDstType, dst->data_.get());

            ::cv::cvtColor(srcMat, dstMat, flag);
        } catch (const std::exception &e) {
            throw error::Unknown("cvtColor: " + std::string(e.what()));
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, error::guarded(fnBody)));
}

void install_toChannelsFirst(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "toChannelsFirst";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) {
            throw error::InvalidArgument("toChannelsFirst: Usage: toChannelsFirst(src, dst)");
        }

        auto src = tensor::fromJs(rt, "toChannelsFirst: src", args[0], std::nullopt, {"H", "W", "C"});
        auto dst = tensor::fromJs(rt, "toChannelsFirst: dst", args[1], src->dtype_, {src->shape_[2], src->shape_[0], src->shape_[1]});

        tensor::checkNotSameTensor(rt, "toChannelsFirst: src", src, "toChannelsFirst: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "toChannelsFirst: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "toChannelsFirst: dst", dst);

        const int32_t srcH = src->shape_[0];
        const int32_t srcW = src->shape_[1];
        const int32_t srcC = src->shape_[2];

        const int cvType = CV_MAKETYPE(dtypeToCvDepth(src->dtype_), srcC);

        try {
            const ::cv::Mat srcMat(srcH, srcW, cvType, src->data_.get());
            std::vector<::cv::Mat> channels;
            ::cv::split(srcMat, channels);

            const size_t hw = static_cast<size_t>(srcH) * static_cast<size_t>(srcW);
            const size_t elemSize = rnexecutorch::core::types::elementSize(src->dtype_);
            const size_t planeBytes = hw * elemSize;
            const std::span<uint8_t> dstBytes(dst->data_.get(), dst->size_);

            for (size_t i = 0; std::cmp_less(i, srcC); ++i) {
                const std::span<const uint8_t> plane(channels[i].data, planeBytes);
                std::ranges::copy(plane, dstBytes.subspan(i * planeBytes, planeBytes).begin());
            }
        } catch (const std::exception &e) {
            throw error::Unknown("toChannelsFirst: " + std::string(e.what()));
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 2, error::guarded(fnBody)));
}

void install_toChannelsLast(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "toChannelsLast";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) {
            throw error::InvalidArgument("toChannelsLast: Usage: toChannelsLast(src, dst)");
        }

        auto src = tensor::fromJs(rt, "toChannelsLast: src", args[0], std::nullopt, {"C", "H", "W"});
        auto dst = tensor::fromJs(rt, "toChannelsLast: dst", args[1], src->dtype_, {src->shape_[1], src->shape_[2], src->shape_[0]});

        tensor::checkNotSameTensor(rt, "toChannelsLast: src", src, "toChannelsLast: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "toChannelsLast: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "toChannelsLast: dst", dst);

        const int32_t srcC = src->shape_[0];
        const int32_t srcH = src->shape_[1];
        const int32_t srcW = src->shape_[2];

        const int cvDepth = dtypeToCvDepth(src->dtype_);

        try {
            const size_t hw = static_cast<size_t>(srcH) * static_cast<size_t>(srcW);
            const size_t elemSize = rnexecutorch::core::types::elementSize(src->dtype_);
            const size_t planeBytes = hw * elemSize;
            const std::span<uint8_t> srcBytes(src->data_.get(), src->size_);

            std::vector<::cv::Mat> channels;
            for (size_t i = 0; std::cmp_less(i, srcC); ++i) {
                channels.emplace_back(srcH, srcW, cvDepth, srcBytes.subspan(i * planeBytes, planeBytes).data());
            }

            ::cv::Mat dstMat(srcH, srcW, CV_MAKETYPE(cvDepth, srcC), dst->data_.get());
            ::cv::merge(channels, dstMat);
        } catch (const std::exception &e) {
            throw error::Unknown("toChannelsLast: " + std::string(e.what()));
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 2, error::guarded(fnBody)));
}

void install_normalize(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "normalize";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw error::InvalidArgument("normalize: Usage: normalize(src, dst, options)");
        }

        auto src = tensor::fromJs(rt, "normalize: src", args[0], std::nullopt, {"C", "H", "W"});
        auto dst = tensor::fromJs(rt, "normalize: dst", args[1], std::nullopt, src->shape_);

        tensor::checkNotSameTensor(rt, "normalize: src", src, "normalize: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "normalize: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "normalize: dst", dst);

        auto opts = conversions::asType<jsi::Object>(rt, "normalize: options", args[2]);

        const int32_t c = src->shape_[0];
        const int32_t h = src->shape_[1];
        const int32_t w = src->shape_[2];

        auto getNormalizeOption = [&](const char *optName) -> std::vector<double> {
            auto val = conversions::getRequiredProperty<jsi::Value>(rt, "normalize: options", opts, optName);
            std::vector<double> result(static_cast<size_t>(c));
            if (val.isNumber()) {
                std::ranges::fill(result, conversions::asType<double>(rt, std::format("normalize: options.{}", optName), val));
            } else {
                auto arr = conversions::asVector<double>(rt, std::format("normalize: options.{}", optName), val);
                if (arr.size() != static_cast<size_t>(c)) {
                    throw error::InvalidArgument(std::format("normalize: options.{} array length must be exactly equal to channels", optName));
                }
                result = std::move(arr);
            }
            return result;
        };

        std::vector<double> alpha = getNormalizeOption("alpha");
        std::vector<double> beta = getNormalizeOption("beta");

        const int srcDepthType = dtypeToCvDepth(src->dtype_);
        const int dstDepthType = dtypeToCvDepth(dst->dtype_);

        try {
            const size_t srcElemSize = rnexecutorch::core::types::elementSize(src->dtype_);
            const size_t dstElemSize = rnexecutorch::core::types::elementSize(dst->dtype_);
            const std::span<uint8_t> srcBytes(src->data_.get(), src->size_);
            const std::span<uint8_t> dstBytes(dst->data_.get(), dst->size_);

            const size_t plane = static_cast<size_t>(h) * static_cast<size_t>(w);
            const size_t srcPlaneBytes = plane * srcElemSize;
            const size_t dstPlaneBytes = plane * dstElemSize;

            for (size_t ch = 0; std::cmp_less(ch, c); ++ch) {
                const ::cv::Mat srcChannel(h, w, srcDepthType,
                                           srcBytes.subspan(ch * srcPlaneBytes, srcPlaneBytes).data());
                ::cv::Mat dstChannel(h, w, dstDepthType,
                                     dstBytes.subspan(ch * dstPlaneBytes, dstPlaneBytes).data());

                srcChannel.convertTo(dstChannel, dstDepthType, alpha[ch], beta[ch]);
            }
        } catch (const std::exception &e) {
            throw error::Unknown("normalize: " + std::string(e.what()));
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, error::guarded(fnBody)));
}

void install_applyColormap(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "applyColormap";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw error::InvalidArgument("applyColormap: Usage: applyColormap(src, dst, colormap)");
        }

        auto colormapArray = conversions::asType<jsi::Array>(rt, "applyColormap: colormap", args[2]);
        auto src = tensor::fromJs(rt, "applyColormap: src", args[0], DType::int32, {"H", "W", 1});
        auto dst = tensor::fromJs(rt, "applyColormap: dst", args[1], DType::uint8, {src->shape_[0], src->shape_[1], 4});

        tensor::checkNotSameTensor(rt, "applyColormap: src", src, "applyColormap: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "applyColormap: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "applyColormap: dst", dst);

        constexpr size_t numRgbaChannels = 4;

        const size_t numColors = colormapArray.size(rt);
        std::vector<std::array<uint8_t, numRgbaChannels>> lut(numColors);
        for (size_t i = 0; i < numColors; ++i) {
            auto colorVec = conversions::asVector<uint8_t>(rt, "applyColormap: colormap entry", colormapArray.getValueAtIndex(rt, i));
            if (colorVec.size() != numRgbaChannels) {
                throw error::InvalidArgument(std::format("applyColormap: colormap entry must be an RGBA color array of size 4 (got size {})",
                                                         colorVec.size()));
            }
            for (size_t c = 0; c < numRgbaChannels; ++c) {
                lut[i][c] = colorVec[c];
            }
        }

        const std::span<const int32_t> srcData(reinterpret_cast<const int32_t *>(src->data_.get()), src->numel_);
        const std::span<uint8_t> dstData(dst->data_.get(), dst->numel_);

        for (size_t i = 0; i < srcData.size(); ++i) {
            const int32_t idx = srcData[i];
            if (idx < 0 || std::cmp_greater_equal(idx, numColors)) {
                throw error::InvalidArgument("applyColormap: tensor contains class index (" +
                                             std::to_string(idx) + ") that exceeds provided colormap size (" +
                                             std::to_string(numColors) + ")");
            }
            std::ranges::copy(lut[static_cast<size_t>(idx)],
                              dstData.subspan(i * numRgbaChannels, numRgbaChannels).begin());
        }

        return jsi::Value(rt, args[1]);
    };
    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, error::guarded(fnBody)));
}

// Perspective-crop an oriented quad of `src` into the `dst` canvas.
void install_rectifyQuad(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "rectifyQuad";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 4) {
            throw error::InvalidArgument("Usage: rectifyQuad(src, dst, quad, options)");
        }

        using DType = rnexecutorch::core::types::DType;

        auto src = tensor::fromJs(rt, "rectifyQuad: src", args[0], DType::uint8, {"H", "W", "C"});
        auto dst = tensor::fromJs(rt, "rectifyQuad: dst", args[1], DType::uint8, {"H'", "W'", src->shape_[2]});
        tensor::checkNotSameTensor(rt, "rectifyQuad: src", src, "rectifyQuad: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "rectifyQuad: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "rectifyQuad: dst", dst);

        const auto quadArr = conversions::asType<jsi::Array>(rt, "rectifyQuad: quad", args[2]);
        const auto opts = conversions::asType<jsi::Object>(rt, "rectifyQuad: options", args[3]);
        if (quadArr.length(rt) != 8) {
            throw error::InvalidArgument("rectifyQuad: quad must have exactly 8 numbers (4 points)");
        }

        const int32_t channels = src->shape_[2];
        const int32_t recH = dst->shape_[0];
        const int32_t canvasW = dst->shape_[1];

        const int32_t contentWidth =
            std::clamp(conversions::getRequiredProperty<int32_t>(rt, "rectifyQuad: options", opts, "contentWidth"), 1, canvasW);
        const auto padValue = conversions::getRequiredProperty<double>(rt, "rectifyQuad: options", opts, "padValue");
        const auto align = conversions::getRequiredProperty<std::string>(rt, "rectifyQuad: options", opts, "align");

        std::array<::cv::Point2f, 4> quad;
        for (std::size_t i = 0; i < 4; ++i) {
            quad[i] = {conversions::asType<float>(rt, "rectifyQuad: quad", quadArr.getValueAtIndex(rt, i * 2)),
                       conversions::asType<float>(rt, "rectifyQuad: quad", quadArr.getValueAtIndex(rt, i * 2 + 1))};
        }

        const int cvType = CV_MAKETYPE(CV_8U, channels);
        ::cv::Mat srcMat(src->shape_[0], src->shape_[1], cvType, src->data_.get());
        ::cv::Mat dstMat(recH, canvasW, cvType, dst->data_.get());

        try {
            const std::array<::cv::Point2f, 4> dstPts = {
                ::cv::Point2f{0.0f, 0.0f},
                {static_cast<float>(contentWidth), 0.0f},
                {static_cast<float>(contentWidth), static_cast<float>(recH)},
                {0.0f, static_cast<float>(recH)}};
            const std::array<::cv::Point2f, 4> srcPts = {quad[0], quad[1], quad[2], quad[3]};

            ::cv::Mat m = ::cv::getPerspectiveTransform(srcPts.data(), dstPts.data());
            ::cv::Mat content;
            ::cv::warpPerspective(srcMat, content, m, ::cv::Size(contentWidth, recH), ::cv::INTER_CUBIC, ::cv::BORDER_REPLICATE);

            // Fill the whole canvas first, then blit the content into its slot:
            // whatever the content does not cover stays flat padding.
            dstMat.setTo(::cv::Scalar::all(padValue));

            const int32_t offsetX = (align == "center") ? (canvasW - contentWidth) / 2 : 0;
            const int32_t copyW = std::min(contentWidth, canvasW - offsetX);
            content(::cv::Rect(0, 0, copyW, recH)).copyTo(dstMat(::cv::Rect(offsetX, 0, copyW, recH)));
        } catch (const std::exception &e) {
            throw error::ExecutionFailed(std::format("rectifyQuad: OpenCV error: {}", e.what()));
        }
        return jsi::Value(rt, args[1]);
    };
    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 4, error::guarded(fnBody)));
}

// --- Windowed copies ---------------------------------------------------------

namespace {
struct Window {
    int32_t x, y;
};

// Reads the `{x, y}` origin of a `w` x `h` window and checks that it lies inside
// a `frameW` x `frameH` frame.
Window windowInside(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &optsVal,
                    int32_t w, int32_t h, int32_t frameW, int32_t frameH) {
    const auto opts = conversions::asType<jsi::Object>(rt, ctx + ": options", optsVal);
    const auto x = conversions::getRequiredProperty<int32_t>(rt, ctx + ": options", opts, "x");
    const auto y = conversions::getRequiredProperty<int32_t>(rt, ctx + ": options", opts, "y");
    if (x < 0 || y < 0 || x + w > frameW || y + h > frameH) {
        throw error::InvalidArgument(std::format("{}: a {}x{} window at ({}, {}) does not fit in a {}x{} image",
                                                 ctx, w, h, x, y, frameW, frameH));
    }
    return {.x = x, .y = y};
}
} // namespace

// Copy the window of `src` that `dst` is sized for, starting at options.{x, y}.
void install_crop(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "crop";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw error::InvalidArgument("crop: Usage: crop(src, dst, options)");
        }

        auto src = tensor::fromJs(rt, "crop: src", args[0], std::nullopt, {"H", "W", "C"});
        auto dst = tensor::fromJs(rt, "crop: dst", args[1], src->dtype_, {"H'", "W'", src->shape_[2]});

        tensor::checkNotSameTensor(rt, "crop: src", src, "crop: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "crop: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "crop: dst", dst);

        const int32_t dstH = dst->shape_[0];
        const int32_t dstW = dst->shape_[1];
        const Window win = windowInside(rt, "crop", args[2], dstW, dstH, src->shape_[1], src->shape_[0]);

        const int cvType = CV_MAKETYPE(dtypeToCvDepth(src->dtype_), src->shape_[2]);
        try {
            const ::cv::Mat srcMat(src->shape_[0], src->shape_[1], cvType, src->data_.get());
            ::cv::Mat dstMat(dstH, dstW, cvType, dst->data_.get());
            srcMat(::cv::Rect(win.x, win.y, dstW, dstH)).copyTo(dstMat);
        } catch (const std::exception &e) {
            throw error::Unknown("crop: " + std::string(e.what()));
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, error::guarded(fnBody)));
}

// Paste the whole of `src` into the window of `dst` starting at options.{x, y};
// the rest of `dst` is left untouched.
void install_paste(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "paste";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw error::InvalidArgument("paste: Usage: paste(src, dst, options)");
        }

        auto src = tensor::fromJs(rt, "paste: src", args[0], std::nullopt, {"H", "W", "C"});
        auto dst = tensor::fromJs(rt, "paste: dst", args[1], src->dtype_, {"H'", "W'", src->shape_[2]});

        tensor::checkNotSameTensor(rt, "paste: src", src, "paste: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "paste: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "paste: dst", dst);

        const int32_t srcH = src->shape_[0];
        const int32_t srcW = src->shape_[1];
        const Window win = windowInside(rt, "paste", args[2], srcW, srcH, dst->shape_[1], dst->shape_[0]);

        const int cvType = CV_MAKETYPE(dtypeToCvDepth(src->dtype_), src->shape_[2]);
        try {
            const ::cv::Mat srcMat(srcH, srcW, cvType, src->data_.get());
            ::cv::Mat dstMat(dst->shape_[0], dst->shape_[1], cvType, dst->data_.get());
            srcMat.copyTo(dstMat(::cv::Rect(win.x, win.y, srcW, srcH)));
        } catch (const std::exception &e) {
            throw error::Unknown("paste: " + std::string(e.what()));
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, error::guarded(fnBody)));
}

// Composite `overlay` over `src` where `mask` is non-zero, with the masked
// region eroded by `shrink` px and its edge feathered by a `feather`-wide
// Gaussian, so the seam blends instead of cutting: dst = src*(1-w) + overlay*w.
void install_blendMasked(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "blendMasked";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 5) {
            throw error::InvalidArgument("blendMasked: Usage: blendMasked(src, overlay, mask, dst, options)");
        }

        auto src = tensor::fromJs(rt, "blendMasked: src", args[0], DType::uint8, {"H", "W", "C"});
        auto overlay = tensor::fromJs(rt, "blendMasked: overlay", args[1], DType::uint8, src->shape_);
        auto mask = tensor::fromJs(rt, "blendMasked: mask", args[2], DType::uint8, {src->shape_[0], src->shape_[1], 1});
        auto dst = tensor::fromJs(rt, "blendMasked: dst", args[3], DType::uint8, src->shape_);

        tensor::checkNotSameTensor(rt, "blendMasked: src", src, "blendMasked: dst", dst);
        tensor::checkNotSameTensor(rt, "blendMasked: overlay", overlay, "blendMasked: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "blendMasked: src", src);
        auto overlayLock = tensor::tryLockShared(rt, "blendMasked: overlay", overlay);
        auto maskLock = tensor::tryLockShared(rt, "blendMasked: mask", mask);
        auto dstLock = tensor::tryLockUnique(rt, "blendMasked: dst", dst);

        const auto opts = conversions::asType<jsi::Object>(rt, "blendMasked: options", args[4]);
        const auto shrink = conversions::getRequiredProperty<int32_t>(rt, "blendMasked: options", opts, "shrink");
        const auto feather = conversions::getRequiredProperty<int32_t>(rt, "blendMasked: options", opts, "feather");
        if (shrink < 0) {
            throw error::InvalidArgument(std::format("blendMasked: shrink must be >= 0 (got {})", shrink));
        }
        if (feather < 0 || (feather > 0 && feather % 2 == 0)) {
            throw error::InvalidArgument(std::format("blendMasked: feather must be 0 or an odd kernel size (got {})", feather));
        }

        const int32_t h = src->shape_[0];
        const int32_t w = src->shape_[1];
        const int cvType = CV_MAKETYPE(CV_8U, src->shape_[2]);

        try {
            const ::cv::Mat srcMat(h, w, cvType, src->data_.get());
            const ::cv::Mat overlayMat(h, w, cvType, overlay->data_.get());
            const ::cv::Mat maskMat(h, w, CV_8UC1, mask->data_.get());
            ::cv::Mat dstMat(h, w, cvType, dst->data_.get());

            // Weight of the overlay: 1 inside the (eroded, feathered) mask, 0 outside.
            ::cv::Mat region;
            ::cv::threshold(maskMat, region, 0, 255, ::cv::THRESH_BINARY);
            if (shrink > 0) {
                const int k = 2 * shrink + 1;
                ::cv::erode(region, region, ::cv::getStructuringElement(::cv::MORPH_RECT, ::cv::Size(k, k)));
            }
            ::cv::Mat weight;
            region.convertTo(weight, CV_32F, 1.0 / 255.0);
            if (feather > 0) {
                ::cv::GaussianBlur(weight, weight, ::cv::Size(feather, feather), 0);
            }

            ::cv::Mat ones = ::cv::Mat::ones(h, w, CV_32F);
            ::cv::blendLinear(srcMat, overlayMat, ones - weight, weight, dstMat);
        } catch (const std::exception &e) {
            throw error::Unknown("blendMasked: " + std::string(e.what()));
        }

        return jsi::Value(rt, args[3]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 5, error::guarded(fnBody)));
}

} // namespace rnexecutorch::extensions::cv::image_ops
