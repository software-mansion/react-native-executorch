#include "box_ops.h"

#include <algorithm>
#include <array>
#include <cmath>
#include <cstddef>
#include <format>
#include <numeric>
#include <optional>
#include <shared_mutex>
#include <span>
#include <stdexcept>
#include <utility>
#include <vector>

#include "core/dtype.h"
#include "core/tensor.h"
#include "core/tensor_helpers.h"
#include "utils.h"

#include <opencv2/core.hpp>

#include "core/error.h"

namespace error = rnexecutorch::core::error;

namespace rnexecutorch::extensions::cv::box_ops {
namespace jsi = facebook::jsi;
namespace tensor = rnexecutorch::core::tensor;
namespace conversions = rnexecutorch::core::conversions;

using rnexecutorch::core::types::DType;

namespace {
enum class BoxFormat {
    XYXY,
    XYWH,
    CXCYWH
};

BoxFormat parseBoxFormat(const std::string &ctx, const std::string &s) {
    if (s == "xyxy") {
        return BoxFormat::XYXY;
    }
    if (s == "xywh") {
        return BoxFormat::XYWH;
    }
    if (s == "cxcywh") {
        return BoxFormat::CXCYWH;
    }
    throw error::InvalidArgument(std::format("{}: unsupported boxFormat '{}'. Expected 'xyxy', 'xywh', or 'cxcywh'", ctx, s));
}

enum class NmsType {
    Standard,
    Weighted
};

NmsType parseNmsType(const std::string &ctx, const std::string &s) {
    if (s == "standard") {
        return NmsType::Standard;
    }
    if (s == "weighted") {
        return NmsType::Weighted;
    }
    throw error::InvalidArgument(std::format("{}: unsupported nmsType '{}'. Expected 'standard' or 'weighted'", ctx, s));
}

constexpr size_t kBoxCoords = 4;

std::array<float, kBoxCoords> decodeToXyxy(std::span<const float, kBoxCoords> box, BoxFormat format) {
    const float a = box[0];
    const float b = box[1];
    const float c = box[2];
    const float d = box[3];
    switch (format) {
    case BoxFormat::XYXY:
        return {a, b, c, d};
    case BoxFormat::XYWH:
        return {a, b, a + c, b + d};
    case BoxFormat::CXCYWH:
        return {a - c / 2.0f, b - d / 2.0f, a + c / 2.0f, b + d / 2.0f};
    }
}
} // namespace

void install_nms(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "nms";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count < 3) {
            throw error::InvalidArgument("nms: Usage: nms(boxes, scores, options)");
        }

        auto boxes = tensor::fromJs(rt, "nms: boxes", args[0], DType::float32, {"N", 4});
        auto scores = tensor::fromJs(rt, "nms: scores", args[1], DType::float32, {boxes->shape_[0]});

        tensor::checkNotSameTensor(rt, "nms: boxes", boxes, "nms: scores", scores);
        auto boxesLock = tensor::tryLockShared(rt, "nms: boxes", boxes);
        auto scoresLock = tensor::tryLockShared(rt, "nms: scores", scores);

        auto opts = conversions::asType<jsi::Object>(rt, "nms: options", args[2]);
        auto nmsTypeStr = conversions::getRequiredProperty<std::string>(rt, "nms: options", opts, "nmsType");
        auto boxFormatStr = conversions::getRequiredProperty<std::string>(rt, "nms: options", opts, "boxFormat");
        auto iouThreshold = conversions::getRequiredProperty<float>(rt, "nms: options", opts, "iouThreshold");
        auto confidenceThreshold = conversions::getRequiredProperty<float>(rt, "nms: options", opts, "confidenceThreshold");

        NmsType nmsType = parseNmsType("nms", nmsTypeStr);
        BoxFormat boxFormat = parseBoxFormat("nms", boxFormatStr);

        std::int32_t numAnchors = scores->shape_[0];
        const std::span<const float> boxesData(reinterpret_cast<const float *>(boxes->data_.get()), boxes->numel_);
        const std::span<const float> scoresData(reinterpret_cast<const float *>(scores->data_.get()), scores->numel_);

        // Coordinates of anchor `i` occupy the i-th 4-element row of `boxesData`.
        auto boxAt = [boxesData](std::int32_t index) -> std::span<const float, kBoxCoords> {
            return std::span<const float, kBoxCoords>(
                boxesData.subspan(static_cast<size_t>(index) * kBoxCoords, kBoxCoords));
        };

        std::vector<std::pair<std::int32_t, float>> candidates;
        candidates.reserve(static_cast<size_t>(numAnchors));

        for (std::int32_t idx = 0; idx < numAnchors; ++idx) {
            const float score = scoresData[static_cast<size_t>(idx)];

            if (score >= confidenceThreshold) {
                candidates.emplace_back(idx, score);
            }
        }

        if (candidates.empty()) {
            return jsi::Array(rt, 0);
        }

        std::ranges::sort(candidates, [](const auto &lhs, const auto &rhs) { return lhs.second > rhs.second; });

        std::vector<std::vector<std::int32_t>> groups;
        std::vector<bool> suppressed(candidates.size(), false);

        for (size_t i = 0; i < candidates.size(); ++i) {
            if (suppressed[i]) {
                continue;
            }

            std::int32_t idxI = candidates[i].first;

            auto [xminA, yminA, xmaxA, ymaxA] = decodeToXyxy(boxAt(idxI), boxFormat);

            const float areaA = (xmaxA - xminA) * (ymaxA - yminA);

            std::vector<std::int32_t> overlapping = {idxI};

            for (size_t j = i + 1; j < candidates.size(); ++j) {
                if (suppressed[j]) {
                    continue;
                }

                std::int32_t idxJ = candidates[j].first;

                auto [xminB, yminB, xmaxB, ymaxB] = decodeToXyxy(boxAt(idxJ), boxFormat);

                const float areaB = (xmaxB - xminB) * (ymaxB - yminB);

                const float interYMin = std::max(yminA, yminB);
                const float interXMin = std::max(xminA, xminB);
                const float interYMax = std::min(ymaxA, ymaxB);
                const float interXMax = std::min(xmaxA, xmaxB);

                const float interH = std::max(0.0f, interYMax - interYMin);
                const float interW = std::max(0.0f, interXMax - interXMin);
                const float intersection = interH * interW;

                const float unionArea = areaA + areaB - intersection;
                const float iou = (unionArea > 0.0f) ? (intersection / unionArea) : 0.0f;

                if (iou > iouThreshold) {
                    if (nmsType == NmsType::Weighted) {
                        overlapping.push_back(idxJ);
                    }
                    suppressed[j] = true;
                }
            }

            groups.push_back(std::move(overlapping));
        }

        switch (nmsType) {
        case NmsType::Standard: {
            jsi::Array result = jsi::Array(rt, groups.size());
            for (size_t i = 0; i < groups.size(); ++i) {
                result.setValueAtIndex(rt, i, jsi::Value(static_cast<double>(groups[i][0])));
            }
            return result;
        }
        case NmsType::Weighted: {
            jsi::Array resultGroups = jsi::Array(rt, groups.size());
            for (size_t i = 0; i < groups.size(); ++i) {
                resultGroups.setValueAtIndex(rt, i, conversions::toJsiArray(rt, groups[i]));
            }
            return resultGroups;
        }
        }
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, error::guarded(fnBody)));
}

void install_restrictToBox(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "restrictToBox";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 4) {
            throw error::InvalidArgument("restrictToBox: Usage: restrictToBox(src, dst, boxTuple, format)");
        }

        auto src = tensor::fromJs(rt, "restrictToBox: src", args[0], std::nullopt, {"H", "W", "C"});
        auto dst = tensor::fromJs(rt, "restrictToBox: dst", args[1], src->dtype_, src->shape_);

        tensor::checkNotSameTensor(rt, "restrictToBox: src", src, "restrictToBox: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "restrictToBox: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "restrictToBox: dst", dst);

        auto boxVec = conversions::asVector<float>(rt, "restrictToBox: boxTuple", args[2]);
        if (boxVec.size() != kBoxCoords) {
            throw error::InvalidArgument(std::format("restrictToBox: boxTuple must contain exactly 4 coordinates (got {})",
                                                     boxVec.size()));
        }

        auto boxFormatStr = conversions::asType<std::string>(rt, "restrictToBox: format", args[3]);
        BoxFormat boxFormat = parseBoxFormat("restrictToBox", boxFormatStr);

        auto [xmin, ymin, xmax, ymax] = decodeToXyxy(std::span<const float, kBoxCoords>(boxVec), boxFormat);

        int32_t H = src->shape_[0];
        int32_t W = src->shape_[1];
        int32_t C = src->shape_[2];

        auto x1 = static_cast<int32_t>(std::ceil(xmin));
        auto y1 = static_cast<int32_t>(std::ceil(ymin));
        auto x2 = static_cast<int32_t>(std::floor(xmax));
        auto y2 = static_cast<int32_t>(std::floor(ymax));

        x1 = std::max(0, x1);
        y1 = std::max(0, y1);
        x2 = std::min(W - 1, x2);
        y2 = std::min(H - 1, y2);

        bool isEmpty = (x2 < x1) || (y2 < y1);

        const int32_t cvType = CV_MAKETYPE(dtypeToCvDepth(src->dtype_), C);

        try {
            ::cv::Mat srcMat(H, W, cvType, src->data_.get());
            ::cv::Mat dstMat(H, W, cvType, dst->data_.get());

            dstMat.setTo(::cv::Scalar::all(0));
            if (!isEmpty) {
                int32_t boxW = x2 - x1 + 1;
                int32_t boxH = y2 - y1 + 1;
                ::cv::Rect roi(x1, y1, boxW, boxH);
                srcMat(roi).copyTo(dstMat(roi));
            }
        } catch (const std::exception &e) {
            throw error::Unknown("restrictToBox: " + std::string(e.what()));
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 4, error::guarded(fnBody)));
}

} // namespace rnexecutorch::extensions::cv::box_ops
