#include "image_ops.h"

#include <cmath>
#include <numeric>
#include <stdexcept>

#include <opencv2/imgproc.hpp>

#include "core/dtype.h"
#include "core/tensor.h"

namespace rnexecutorch::extensions::cv::image_ops {
namespace jsi = facebook::jsi;
using TensorHostObject = rnexecutorch::core::tensor::TensorHostObject;
static int interpToFlag(const std::string &interp) {
    if (interp == "nearest")
        return ::cv::INTER_NEAREST;
    if (interp == "area")
        return ::cv::INTER_AREA;
    if (interp == "linear")
        return ::cv::INTER_LINEAR;
    if (interp == "cubic")
        return ::cv::INTER_CUBIC;
    if (interp == "lanczos")
        return ::cv::INTER_LANCZOS4;
    throw std::invalid_argument("unsupported interpolation '" + interp + "'");
}

static int dtypeToCvDepth(rnexecutorch::core::types::DType dtype) {
    switch (dtype) {
    case rnexecutorch::core::types::DType::uint8:
        return CV_8U;
    case rnexecutorch::core::types::DType::int32:
        return CV_32S;
    case rnexecutorch::core::types::DType::float32:
        return CV_32F;
    }
    throw std::invalid_argument("unsupported dtype");
}

void install_resize(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "resize";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
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

        std::shared_lock<std::shared_mutex> src_lock(src->mutex_, std::try_to_lock);
        if (!src_lock.owns_lock()) {
            throw jsi::JSError(rt, "resize: src tensor is currently in use");
        }

        std::unique_lock<std::shared_mutex> dst_lock(dst->mutex_, std::try_to_lock);
        if (!dst_lock.owns_lock()) {
            throw jsi::JSError(rt, "resize: dst tensor is currently in use");
        }

        if (!src->data_) {
            throw jsi::JSError(rt, "resize: src tensor has been disposed");
        }

        if (!dst->data_) {
            throw jsi::JSError(rt, "resize: dst tensor has been disposed");
        }

        int src_h = src->shape_[0];
        int src_w = src->shape_[1];
        int channels = src->shape_[2];
        int dst_h = dst->shape_[0];
        int dst_w = dst->shape_[1];

        int cv_type, interp_flag;
        try {
            cv_type = CV_MAKETYPE(dtypeToCvDepth(src->dtype_), channels);
            interp_flag = interpToFlag(interp);
        } catch (const std::invalid_argument &e) {
            throw jsi::JSError(rt, "resize: " + std::string(e.what()));
        }

        ::cv::Mat src_mat(src_h, src_w, cv_type, src->data_.get());
        ::cv::Mat dst_mat(dst_h, dst_w, cv_type, dst->data_.get());

        if (mode == "stretch") {
            // Zero-alloc: cv::resize writes directly into dst->data_
            ::cv::resize(src_mat, dst_mat, dst_mat.size(), 0, 0, interp_flag);
        } else if (mode == "letterbox") {
            // Scale uniformly so src fits inside dst, pad remainder.
            // Zero-alloc: resize into an ROI submatrix view of dst_mat.
            double scale = std::min(static_cast<double>(dst_w) / src_w,
                                    static_cast<double>(dst_h) / src_h);

            int new_w = static_cast<int>(std::round(src_w * scale));
            int new_h = static_cast<int>(std::round(src_h * scale));
            int off_x = (dst_w - new_w) / 2;
            int off_y = (dst_h - new_h) / 2;

            dst_mat.setTo(::cv::Scalar::all(padValue));
            ::cv::Mat roi = dst_mat(::cv::Rect(off_x, off_y, new_w, new_h));
            ::cv::resize(src_mat, roi, roi.size(), 0, 0, interp_flag);
        } else if (mode == "crop") {
            // Scale so the *smaller* dimension fills dst, then center-crop.
            // Requires one temporary Mat because the scaled image is larger
            // than dst in at least one dimension.
            double scale = std::max(static_cast<double>(dst_w) / src_w,
                                    static_cast<double>(dst_h) / src_h);

            int new_w = static_cast<int>(std::round(src_w * scale));
            int new_h = static_cast<int>(std::round(src_h * scale));
            int off_x = (new_w - dst_w) / 2;
            int off_y = (new_h - dst_h) / 2;

            ::cv::Mat scaled;
            ::cv::resize(src_mat, scaled, ::cv::Size(new_w, new_h), 0, 0, interp_flag);
            scaled(::cv::Rect(off_x, off_y, dst_w, dst_h)).copyTo(dst_mat);
        } else {
            throw jsi::JSError(rt, "resize: unknown mode '" + mode + "'. Use 'stretch', 'letterbox', or 'crop'");
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, fnBody));
}

static int codeToColorConversionFlag(const std::string &code) {
    if (code == "RGBA2RGB")
        return ::cv::COLOR_RGBA2RGB;
    if (code == "RGBA2BGR")
        return ::cv::COLOR_RGBA2BGR;
    if (code == "BGRA2RGBA")
        return ::cv::COLOR_BGRA2RGBA;
    if (code == "BGRA2RGB")
        return ::cv::COLOR_BGRA2RGB;
    if (code == "BGRA2BGR")
        return ::cv::COLOR_BGRA2BGR;
    if (code == "RGB2BGR")
        return ::cv::COLOR_RGB2BGR;
    if (code == "BGR2RGB")
        return ::cv::COLOR_BGR2RGB;
    if (code == "RGB2RGBA")
        return ::cv::COLOR_RGB2RGBA;
    if (code == "BGR2RGBA")
        return ::cv::COLOR_BGR2RGBA;
    if (code == "RGB2GRAY")
        return ::cv::COLOR_RGB2GRAY;
    if (code == "RGBA2GRAY")
        return ::cv::COLOR_RGBA2GRAY;
    if (code == "BGR2GRAY")
        return ::cv::COLOR_BGR2GRAY;
    if (code == "BGRA2GRAY")
        return ::cv::COLOR_BGRA2GRAY;
    if (code == "GRAY2RGBA")
        return ::cv::COLOR_GRAY2RGBA;
    throw std::invalid_argument("cvtColor: unsupported color conversion code '" + code + "'");
}

void install_cvtColor(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "cvtColor";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
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

        std::shared_lock<std::shared_mutex> src_lock(src->mutex_, std::try_to_lock);
        if (!src_lock.owns_lock()) {
            throw jsi::JSError(rt, "cvtColor: src tensor is currently in use");
        }

        std::unique_lock<std::shared_mutex> dst_lock(dst->mutex_, std::try_to_lock);
        if (!dst_lock.owns_lock()) {
            throw jsi::JSError(rt, "cvtColor: dst tensor is currently in use");
        }

        if (!src->data_) {
            throw jsi::JSError(rt, "cvtColor: src tensor has been disposed");
        }

        if (!dst->data_) {
            throw jsi::JSError(rt, "cvtColor: dst tensor has been disposed");
        }

        int src_h = src->shape_[0];
        int src_w = src->shape_[1];
        int src_c = src->shape_[2];
        int dst_c = dst->shape_[2];

        int cv_src_type, cv_dst_type, flag;
        try {
            cv_src_type = CV_MAKETYPE(dtypeToCvDepth(src->dtype_), src_c);
            cv_dst_type = CV_MAKETYPE(dtypeToCvDepth(dst->dtype_), dst_c);
            flag = codeToColorConversionFlag(code);

            ::cv::Mat src_mat(src_h, src_w, cv_src_type, src->data_.get());
            ::cv::Mat dst_mat(src_h, src_w, cv_dst_type, dst->data_.get());

            ::cv::cvtColor(src_mat, dst_mat, flag);
        } catch (const std::invalid_argument &e) {
            throw jsi::JSError(rt, "cvtColor: " + std::string(e.what()));
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, fnBody));
}

void install_toChannelsFirst(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "toChannelsFirst";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
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

        int src_h = src->shape_[0];
        int src_w = src->shape_[1];
        int src_c = src->shape_[2];

        if (dst->shape_.size() != 3) {
            throw jsi::JSError(rt, "toChannelsFirst: dst must be a 3D tensor [C, H, W]");
        }
        int dst_c = dst->shape_[0];
        int dst_h = dst->shape_[1];
        int dst_w = dst->shape_[2];

        if (src_h != dst_h || src_w != dst_w || src_c != dst_c) {
            throw jsi::JSError(rt, "toChannelsFirst: src and dst spatial dimensions and channel counts must match");
        }

        std::shared_lock<std::shared_mutex> src_lock(src->mutex_, std::try_to_lock);
        if (!src_lock.owns_lock()) {
            throw jsi::JSError(rt, "toChannelsFirst: src tensor is currently in use");
        }

        std::unique_lock<std::shared_mutex> dst_lock(dst->mutex_, std::try_to_lock);
        if (!dst_lock.owns_lock()) {
            throw jsi::JSError(rt, "toChannelsFirst: dst tensor is currently in use");
        }

        if (!src->data_) {
            throw jsi::JSError(rt, "toChannelsFirst: src tensor has been disposed");
        }

        if (!dst->data_) {
            throw jsi::JSError(rt, "toChannelsFirst: dst tensor has been disposed");
        }

        int cv_type;
        try {
            cv_type = CV_MAKETYPE(dtypeToCvDepth(src->dtype_), src_c);
        } catch (const std::invalid_argument &e) {
            throw jsi::JSError(rt, "toChannelsFirst: " + std::string(e.what()));
        }

        ::cv::Mat src_mat(src_h, src_w, cv_type, src->data_.get());
        std::vector<::cv::Mat> channels;
        ::cv::split(src_mat, channels);

        int hw = src_h * src_w;
        size_t elem_size = rnexecutorch::core::types::elementSize(src->dtype_);
        uint8_t *dst_ptr = dst->data_.get();

        for (int i = 0; i < src_c; ++i) {
            std::memcpy(dst_ptr + i * hw * elem_size, channels[i].data, hw * elem_size);
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 2, fnBody));
}

void install_toChannelsLast(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "toChannelsLast";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
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

        int src_c = src->shape_[0];
        int src_h = src->shape_[1];
        int src_w = src->shape_[2];

        if (dst->shape_.size() != 3) {
            throw jsi::JSError(rt, "toChannelsLast: dst must be a 3D tensor [H, W, C]");
        }
        int dst_h = dst->shape_[0];
        int dst_w = dst->shape_[1];
        int dst_c = dst->shape_[2];

        if (src_h != dst_h || src_w != dst_w || src_c != dst_c) {
            throw jsi::JSError(rt, "toChannelsLast: src and dst spatial dimensions and channel counts must match");
        }

        std::shared_lock<std::shared_mutex> src_lock(src->mutex_, std::try_to_lock);
        if (!src_lock.owns_lock()) {
            throw jsi::JSError(rt, "toChannelsLast: src tensor is currently in use");
        }

        std::unique_lock<std::shared_mutex> dst_lock(dst->mutex_, std::try_to_lock);
        if (!dst_lock.owns_lock()) {
            throw jsi::JSError(rt, "toChannelsLast: dst tensor is currently in use");
        }

        if (!src->data_) {
            throw jsi::JSError(rt, "toChannelsLast: src tensor has been disposed");
        }

        if (!dst->data_) {
            throw jsi::JSError(rt, "toChannelsLast: dst tensor has been disposed");
        }

        int cv_depth;
        try {
            cv_depth = dtypeToCvDepth(src->dtype_);
        } catch (const std::invalid_argument &e) {
            throw jsi::JSError(rt, "toChannelsLast: " + std::string(e.what()));
        }

        int hw = src_h * src_w;
        size_t elem_size = rnexecutorch::core::types::elementSize(src->dtype_);
        uint8_t *src_ptr = src->data_.get();

        std::vector<::cv::Mat> channels;
        for (int i = 0; i < src_c; ++i) {
            channels.push_back(::cv::Mat(src_h, src_w, cv_depth, src_ptr + i * hw * elem_size));
        }

        ::cv::Mat dst_mat(dst_h, dst_w, CV_MAKETYPE(cv_depth, dst_c), dst->data_.get());
        ::cv::merge(channels, dst_mat);

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 2, fnBody));
}

void install_normalize(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "normalize";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
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

        int c = src->shape_[0];
        int h = src->shape_[1];
        int w = src->shape_[2];

        bool dstMatch = false;
        if (dst->shape_.size() == 3 &&
            dst->shape_[0] == c &&
            dst->shape_[1] == h &&
            dst->shape_[2] == w) {
            dstMatch = true;
        }

        if (!dstMatch) {
            throw jsi::JSError(rt, "normalize: src and dst shapes must match exactly ([C, H, W])");
        }

        if (!opts.hasProperty(rt, "alpha")) {
            throw jsi::JSError(rt, "normalize: options.alpha is required");
        }

        if (!opts.hasProperty(rt, "beta")) {
            throw jsi::JSError(rt, "normalize: options.beta is required");
        }

        std::vector<double> alpha(c);
        std::vector<double> beta(c);

        auto alphaVal = opts.getProperty(rt, "alpha");
        if (alphaVal.isNumber()) {
            std::fill(alpha.begin(), alpha.end(), alphaVal.asNumber());
        } else if (alphaVal.isObject() && alphaVal.asObject(rt).isArray(rt)) {
            auto arr = alphaVal.asObject(rt).asArray(rt);
            if (arr.length(rt) != static_cast<size_t>(c)) {
                throw jsi::JSError(rt, "normalize: options.alpha array length must be exactly equal to channels");
            }
            for (int i = 0; i < c; ++i) {
                auto val = arr.getValueAtIndex(rt, i);
                if (!val.isNumber()) {
                    throw jsi::JSError(rt, "normalize: options.alpha array must contain only numbers");
                }
                alpha[i] = val.asNumber();
            }
        } else {
            throw jsi::JSError(rt, "normalize: options.alpha must be a number or an array of numbers");
        }

        auto betaVal = opts.getProperty(rt, "beta");
        if (betaVal.isNumber()) {
            std::fill(beta.begin(), beta.end(), betaVal.asNumber());
        } else if (betaVal.isObject() && betaVal.asObject(rt).isArray(rt)) {
            auto arr = betaVal.asObject(rt).asArray(rt);
            if (arr.length(rt) != static_cast<size_t>(c)) {
                throw jsi::JSError(rt, "normalize: options.beta array length must be exactly equal to channels");
            }
            for (int i = 0; i < c; ++i) {
                auto val = arr.getValueAtIndex(rt, i);
                if (!val.isNumber()) {
                    throw jsi::JSError(rt, "normalize: options.beta array must contain only numbers");
                }
                beta[i] = val.asNumber();
            }
        } else {
            throw jsi::JSError(rt, "normalize: options.beta must be a number or an array of numbers");
        }

        std::shared_lock<std::shared_mutex> src_lock(src->mutex_, std::try_to_lock);
        if (!src_lock.owns_lock()) {
            throw jsi::JSError(rt, "normalize: src tensor is currently in use");
        }

        std::unique_lock<std::shared_mutex> dst_lock(dst->mutex_, std::try_to_lock);
        if (!dst_lock.owns_lock()) {
            throw jsi::JSError(rt, "normalize: dst tensor is currently in use");
        }

        if (!src->data_) {
            throw jsi::JSError(rt, "normalize: src tensor has been disposed");
        }

        if (!dst->data_) {
            throw jsi::JSError(rt, "normalize: dst tensor has been disposed");
        }

        int src_depth_type;
        int dst_depth_type;
        try {
            src_depth_type = dtypeToCvDepth(src->dtype_);
            dst_depth_type = dtypeToCvDepth(dst->dtype_);
        } catch (const std::invalid_argument &e) {
            throw jsi::JSError(rt, "normalize: " + std::string(e.what()));
        }

        size_t src_elem_size = rnexecutorch::core::types::elementSize(src->dtype_);
        size_t dst_elem_size = rnexecutorch::core::types::elementSize(dst->dtype_);
        uint8_t *src_ptr = src->data_.get();
        uint8_t *dst_ptr = dst->data_.get();

        for (int ch = 0; ch < c; ++ch) {
            ::cv::Mat src_channel(h, w, src_depth_type, src_ptr + ch * h * w * src_elem_size);
            ::cv::Mat dst_channel(h, w, dst_depth_type, dst_ptr + ch * h * w * dst_elem_size);

            src_channel.convertTo(dst_channel, dst_depth_type, alpha[ch], beta[ch]);
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, fnBody));
}
} // namespace rnexecutorch::extensions::cv::image_ops
