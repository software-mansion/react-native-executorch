#include "ocr_ops.h"

#include <algorithm>
#include <array>
#include <cmath>
#include <cstddef>
#include <jsi/jsi.h>
#include <limits>
#include <numbers>
#include <numeric>
#include <opencv2/core/check.hpp>
#include <optional>
#include <stdexcept>
#include <tuple>
#include <unordered_set>
#include <utility>
#include <vector>

#include <opencv2/imgproc.hpp>

#include "core/dtype.h"
#include "core/tensor.h"

namespace rnexecutorch::extensions::cv::ocr_ops {
namespace jsi = facebook::jsi;
using TensorHostObject = rnexecutorch::core::tensor::TensorHostObject;

namespace {
// ----------------------------- geometry types ------------------------------
struct Box {
    float x0{}, y0{}, x1{}, y1{}; // axis-aligned (p1=min, p2=max)
    float angle = 0.0f;
    [[nodiscard]] float width() const { return x1 - x0; }
    [[nodiscard]] float height() const { return y1 - y0; }
};

struct Quad {
    std::array<::cv::Point2f, 4> pts;
    float score = 1.0f;
};

float dist(const ::cv::Point2f &a, const ::cv::Point2f &b) {
    return std::hypot(b.x - a.x, b.y - a.y);
}
::cv::Point2f center(const Box &b) {
    return {(b.x0 + b.x1) * 0.5f, (b.y0 + b.y1) * 0.5f};
}
float minSide(const Box &b) { return std::min(b.width(), b.height()); }
float maxSide(const Box &b) { return std::max(b.width(), b.height()); }
bool isClose(float a, float b, float eps = 1e-3f) { return std::fabs(a - b) < eps; }

std::array<::cv::Point2f, 4> corners(const Box &b) {
    return {::cv::Point2f{b.x0, b.y0}, {b.x1, b.y0}, {b.x1, b.y1}, {b.x0, b.y1}};
}

::cv::Point2f rotateAround(const ::cv::Point2f &p, const ::cv::Point2f &ctr, float rad) {
    const float tx = p.x - ctr.x;
    const float ty = p.y - ctr.y;
    return {tx * std::cos(rad) - ty * std::sin(rad) + ctr.x,
            tx * std::sin(rad) + ty * std::cos(rad) + ctr.y};
}

// ------------------------------ CRAFT branch -------------------------------
void dilateComponent(::cv::Mat &segMap, const ::cv::Mat &stats, int32_t i, int32_t area,
                     int32_t imgW, int32_t imgH) {
    const int32_t x = stats.at<int32_t>(i, ::cv::CC_STAT_LEFT);
    const int32_t y = stats.at<int32_t>(i, ::cv::CC_STAT_TOP);
    const int32_t w = stats.at<int32_t>(i, ::cv::CC_STAT_WIDTH);
    const int32_t h = stats.at<int32_t>(i, ::cv::CC_STAT_HEIGHT);
    const auto dilationRadius =
        static_cast<int32_t>(std::sqrt(static_cast<double>(area) / std::max(w, h)) * 2);
    const int32_t sx = std::max(x - dilationRadius, 0);
    const int32_t ex = std::min(x + w + dilationRadius, imgW);
    const int32_t sy = std::max(y - dilationRadius, 0);
    const int32_t ey = std::min(y + h + dilationRadius, imgH);
    const int32_t kSize = 1 + dilationRadius;
    ::cv::Mat kernel = ::cv::getStructuringElement(::cv::MORPH_RECT, ::cv::Size(kSize, kSize));
    ::cv::Mat roi = segMap(::cv::Rect(sx, sy, ex - sx, ey - sy));
    ::cv::dilate(roi, roi, kernel, ::cv::Point(-1, -1), 1);
}

std::optional<Box> boxFromComponent(const ::cv::Mat &textMap, const ::cv::Mat &labels,
                                    const ::cv::Mat &stats, int32_t i, int32_t imgW, int32_t imgH,
                                    float lowTextThreshold) {
    const int32_t area = stats.at<int32_t>(i, ::cv::CC_STAT_AREA);
    if (area < 10) {
        return std::nullopt;
    }
    ::cv::Mat mask = (labels == i);
    double maxVal = 0.0;
    ::cv::minMaxLoc(textMap, nullptr, &maxVal, nullptr, nullptr, mask);
    if (maxVal < static_cast<double>(lowTextThreshold)) {
        return std::nullopt;
    }
    ::cv::Mat segMap = ::cv::Mat::zeros(textMap.size(), CV_8U);
    segMap.setTo(255, mask);
    dilateComponent(segMap, stats, i, area, imgW, imgH);

    std::vector<std::vector<::cv::Point>> contours;
    ::cv::findContours(segMap, contours, ::cv::RETR_EXTERNAL, ::cv::CHAIN_APPROX_SIMPLE);
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

// CRAFT text+affinity maps -> component boxes, in two modes:
//   - line grouping (charLevel=false): affinity is ADDED to the text map so
//     adjacent glyphs link into one region; boxes keep their rotated-rect angle.
//   - char level (charLevel=true): affinity is SUBTRACTED to BREAK those links,
//     and the mask is eroded/dilated to clean up, yielding one upright box per
//     glyph (used by the per-column pass that reads stacked text glyph by glyph;
//     mirrors the old VerticalDetector's single-character path).
// Everything after the combine step (binarize -> connected components -> one box
// per component) is shared. charLevel boxes are forced upright (angle 0).
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

// fit a line to the two shortest sides' midpoints; returns slope, intercept, vertical?
std::tuple<float, float, bool> fitLineToShortestSides(const Box &b, float verticalThreshold) {
    const auto pts = corners(b);
    std::array<std::pair<float, int>, 4> sides;
    std::array<::cv::Point2f, 4> mids;
    for (int i = 0; i < 4; ++i) {
        const auto &p1 = pts[static_cast<std::size_t>(i)];
        const auto &p2 = pts[static_cast<std::size_t>((i + 1) % 4)];
        sides[static_cast<std::size_t>(i)] = {dist(p1, p2), i};
        mids[static_cast<std::size_t>(i)] = {(p1.x + p2.x) * 0.5f, (p1.y + p2.y) * 0.5f};
    }
    std::ranges::sort(sides);
    ::cv::Point2f m1 = mids[static_cast<std::size_t>(sides[0].second)];
    ::cv::Point2f m2 = mids[static_cast<std::size_t>(sides[1].second)];
    const bool isVertical = std::fabs(m2.x - m1.x) < verticalThreshold;
    std::vector<::cv::Point2f> fitPts = {m1, m2};
    if (isVertical) {
        for (auto &p : fitPts) {
            std::swap(p.x, p.y);
        }
    }
    ::cv::Vec4f line;
    ::cv::fitLine(fitPts, line, ::cv::DIST_L2, 0, 0.01, 0.01);
    const float m = line[1] / line[0];
    const float c = line[3] - m * line[2];
    return {m, c, isVertical};
}

Box rotateBox(const Box &b, float angleDeg) {
    const ::cv::Point2f ctr = center(b);
    const float rad = angleDeg * std::numbers::pi_v<float> / 180.0f;
    float minX = std::numeric_limits<float>::max();
    float minY = std::numeric_limits<float>::max();
    float maxX = std::numeric_limits<float>::lowest();
    float maxY = std::numeric_limits<float>::lowest();
    for (const auto &p : corners(b)) {
        const ::cv::Point2f r = rotateAround(p, ctr, rad);
        minX = std::min(minX, r.x);
        minY = std::min(minY, r.y);
        maxX = std::max(maxX, r.x);
        maxY = std::max(maxY, r.y);
    }
    return {.x0 = minX, .y0 = minY, .x1 = maxX, .y1 = maxY, .angle = b.angle};
}

float minDistanceBetween(const Box &a, const Box &b) {
    float md = std::numeric_limits<float>::max();
    for (const auto &c1 : corners(a)) {
        for (const auto &c2 : corners(b)) {
            md = std::min(md, dist(c1, c2));
        }
    }
    return md;
}

std::optional<std::pair<std::size_t, float>>
findClosestBox(const std::vector<Box> &boxes, const std::unordered_set<std::size_t> &ignored,
               const Box &current, bool isVertical, float m, float c, float centerThreshold) {
    float smallest = std::numeric_limits<float>::max();
    std::ptrdiff_t idx = -1;
    float boxHeight = 0.0f;
    const ::cv::Point2f cc = center(current);
    for (std::size_t i = 0; i < boxes.size(); ++i) {
        if (ignored.contains(i)) {
            continue;
        }
        const ::cv::Point2f pc = center(boxes[i]);
        const float d = dist(cc, pc);
        if (d >= smallest) {
            continue;
        }
        const float h = minSide(boxes[i]);
        const float lineDistance =
            isVertical ? std::fabs(pc.x - (m * pc.y + c)) : std::fabs(pc.y - (m * pc.x + c));
        if (lineDistance < h * centerThreshold) {
            idx = static_cast<std::ptrdiff_t>(i);
            smallest = d;
            boxHeight = h;
        }
    }
    if (idx == -1) {
        return std::nullopt;
    }
    return std::make_pair(static_cast<std::size_t>(idx), boxHeight);
}

Box mergeBoxes(const Box &a, const Box &b) {
    return {.x0 = std::min(a.x0, b.x0), .y0 = std::min(a.y0, b.y0), .x1 = std::max(a.x1, b.x1), .y1 = std::max(a.y1, b.y1), .angle = a.angle};
}

// CRAFT box grouping -> reading-ordered text lines.
std::vector<Box> groupTextBoxes(std::vector<Box> boxes, float centerThreshold,
                                float distanceThreshold, float heightThreshold,
                                float minSideThreshold, float maxSideThreshold,
                                float verticalThreshold) {
    std::ranges::sort(boxes,
                      [](const Box &a, const Box &b) { return maxSide(a) > maxSide(b); });

    std::vector<Box> merged;
    std::unordered_set<std::size_t> ignored;
    while (!boxes.empty()) {
        Box current = boxes.front();
        const float normalizedAngle = (current.angle > 45.0f) ? current.angle - 90.0f : current.angle;
        boxes.erase(boxes.begin());
        ignored.clear();
        float lineAngle = 0.0f;

        while (true) {
            auto [slope, intercept, isVertical] = fitLineToShortestSides(current, verticalThreshold);
            lineAngle = isVertical ? -90.0f : std::atan(slope) * 180.0f / std::numbers::pi_v<float>;
            auto closest =
                findClosestBox(boxes, ignored, current, isVertical, slope, intercept, centerThreshold);
            if (!closest) {
                break;
            }
            const auto [candIdx, candHeight] = *closest;
            Box candidate = boxes[candIdx];
            if ((isClose(candidate.angle, 90.0f) && !isVertical) ||
                (isClose(candidate.angle, 0.0f) && isVertical)) {
                candidate = rotateBox(candidate, normalizedAngle);
            }
            const float md = minDistanceBetween(candidate, current);
            const float mergedHeight = minSide(current);
            if (md < distanceThreshold * candHeight &&
                std::fabs(mergedHeight - candHeight) < candHeight * heightThreshold) {
                current = mergeBoxes(current, candidate);
                boxes.erase(boxes.begin() + static_cast<std::ptrdiff_t>(candIdx));
                ignored.clear();
            } else {
                ignored.insert(candIdx);
            }
        }
        current.angle = lineAngle;
        merged.push_back(current);
    }

    // Remove small boxes. Output order is unspecified — the TypeScript pipeline
    // derives reading order geometrically for every result set.
    std::vector<Box> filtered;
    for (const auto &b : merged) {
        if (minSide(b) > minSideThreshold && maxSide(b) > maxSideThreshold) {
            filtered.push_back(b);
        }
    }
    return filtered;
}

// CRAFT half-res heatmap (text+affinity interleaved) -> oriented quads in
// detector-input pixels; restoreRatio scales the half-res boxes back up. With
// charLevel the boxes are individual upright glyphs (no grouping); otherwise
// they are grouped reading-ordered lines. `data` points at heatW*heatH*2 floats.
std::vector<Quad> extractCraft(float *data, int32_t heatW, int32_t heatH, float textThreshold,
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
    if (!charLevel) {
        // Grouping constants in detector-input space. Lines are merged without a width
        // cap; the recognizer reads each line whole (snapping to its widest bucket).
        boxes = groupTextBoxes(boxes, /*center*/ 0.5f, /*distance*/ 2.0f, /*height*/ 2.0f,
                               /*minSide*/ 15.0f, /*maxSide*/ 30.0f,
                               /*verticalThreshold*/ 20.0f);
    }

    std::vector<Quad> quads;
    quads.reserve(boxes.size());
    for (const auto &b : boxes) {
        Quad q;
        q.score = 1.0f;
        // De-skew near-horizontal lines by rotating the AABB corners about the
        // center. A near-vertical line (angle ~ -90, from a tall/stacked region)
        // is NOT flipped flat — that would lay an upright column on its side and
        // misplace the box; keep it as an upright tall AABB so the column reader
        // can take it.
        const ::cv::Point2f ctr = center(b);
        const float rad =
            (std::fabs(b.angle) > 45.0f) ? 0.0f : b.angle * std::numbers::pi_v<float> / 180.0f;
        const auto cs = corners(b);
        for (std::size_t i = 0; i < 4; ++i) {
            q.pts[i] = rotateAround(cs[i], ctr, rad);
        }
        quads.push_back(q);
    }
    return quads;
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
        ::cv::Mat mask = ::cv::Mat::zeros(prob.size(), CV_8UC1);
        ::cv::drawContours(mask, contours, i, ::cv::Scalar(255), ::cv::FILLED);
        const float score = static_cast<float>(::cv::mean(prob, mask)[0]);
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
        q.score = score;
        auto minX = static_cast<float>(w);
        auto minY = static_cast<float>(h);
        float maxX = 0;
        float maxY = 0;
        for (int32_t k = 0; k < 4; ++k) {
            const float px = std::clamp(c[static_cast<std::size_t>(k)].x, 0.0f, static_cast<float>(w));
            const float py = std::clamp(c[static_cast<std::size_t>(k)].y, 0.0f, static_cast<float>(h));
            q.pts[static_cast<std::size_t>(k)] = {px, py};
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

// Flatten quads to a JS double array, 9 per box (x0,y0..x3,y3,score).
jsi::Array quadsToArray(jsi::Runtime &rt, const std::vector<Quad> &quads) {
    jsi::Array out(rt, quads.size() * 9);
    size_t idx = 0;
    for (const auto &q : quads) {
        for (std::size_t k = 0; k < 4; ++k) {
            out.setValueAtIndex(rt, idx++, jsi::Value(static_cast<double>(q.pts[k].x)));
            out.setValueAtIndex(rt, idx++, jsi::Value(static_cast<double>(q.pts[k].y)));
        }
        out.setValueAtIndex(rt, idx++, jsi::Value(static_cast<double>(q.score)));
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
        if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "extractCraftTextBoxes: src must be a Tensor");
        }
        if (!args[1].isObject()) {
            throw jsi::JSError(rt, "extractCraftTextBoxes: options must be an object");
        }
        auto src = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto opts = args[1].asObject(rt);
        if (src->dtype_ != rnexecutorch::core::types::DType::float32) {
            throw jsi::JSError(rt, "extractCraftTextBoxes: src must be a float32 Tensor");
        }

        std::shared_lock<std::shared_mutex> srcLock(src->mutex_, std::try_to_lock);
        if (!srcLock.owns_lock()) {
            throw jsi::JSError(rt, "extractCraftTextBoxes: src tensor is currently in use");
        }
        if (!src->data_) {
            throw jsi::JSError(rt, "extractCraftTextBoxes: src tensor has been disposed");
        }
        auto *dataPtr = reinterpret_cast<float *>(src->data_.get());

        // src is [1,Hd,Wd,2] or [Hd,Wd,2] interleaved (text, affinity), half-res.
        const auto &s = src->shape_;
        if (s.size() < 3 || s.back() != 2) {
            throw jsi::JSError(rt, "extractCraftTextBoxes: src must be [..,Hd,Wd,2]");
        }
        const int32_t heatW = s[s.size() - 2];
        const int32_t heatH = s[s.size() - 3];
        const double targetH = opts.getProperty(rt, "targetHeight").asNumber();
        const float restoreRatio = static_cast<float>(targetH) / static_cast<float>(heatH);
        // Required option — default values live in the TypeScript wrapper layer.
        const bool charLevel = opts.getProperty(rt, "charLevel").asBool();

        std::vector<Quad> quads;
        try {
            quads = extractCraft(
                dataPtr, heatW, heatH,
                static_cast<float>(opts.getProperty(rt, "textThreshold").asNumber()),
                static_cast<float>(opts.getProperty(rt, "linkThreshold").asNumber()),
                static_cast<float>(opts.getProperty(rt, "lowTextThreshold").asNumber()),
                restoreRatio, charLevel);
        } catch (const std::exception &e) {
            throw jsi::JSError(rt, std::string("extractCraftTextBoxes: OpenCV error: ") + e.what());
        }
        return quadsToArray(rt, quads);
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
        if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "extractDbnetTextBoxes: src must be a Tensor");
        }
        if (!args[1].isObject()) {
            throw jsi::JSError(rt, "extractDbnetTextBoxes: options must be an object");
        }
        auto src = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto opts = args[1].asObject(rt);
        if (src->dtype_ != rnexecutorch::core::types::DType::float32) {
            throw jsi::JSError(rt, "extractDbnetTextBoxes: src must be a float32 Tensor");
        }

        std::shared_lock<std::shared_mutex> srcLock(src->mutex_, std::try_to_lock);
        if (!srcLock.owns_lock()) {
            throw jsi::JSError(rt, "extractDbnetTextBoxes: src tensor is currently in use");
        }
        if (!src->data_) {
            throw jsi::JSError(rt, "extractDbnetTextBoxes: src tensor has been disposed");
        }
        auto *dataPtr = reinterpret_cast<float *>(src->data_.get());

        // src is [1,1,H,W] or [H,W] probability map (full-res).
        const auto &s = src->shape_;
        if (s.size() < 2) {
            throw jsi::JSError(rt, "extractDbnetTextBoxes: src must be [..,H,W]");
        }
        const int32_t w = s[s.size() - 1];
        const int32_t h = s[s.size() - 2];

        std::vector<Quad> quads;
        try {
            ::cv::Mat prob(h, w, CV_32F, dataPtr);
            quads = extractDbnet(
                prob, static_cast<float>(opts.getProperty(rt, "binThreshold").asNumber()),
                static_cast<float>(opts.getProperty(rt, "boxThreshold").asNumber()),
                static_cast<float>(opts.getProperty(rt, "unclipRatio").asNumber()),
                static_cast<int32_t>(opts.getProperty(rt, "minBoxSide").asNumber()),
                static_cast<int32_t>(opts.getProperty(rt, "maxCandidates").asNumber()));
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
        if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "ctcGreedyDecode: src must be a Tensor");
        }
        auto src = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);

        std::shared_lock<std::shared_mutex> srcLock(src->mutex_, std::try_to_lock);
        if (!srcLock.owns_lock()) {
            throw jsi::JSError(rt, "ctcGreedyDecode: src tensor is currently in use");
        }
        if (!src->data_) {
            throw jsi::JSError(rt, "ctcGreedyDecode: src tensor has been disposed");
        }

        if (src->dtype_ != rnexecutorch::core::types::DType::float32) {
            throw jsi::JSError(rt, "ctcGreedyDecode: src must be a float32 Tensor");
        }
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
