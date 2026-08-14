#include "ocr_ops.h"

#include <algorithm>
#include <array>
#include <cstddef>
#include <format>
#include <jsi/jsi.h>
#include <optional>
#include <vector>

#include <opencv2/imgproc.hpp>

#include "core/conversions.h"
#include "core/dtype.h"
#include "core/error.h"
#include "core/tensor.h"
#include "core/tensor_helpers.h"

namespace error = rnexecutorch::core::error;

namespace rnexecutorch::extensions::cv::ocr_ops {
namespace jsi = facebook::jsi;
namespace tensor = rnexecutorch::core::tensor;
namespace conversions = rnexecutorch::core::conversions;
using DType = rnexecutorch::core::types::DType;

namespace {
using Quad = std::array<::cv::Point2f, 4>;

// ------------------------------ DBNet branch -------------------------------
// DBNet prob map [H,W] -> oriented quads. The map must be post-sigmoid
// probabilities — any activation is baked into the model's export.
std::vector<Quad> extractDbnet(const ::cv::Mat &prob, float binThreshold, float boxThreshold,
                               float unclipRatio, int32_t minBoxSide, int32_t maxCandidates) {
    const int32_t w = prob.cols;
    const int32_t h = prob.rows;

    ::cv::Mat bitmap;
    ::cv::threshold(prob, bitmap, static_cast<double>(binThreshold), 255, ::cv::THRESH_BINARY);
    bitmap.convertTo(bitmap, CV_8UC1);

    std::vector<std::vector<::cv::Point>> contours;
    ::cv::findContours(bitmap, contours, ::cv::RETR_LIST, ::cv::CHAIN_APPROX_SIMPLE);

    std::vector<Quad> quads;
    const int32_t maxN = static_cast<int32_t>(
        std::min<std::size_t>(contours.size(), static_cast<std::size_t>(maxCandidates)));
    for (int32_t i = 0; i < maxN; ++i) {
        const auto &contour = contours[static_cast<std::size_t>(i)];
        if (contour.size() < 4) {
            continue;
        }
        ::cv::RotatedRect rr = ::cv::minAreaRect(contour);
        if (std::min(rr.size.width, rr.size.height) < static_cast<float>(minBoxSide)) {
            continue;
        }
        // Score inside the contour's bounding rect only — a full-frame mask per
        // candidate would make scoring O(candidates · H · W).
        const ::cv::Rect bounds = ::cv::boundingRect(contour);
        ::cv::Mat mask = ::cv::Mat::zeros(bounds.size(), CV_8UC1);
        ::cv::drawContours(mask, contours, i, ::cv::Scalar(255), ::cv::FILLED, ::cv::LINE_8,
                           ::cv::noArray(), 0, -bounds.tl());
        const float score = static_cast<float>(::cv::mean(prob(bounds), mask)[0]);
        if (score < boxThreshold) {
            continue;
        }
        const double area = static_cast<double>(rr.size.width) * static_cast<double>(rr.size.height);
        const double perim =
            2.0 * (static_cast<double>(rr.size.width) + static_cast<double>(rr.size.height));
        const double distance = perim > 0.0 ? area * static_cast<double>(unclipRatio) / perim : 0.0;
        const auto grow = static_cast<float>(2.0 * distance);
        ::cv::RotatedRect expanded(rr.center,
                                   ::cv::Size2f(rr.size.width + grow, rr.size.height + grow),
                                   rr.angle);
        if (std::min(expanded.size.width, expanded.size.height) <
            static_cast<float>(minBoxSide + 2)) {
            continue;
        }
        std::array<::cv::Point2f, 4> c;
        expanded.points(c.data());
        Quad q;
        auto minX = static_cast<float>(w);
        auto minY = static_cast<float>(h);
        float maxX = 0;
        float maxY = 0;
        for (std::size_t k = 0; k < c.size(); ++k) {
            // Clamp to the last valid pixel index (w-1/h-1), not w/h — a corner at
            // exactly w or h is one past the last column/row.
            const float px = std::clamp(c[k].x, 0.0f, static_cast<float>(w - 1));
            const float py = std::clamp(c[k].y, 0.0f, static_cast<float>(h - 1));
            q[k] = {px, py};
            minX = std::min(minX, px);
            minY = std::min(minY, py);
            maxX = std::max(maxX, px);
            maxY = std::max(maxY, py);
        }
        if (maxX - minX < 1.0f || maxY - minY < 1.0f) {
            continue;
        }
        quads.push_back(q);
    }
    // Output order is unspecified — the TypeScript pipeline derives reading
    // order geometrically for every result set.
    return quads;
}

// Flatten quads to a Float32Array, 8 per box (x0,y0..x3,y3).
jsi::Object quadsToArray(jsi::Runtime &rt, const std::vector<Quad> &quads) {
    std::vector<float> flat;
    flat.reserve(quads.size() * 8);
    for (const auto &q : quads) {
        for (const auto &p : q) {
            flat.push_back(p.x);
            flat.push_back(p.y);
        }
    }
    return conversions::toJsiTypedArray(rt, flat);
}

} // namespace

void install_extractDbnetTextBoxes(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "extractDbnetTextBoxes";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args,
                     size_t count) -> jsi::Value {
        if (count != 2) {
            throw error::InvalidArgument("Usage: extractDbnetTextBoxes(src, options)");
        }
        const char *ctx = "extractDbnetTextBoxes";
        auto src = tensor::fromJs(rt, "extractDbnetTextBoxes: src", args[0], DType::float32, std::nullopt);
        const auto opts = conversions::asType<jsi::Object>(rt, "extractDbnetTextBoxes: options", args[1]);
        auto srcLock = tensor::tryLockShared(rt, "extractDbnetTextBoxes: src", src);
        auto *dataPtr = reinterpret_cast<float *>(src->data_.get());

        // src is [1,1,H,W] or [H,W] probability map (full-res).
        const auto &s = src->shape_;
        if (s.size() < 2) {
            throw error::InvalidArgument("extractDbnetTextBoxes: src must be [..,H,W]");
        }
        const int32_t w = s[s.size() - 1];
        const int32_t h = s[s.size() - 2];
        if (static_cast<std::size_t>(w) * static_cast<std::size_t>(h) != src->numel_) {
            throw error::InvalidArgument("extractDbnetTextBoxes: src H*W does not match numel");
        }

        std::vector<Quad> quads;
        try {
            ::cv::Mat prob(h, w, CV_32F, dataPtr);
            quads = extractDbnet(
                prob, static_cast<float>(conversions::getRequiredProperty<double>(rt, ctx, opts, "binThreshold")),
                static_cast<float>(conversions::getRequiredProperty<double>(rt, ctx, opts, "boxThreshold")),
                static_cast<float>(conversions::getRequiredProperty<double>(rt, ctx, opts, "unclipRatio")),
                conversions::getRequiredProperty<int32_t>(rt, ctx, opts, "minBoxSide"),
                conversions::getRequiredProperty<int32_t>(rt, ctx, opts, "maxCandidates"));
        } catch (const std::exception &e) {
            throw error::ExecutionFailed(std::format("extractDbnetTextBoxes: OpenCV error: {}", e.what()));
        }
        return quadsToArray(rt, quads);
    };
    module.setProperty(rt, name,
                       jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name),
                                                             2, error::guarded(fnBody)));
}

// --------------------------- ctcGreedyDecode -------------------------------
// Per-timestep argmax + max value over a [..,T,V] tensor. The values are
// returned as-is, so they are probabilities only when the recognizer exports a
// softmaxed head — this op neither normalizes nor takes options.
void install_ctcGreedyDecode(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "ctcGreedyDecode";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args,
                     size_t count) -> jsi::Value {
        if (count != 1) {
            throw error::InvalidArgument("Usage: ctcGreedyDecode(src)");
        }
        auto src = tensor::fromJs(rt, "ctcGreedyDecode: src", args[0], DType::float32, std::nullopt);
        auto srcLock = tensor::tryLockShared(rt, "ctcGreedyDecode: src", src);

        const auto &s = src->shape_;
        if (s.size() < 2) {
            throw error::InvalidArgument("ctcGreedyDecode: src must be at least 2-D [..,T,V]");
        }
        const int32_t vocab = s.back();
        if (vocab < 1) {
            throw error::InvalidArgument("ctcGreedyDecode: vocab dimension must be >= 1");
        }
        if (src->numel_ % static_cast<std::size_t>(vocab) != 0) {
            throw error::InvalidArgument("ctcGreedyDecode: numel must be a multiple of the vocab dim");
        }
        const int32_t timesteps = static_cast<int32_t>(src->numel_) / vocab;
        const auto *data = reinterpret_cast<const float *>(src->data_.get());

        // Interleaved (index, value) pairs. float32 holds any index a CTC vocab
        // can reach exactly, so one array carries both without a second buffer.
        std::vector<float> out;
        out.reserve(static_cast<std::size_t>(timesteps) * 2);
        for (int32_t t = 0; t < timesteps; ++t) {
            const float *row = data + static_cast<std::size_t>(t) * static_cast<std::size_t>(vocab);
            const float *maxIt = std::max_element(row, row + vocab);
            out.push_back(static_cast<float>(maxIt - row));
            out.push_back(*maxIt);
        }
        return conversions::toJsiTypedArray(rt, out);
    };
    module.setProperty(rt, name,
                       jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name),
                                                             1, error::guarded(fnBody)));
}

} // namespace rnexecutorch::extensions::cv::ocr_ops
