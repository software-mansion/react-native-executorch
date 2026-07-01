#include "text_boxes_ops.h"

#include <algorithm>
#include <array>
#include <cmath>
#include <numeric>
#include <stdexcept>
#include <utility>

#include <opencv2/imgproc.hpp>

#include "core/dtype.h"
#include "core/tensor.h"
#include "utils.h"
namespace rnexecutorch::extensions::cv::text_boxes_ops {

namespace jsi = facebook::jsi;
using TensorHostObject = rnexecutorch::core::tensor::TensorHostObject;

void install_gridSample(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "gridSample";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw jsi::JSError(rt, "Usage: gridSample(src, grid, dst)");
        }
        if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt) ||
            !args[1].isObject() || !args[1].asObject(rt).isHostObject<TensorHostObject>(rt) ||
            !args[2].isObject() || !args[2].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "gridSample: src, grid, and dst must be Tensors");
        }

        auto src = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto grid = args[1].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto dst = args[2].asObject(rt).getHostObject<TensorHostObject>(rt);

        if (src.get() == dst.get()) {
            throw jsi::JSError(rt, "gridSample: In-place operations (src == dst) are not supported.");
        }
        if (src->dtype_ != rnexecutorch::core::types::DType::uint8 ||
            dst->dtype_ != rnexecutorch::core::types::DType::uint8) {
            throw jsi::JSError(rt, "gridSample: src and dst must be uint8");
        }
        if (grid->dtype_ != rnexecutorch::core::types::DType::float32) {
            throw jsi::JSError(rt, "gridSample: grid must be float32");
        }
        if (src->shape_.size() != 3 || dst->shape_.size() != 3) {
            throw jsi::JSError(rt, "gridSample: src and dst must be [H, W, C]");
        }
        if (src->shape_ != dst->shape_) {
            throw jsi::JSError(rt, "gridSample: src and dst must have the same shape");
        }
        // grid is the torch grid_sample field [..,2,gH,gW], channel 0 = x, 1 = y,
        // normalized to [-1,1] with align_corners=true.
        const auto &gs = grid->shape_;
        if (gs.size() < 3 || gs[gs.size() - 3] != 2) {
            throw jsi::JSError(rt, "gridSample: grid must be [..,2,gH,gW]");
        }

        std::shared_lock<std::shared_mutex> srcLock(src->mutex_, std::try_to_lock);
        std::shared_lock<std::shared_mutex> gridLock(grid->mutex_, std::try_to_lock);
        std::unique_lock<std::shared_mutex> dstLock(dst->mutex_, std::try_to_lock);
        if (!srcLock.owns_lock() || !gridLock.owns_lock() || !dstLock.owns_lock()) {
            throw jsi::JSError(rt, "gridSample: a tensor is currently in use");
        }
        if (!src->data_ || !grid->data_ || !dst->data_) {
            throw jsi::JSError(rt, "gridSample: a tensor has been disposed");
        }

        const int32_t h = src->shape_[0];
        const int32_t w = src->shape_[1];
        const int32_t channels = src->shape_[2];
        const int32_t gridH = gs[gs.size() - 2];
        const int32_t gridW = gs[gs.size() - 1];
        const int32_t plane = gridH * gridW;
        const auto *g = reinterpret_cast<const float *>(grid->data_.get());

        // Bilinearly sample channel `c` of the low-res grid at fractional (gx, gy).
        auto sampleGrid = [&](int32_t c, float gx, float gy) -> float {
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
        } catch (const ::cv::Exception &e) {
            throw jsi::JSError(rt, std::string("gridSample: OpenCV error: ") + e.what());
        }
        return jsi::Value(rt, args[2]);
    };
    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, fnBody));
}

// ------------------------------- warpQuad ----------------------------------
// Perspective-crop an oriented quad of `src` into the `dst` canvas (crop +
// resize-to-height + pad/align). A generic image op; used by the OCR recognizer.
void install_warpQuad(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "warpQuad";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args,
                     size_t count) -> jsi::Value {
        if (count != 4) {
            throw jsi::JSError(rt, "Usage: warpQuad(src, dst, quad, options)");
        }
        if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "warpQuad: src must be a Tensor");
        }
        if (!args[1].isObject() || !args[1].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "warpQuad: dst must be a Tensor");
        }
        if (!args[2].isObject() || !args[2].asObject(rt).isArray(rt)) {
            throw jsi::JSError(rt, "warpQuad: quad must be an array of 8 numbers");
        }
        if (!args[3].isObject()) {
            throw jsi::JSError(rt, "warpQuad: options must be an object");
        }
        auto src = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto dst = args[1].asObject(rt).getHostObject<TensorHostObject>(rt);
        if (src.get() == dst.get()) {
            throw jsi::JSError(rt, "warpQuad: In-place operations (src == dst) are not supported.");
        }
        auto quadArr = args[2].asObject(rt).asArray(rt);
        auto opts = args[3].asObject(rt);

        if (quadArr.length(rt) != 8) {
            throw jsi::JSError(rt, "warpQuad: quad must have exactly 8 numbers (4 points)");
        }
        if (src->shape_.size() != 3 || dst->shape_.size() != 3) {
            throw jsi::JSError(rt, "warpQuad: src and dst must be [H,W,C]");
        }
        if (src->dtype_ != rnexecutorch::core::types::DType::uint8 ||
            dst->dtype_ != rnexecutorch::core::types::DType::uint8) {
            throw jsi::JSError(rt, "warpQuad: src and dst must be uint8");
        }
        if (src->shape_[2] != dst->shape_[2]) {
            throw jsi::JSError(rt, "warpQuad: src and dst must have the same channel count");
        }

        const int32_t channels = src->shape_[2];
        const int32_t recH = dst->shape_[0];
        const int32_t bucketW = dst->shape_[1];

        if (!opts.hasProperty(rt, "contentWidth") ||
            !opts.getProperty(rt, "contentWidth").isNumber()) {
            throw jsi::JSError(rt, "warpQuad: options.contentWidth is required");
        }
        const int32_t contentWidth =
            std::clamp(static_cast<int32_t>(opts.getProperty(rt, "contentWidth").asNumber()), 1,
                       bucketW);
        const std::string padMode = opts.getProperty(rt, "padMode").asString(rt).utf8(rt);
        const double padValue = opts.getProperty(rt, "padValue").asNumber();
        const std::string align = opts.getProperty(rt, "align").asString(rt).utf8(rt);
        // offsetX >= 0 places content at that x (overriding align); clear=false skips
        // wiping dst first, so successive warps compose into one canvas (glyph strips).
        const auto offsetXOpt = static_cast<int32_t>(opts.getProperty(rt, "offsetX").asNumber());
        const bool clear = opts.getProperty(rt, "clear").asBool();

        std::array<::cv::Point2f, 4> quad;
        for (std::size_t i = 0; i < 8; ++i) {
            if (!quadArr.getValueAtIndex(rt, i).isNumber()) {
                throw jsi::JSError(rt, "warpQuad: quad must contain only numbers");
            }
        }
        for (std::size_t i = 0; i < 4; ++i) {
            quad[i] = {static_cast<float>(quadArr.getValueAtIndex(rt, i * 2).asNumber()),
                       static_cast<float>(quadArr.getValueAtIndex(rt, i * 2 + 1).asNumber())};
        }

        std::shared_lock<std::shared_mutex> srcLock(src->mutex_, std::try_to_lock);
        if (!srcLock.owns_lock()) {
            throw jsi::JSError(rt, "warpQuad: src tensor is currently in use");
        }
        std::unique_lock<std::shared_mutex> dstLock(dst->mutex_, std::try_to_lock);
        if (!dstLock.owns_lock()) {
            throw jsi::JSError(rt, "warpQuad: dst tensor is currently in use");
        }
        if (!src->data_ || !dst->data_) {
            throw jsi::JSError(rt, "warpQuad: a tensor has been disposed");
        }

        const int cvType = CV_MAKETYPE(CV_8U, channels);
        ::cv::Mat srcMat(src->shape_[0], src->shape_[1], cvType, src->data_.get());
        ::cv::Mat dstMat(recH, bucketW, cvType, dst->data_.get());

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

            if (clear) {
                dstMat.setTo(padColor);
            }
            int32_t offsetX = offsetXOpt;
            if (offsetX < 0) {
                offsetX = (align == "center") ? (bucketW - contentWidth) / 2 : 0;
            }
            if (offsetX < bucketW) {
                const int32_t copyW = std::min(contentWidth, bucketW - offsetX);
                content(::cv::Rect(0, 0, copyW, recH))
                    .copyTo(dstMat(::cv::Rect(offsetX, 0, copyW, recH)));
            }
        } catch (const ::cv::Exception &e) {
            throw jsi::JSError(rt, std::string("warpQuad: OpenCV error: ") + e.what());
        }
        return jsi::Value(rt, args[1]);
    };
    module.setProperty(rt, name,
                       jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name),
                                                             4, fnBody));
}

} // namespace rnexecutorch::extensions::cv::text_boxes_ops
