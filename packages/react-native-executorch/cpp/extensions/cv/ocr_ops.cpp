#include "ocr_ops.h"

#include <algorithm>
#include <array>
#include <cmath>
#include <cstddef>
#include <limits>
#include <numeric>
#include <optional>
#include <span>
#include <stdexcept>
#include <tuple>
#include <unordered_set>
#include <utility>
#include <vector>

#include <opencv2/imgproc.hpp>

#include "core/dtype.h"
#include "core/tensor.h"

// Detector postprocessing geometry: CRAFT text-map grouping + DBNet prob-map ->
// oriented quads. Pure OpenCV, kept native. ctcGreedyDecode (per-timestep argmax
// + max prob) is native too; the CTC blank-collapse, charset mapping, and
// confidence aggregation stay in TypeScript.
namespace rnexecutorch::extensions::cv::ocr_ops {
namespace jsi = facebook::jsi;
using TensorHostObject = rnexecutorch::core::tensor::TensorHostObject;

namespace {
// ----------------------------- geometry types ------------------------------
struct Box {
    float x0, y0, x1, y1; // axis-aligned (p1=min, p2=max)
    float angle = 0.0f;
    float width() const { return x1 - x0; }
    float height() const { return y1 - y0; }
};

struct Quad {
    std::array<::cv::Point2f, 4> pts;
    float score = 1.0f;
    float angle = 0.0f;
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
std::pair<::cv::Mat, ::cv::Mat> interleavedToMats(std::span<const float> data, ::cv::Size size) {
    ::cv::Mat textMap(size, CV_32F);
    ::cv::Mat affinityMap(size, CV_32F);
    const auto w = static_cast<std::size_t>(size.width);
    for (std::size_t i = 0; i < data.size(); ++i) {
        const int32_t x = static_cast<int32_t>((i / 2) % w);
        const int32_t y = static_cast<int32_t>((i / 2) / w);
        if (i % 2 == 0) {
            textMap.at<float>(y, x) = data[i];
        } else {
            affinityMap.at<float>(y, x) = data[i];
        }
    }
    return {textMap, affinityMap};
}

void dilateComponent(::cv::Mat &segMap, const ::cv::Mat &stats, int32_t i, int32_t area,
                     int32_t imgW, int32_t imgH) {
    const int32_t x = stats.at<int32_t>(i, ::cv::CC_STAT_LEFT);
    const int32_t y = stats.at<int32_t>(i, ::cv::CC_STAT_TOP);
    const int32_t w = stats.at<int32_t>(i, ::cv::CC_STAT_WIDTH);
    const int32_t h = stats.at<int32_t>(i, ::cv::CC_STAT_HEIGHT);
    const int32_t dilationRadius =
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
    double maxVal;
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

std::vector<Box> getDetBoxesFromTextMap(::cv::Mat &textMap, ::cv::Mat &affinityMap,
                                        float textThreshold, float linkThreshold,
                                        float lowTextThreshold) {
    const int32_t imgH = textMap.rows;
    const int32_t imgW = textMap.cols;
    ::cv::Mat textScore, affinityScore;
    ::cv::threshold(textMap, textScore, static_cast<double>(textThreshold), 1.0, ::cv::THRESH_BINARY);
    ::cv::threshold(affinityMap, affinityScore, static_cast<double>(linkThreshold), 1.0,
                    ::cv::THRESH_BINARY);
    ::cv::Mat comb = textScore + affinityScore;
    ::cv::threshold(comb, comb, 0.0, 1.0, ::cv::THRESH_BINARY);
    ::cv::Mat binary;
    comb.convertTo(binary, CV_8UC1);

    ::cv::Mat labels, stats, centroids;
    const int32_t nLabels = ::cv::connectedComponentsWithStats(binary, labels, stats, centroids, 4);

    std::vector<Box> boxes;
    boxes.reserve(static_cast<std::size_t>(nLabels));
    for (int32_t i = 1; i < nLabels; ++i) {
        auto box = boxFromComponent(textMap, labels, stats, i, imgW, imgH, lowTextThreshold);
        if (box) {
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
    std::sort(sides.begin(), sides.end());
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
    const float rad = angleDeg * static_cast<float>(M_PI) / 180.0f;
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
    return {minX, minY, maxX, maxY, b.angle};
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
    return {std::min(a.x0, b.x0), std::min(a.y0, b.y0), std::max(a.x1, b.x1), std::max(a.y1, b.y1),
            a.angle};
}

// CRAFT box grouping -> reading-ordered text lines.
std::vector<Box> groupTextBoxes(std::vector<Box> boxes, float centerThreshold,
                                float distanceThreshold, float heightThreshold,
                                float minSideThreshold, float maxSideThreshold,
                                float verticalThreshold) {
    std::sort(boxes.begin(), boxes.end(),
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
            lineAngle = isVertical ? -90.0f : std::atan(slope) * 180.0f / static_cast<float>(M_PI);
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

    // remove small boxes
    std::vector<Box> filtered;
    for (const auto &b : merged) {
        if (minSide(b) > minSideThreshold && maxSide(b) > maxSideThreshold) {
            filtered.push_back(b);
        }
    }

    // reading order: rows by top-Y, then left-to-right within a row
    std::sort(filtered.begin(), filtered.end(),
              [](const Box &a, const Box &b) { return a.y0 < b.y0; });
    float yThresh = 0.0f;
    if (!filtered.empty()) {
        float total = 0.0f;
        for (const auto &b : filtered) {
            total += minSide(b);
        }
        yThresh = (total / static_cast<float>(filtered.size())) * 0.5f;
    }
    for (auto rowBegin = filtered.begin(); rowBegin != filtered.end();) {
        const float rowY = rowBegin->y0;
        auto rowEnd = std::find_if(rowBegin, filtered.end(),
                                   [rowY, yThresh](const Box &b) { return b.y0 - rowY > yThresh; });
        std::sort(rowBegin, rowEnd, [](const Box &a, const Box &b) { return a.x0 < b.x0; });
        rowBegin = rowEnd;
    }
    return filtered;
}

// Char-level CRAFT extraction: one upright box per glyph, no line grouping. The
// affinity map is SUBTRACTED from the text map to break the links between
// adjacent characters (the opposite of the grouped path, which adds them), then
// the components are eroded/dilated to clean up before labelling. Used by the
// second, per-column detection pass that reads upright stacked text glyph by
// glyph. Mirrors the old VerticalDetector's single-character path.
std::vector<Box> getCharBoxesFromTextMap(::cv::Mat &textMap, ::cv::Mat &affinityMap,
                                         float textThreshold, float linkThreshold,
                                         float lowTextThreshold) {
    const int32_t imgH = textMap.rows;
    const int32_t imgW = textMap.cols;
    ::cv::Mat textScore, affinityScore;
    ::cv::threshold(textMap, textScore, static_cast<double>(textThreshold), 1.0, ::cv::THRESH_BINARY);
    ::cv::threshold(affinityMap, affinityScore, static_cast<double>(linkThreshold), 1.0,
                    ::cv::THRESH_BINARY);
    ::cv::Mat comb = textScore - affinityScore; // subtract to separate adjacent glyphs
    ::cv::threshold(comb, comb, 0.0, 1.0, ::cv::THRESH_TOZERO);
    ::cv::threshold(comb, comb, 1.0, 1.0, ::cv::THRESH_TRUNC);
    ::cv::Mat kernel = ::cv::getStructuringElement(::cv::MORPH_RECT, ::cv::Size(3, 3));
    ::cv::erode(comb, comb, kernel, ::cv::Point(-1, -1), 1);
    ::cv::dilate(comb, comb, kernel, ::cv::Point(-1, -1), 4);

    ::cv::Mat binary;
    comb.convertTo(binary, CV_8UC1);
    ::cv::Mat labels, stats, centroids;
    const int32_t nLabels = ::cv::connectedComponentsWithStats(binary, labels, stats, centroids, 4);

    std::vector<Box> boxes;
    boxes.reserve(static_cast<std::size_t>(nLabels));
    for (int32_t i = 1; i < nLabels; ++i) {
        auto box = boxFromComponent(textMap, labels, stats, i, imgW, imgH, lowTextThreshold);
        if (box) {
            box->angle = 0.0f; // glyphs are read upright, never rotated
            boxes.push_back(*box);
        }
    }
    return boxes;
}

// CRAFT half-res heatmap (text+affinity interleaved) -> oriented quads in
// detector-input pixels; restoreRatio scales the half-res boxes back up. With
// charLevel the boxes are individual upright glyphs (no grouping); otherwise
// they are grouped reading-ordered lines.
std::vector<Quad> extractCraft(std::span<const float> data, int32_t heatW, int32_t heatH,
                               float textThreshold, float linkThreshold, float lowTextThreshold,
                               float restoreRatio, bool charLevel) {
    auto [textMap, affinityMap] = interleavedToMats(data, ::cv::Size(heatW, heatH));
    std::vector<Box> boxes =
        charLevel ? getCharBoxesFromTextMap(textMap, affinityMap, textThreshold, linkThreshold,
                                            lowTextThreshold)
                  : getDetBoxesFromTextMap(textMap, affinityMap, textThreshold, linkThreshold,
                                           lowTextThreshold);
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
        q.angle = b.angle;
        // De-skew near-horizontal lines by rotating the AABB corners about the
        // center. A near-vertical line (angle ~ -90, from a tall/stacked region)
        // is NOT flipped flat — that would lay an upright column on its side and
        // misplace the box; keep it as an upright tall AABB so the column reader
        // can take it.
        const ::cv::Point2f ctr = center(b);
        const float rad =
            (std::fabs(b.angle) > 45.0f) ? 0.0f : b.angle * static_cast<float>(M_PI) / 180.0f;
        const auto cs = corners(b);
        for (std::size_t i = 0; i < 4; ++i) {
            q.pts[i] = rotateAround(cs[i], ctr, rad);
        }
        quads.push_back(q);
    }
    return quads;
}

// ------------------------------ DBNet branch -------------------------------
// DBNet prob map [H,W] -> oriented quads.
std::vector<Quad> extractDbnet(const ::cv::Mat &probIn, float binThreshold, float boxThreshold,
                               float unclipRatio, int32_t minBoxSide, int32_t maxCandidates,
                               bool applySigmoid) {
    const int32_t w = probIn.cols;
    const int32_t h = probIn.rows;
    // The caller declares (from the model's export contract) whether the head
    // emits raw logits (apply sigmoid) or already-normalized probabilities.
    ::cv::Mat prob;
    if (applySigmoid) {
        ::cv::Mat neg;
        ::cv::exp(-probIn, neg);
        prob = 1.0 / (1.0 + neg);
    } else {
        prob = probIn;
    }

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
        ::cv::Point2f c[4];
        expanded.points(c);
        Quad q;
        q.score = score;
        q.angle = expanded.angle;
        float minX = static_cast<float>(w), minY = static_cast<float>(h), maxX = 0, maxY = 0;
        for (int32_t k = 0; k < 4; ++k) {
            const float px = std::clamp(c[k].x, 0.0f, static_cast<float>(w));
            const float py = std::clamp(c[k].y, 0.0f, static_cast<float>(h));
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

    // Reading order: top -> bottom by ~row, then left -> right. Quantise y into
    // row bands first so the comparator is a valid strict-weak ordering — a raw
    // `|dy| > threshold` test is intransitive (a~b, b~c, but a<c) and aborts under
    // libc++ hardening.
    constexpr float kRowBand = 10.0f;
    std::sort(quads.begin(), quads.end(), [](const Quad &a, const Quad &b) {
        const int rowA = static_cast<int>(std::floor(a.pts[0].y / kRowBand));
        const int rowB = static_cast<int>(std::floor(b.pts[0].y / kRowBand));
        if (rowA != rowB) {
            return rowA < rowB;
        }
        return a.pts[0].x < b.pts[0].x;
    });
    return quads;
}

// ----------------------------- option readers ------------------------------
// Required option getters (defaults live in the TS wrappers, so these throw).
double getNumberProp(jsi::Runtime &rt, const jsi::Object &opts, const char *name) {
    if (!opts.hasProperty(rt, name) || !opts.getProperty(rt, name).isNumber()) {
        throw jsi::JSError(rt, std::string("options.") + name + " is required and must be a number");
    }
    return opts.getProperty(rt, name).asNumber();
}

std::string getStringProp(jsi::Runtime &rt, const jsi::Object &opts, const char *name) {
    if (!opts.hasProperty(rt, name) || !opts.getProperty(rt, name).isString()) {
        throw jsi::JSError(rt, std::string("options.") + name + " is required and must be a string");
    }
    return opts.getProperty(rt, name).asString(rt).utf8(rt);
}

bool getBoolProp(jsi::Runtime &rt, const jsi::Object &opts, const char *name) {
    if (!opts.hasProperty(rt, name) || !opts.getProperty(rt, name).isBool()) {
        throw jsi::JSError(rt, std::string("options.") + name + " is required and must be a boolean");
    }
    return opts.getProperty(rt, name).asBool();
}

// Optional boolean (defaults when absent) — used for flags a caller may omit.
bool getBoolPropOr(jsi::Runtime &rt, const jsi::Object &opts, const char *name, bool fallback) {
    if (!opts.hasProperty(rt, name) || !opts.getProperty(rt, name).isBool()) {
        return fallback;
    }
    return opts.getProperty(rt, name).asBool();
}

// Flatten quads to a JS double array, 10 per box (x0,y0..x3,y3,score,angle).
jsi::Array quadsToArray(jsi::Runtime &rt, const std::vector<Quad> &quads) {
    jsi::Array out(rt, quads.size() * 10);
    size_t idx = 0;
    for (const auto &q : quads) {
        for (std::size_t k = 0; k < 4; ++k) {
            out.setValueAtIndex(rt, idx++, jsi::Value(static_cast<double>(q.pts[k].x)));
            out.setValueAtIndex(rt, idx++, jsi::Value(static_cast<double>(q.pts[k].y)));
        }
        out.setValueAtIndex(rt, idx++, jsi::Value(static_cast<double>(q.score)));
        out.setValueAtIndex(rt, idx++, jsi::Value(static_cast<double>(q.angle)));
    }
    return out;
}

} // namespace

void install_extractTextBoxes(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "extractTextBoxes";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args,
                     size_t count) -> jsi::Value {
        if (count != 2) {
            throw jsi::JSError(rt, "Usage: extractTextBoxes(src, options)");
        }
        if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "extractTextBoxes: src must be a Tensor");
        }
        if (!args[1].isObject()) {
            throw jsi::JSError(rt, "extractTextBoxes: options must be an object");
        }
        auto src = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto opts = args[1].asObject(rt);

        if (src->dtype_ != rnexecutorch::core::types::DType::float32) {
            throw jsi::JSError(rt, "extractTextBoxes: src must be a float32 Tensor");
        }
        if (!opts.hasProperty(rt, "mode") || !opts.getProperty(rt, "mode").isString()) {
            throw jsi::JSError(rt, "extractTextBoxes: options.mode is required and must be a string");
        }
        const std::string mode = opts.getProperty(rt, "mode").asString(rt).utf8(rt);

        std::shared_lock<std::shared_mutex> srcLock(src->mutex_, std::try_to_lock);
        if (!srcLock.owns_lock()) {
            throw jsi::JSError(rt, "extractTextBoxes: src tensor is currently in use");
        }
        if (!src->data_) {
            throw jsi::JSError(rt, "extractTextBoxes: src tensor has been disposed");
        }

        const auto *dataPtr = reinterpret_cast<const float *>(src->data_.get());
        std::span<const float> data(dataPtr, src->numel_);

        std::vector<Quad> quads;
        try {
            if (mode == "craft") {
                // src is [1,Hd,Wd,2] or [Hd,Wd,2] interleaved (text, affinity), half-res.
                const auto &s = src->shape_;
                if (s.size() < 3 || s.back() != 2) {
                    throw jsi::JSError(rt, "extractTextBoxes: craft src must be [..,Hd,Wd,2]");
                }
                const int32_t heatW = s[s.size() - 2];
                const int32_t heatH = s[s.size() - 3];
                const double targetH = getNumberProp(rt, opts, "targetHeight");
                const float restoreRatio = static_cast<float>(targetH) / static_cast<float>(heatH);
                quads = extractCraft(data, heatW, heatH,
                                     static_cast<float>(getNumberProp(rt, opts, "textThreshold")),
                                     static_cast<float>(getNumberProp(rt, opts, "linkThreshold")),
                                     static_cast<float>(getNumberProp(rt, opts, "lowTextThreshold")),
                                     restoreRatio, getBoolPropOr(rt, opts, "charLevel", false));
            } else if (mode == "dbnet") {
                // src is [1,1,H,W] or [H,W] probability map (full-res).
                const auto &s = src->shape_;
                if (s.size() < 2) {
                    throw jsi::JSError(rt, "extractTextBoxes: dbnet src must be [..,H,W]");
                }
                const int32_t w = s[s.size() - 1];
                const int32_t h = s[s.size() - 2];
                ::cv::Mat prob(h, w, CV_32F, const_cast<float *>(dataPtr));
                quads = extractDbnet(
                    prob, static_cast<float>(getNumberProp(rt, opts, "binThreshold")),
                    static_cast<float>(getNumberProp(rt, opts, "boxThreshold")),
                    static_cast<float>(getNumberProp(rt, opts, "unclipRatio")),
                    static_cast<int32_t>(getNumberProp(rt, opts, "minBoxSide")),
                    static_cast<int32_t>(getNumberProp(rt, opts, "maxCandidates")),
                    getBoolProp(rt, opts, "applySigmoid"));
            } else {
                throw jsi::JSError(rt, "extractTextBoxes: unknown mode '" + mode + "'");
            }
        } catch (const ::cv::Exception &e) {
            throw jsi::JSError(rt, std::string("extractTextBoxes: OpenCV error: ") + e.what());
        }
        return quadsToArray(rt, quads);
    };
    module.setProperty(rt, name,
                       jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name),
                                                             2, fnBody));
}

// ------------------------------- warpQuad ----------------------------------
void install_warpQuad(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "warpQuad";
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
        const std::string padMode = getStringProp(rt, opts, "padMode");
        const double padValue = getNumberProp(rt, opts, "padValue");
        const std::string align = getStringProp(rt, opts, "align");

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
            const ::cv::Point2f dstPts[4] = {{0.0f, 0.0f},
                                             {static_cast<float>(contentWidth), 0.0f},
                                             {static_cast<float>(contentWidth),
                                              static_cast<float>(recH)},
                                             {0.0f, static_cast<float>(recH)}};
            const ::cv::Point2f srcPts[4] = {quad[0], quad[1], quad[2], quad[3]};
            ::cv::Mat m = ::cv::getPerspectiveTransform(srcPts, dstPts);
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
            const int32_t offsetX = (align == "center") ? (bucketW - contentWidth) / 2 : 0;
            content.copyTo(dstMat(::cv::Rect(offsetX, 0, contentWidth, recH)));
        } catch (const ::cv::Exception &e) {
            throw jsi::JSError(rt, std::string("warpQuad: OpenCV error: ") + e.what());
        }
        return jsi::Value(rt, args[1]);
    };
    module.setProperty(rt, name,
                       jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name),
                                                             4, fnBody));
}

// --------------------------- ctcGreedyDecode -------------------------------
void install_ctcGreedyDecode(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "ctcGreedyDecode";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args,
                     size_t count) -> jsi::Value {
        if (count != 2) {
            throw jsi::JSError(rt, "Usage: ctcGreedyDecode(src, options)");
        }
        if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "ctcGreedyDecode: src must be a Tensor");
        }
        if (!args[1].isObject()) {
            throw jsi::JSError(rt, "ctcGreedyDecode: options must be an object");
        }
        auto src = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto opts = args[1].asObject(rt);

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
        const bool softmax = getBoolProp(rt, opts, "softmax");

        std::shared_lock<std::shared_mutex> srcLock(src->mutex_, std::try_to_lock);
        if (!srcLock.owns_lock()) {
            throw jsi::JSError(rt, "ctcGreedyDecode: src tensor is currently in use");
        }
        if (!src->data_) {
            throw jsi::JSError(rt, "ctcGreedyDecode: src tensor has been disposed");
        }
        const auto *data = reinterpret_cast<const float *>(src->data_.get());

        jsi::Array out(rt, static_cast<size_t>(timesteps) * 2);
        size_t oi = 0;
        for (int32_t t = 0; t < timesteps; ++t) {
            const float *row = data + static_cast<std::size_t>(t) * static_cast<std::size_t>(vocab);
            const float *maxIt = std::max_element(row, row + vocab);
            const int32_t maxIdx = static_cast<int32_t>(maxIt - row);
            const float maxVal = *maxIt;
            double prob = static_cast<double>(maxVal);
            if (softmax) {
                double sum = 0.0;
                for (int32_t v = 0; v < vocab; ++v) {
                    sum += std::exp(static_cast<double>(row[v]) - static_cast<double>(maxVal));
                }
                prob = sum > 0.0 ? 1.0 / sum : 0.0; // exp(maxVal - maxVal) / sum
            }
            out.setValueAtIndex(rt, oi++, jsi::Value(static_cast<double>(maxIdx)));
            out.setValueAtIndex(rt, oi++, jsi::Value(prob));
        }
        return out;
    };
    module.setProperty(rt, name,
                       jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name),
                                                             2, fnBody));
}

} // namespace rnexecutorch::extensions::cv::ocr_ops
