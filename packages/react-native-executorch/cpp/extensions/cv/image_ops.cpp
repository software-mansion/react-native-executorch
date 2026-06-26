#include "image_ops.h"

#include <algorithm>
#include <cmath>
#include <numeric>
#include <stdexcept>
#include <utility>

#include <opencv2/imgproc.hpp>

#include "core/dtype.h"
#include "core/tensor.h"
#include "utils.h"

namespace rnexecutorch::extensions::cv::image_ops {
namespace jsi = facebook::jsi;
using TensorHostObject = rnexecutorch::core::tensor::TensorHostObject;

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
    double scaleW = static_cast<double>(dstW) / srcW;
    double scaleH = static_cast<double>(dstH) / srcH;
    double scale = inner ? std::min(scaleW, scaleH) : std::max(scaleW, scaleH);

    int32_t w = static_cast<int32_t>(std::round(srcW * scale));
    int32_t h = static_cast<int32_t>(std::round(srcH * scale));
    int32_t sign = inner ? 1 : -1; // letterbox centers padding, crop centers the crop
    return {w, h, sign * (dstW - w) / 2, sign * (dstH - h) / 2};
}
} // namespace

void install_resize(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "resize";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw jsi::JSError(rt, "Usage: resize(src, dst, options)");
        }

        if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "resize: src must be a Tensor");
        }

        if (!args[1].isObject() || !args[1].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "resize: dst must be a Tensor");
        }

        if (!args[2].isObject()) {
            throw jsi::JSError(rt, "resize: options must be an object");
        }

        auto src = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto dst = args[1].asObject(rt).getHostObject<TensorHostObject>(rt);

        if (src.get() == dst.get()) {
            throw jsi::JSError(rt, "resize: In-place operations (src == dst) are not supported.");
        }
        auto opts = args[2].asObject(rt);

        if (!opts.hasProperty(rt, "mode") || !opts.getProperty(rt, "mode").isString()) {
            throw jsi::JSError(rt, "resize: options.mode is required and must be a string");
        }

        if (!opts.hasProperty(rt, "interpolation") || !opts.getProperty(rt, "interpolation").isString()) {
            throw jsi::JSError(rt, "resize: options.interpolation is required and must be a string");
        }

        if (!opts.hasProperty(rt, "padValue") || !opts.getProperty(rt, "padValue").isNumber()) {
            throw jsi::JSError(rt, "resize: options.padValue is required and must be a number");
        }

        auto mode = opts.getProperty(rt, "mode").asString(rt).utf8(rt);
        auto interp = opts.getProperty(rt, "interpolation").asString(rt).utf8(rt);
        double padValue = opts.getProperty(rt, "padValue").asNumber();

        if (src->shape_.size() != 3) {
            throw jsi::JSError(rt, "resize: src must be [H, W, C]");
        }

        if (dst->shape_.size() != 3) {
            throw jsi::JSError(rt, "resize: dst must be [H, W, C]");
        }

        if (src->shape_[2] != dst->shape_[2]) {
            throw jsi::JSError(rt, "resize: src and dst must have the same number of channels");
        }

        if (src->dtype_ != dst->dtype_) {
            throw jsi::JSError(rt, "resize: src and dst must have the same dtype");
        }

        // shared on src (read-only), unique on dst (write)

        std::shared_lock<std::shared_mutex> srcLock(src->mutex_, std::try_to_lock);
        if (!srcLock.owns_lock()) {
            throw jsi::JSError(rt, "resize: src tensor is currently in use");
        }

        std::unique_lock<std::shared_mutex> dstLock(dst->mutex_, std::try_to_lock);
        if (!dstLock.owns_lock()) {
            throw jsi::JSError(rt, "resize: dst tensor is currently in use");
        }

        if (!src->data_) {
            throw jsi::JSError(rt, "resize: src tensor has been disposed");
        }

        if (!dst->data_) {
            throw jsi::JSError(rt, "resize: dst tensor has been disposed");
        }

        int32_t srcH = src->shape_[0];
        int32_t srcW = src->shape_[1];
        int32_t channels = src->shape_[2];
        int32_t dstH = dst->shape_[0];
        int32_t dstW = dst->shape_[1];

        int cvType{}, interpFlag{};
        try {
            cvType = CV_MAKETYPE(dtypeToCvDepth(src->dtype_), channels);
            interpFlag = interpToFlag(interp);
        } catch (const std::invalid_argument &e) {
            throw jsi::JSError(rt, "resize: " + std::string(e.what()));
        }

        ::cv::Mat srcMat(srcH, srcW, cvType, src->data_.get());
        ::cv::Mat dstMat(dstH, dstW, cvType, dst->data_.get());

        if (mode == "stretch") {
            ::cv::resize(srcMat, dstMat, dstMat.size(), 0, 0, interpFlag);
        } else if (mode == "letterbox") {
            FitBox fit = computeFit(srcW, srcH, dstW, dstH, /*inner=*/true);

            dstMat.setTo(::cv::Scalar::all(padValue));
            ::cv::Mat roi = dstMat(::cv::Rect(fit.offX, fit.offY, fit.w, fit.h));
            ::cv::resize(srcMat, roi, roi.size(), 0, 0, interpFlag);
        } else if (mode == "crop") {
            FitBox fit = computeFit(srcW, srcH, dstW, dstH, /*inner=*/false);

            ::cv::Mat scaled;
            ::cv::resize(srcMat, scaled, ::cv::Size(fit.w, fit.h), 0, 0, interpFlag);
            scaled(::cv::Rect(fit.offX, fit.offY, dstW, dstH)).copyTo(dstMat);
        } else {
            throw jsi::JSError(rt, "resize: unknown mode '" + mode + "'. Use 'stretch', 'letterbox', or 'crop'");
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
    auto name = "cvtColor";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw jsi::JSError(rt, "Usage: cvtColor(src, dst, code)");
        }

        if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "cvtColor: src must be a Tensor");
        }

        if (!args[1].isObject() || !args[1].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "cvtColor: dst must be a Tensor");
        }

        if (!args[2].isString()) {
            throw jsi::JSError(rt, "cvtColor: code must be a string");
        }

        auto src = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto dst = args[1].asObject(rt).getHostObject<TensorHostObject>(rt);

        if (src.get() == dst.get()) {
            throw jsi::JSError(rt, "cvtColor: In-place operations (src == dst) are not supported.");
        }
        auto code = args[2].asString(rt).utf8(rt);

        if (src->shape_.size() != 3) {
            throw jsi::JSError(rt, "cvtColor: src must be a 3D tensor [H, W, C]");
        }

        if (dst->shape_.size() != 3) {
            throw jsi::JSError(rt, "cvtColor: dst must be a 3D tensor [H, W, C]");
        }

        if (src->shape_[0] != dst->shape_[0] || src->shape_[1] != dst->shape_[1]) {
            throw jsi::JSError(rt, "cvtColor: src and dst spatial dimensions (H, W) must match");
        }

        if (src->dtype_ != dst->dtype_) {
            throw jsi::JSError(rt, "cvtColor: src and dst must have the same dtype");
        }

        std::shared_lock<std::shared_mutex> srcLock(src->mutex_, std::try_to_lock);
        if (!srcLock.owns_lock()) {
            throw jsi::JSError(rt, "cvtColor: src tensor is currently in use");
        }

        std::unique_lock<std::shared_mutex> dstLock(dst->mutex_, std::try_to_lock);
        if (!dstLock.owns_lock()) {
            throw jsi::JSError(rt, "cvtColor: dst tensor is currently in use");
        }

        if (!src->data_) {
            throw jsi::JSError(rt, "cvtColor: src tensor has been disposed");
        }

        if (!dst->data_) {
            throw jsi::JSError(rt, "cvtColor: dst tensor has been disposed");
        }

        int32_t srcH = src->shape_[0];
        int32_t srcW = src->shape_[1];
        int32_t srcC = src->shape_[2];
        int32_t dstC = dst->shape_[2];

        int cvSrcType{}, cvDstType{}, flag{};
        try {
            cvSrcType = CV_MAKETYPE(dtypeToCvDepth(src->dtype_), srcC);
            cvDstType = CV_MAKETYPE(dtypeToCvDepth(dst->dtype_), dstC);
            flag = codeToColorConversionFlag(code);

            ::cv::Mat srcMat(srcH, srcW, cvSrcType, src->data_.get());
            ::cv::Mat dstMat(srcH, srcW, cvDstType, dst->data_.get());

            ::cv::cvtColor(srcMat, dstMat, flag);
        } catch (const std::invalid_argument &e) {
            throw jsi::JSError(rt, "cvtColor: " + std::string(e.what()));
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, fnBody));
}

void install_toChannelsFirst(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "toChannelsFirst";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) {
            throw jsi::JSError(rt, "Usage: toChannelsFirst(src, dst)");
        }

        if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "toChannelsFirst: src must be a Tensor");
        }

        if (!args[1].isObject() || !args[1].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "toChannelsFirst: dst must be a Tensor");
        }

        auto src = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto dst = args[1].asObject(rt).getHostObject<TensorHostObject>(rt);

        if (src.get() == dst.get()) {
            throw jsi::JSError(rt, "toChannelsFirst: In-place operations (src == dst) are not supported.");
        }

        if (src->shape_.size() != 3) {
            throw jsi::JSError(rt, "toChannelsFirst: src must be a 3D tensor [H, W, C]");
        }

        if (src->dtype_ != dst->dtype_) {
            throw jsi::JSError(rt, "toChannelsFirst: src and dst must have the same dtype");
        }

        int32_t srcH = src->shape_[0];
        int32_t srcW = src->shape_[1];
        int32_t srcC = src->shape_[2];

        if (dst->shape_.size() != 3) {
            throw jsi::JSError(rt, "toChannelsFirst: dst must be a 3D tensor [C, H, W]");
        }
        int32_t dstC = dst->shape_[0];
        int32_t dstH = dst->shape_[1];
        int32_t dstW = dst->shape_[2];

        if (srcH != dstH || srcW != dstW || srcC != dstC) {
            throw jsi::JSError(rt, "toChannelsFirst: src and dst spatial dimensions and channel counts must match");
        }

        std::shared_lock<std::shared_mutex> srcLock(src->mutex_, std::try_to_lock);
        if (!srcLock.owns_lock()) {
            throw jsi::JSError(rt, "toChannelsFirst: src tensor is currently in use");
        }

        std::unique_lock<std::shared_mutex> dstLock(dst->mutex_, std::try_to_lock);
        if (!dstLock.owns_lock()) {
            throw jsi::JSError(rt, "toChannelsFirst: dst tensor is currently in use");
        }

        if (!src->data_) {
            throw jsi::JSError(rt, "toChannelsFirst: src tensor has been disposed");
        }

        if (!dst->data_) {
            throw jsi::JSError(rt, "toChannelsFirst: dst tensor has been disposed");
        }

        int cvType{};
        try {
            cvType = CV_MAKETYPE(dtypeToCvDepth(src->dtype_), srcC);
        } catch (const std::invalid_argument &e) {
            throw jsi::JSError(rt, "toChannelsFirst: " + std::string(e.what()));
        }

        ::cv::Mat srcMat(srcH, srcW, cvType, src->data_.get());
        std::vector<::cv::Mat> channels;
        ::cv::split(srcMat, channels);

        size_t hw = static_cast<size_t>(srcH) * static_cast<size_t>(srcW);
        size_t elemSize = rnexecutorch::core::types::elementSize(src->dtype_);
        uint8_t *dstPtr = dst->data_.get();

        for (size_t i = 0; std::cmp_less(i, srcC); ++i) {
            std::memcpy(dstPtr + i * hw * elemSize, channels[i].data, hw * elemSize);
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 2, fnBody));
}

void install_toChannelsLast(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "toChannelsLast";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) {
            throw jsi::JSError(rt, "Usage: toChannelsLast(src, dst)");
        }

        if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "toChannelsLast: src must be a Tensor");
        }

        if (!args[1].isObject() || !args[1].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "toChannelsLast: dst must be a Tensor");
        }

        auto src = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto dst = args[1].asObject(rt).getHostObject<TensorHostObject>(rt);

        if (src.get() == dst.get()) {
            throw jsi::JSError(rt, "toChannelsLast: In-place operations (src == dst) are not supported.");
        }

        if (src->shape_.size() != 3) {
            throw jsi::JSError(rt, "toChannelsLast: src must be a 3D tensor [C, H, W]");
        }

        if (src->dtype_ != dst->dtype_) {
            throw jsi::JSError(rt, "toChannelsLast: src and dst must have the same dtype");
        }

        int32_t srcC = src->shape_[0];
        int32_t srcH = src->shape_[1];
        int32_t srcW = src->shape_[2];

        if (dst->shape_.size() != 3) {
            throw jsi::JSError(rt, "toChannelsLast: dst must be a 3D tensor [H, W, C]");
        }
        int32_t dstH = dst->shape_[0];
        int32_t dstW = dst->shape_[1];
        int32_t dstC = dst->shape_[2];

        if (srcH != dstH || srcW != dstW || srcC != dstC) {
            throw jsi::JSError(rt, "toChannelsLast: src and dst spatial dimensions and channel counts must match");
        }

        std::shared_lock<std::shared_mutex> srcLock(src->mutex_, std::try_to_lock);
        if (!srcLock.owns_lock()) {
            throw jsi::JSError(rt, "toChannelsLast: src tensor is currently in use");
        }

        std::unique_lock<std::shared_mutex> dstLock(dst->mutex_, std::try_to_lock);
        if (!dstLock.owns_lock()) {
            throw jsi::JSError(rt, "toChannelsLast: dst tensor is currently in use");
        }

        if (!src->data_) {
            throw jsi::JSError(rt, "toChannelsLast: src tensor has been disposed");
        }

        if (!dst->data_) {
            throw jsi::JSError(rt, "toChannelsLast: dst tensor has been disposed");
        }

        int cvDepth{};
        try {
            cvDepth = dtypeToCvDepth(src->dtype_);
        } catch (const std::invalid_argument &e) {
            throw jsi::JSError(rt, "toChannelsLast: " + std::string(e.what()));
        }

        size_t hw = static_cast<size_t>(srcH) * static_cast<size_t>(srcW);
        size_t elemSize = rnexecutorch::core::types::elementSize(src->dtype_);
        uint8_t *srcPtr = src->data_.get();

        std::vector<::cv::Mat> channels;
        for (size_t i = 0; std::cmp_less(i, srcC); ++i) {
            channels.push_back(::cv::Mat(srcH, srcW, cvDepth, srcPtr + i * hw * elemSize));
        }

        ::cv::Mat dstMat(dstH, dstW, CV_MAKETYPE(cvDepth, dstC), dst->data_.get());
        ::cv::merge(channels, dstMat);

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 2, fnBody));
}

void install_normalize(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "normalize";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw jsi::JSError(rt, "Usage: normalize(src, dst, options)");
        }

        if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "normalize: src must be a Tensor");
        }

        if (!args[1].isObject() || !args[1].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "normalize: dst must be a Tensor");
        }

        if (!args[2].isObject()) {
            throw jsi::JSError(rt, "normalize: options must be an object");
        }

        auto src = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto dst = args[1].asObject(rt).getHostObject<TensorHostObject>(rt);

        if (src.get() == dst.get()) {
            throw jsi::JSError(rt, "normalize: In-place operations (src == dst) are not supported.");
        }
        auto opts = args[2].asObject(rt);

        if (src->shape_.size() != 3) {
            throw jsi::JSError(rt, "normalize: src must be a 3D tensor [C, H, W]");
        }

        int32_t c = src->shape_[0];
        int32_t h = src->shape_[1];
        int32_t w = src->shape_[2];

        if (dst->shape_.size() != 3 ||
            dst->shape_[0] != c ||
            dst->shape_[1] != h ||
            dst->shape_[2] != w) {
            throw jsi::JSError(rt, "normalize: src and dst shapes must match exactly ([C, H, W])");
        }

        auto getNormalizeOption = [&](const char *name) -> std::vector<double> {
            if (!opts.hasProperty(rt, name)) {
                throw jsi::JSError(rt, "normalize: options." + std::string(name) + " is required");
            }

            auto val = opts.getProperty(rt, name);
            std::vector<double> result(static_cast<size_t>(c));

            if (val.isNumber()) {
                std::ranges::fill(result, val.asNumber());
            } else if (val.isObject() && val.asObject(rt).isArray(rt)) {
                auto arr = val.asObject(rt).asArray(rt);
                if (arr.length(rt) != static_cast<size_t>(c)) {
                    throw jsi::JSError(rt, "normalize: options." + std::string(name) +
                                               " array length must be exactly equal to channels");
                }
                for (size_t i = 0; std::cmp_less(i, c); ++i) {
                    auto item = arr.getValueAtIndex(rt, i);
                    if (!item.isNumber()) {
                        throw jsi::JSError(rt, "normalize: options." + std::string(name) +
                                                   " array must contain only numbers");
                    }
                    result[i] = item.asNumber();
                }
            } else {
                throw jsi::JSError(rt, "normalize: options." + std::string(name) +
                                           " must be a number or an array of numbers");
            }

            return result;
        };

        std::vector<double> alpha = getNormalizeOption("alpha");
        std::vector<double> beta = getNormalizeOption("beta");

        std::shared_lock<std::shared_mutex> srcLock(src->mutex_, std::try_to_lock);
        if (!srcLock.owns_lock()) {
            throw jsi::JSError(rt, "normalize: src tensor is currently in use");
        }

        std::unique_lock<std::shared_mutex> dstLock(dst->mutex_, std::try_to_lock);
        if (!dstLock.owns_lock()) {
            throw jsi::JSError(rt, "normalize: dst tensor is currently in use");
        }

        if (!src->data_) {
            throw jsi::JSError(rt, "normalize: src tensor has been disposed");
        }

        if (!dst->data_) {
            throw jsi::JSError(rt, "normalize: dst tensor has been disposed");
        }

        int srcDepthType{};
        int dstDepthType{};
        try {
            srcDepthType = dtypeToCvDepth(src->dtype_);
            dstDepthType = dtypeToCvDepth(dst->dtype_);
        } catch (const std::invalid_argument &e) {
            throw jsi::JSError(rt, "normalize: " + std::string(e.what()));
        }

        size_t srcElemSize = rnexecutorch::core::types::elementSize(src->dtype_);
        size_t dstElemSize = rnexecutorch::core::types::elementSize(dst->dtype_);
        uint8_t *srcPtr = src->data_.get();
        uint8_t *dstPtr = dst->data_.get();

        const size_t plane = static_cast<size_t>(h) * static_cast<size_t>(w);
        for (size_t ch = 0; std::cmp_less(ch, c); ++ch) {
            ::cv::Mat srcChannel(h, w, srcDepthType, srcPtr + ch * plane * srcElemSize);
            ::cv::Mat dstChannel(h, w, dstDepthType, dstPtr + ch * plane * dstElemSize);

            srcChannel.convertTo(dstChannel, dstDepthType, alpha[ch], beta[ch]);
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, fnBody));
}

void install_applyColormap(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "applyColormap";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw jsi::JSError(rt, "Usage: applyColormap(src, dst, colormap)");
        }

        if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "applyColormap: src must be a Tensor");
        }
        if (!args[1].isObject() || !args[1].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "applyColormap: dst must be a Tensor");
        }

        auto src = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto dst = args[1].asObject(rt).getHostObject<TensorHostObject>(rt);
        constexpr size_t numRgbaChannels = 4;

        if (src->dtype_ != rnexecutorch::core::types::DType::int32) {
            throw jsi::JSError(rt, "applyColormap: src must be int32");
        }
        if (dst->dtype_ != rnexecutorch::core::types::DType::uint8) {
            throw jsi::JSError(rt, "applyColormap: dst must be uint8");
        }
        if (dst->numel_ != src->numel_ * numRgbaChannels) {
            throw jsi::JSError(rt, "applyColormap: dst must have exactly 4 times the number of elements as src (RGBA channels)");
        }

        if (!args[2].isObject() || !args[2].asObject(rt).isArray(rt)) {
            throw jsi::JSError(rt, "applyColormap: colormap must be an array");
        }

        auto colormapArray = args[2].asObject(rt).asArray(rt);
        size_t numColors = colormapArray.size(rt);
        std::vector<std::array<uint8_t, numRgbaChannels>> lut(numColors);
        for (size_t i = 0; i < numColors; ++i) {
            auto colorVal = colormapArray.getValueAtIndex(rt, i);
            if (!colorVal.isObject() || !colorVal.asObject(rt).isArray(rt)) {
                throw jsi::JSError(rt, "applyColormap: colormap entry must be an array");
            }
            auto color = colorVal.asObject(rt).asArray(rt);
            if (color.size(rt) != numRgbaChannels) {
                throw jsi::JSError(rt, "applyColormap: colormap entry must be an RGBA color array of size 4");
            }
            for (size_t c = 0; c < numRgbaChannels; ++c) {
                auto channelVal = color.getValueAtIndex(rt, c);
                if (!channelVal.isNumber()) {
                    throw jsi::JSError(rt, "applyColormap: colormap channel value must be a number");
                }
                double val = channelVal.asNumber();
                if (std::isnan(val) || val < 0.0 || val > 255.0) {
                    throw jsi::JSError(rt, "applyColormap: colormap channel value must be between 0 and 255");
                }
                lut[i][c] = static_cast<uint8_t>(val);
            }
        }

        std::shared_lock<std::shared_mutex> srcLock(src->mutex_, std::try_to_lock);
        std::unique_lock<std::shared_mutex> dstLock(dst->mutex_, std::try_to_lock);
        if (!srcLock.owns_lock() || !dstLock.owns_lock()) {
            throw jsi::JSError(rt, "applyColormap: tensors in use");
        }

        if (!src->data_ || !dst->data_) {
            throw jsi::JSError(rt, "applyColormap: tensor has been disposed");
        }

        size_t pixels = src->numel_;

        const int32_t *srcData = reinterpret_cast<const int32_t *>(src->data_.get());
        uint8_t *dstData = dst->data_.get();

        for (size_t i = 0; i < pixels; ++i) {
            int32_t idx = srcData[i];
            if (idx < 0 || static_cast<size_t>(idx) >= numColors) {
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
