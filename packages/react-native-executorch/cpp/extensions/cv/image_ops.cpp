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
using rnexecutorch::core::error::RnExecuTorchException;
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
            throw error::InvalidArgument("Usage: resize(src, dst, options)");
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
            throw error::Unknown("resize: " + std::string(e.what()));
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
                throw error::InvalidArgument("resize: unknown mode '" + mode + "'. Use 'stretch', 'letterbox', or 'crop'");
            }
        } catch (const RnExecuTorchException &) {
            throw;
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
            throw error::InvalidArgument("Usage: cvtColor(src, dst, code)");
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
            throw error::InvalidArgument("Usage: toChannelsFirst(src, dst)");
        }

        auto src = tensor::fromJs(rt, "toChannelsFirst: src", args[0], std::nullopt, {"H", "W", "C"});
        auto dst = tensor::fromJs(rt, "toChannelsFirst: dst", args[1], src->dtype_, {src->shape_[2], src->shape_[0], src->shape_[1]});

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
            throw error::InvalidArgument("Usage: toChannelsLast(src, dst)");
        }

        auto src = tensor::fromJs(rt, "toChannelsLast: src", args[0], std::nullopt, {"C", "H", "W"});
        auto dst = tensor::fromJs(rt, "toChannelsLast: dst", args[1], src->dtype_, {src->shape_[1], src->shape_[2], src->shape_[0]});

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
            throw error::InvalidArgument("Usage: normalize(src, dst, options)");
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

        try {
            const int srcDepthType = dtypeToCvDepth(src->dtype_);
            const int dstDepthType = dtypeToCvDepth(dst->dtype_);

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
            throw error::InvalidArgument("Usage: applyColormap(src, dst, colormap)");
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

void install_rotate(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "rotate";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw error::InvalidArgument("Usage: rotate(src, dst, degCW)");
        }

        auto src = tensor::fromJs(rt, "rotate: src", args[0], std::nullopt, {"H", "W", "C"});
        auto dst = tensor::fromJs(rt, "rotate: dst", args[1], src->dtype_, {"H'", "W'", src->shape_[2]});
        tensor::checkNotSameTensor(rt, "rotate: src", src, "rotate: dst", dst);

        const auto degCW = conversions::asType<int32_t>(rt, "rotate: degCW", args[2]);
        int rotateCode = 0;
        if (degCW == 90) {
            rotateCode = ::cv::ROTATE_90_CLOCKWISE;
        } else if (degCW == 180) {
            rotateCode = ::cv::ROTATE_180;
        } else if (degCW == 270) {
            rotateCode = ::cv::ROTATE_90_COUNTERCLOCKWISE;
        } else {
            throw error::InvalidArgument("rotate: degCW must be 90, 180, or 270");
        }

        const int32_t srcH = src->shape_[0];
        const int32_t srcW = src->shape_[1];
        const int32_t channels = src->shape_[2];
        // 90/270 transpose the axes; 180 preserves them. dst must be pre-sized to match,
        // else cv::rotate reallocates off the tensor buffer and the result is lost.
        const bool swap = degCW != 180;
        const int32_t expH = swap ? srcW : srcH;
        const int32_t expW = swap ? srcH : srcW;
        if (dst->shape_[0] != expH || dst->shape_[1] != expW) {
            throw error::InvalidArgument(
                std::format("rotate: dst must be sized [{}, {}, C] for a {} degree rotation", expH,
                            expW, degCW));
        }

        auto srcLock = tensor::tryLockShared(rt, "rotate: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "rotate: dst", dst);

        int cvType{};
        try {
            cvType = CV_MAKETYPE(dtypeToCvDepth(src->dtype_), channels);
        } catch (const std::exception &e) {
            throw error::ExecutionFailed(std::format("rotate: {}", e.what()));
        }

        const ::cv::Mat srcMat(srcH, srcW, cvType, src->data_.get());
        ::cv::Mat dstMat(expH, expW, cvType, dst->data_.get());
        ::cv::rotate(srcMat, dstMat, rotateCode);

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, error::guarded(fnBody)));
}

// Warp `src` through a grid_sample-style backward field into `dst` via cv::remap.
// grid is [..,2,gH,gW] in [-1,1] with align_corners=true (channel 0 = x, 1 = y).
void install_warpByGrid(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "warpByGrid";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw error::InvalidArgument("Usage: warpByGrid(src, grid, dst)");
        }

        using DType = rnexecutorch::core::types::DType;
        auto src = tensor::fromJs(rt, "warpByGrid: src", args[0], DType::uint8, {"H", "W", "C"});
        auto grid = tensor::fromJs(rt, "warpByGrid: grid", args[1], DType::float32, std::nullopt);
        auto dst = tensor::fromJs(rt, "warpByGrid: dst", args[2], DType::uint8,
                                  {src->shape_[0], src->shape_[1], src->shape_[2]});
        tensor::checkNotSameTensor(rt, "warpByGrid: src", src, "warpByGrid: dst", dst);
        tensor::checkNotSameTensor(rt, "warpByGrid: grid", grid, "warpByGrid: dst", dst);

        // Grid rank varies, so fromJs can't constrain it; check the [..,2,gH,gW] tail here.
        const auto &gs = grid->shape_;
        if (gs.size() < 3 || gs[gs.size() - 3] != 2) {
            throw error::InvalidArgument("warpByGrid: grid must be [..,2,gH,gW]");
        }

        auto srcLock = tensor::tryLockShared(rt, "warpByGrid: src", src);
        auto gridLock = tensor::tryLockShared(rt, "warpByGrid: grid", grid);
        auto dstLock = tensor::tryLockUnique(rt, "warpByGrid: dst", dst);

        const int32_t h = src->shape_[0];
        const int32_t w = src->shape_[1];
        const int32_t channels = src->shape_[2];
        const int32_t gridH = gs[gs.size() - 2];
        const int32_t gridW = gs[gs.size() - 1];
        const int32_t plane = gridH * gridW;
        // Require exactly 2*gH*gW elements — [2,gH,gW], or an equivalent with
        // batch dims of 1 (e.g. [1,2,gH,gW]). The sampler reads channels 0 and 1
        // of a single plane, so a real batch > 1 would silently use batch 0 and a
        // smaller buffer would read out of bounds.
        size_t numel = 1;
        for (const auto d : gs) {
            numel *= static_cast<size_t>(d);
        }
        if (numel != static_cast<size_t>(2) * static_cast<size_t>(plane)) {
            throw error::InvalidArgument("warpByGrid: grid must have exactly 2*gH*gW elements ([2,gH,gW], batch > 1 not supported)");
        }
        const auto *g = reinterpret_cast<const float *>(grid->data_.get());

        // Bilinearly sample channel `c` of the low-res grid at fractional (gx, gy).
        auto sampleGrid = [g, gridW, gridH, plane](int32_t c, float gx, float gy) -> float {
            const int32_t x0 = std::clamp(static_cast<int32_t>(std::floor(gx)), 0, gridW - 1);
            const int32_t y0 = std::clamp(static_cast<int32_t>(std::floor(gy)), 0, gridH - 1);
            const int32_t x1 = std::min(x0 + 1, gridW - 1);
            const int32_t y1 = std::min(y0 + 1, gridH - 1);
            const float dx = gx - static_cast<float>(x0);
            const float dy = gy - static_cast<float>(y0);
            const int32_t base = c * plane;
            const float top = g[base + y0 * gridW + x0] +
                              (g[base + y0 * gridW + x1] - g[base + y0 * gridW + x0]) * dx;
            const float bot = g[base + y1 * gridW + x0] +
                              (g[base + y1 * gridW + x1] - g[base + y1 * gridW + x0]) * dx;
            return top + (bot - top) * dy;
        };

        ::cv::Mat mapX(h, w, CV_32F);
        ::cv::Mat mapY(h, w, CV_32F);
        for (int32_t oy = 0; oy < h; ++oy) {
            const float gy = h > 1 ? (static_cast<float>(oy) / static_cast<float>(h - 1)) *
                                         static_cast<float>(gridH - 1)
                                   : 0.0f;
            auto *rowX = mapX.ptr<float>(oy);
            auto *rowY = mapY.ptr<float>(oy);
            for (int32_t ox = 0; ox < w; ++ox) {
                const float gx = w > 1 ? (static_cast<float>(ox) / static_cast<float>(w - 1)) *
                                             static_cast<float>(gridW - 1)
                                       : 0.0f;
                const float nx = sampleGrid(0, gx, gy); // [-1,1]
                const float ny = sampleGrid(1, gx, gy);
                rowX[ox] = ((nx + 1.0f) / 2.0f) * static_cast<float>(w - 1);
                rowY[ox] = ((ny + 1.0f) / 2.0f) * static_cast<float>(h - 1);
            }
        }

        const int cvType = CV_MAKETYPE(CV_8U, channels);
        ::cv::Mat srcMat(h, w, cvType, src->data_.get());
        ::cv::Mat dstMat(h, w, cvType, dst->data_.get());
        try {
            ::cv::remap(srcMat, dstMat, mapX, mapY, ::cv::INTER_LINEAR, ::cv::BORDER_REPLICATE);
        } catch (const std::exception &e) {
            throw error::ExecutionFailed(std::format("warpByGrid: OpenCV error: {}", e.what()));
        }
        return jsi::Value(rt, args[2]);
    };
    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, error::guarded(fnBody)));
}

// Copy an axis-aligned [x0,y0,x1,y1] region of `src` into the pre-sized `dst` — a
// shape-changing crop via a native cv::Mat ROI copy (unlike restrictToBox, which
// masks in place at the same size). `dst` must be sized [y1-y0, x1-x0, C].
void install_crop(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "crop";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args,
                     size_t count) -> jsi::Value {
        if (count != 3) {
            throw error::InvalidArgument("Usage: crop(src, dst, [x0, y0, x1, y1])");
        }
        auto src = tensor::fromJs(rt, "crop: src", args[0], std::nullopt, {"H", "W", "C"});
        auto dst = tensor::fromJs(rt, "crop: dst", args[1], src->dtype_, {"H'", "W'", src->shape_[2]});
        tensor::checkNotSameTensor(rt, "crop: src", src, "crop: dst", dst);

        const auto boxArr = conversions::asType<jsi::Array>(rt, "crop: box", args[2]);
        if (boxArr.length(rt) != 4) {
            throw error::InvalidArgument("crop: box must be [x0, y0, x1, y1]");
        }
        const int32_t srcH = src->shape_[0];
        const int32_t srcW = src->shape_[1];
        const int32_t channels = src->shape_[2];
        const int32_t x0 = std::clamp(conversions::asType<int32_t>(rt, "crop: box", boxArr.getValueAtIndex(rt, 0)), 0, srcW);
        const int32_t y0 = std::clamp(conversions::asType<int32_t>(rt, "crop: box", boxArr.getValueAtIndex(rt, 1)), 0, srcH);
        const int32_t x1 = std::clamp(conversions::asType<int32_t>(rt, "crop: box", boxArr.getValueAtIndex(rt, 2)), 0, srcW);
        const int32_t y1 = std::clamp(conversions::asType<int32_t>(rt, "crop: box", boxArr.getValueAtIndex(rt, 3)), 0, srcH);
        const int32_t cropW = x1 - x0;
        const int32_t cropH = y1 - y0;
        if (cropW <= 0 || cropH <= 0) {
            throw error::InvalidArgument("crop: box does not intersect the image");
        }
        if (dst->shape_[0] != cropH || dst->shape_[1] != cropW) {
            throw error::InvalidArgument(
                std::format("crop: dst must be sized [{}, {}, C] for the clamped box", cropH, cropW));
        }

        auto srcLock = tensor::tryLockShared(rt, "crop: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "crop: dst", dst);

        int cvType{};
        try {
            cvType = CV_MAKETYPE(dtypeToCvDepth(src->dtype_), channels);
        } catch (const std::exception &e) {
            throw error::ExecutionFailed(std::format("crop: {}", e.what()));
        }

        const ::cv::Mat srcMat(srcH, srcW, cvType, src->data_.get());
        ::cv::Mat dstMat(cropH, cropW, cvType, dst->data_.get());
        srcMat(::cv::Rect(x0, y0, cropW, cropH)).copyTo(dstMat);

        return jsi::Value(rt, args[1]);
    };
    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, error::guarded(fnBody)));
}

// Perspective-crop an oriented quad of `src` into the `dst` canvas (crop +
// resize-to-height + pad/align) — normalizes a detected text box for the recognizer.
void install_rectifyQuad(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "rectifyQuad";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args,
                     size_t count) -> jsi::Value {
        if (count != 4) {
            throw error::InvalidArgument("Usage: rectifyQuad(src, dst, quad, options)");
        }
        using DType = rnexecutorch::core::types::DType;
        auto src = tensor::fromJs(rt, "rectifyQuad: src", args[0], DType::uint8, {"H", "W", "C"});
        auto dst = tensor::fromJs(rt, "rectifyQuad: dst", args[1], DType::uint8,
                                  {"H'", "W'", src->shape_[2]});
        tensor::checkNotSameTensor(rt, "rectifyQuad: src", src, "rectifyQuad: dst", dst);
        const auto quadArr = conversions::asType<jsi::Array>(rt, "rectifyQuad: quad", args[2]);
        const auto opts = conversions::asType<jsi::Object>(rt, "rectifyQuad: options", args[3]);
        if (quadArr.length(rt) != 8) {
            throw error::InvalidArgument("rectifyQuad: quad must have exactly 8 numbers (4 points)");
        }

        const int32_t channels = src->shape_[2];
        const int32_t recH = dst->shape_[0];
        const int32_t canvasW = dst->shape_[1];

        const int32_t contentWidth = std::clamp(
            conversions::getRequiredProperty<int32_t>(rt, "rectifyQuad: options", opts, "contentWidth"),
            1, canvasW);
        const auto padMode = conversions::getRequiredProperty<std::string>(rt, "rectifyQuad: options", opts, "padMode");
        const auto padValue = conversions::getRequiredProperty<double>(rt, "rectifyQuad: options", opts, "padValue");
        const auto align = conversions::getRequiredProperty<std::string>(rt, "rectifyQuad: options", opts, "align");

        std::array<::cv::Point2f, 4> quad;
        for (std::size_t i = 0; i < 4; ++i) {
            quad[i] = {conversions::asType<float>(rt, "rectifyQuad: quad", quadArr.getValueAtIndex(rt, i * 2)),
                       conversions::asType<float>(rt, "rectifyQuad: quad", quadArr.getValueAtIndex(rt, i * 2 + 1))};
        }

        auto srcLock = tensor::tryLockShared(rt, "rectifyQuad: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "rectifyQuad: dst", dst);

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
            ::cv::warpPerspective(srcMat, content, m, ::cv::Size(contentWidth, recH),
                                  ::cv::INTER_CUBIC, ::cv::BORDER_REPLICATE);

            ::cv::Scalar padColor;
            if (padMode == "cornerMean") {
                const int patch = std::max(1, std::min(recH, contentWidth) / 30);
                ::cv::Scalar acc(0, 0, 0, 0);
                const std::array<::cv::Rect, 4> rects = {
                    ::cv::Rect(0, 0, patch, patch),
                    ::cv::Rect(contentWidth - patch, 0, patch, patch),
                    ::cv::Rect(0, recH - patch, patch, patch),
                    ::cv::Rect(contentWidth - patch, recH - patch, patch, patch)};
                for (const auto &r : rects) {
                    acc += ::cv::mean(content(r));
                }
                padColor = acc / 4.0;
            } else {
                padColor = ::cv::Scalar::all(padValue);
            }

            dstMat.setTo(padColor);
            const int32_t offsetX = (align == "center") ? (canvasW - contentWidth) / 2 : 0;
            const int32_t copyW = std::min(contentWidth, canvasW - offsetX);
            content(::cv::Rect(0, 0, copyW, recH)).copyTo(dstMat(::cv::Rect(offsetX, 0, copyW, recH)));
        } catch (const std::exception &e) {
            throw error::ExecutionFailed(std::format("rectifyQuad: OpenCV error: {}", e.what()));
        }
        return jsi::Value(rt, args[1]);
    };
    module.setProperty(rt, name,
                       jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name),
                                                             4, error::guarded(fnBody)));
}

} // namespace rnexecutorch::extensions::cv::image_ops
