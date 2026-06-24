#include "box_ops.h"

#include <algorithm>
#include <array>
#include <cmath>
#include <numeric>
#include <shared_mutex>
#include <stdexcept>
#include <utility>
#include <vector>

#include "core/dtype.h"
#include "core/tensor.h"

namespace rnexecutorch::extensions::cv::box_ops {
namespace jsi = facebook::jsi;
using TensorHostObject = rnexecutorch::core::tensor::TensorHostObject;

namespace {
enum class BoxFormat {
    XYXY,
    XYWH,
    CXCYWH
};

BoxFormat parseBoxFormat(const std::string &s) {
    if (s == "xyxy") {
        return BoxFormat::XYXY;
    }
    if (s == "xywh") {
        return BoxFormat::XYWH;
    }
    if (s == "cxcywh") {
        return BoxFormat::CXCYWH;
    }
    throw std::invalid_argument("unsupported boxFormat '" + s + "'");
}

enum class NmsType {
    Standard,
    Weighted
};

NmsType parseNmsType(const std::string &s) {
    if (s == "standard") {
        return NmsType::Standard;
    }
    if (s == "weighted") {
        return NmsType::Weighted;
    }
    throw std::invalid_argument("unsupported nmsType '" + s + "'");
}

std::array<float, 4> decodeToXyxy(
    float a, float b, float c, float d,
    BoxFormat format) {
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
    auto name = "nms";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count < 3) {
            throw jsi::JSError(rt, "Usage: nms(boxes, scores, options)");
        }

        if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt) ||
            !args[1].isObject() || !args[1].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "nms: boxes and scores must be Tensors");
        }

        if (!args[2].isObject()) {
            throw jsi::JSError(rt, "nms: options must be an object");
        }

        auto boxes = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto scores = args[1].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto opts = args[2].asObject(rt);

        if (boxes.get() == scores.get()) {
            throw jsi::JSError(rt, "nms: boxes and scores cannot be the same tensor.");
        }

        if (!opts.hasProperty(rt, "iouThreshold") ||
            !opts.hasProperty(rt, "boxFormat") ||
            !opts.hasProperty(rt, "confidenceThreshold") ||
            !opts.hasProperty(rt, "nmsType")) {
            throw jsi::JSError(rt, "nms: options must specify iouThreshold, boxFormat, confidenceThreshold, and nmsType");
        }

        float iouThreshold = static_cast<float>(opts.getProperty(rt, "iouThreshold").asNumber());
        float confidenceThreshold = static_cast<float>(opts.getProperty(rt, "confidenceThreshold").asNumber());

        std::string nmsTypeStr = opts.getProperty(rt, "nmsType").asString(rt).utf8(rt);
        std::string boxFormatStr = opts.getProperty(rt, "boxFormat").asString(rt).utf8(rt);

        NmsType nmsType;
        BoxFormat boxFormat;
        try {
            nmsType = parseNmsType(nmsTypeStr);
            boxFormat = parseBoxFormat(boxFormatStr);
        } catch (const std::invalid_argument &e) {
            throw jsi::JSError(rt, "nms: " + std::string(e.what()));
        }

        std::shared_lock<std::shared_mutex> boxesLock(boxes->mutex_, std::try_to_lock);
        std::shared_lock<std::shared_mutex> scoresLock(scores->mutex_, std::try_to_lock);

        if (!boxesLock.owns_lock() || !scoresLock.owns_lock()) {
            throw jsi::JSError(rt, "nms: one of the tensors is currently locked");
        }

        if (!boxes->data_ || !scores->data_) {
            throw jsi::JSError(rt, "nms: tensors must not be disposed");
        }

        if (scores->shape_.size() != 1) {
            throw jsi::JSError(rt, "nms: scores must be a 1D tensor with shape [N]");
        }
        std::int32_t numAnchors = scores->shape_[0];

        if (boxes->shape_.size() != 2 || boxes->shape_[1] != 4) {
            throw jsi::JSError(rt, "nms: boxes must be a 2D tensor with shape [N, 4]");
        }

        if (boxes->shape_[0] != numAnchors) {
            throw jsi::JSError(rt, "nms: boxes and scores must have the same number of elements");
        }

        if (boxes->dtype_ != rnexecutorch::core::types::DType::float32 || scores->dtype_ != rnexecutorch::core::types::DType::float32) {
            throw jsi::JSError(rt, "nms: boxes and scores must have dtype float32");
        }

        const float *boxesPtr = reinterpret_cast<const float *>(boxes->data_.get());
        const float *scoresPtr = reinterpret_cast<const float *>(scores->data_.get());

        std::vector<std::pair<std::int32_t, float>> candidates;
        candidates.reserve(numAnchors);

        for (size_t idx = 0; idx < numAnchors; ++idx) {
            float score = scoresPtr[idx];

            if (score >= confidenceThreshold) {
                candidates.push_back({idx, score});
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

            auto [xminA, yminA, xmaxA, ymaxA] = decodeToXyxy(
                boxesPtr[idxI * 4 + 0],
                boxesPtr[idxI * 4 + 1],
                boxesPtr[idxI * 4 + 2],
                boxesPtr[idxI * 4 + 3],
                boxFormat);

            float areaA = (xmaxA - xminA) * (ymaxA - yminA);

            std::vector<std::int32_t> overlapping = {idxI};

            for (size_t j = i + 1; j < candidates.size(); ++j) {
                if (suppressed[j]) {
                    continue;
                }

                std::int32_t idxJ = candidates[j].first;

                auto [xminB, yminB, xmaxB, ymaxB] = decodeToXyxy(
                    boxesPtr[idxJ * 4 + 0],
                    boxesPtr[idxJ * 4 + 1],
                    boxesPtr[idxJ * 4 + 2],
                    boxesPtr[idxJ * 4 + 3],
                    boxFormat);

                float areaB = (xmaxB - xminB) * (ymaxB - yminB);

                float interYMin = std::max(yminA, yminB);
                float interXMin = std::max(xminA, xminB);
                float interYMax = std::min(ymaxA, ymaxB);
                float interXMax = std::min(xmaxA, xmaxB);

                float interH = std::max(0.0f, interYMax - interYMin);
                float interW = std::max(0.0f, interXMax - interXMin);
                float intersection = interH * interW;

                float unionArea = areaA + areaB - intersection;
                float iou = (unionArea > 0.0f) ? (intersection / unionArea) : 0.0f;

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
                jsi::Array singleGroup = jsi::Array(rt, groups[i].size());
                for (size_t j = 0; j < groups[i].size(); ++j) {
                    singleGroup.setValueAtIndex(rt, j, jsi::Value(static_cast<double>(groups[i][j])));
                }
                resultGroups.setValueAtIndex(rt, i, singleGroup);
            }
            return resultGroups;
        }
        }
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, fnBody));
}
} // namespace rnexecutorch::extensions::cv::box_ops
