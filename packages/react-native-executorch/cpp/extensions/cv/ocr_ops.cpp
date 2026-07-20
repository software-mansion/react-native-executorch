#include "ocr_ops.h"

#include <algorithm>
#include <array>
#include <cmath>
#include <cstddef>
#include <jsi/jsi.h>
#include <optional>
#include <vector>

#include <opencv2/imgproc.hpp>

#include "core/conversions.h"
#include "core/dtype.h"
#include "core/tensor.h"
#include "core/tensor_helpers.h"

namespace rnexecutorch::extensions::cv::ocr_ops {
namespace jsi = facebook::jsi;
namespace tensor = rnexecutorch::core::tensor;
namespace conversions = rnexecutorch::core::conversions;
using DType = rnexecutorch::core::types::DType;

namespace {
// Drop CRAFT connected components smaller than this (detector-input px²).
constexpr int32_t kMinComponentArea = 10;

// Axis-aligned box (p0 = min, p1 = max) plus the rotated-rect angle. Line grouping
// and de-skew live in TypeScript; native only produces these component boxes.
struct Box {
    float x0{}, y0{}, x1{}, y1{};
    float angle = 0.0f;
};

using Quad = std::array<::cv::Point2f, 4>;

// ------------------------------ CRAFT branch -------------------------------
// All per-component work stays inside the component's (dilation-padded) rect —
// full-frame masks per component would make the decode O(components · H · W).
std::optional<Box> boxFromComponent(const ::cv::Mat &textMap, const ::cv::Mat &labels,
                                    const ::cv::Mat &stats, int32_t i, int32_t imgW, int32_t imgH,
                                    float lowTextThreshold) {
    const int32_t area = stats.at<int32_t>(i, ::cv::CC_STAT_AREA);
    if (area < kMinComponentArea) {
        return std::nullopt;
    }
    const int32_t x = stats.at<int32_t>(i, ::cv::CC_STAT_LEFT);
    const int32_t y = stats.at<int32_t>(i, ::cv::CC_STAT_TOP);
    const int32_t w = stats.at<int32_t>(i, ::cv::CC_STAT_WIDTH);
    const int32_t h = stats.at<int32_t>(i, ::cv::CC_STAT_HEIGHT);
    const ::cv::Rect compRect(x, y, w, h);
    ::cv::Mat mask = (labels(compRect) == i);
    double maxVal = 0.0;
    ::cv::minMaxLoc(textMap(compRect), nullptr, &maxVal, nullptr, nullptr, mask);
    if (maxVal < static_cast<double>(lowTextThreshold)) {
        return std::nullopt;
    }

    const auto dilationRadius =
        static_cast<int32_t>(std::sqrt(static_cast<double>(area) / std::max(w, h)) * 2);
    const int32_t sx = std::max(x - dilationRadius, 0);
    const int32_t ex = std::min(x + w + dilationRadius, imgW);
    const int32_t sy = std::max(y - dilationRadius, 0);
    const int32_t ey = std::min(y + h + dilationRadius, imgH);
    ::cv::Mat segMap = ::cv::Mat::zeros(ey - sy, ex - sx, CV_8U);
    segMap(::cv::Rect(x - sx, y - sy, w, h)).setTo(255, mask);
    const int32_t kSize = 1 + dilationRadius;
    ::cv::Mat kernel = ::cv::getStructuringElement(::cv::MORPH_RECT, ::cv::Size(kSize, kSize));
    ::cv::dilate(segMap, segMap, kernel, ::cv::Point(-1, -1), 1);

    std::vector<std::vector<::cv::Point>> contours;
    // The offset restores full-frame coordinates for the ROI-local contours.
    ::cv::findContours(segMap, contours, ::cv::RETR_EXTERNAL, ::cv::CHAIN_APPROX_SIMPLE,
                       ::cv::Point(sx, sy));
    if (contours.empty()) {
        return std::nullopt;
    }
    ::cv::RotatedRect rr = ::cv::minAreaRect(contours[0]);
    std::array<::cv::Point2f, 4> v;
    rr.points(v.data());
    Box box;
    box.x0 = std::min({v[0].x, v[1].x, v[2].x, v[3].x});
    box.y0 = std::min({v[0].y, v[1].y, v[2].y, v[3].y});
    box.x1 = std::max({v[0].x, v[1].x, v[2].x, v[3].x});
    box.y1 = std::max({v[0].y, v[1].y, v[2].y, v[3].y});
    box.angle = rr.angle;
    return box;
}

// CRAFT text+affinity maps -> one component box each. charLevel=false ADDS
// affinity to link adjacent glyphs into line-regions (keeping the rotated-rect
// angle); charLevel=true SUBTRACTS it (+ erode/dilate) to break them into upright
// per-glyph boxes (angle 0) for the stacked-column reader.
std::vector<Box> componentBoxes(::cv::Mat &textMap, ::cv::Mat &affinityMap, float textThreshold,
                                float linkThreshold, float lowTextThreshold, bool charLevel) {
    const int32_t imgH = textMap.rows;
    const int32_t imgW = textMap.cols;
    ::cv::Mat textScore;
    ::cv::Mat affinityScore;
    ::cv::threshold(textMap, textScore, static_cast<double>(textThreshold), 1.0, ::cv::THRESH_BINARY);
    ::cv::threshold(affinityMap, affinityScore, static_cast<double>(linkThreshold), 1.0,
                    ::cv::THRESH_BINARY);

    ::cv::Mat comb;
    if (charLevel) {
        comb = textScore - affinityScore; // subtract to separate adjacent glyphs
        ::cv::threshold(comb, comb, 0.0, 1.0, ::cv::THRESH_TOZERO);
        ::cv::threshold(comb, comb, 1.0, 1.0, ::cv::THRESH_TRUNC);
        ::cv::Mat kernel = ::cv::getStructuringElement(::cv::MORPH_RECT, ::cv::Size(3, 3));
        ::cv::erode(comb, comb, kernel, ::cv::Point(-1, -1), 1);
        ::cv::dilate(comb, comb, kernel, ::cv::Point(-1, -1), 4);
    } else {
        comb = textScore + affinityScore; // add to link adjacent glyphs into lines
        ::cv::threshold(comb, comb, 0.0, 1.0, ::cv::THRESH_BINARY);
    }

    ::cv::Mat binary;
    comb.convertTo(binary, CV_8UC1);
    ::cv::Mat labels;
    ::cv::Mat stats;
    ::cv::Mat centroids;
    const int32_t nLabels = ::cv::connectedComponentsWithStats(binary, labels, stats, centroids, 4);

    std::vector<Box> boxes;
    boxes.reserve(static_cast<std::size_t>(nLabels));
    for (int32_t i = 1; i < nLabels; ++i) {
        auto box = boxFromComponent(textMap, labels, stats, i, imgW, imgH, lowTextThreshold);
        if (box) {
            if (charLevel) {
                box->angle = 0.0f; // glyphs are read upright, never rotated
            }
            boxes.push_back(*box);
        }
    }
    return boxes;
}

// CRAFT half-res heatmap (text+affinity interleaved) -> component boxes in
// detector-input pixels; restoreRatio scales the half-res boxes back up. Line
// grouping and de-skew are done in TypeScript; charLevel yields upright per-glyph
// boxes. `data` points at heatW*heatH*2 floats.
std::vector<Box> extractCraft(float *data, int32_t heatW, int32_t heatH, float textThreshold,
                              float linkThreshold, float lowTextThreshold, float restoreRatio,
                              bool charLevel) {
    // Deinterleave the [text, affinity] channels of the half-res heatmap.
    ::cv::Mat interleaved(heatH, heatW, CV_32FC2, data);
    std::array<::cv::Mat, 2> channels;
    ::cv::split(interleaved, channels);
    std::vector<Box> boxes = componentBoxes(channels[0], channels[1], textThreshold, linkThreshold,
                                            lowTextThreshold, charLevel);
    for (auto &b : boxes) {
        b.x0 *= restoreRatio;
        b.y0 *= restoreRatio;
        b.x1 *= restoreRatio;
        b.y1 *= restoreRatio;
    }
    return boxes;
}

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
        for (int32_t k = 0; k < 4; ++k) {
            // Clamp to the last valid pixel index (w-1/h-1), not w/h — a corner at
            // exactly w or h is one past the last column/row.
            const float px = std::clamp(c[static_cast<std::size_t>(k)].x, 0.0f, static_cast<float>(w - 1));
            const float py = std::clamp(c[static_cast<std::size_t>(k)].y, 0.0f, static_cast<float>(h - 1));
            q[static_cast<std::size_t>(k)] = {px, py};
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

// Flatten quads to a JS double array, 8 per box (x0,y0..x3,y3).
jsi::Array quadsToArray(jsi::Runtime &rt, const std::vector<Quad> &quads) {
    jsi::Array out(rt, quads.size() * 8);
    size_t idx = 0;
    for (const auto &q : quads) {
        for (std::size_t k = 0; k < 4; ++k) {
            out.setValueAtIndex(rt, idx++, jsi::Value(static_cast<double>(q[k].x)));
            out.setValueAtIndex(rt, idx++, jsi::Value(static_cast<double>(q[k].y)));
        }
    }
    return out;
}

// Flatten component boxes to a JS double array, 5 per box (x0,y0,x1,y1,angle).
jsi::Array boxesToArray(jsi::Runtime &rt, const std::vector<Box> &boxes) {
    jsi::Array out(rt, boxes.size() * 5);
    size_t idx = 0;
    for (const auto &b : boxes) {
        out.setValueAtIndex(rt, idx++, jsi::Value(static_cast<double>(b.x0)));
        out.setValueAtIndex(rt, idx++, jsi::Value(static_cast<double>(b.y0)));
        out.setValueAtIndex(rt, idx++, jsi::Value(static_cast<double>(b.x1)));
        out.setValueAtIndex(rt, idx++, jsi::Value(static_cast<double>(b.y1)));
        out.setValueAtIndex(rt, idx++, jsi::Value(static_cast<double>(b.angle)));
    }
    return out;
}

} // namespace

void install_extractCraftTextBoxes(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "extractCraftTextBoxes";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args,
                     size_t count) -> jsi::Value {
        if (count != 2) {
            throw jsi::JSError(rt, "Usage: extractCraftTextBoxes(src, options)");
        }
        const char *ctx = "extractCraftTextBoxes";
        auto src = tensor::fromJs(rt, "extractCraftTextBoxes: src", args[0], DType::float32, std::nullopt);
        const auto opts = conversions::asType<jsi::Object>(rt, "extractCraftTextBoxes: options", args[1]);
        auto srcLock = tensor::tryLockShared(rt, "extractCraftTextBoxes: src", src);
        auto *dataPtr = reinterpret_cast<float *>(src->data_.get());

        // src is [1,Hd,Wd,2] or [Hd,Wd,2] interleaved (text, affinity), half-res.
        const auto &s = src->shape_;
        if (s.size() < 3 || s.back() != 2) {
            throw jsi::JSError(rt, "extractCraftTextBoxes: src must be [..,Hd,Wd,2]");
        }
        const int32_t heatW = s[s.size() - 2];
        const int32_t heatH = s[s.size() - 3];
        if (static_cast<std::size_t>(heatW) * static_cast<std::size_t>(heatH) * 2 != src->numel_) {
            throw jsi::JSError(rt, "extractCraftTextBoxes: src Hd*Wd*2 does not match numel");
        }
        const auto targetH = conversions::getRequiredProperty<double>(rt, ctx, opts, "targetHeight");
        const float restoreRatio = static_cast<float>(targetH) / static_cast<float>(heatH);
        const bool charLevel = conversions::getRequiredProperty<bool>(rt, ctx, opts, "charLevel");

        std::vector<Box> boxes;
        try {
            boxes = extractCraft(
                dataPtr, heatW, heatH,
                static_cast<float>(conversions::getRequiredProperty<double>(rt, ctx, opts, "textThreshold")),
                static_cast<float>(conversions::getRequiredProperty<double>(rt, ctx, opts, "linkThreshold")),
                static_cast<float>(conversions::getRequiredProperty<double>(rt, ctx, opts, "lowTextThreshold")),
                restoreRatio, charLevel);
        } catch (const std::exception &e) {
            throw jsi::JSError(rt, std::string("extractCraftTextBoxes: OpenCV error: ") + e.what());
        }
        return boxesToArray(rt, boxes);
    };
    module.setProperty(rt, name,
                       jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name),
                                                             2, fnBody));
}

void install_extractDbnetTextBoxes(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "extractDbnetTextBoxes";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args,
                     size_t count) -> jsi::Value {
        if (count != 2) {
            throw jsi::JSError(rt, "Usage: extractDbnetTextBoxes(src, options)");
        }
        const char *ctx = "extractDbnetTextBoxes";
        auto src = tensor::fromJs(rt, "extractDbnetTextBoxes: src", args[0], DType::float32, std::nullopt);
        const auto opts = conversions::asType<jsi::Object>(rt, "extractDbnetTextBoxes: options", args[1]);
        auto srcLock = tensor::tryLockShared(rt, "extractDbnetTextBoxes: src", src);
        auto *dataPtr = reinterpret_cast<float *>(src->data_.get());

        // src is [1,1,H,W] or [H,W] probability map (full-res).
        const auto &s = src->shape_;
        if (s.size() < 2) {
            throw jsi::JSError(rt, "extractDbnetTextBoxes: src must be [..,H,W]");
        }
        const int32_t w = s[s.size() - 1];
        const int32_t h = s[s.size() - 2];
        if (static_cast<std::size_t>(w) * static_cast<std::size_t>(h) != src->numel_) {
            throw jsi::JSError(rt, "extractDbnetTextBoxes: src H*W does not match numel");
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
            throw jsi::JSError(rt, std::string("extractDbnetTextBoxes: OpenCV error: ") + e.what());
        }
        return quadsToArray(rt, quads);
    };
    module.setProperty(rt, name,
                       jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name),
                                                             2, fnBody));
}

// --------------------------- ctcGreedyDecode -------------------------------
// Per-timestep argmax + max value over [..,T,V] logits. `values` are the raw
// max activations; if a caller needs probabilities it softmaxes the tensor (via
// the math.softmax op) before decoding — this op takes no options.
void install_ctcGreedyDecode(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "ctcGreedyDecode";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args,
                     size_t count) -> jsi::Value {
        if (count != 1) {
            throw jsi::JSError(rt, "Usage: ctcGreedyDecode(src)");
        }
        auto src = tensor::fromJs(rt, "ctcGreedyDecode: src", args[0], DType::float32, std::nullopt);
        auto srcLock = tensor::tryLockShared(rt, "ctcGreedyDecode: src", src);

        const auto &s = src->shape_;
        if (s.size() < 2) {
            throw jsi::JSError(rt, "ctcGreedyDecode: src must be at least 2-D [..,T,V]");
        }
        const int32_t vocab = s.back();
        if (vocab < 1) {
            throw jsi::JSError(rt, "ctcGreedyDecode: vocab dimension must be >= 1");
        }
        if (src->numel_ % static_cast<std::size_t>(vocab) != 0) {
            throw jsi::JSError(rt, "ctcGreedyDecode: numel must be a multiple of the vocab dim");
        }
        const int32_t timesteps = static_cast<int32_t>(src->numel_) / vocab;
        const auto *data = reinterpret_cast<const float *>(src->data_.get());

        jsi::Array out(rt, static_cast<size_t>(timesteps) * 2);
        size_t oi = 0;
        for (int32_t t = 0; t < timesteps; ++t) {
            const float *row = data + static_cast<std::size_t>(t) * static_cast<std::size_t>(vocab);
            const float *maxIt = std::max_element(row, row + vocab);
            const auto maxIdx = static_cast<int32_t>(maxIt - row);
            out.setValueAtIndex(rt, oi++, jsi::Value(static_cast<double>(maxIdx)));
            out.setValueAtIndex(rt, oi++, jsi::Value(static_cast<double>(*maxIt)));
        }
        return out;
    };
    module.setProperty(rt, name,
                       jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name),
                                                             1, fnBody));
}

} // namespace rnexecutorch::extensions::cv::ocr_ops
