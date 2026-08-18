// Upstream ExecuTorch annotates experimental LLM APIs (MultimodalRunner, Stats,
// load_tokenizer, create_multimodal_runner) with `ET_EXPERIMENTAL`, which
// expands to `[[deprecated("...")]]`. We suppress -Wdeprecated-declarations so
// Clang does not fail builds on ExecuTorch's experimental API tags.
#ifdef __clang__
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
#endif

#include "llm_runner.h"

#include <algorithm>
#include <cstring>
#include <format>

#include <executorch/extension/llm/runner/constants.h>
#include <executorch/extension/llm/runner/llm_runner_helper.h>
#include <executorch/extension/llm/runner/multimodal_input.h>
#include <executorch/extension/llm/runner/multimodal_runner.h>
#include <executorch/extension/llm/runner/stats.h>
#include <executorch/extension/llm/runner/text_llm_runner.h>
#include <executorch/runtime/core/error.h>

#include "core/conversions.h"
#include "core/error.h"
#include "core/tensor_helpers.h"

namespace rnexecutorch::extensions::llm {
namespace jsi = facebook::jsi;
namespace error = rnexecutorch::core::error;
namespace tensor = rnexecutorch::core::tensor;
namespace conversions = rnexecutorch::core::conversions;

using rnexecutorch::core::types::DType;

namespace {

// ============================================================================
// NOTE & ARCHITECTURAL DISCLAIMER:
// Upstream ExecuTorch's `TextLLMRunner` and `MultimodalRunner` do not expose
// public getters or setters for:
//   1. `pos_` (the current write head index in the preallocated KV cache)
//   2. `prefill_next_token_` (cached token from prefill phase)
//   3. `metadata_` (unordered map holding context size / max sequence length)
//
// Furthermore, the upstream `reset()` method unconditionally clears the KV
// cache position back to 0. In multi-turn chat sessions and tool-calling flows,
// we need the ability to rewind the KV cache back to an exact token position
// (to discard raw/truncated tool calls and re-prefill formatted responses)
// and inspect context cache utilization without clearing entire buffers.
//
// Below, we use the standard ISO C++ explicit template instantiation trick
// (Herb Sutter GotW #76) to obtain pointer-to-members to private variables in
// standard-compliant C++ without undefined behavior.
//
// COUPLING / MAINTENANCE WARNING:
// This creates a direct compile-time coupling with the internal implementation
// details of ExecuTorch's `TextLLMRunner` and `MultimodalRunner`. If upstream
// ExecuTorch renames or alters `pos_`, `prefill_next_token_`, or `metadata_`,
// this code will fail to compile and must be adjusted accordingly.
// ============================================================================

template <typename Tag, auto MemberPtr>
struct PrivateMemberAccessor {
    friend constexpr auto getPrivateMember(Tag /*tag*/) { return MemberPtr; }
};

struct TextRunnerPosTag {};
struct TextRunnerPrefillTag {};
struct TextRunnerMetadataTag {};

using executorch::extension::llm::TextLLMRunner;

template struct PrivateMemberAccessor<TextRunnerPosTag, &TextLLMRunner::pos_>;
constexpr auto getPrivateMember(TextRunnerPosTag /*tag*/);

template struct PrivateMemberAccessor<TextRunnerPrefillTag, &TextLLMRunner::prefill_next_token_>;
constexpr auto getPrivateMember(TextRunnerPrefillTag /*tag*/);

template struct PrivateMemberAccessor<TextRunnerMetadataTag, &TextLLMRunner::metadata_>;
constexpr auto getPrivateMember(TextRunnerMetadataTag /*tag*/);

struct MMRunnerPosTag {};
struct MMRunnerPrefillTag {};
struct MMRunnerMetadataTag {};

using executorch::extension::llm::MultimodalRunner;

template struct PrivateMemberAccessor<MMRunnerPosTag, &MultimodalRunner::pos_>;
constexpr auto getPrivateMember(MMRunnerPosTag /*tag*/);

template struct PrivateMemberAccessor<MMRunnerPrefillTag, &MultimodalRunner::prefill_next_token_>;
constexpr auto getPrivateMember(MMRunnerPrefillTag /*tag*/);

template struct PrivateMemberAccessor<MMRunnerMetadataTag, &MultimodalRunner::metadata_>;
constexpr auto getPrivateMember(MMRunnerMetadataTag /*tag*/);

int64_t getRunnerPos(executorch::extension::llm::IRunner *runner, bool isMultimodal) {
    if (runner == nullptr) {
        return 0;
    }
    if (!isMultimodal) {
        auto *r = dynamic_cast<TextLLMRunner *>(runner);
        if (r != nullptr) {
            return r->*getPrivateMember(TextRunnerPosTag{});
        }
        return 0;
    }
    auto *r = dynamic_cast<MultimodalRunner *>(runner);
    if (r != nullptr) {
        return r->*getPrivateMember(MMRunnerPosTag{});
    }
    return 0;
}

int64_t getRunnerMaxSeqLen(executorch::extension::llm::IRunner *runner, bool isMultimodal) {
    if (runner == nullptr) {
        return 0;
    }
    const std::unordered_map<std::string, int64_t> *meta = nullptr;
    if (!isMultimodal) {
        auto *r = dynamic_cast<TextLLMRunner *>(runner);
        if (r != nullptr) {
            meta = &(r->*getPrivateMember(TextRunnerMetadataTag{}));
        }
    } else {
        auto *r = dynamic_cast<MultimodalRunner *>(runner);
        if (r != nullptr) {
            meta = &(r->*getPrivateMember(MMRunnerMetadataTag{}));
        }
    }
    if (meta == nullptr) {
        return 0;
    }
    auto it = meta->find(executorch::extension::llm::kMaxSeqLen);
    if (it != meta->end()) {
        return it->second;
    }
    it = meta->find(executorch::extension::llm::kMaxContextLen);
    if (it != meta->end()) {
        return it->second;
    }
    return 0;
}

void setRunnerPos(executorch::extension::llm::IRunner *runner, bool isMultimodal, int64_t targetPos) {
    if (runner == nullptr) {
        return;
    }
    if (!isMultimodal) {
        auto *r = dynamic_cast<TextLLMRunner *>(runner);
        if (r != nullptr) {
            r->*getPrivateMember(TextRunnerPosTag{}) = targetPos;
            r->*getPrivateMember(TextRunnerPrefillTag{}) = std::nullopt;
        }
    } else {
        auto *r = dynamic_cast<MultimodalRunner *>(runner);
        if (r != nullptr) {
            r->*getPrivateMember(MMRunnerPosTag{}) = targetPos;
            r->*getPrivateMember(MMRunnerPrefillTag{}) = std::nullopt;
        }
    }
}

jsi::Object statsToJs(jsi::Runtime &rt, const executorch::extension::llm::Stats &stats) {
    jsi::Object obj(rt);
    obj.setProperty(rt, "numPromptTokens", static_cast<double>(stats.num_prompt_tokens));
    obj.setProperty(rt, "numGeneratedTokens", static_cast<double>(stats.num_generated_tokens));
    obj.setProperty(rt, "firstTokenMs", static_cast<double>(stats.first_token_ms));
    obj.setProperty(rt, "inferenceStartMs", static_cast<double>(stats.inference_start_ms));
    obj.setProperty(rt, "inferenceEndMs", static_cast<double>(stats.inference_end_ms));
    obj.setProperty(rt, "modelLoadStartMs", static_cast<double>(stats.model_load_start_ms));
    obj.setProperty(rt, "modelLoadEndMs", static_cast<double>(stats.model_load_end_ms));
    return obj;
}

std::vector<executorch::extension::llm::MultimodalInput> parsePrompt(
    jsi::Runtime &rt,
    const std::string &ctx,
    const jsi::Value &value,
    const std::vector<std::string> &supportedModalities) {

    if (value.isString()) {
        return {executorch::extension::llm::MultimodalInput(conversions::asType<std::string>(rt, ctx, value))};
    }

    auto arr = conversions::asType<jsi::Array>(rt, ctx, value);
    size_t len = arr.length(rt);

    std::vector<executorch::extension::llm::MultimodalInput> inputs;
    inputs.reserve(len);

    for (size_t i = 0; i < len; ++i) {
        auto elem = arr.getValueAtIndex(rt, i);
        std::string itemCtx = std::format("{}[{}]", ctx, i);

        if (elem.isString()) {
            inputs.emplace_back(conversions::asType<std::string>(rt, itemCtx, elem));
            continue;
        }
        auto mediaObj = conversions::asType<jsi::Object>(rt, itemCtx, elem);
        auto kind = conversions::getRequiredProperty<std::string>(rt, itemCtx, mediaObj, "kind");

        if (std::ranges::find(supportedModalities, kind) == supportedModalities.end()) {
            throw error::InvalidArgument(std::format("{}: Modality '{}' is not supported "
                                                     "by this runner instance",
                                                     itemCtx, kind));
        }

        if (kind == "image") {
            auto tensorJs = conversions::getRequiredProperty<jsi::Value>(rt, itemCtx, mediaObj, "image");
            auto tensorHost = tensor::fromJs(rt, itemCtx, tensorJs, DType::float32, {"C", "H", "W"});
            auto tensorLock = tensor::tryLockShared(rt, itemCtx, tensorHost);

            const auto &shape = tensorHost->shape_;
            const auto C = shape[0];
            const auto H = shape[1];
            const auto W = shape[2];

            std::vector<float> data(tensorHost->numel_);
            std::memcpy(data.data(), tensorHost->data_.get(), tensorHost->numel_ * sizeof(float));
            inputs.emplace_back(executorch::extension::llm::Image(std::move(data), W, H, C));
        } else if (kind == "audio") {
            auto tensorJs = conversions::getRequiredProperty<jsi::Value>(rt, itemCtx, mediaObj, "audio");
            auto tensorHost = tensor::fromJs(rt, itemCtx, tensorJs, DType::float32, {"batch", "n_bins", "n_frames"});
            auto tensorLock = tensor::tryLockShared(rt, itemCtx, tensorHost);

            const auto &shape = tensorHost->shape_;
            const auto batchSize = shape[0];
            const auto nBins = shape[1];
            const auto nFrames = shape[2];

            std::vector<float> data(tensorHost->numel_);
            std::memcpy(data.data(), tensorHost->data_.get(), tensorHost->numel_ * sizeof(float));
            inputs.emplace_back(executorch::extension::llm::Audio(std::move(data), batchSize, nBins, nFrames));
        } else {
            throw error::InvalidArgument(std::format("{}: Unsupported media kind '{}'", itemCtx, kind));
        }
    }

    return inputs;
}
} // namespace

LLMRunnerHostObject::LLMRunnerHostObject(const std::string &modelPath,
                                         const std::string &tokenizerPath,
                                         const std::vector<std::string> &modalities)
    : modelPath_(modelPath),
      tokenizerPath_(tokenizerPath),
      modalities_(modalities) {

    auto tokenizer = executorch::extension::llm::load_tokenizer(tokenizerPath);
    if (!tokenizer) {
        throw error::LoadFailed(std::format("LLMRunner: Failed to load runner tokenizer at path: {}", tokenizerPath));
    }

    if (modalities_.empty()) {
        runner_ = executorch::extension::llm::create_text_llm_runner(modelPath, std::move(tokenizer));
    } else {
        runner_ = executorch::extension::llm::create_multimodal_runner(modelPath, std::move(tokenizer));
    }

    if (!runner_) {
        throw error::LoadFailed("LLMRunner: Failed to create llm runner");
    }

    auto loadError = runner_->load();
    if (loadError != executorch::runtime::Error::Ok) {
        std::string errorMsg = executorch::runtime::to_string(loadError);
        throw error::LoadFailed(std::format("LLMRunner: Failed to load model: {}", errorMsg), loadError);
    }
}

std::unique_lock<std::mutex> LLMRunnerHostObject::tryLockUnique(std::string_view ctx) {
    std::unique_lock<std::mutex> lock(mutex_, std::try_to_lock);
    if (!lock.owns_lock()) {
        throw error::ResourceBusy(std::format("{}: Runner is already in use", ctx));
    }
    if (!runner_) {
        throw error::ResourceDisposed(std::format("{}: Runner has been disposed", ctx));
    }
    return lock;
}

jsi::Value LLMRunnerHostObject::get(jsi::Runtime &rt, const jsi::PropNameID &name) {
    auto nameStr = name.utf8(rt);

    if (nameStr == "modelPath") {
        return jsi::String::createFromUtf8(rt, modelPath_);
    }

    if (nameStr == "tokenizerPath") {
        return jsi::String::createFromUtf8(rt, tokenizerPath_);
    }

    if (nameStr == "modalities") {
        return conversions::toJsiArray(rt, modalities_);
    }

    if (nameStr == "generate") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count < 1) {
                throw error::InvalidArgument("LLMRunner.generate: Usage: generate(prompt, config?, onToken?)");
            }

            executorch::extension::llm::GenerationConfig config;
            if (count > 1 && !args[1].isUndefined() && !args[1].isNull()) {
                auto configObj = conversions::asType<jsi::Object>(rt, "LLMRunner.generate: config", args[1]);
                if (auto echoOpt = conversions::getOptionalProperty<bool>(rt, "LLMRunner.generate: config", configObj, "echo")) {
                    config.echo = *echoOpt;
                }
                if (auto ignoreEosOpt = conversions::getOptionalProperty<bool>(rt, "LLMRunner.generate: config", configObj, "ignoreEos")) {
                    config.ignore_eos = *ignoreEosOpt;
                }
                if (auto maxNewTokensOpt = conversions::getOptionalProperty<int32_t>(rt, "LLMRunner.generate: config", configObj, "maxNewTokens")) {
                    config.max_new_tokens = *maxNewTokensOpt;
                }
                if (auto tempOpt = conversions::getOptionalProperty<float>(rt, "LLMRunner.generate: config", configObj, "temperature")) {
                    config.temperature = *tempOpt;
                }
            }

            std::function<void(const std::string &)> tokenCallback;
            if (count > 2 && !args[2].isUndefined() && !args[2].isNull()) {
                auto tokenFn = std::make_shared<jsi::Function>(conversions::asType<jsi::Function>(rt, "LLMRunner.generate: onToken", args[2]));
                tokenCallback = [&rt, tokenFn](const std::string &token) {
                    tokenFn->call(rt, jsi::String::createFromUtf8(rt, token));
                };
            }

            auto finalStats = std::make_shared<executorch::extension::llm::Stats>();
            auto statsCallback = [finalStats](const executorch::extension::llm::Stats &stats) {
                finalStats->num_prompt_tokens = stats.num_prompt_tokens;
                finalStats->num_generated_tokens = stats.num_generated_tokens;
                finalStats->first_token_ms = stats.first_token_ms;
                finalStats->inference_start_ms = stats.inference_start_ms;
                finalStats->inference_end_ms = stats.inference_end_ms;
                finalStats->model_load_start_ms = stats.model_load_start_ms;
                finalStats->model_load_end_ms = stats.model_load_end_ms;
                finalStats->aggregate_sampling_time_ms = stats.aggregate_sampling_time_ms;
            };

            auto lock = self->tryLockUnique("LLMRunner.generate");

            auto genError = executorch::runtime::Error::Ok;
            if (self->modalities_.empty()) {
                auto prompt = conversions::asType<std::string>(rt, "LLMRunner.generate: prompt", args[0]);
                genError = self->runner_->generate(prompt, config, tokenCallback, statsCallback);
            } else {
                auto inputs = parsePrompt(rt, "LLMRunner.generate", args[0], self->modalities_);
                auto *multimodalRunner = dynamic_cast<executorch::extension::llm::MultimodalRunner *>(self->runner_.get());
                if (multimodalRunner == nullptr) {
                    throw error::InvalidArgument("LLMRunner.generate: Runner instance is not a multimodal model");
                }
                genError = multimodalRunner->generate(inputs, config, tokenCallback, statsCallback);
            }

            if (genError != executorch::runtime::Error::Ok) {
                std::string errorMsg = executorch::runtime::to_string(genError);
                throw error::ExecutionFailed(std::format("LLMRunner.generate: Failed to generate: {}", errorMsg), genError);
            }

            return statsToJs(rt, *finalStats);
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "generate"), 1, error::guarded(fnBody));
    }

    if (nameStr == "prefill") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count < 1) {
                throw error::InvalidArgument("LLMRunner.prefill: Usage: prefill(prompt)");
            }

            auto lock = self->tryLockUnique("LLMRunner.prefill");

            auto inputs = parsePrompt(rt, "LLMRunner.prefill", args[0], self->modalities_);
            auto result = self->runner_->prefill(inputs);

            if (!result.ok()) {
                std::string errorMsg = executorch::runtime::to_string(result.error());
                throw error::ExecutionFailed(std::format("LLMRunner.prefill: Failed: {}", errorMsg), result.error());
            }

            return jsi::Value::undefined();
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "prefill"), 1, error::guarded(fnBody));
    }

    if (nameStr == "stop") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime & /*rt*/, const jsi::Value & /*thisVal*/, const jsi::Value * /*args*/, size_t /*count*/) -> jsi::Value {
            // Intentionally no mutex here: stop() is designed to be called
            // concurrently to interrupt an in-progress generate(). Taking the
            // lock would block until generate() finishes, defeating the point.
            // runner_ is only cleared by dispose() on this same (JS) thread,
            // so reading it lock-free here is safe.
            if (!self->runner_) {
                throw error::ResourceDisposed("LLMRunner.stop: Runner has been disposed");
            }
            self->runner_->stop();
            return jsi::Value::undefined();
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "stop"), 0, error::guarded(fnBody));
    }

    if (nameStr == "getKVCacheState") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value * /*args*/, size_t /*count*/) -> jsi::Value {
            auto lock = self->tryLockUnique("LLMRunner.getKVCacheState");

            bool isMultimodal = !self->modalities_.empty();
            int64_t pos = getRunnerPos(self->runner_.get(), isMultimodal);
            int64_t maxSeqLen = getRunnerMaxSeqLen(self->runner_.get(), isMultimodal);
            int64_t remaining = std::max<int64_t>(0, maxSeqLen - pos);
            double usageRatio = maxSeqLen > 0 ? static_cast<double>(pos) / static_cast<double>(maxSeqLen) : 0.0;

            jsi::Object obj(rt);
            obj.setProperty(rt, "pos", static_cast<double>(pos));
            obj.setProperty(rt, "maxSeqLen", static_cast<double>(maxSeqLen));
            obj.setProperty(rt, "remainingTokens", static_cast<double>(remaining));
            obj.setProperty(rt, "usageRatio", usageRatio);
            return obj;
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "getKVCacheState"), 0, error::guarded(fnBody));
    }

    if (nameStr == "reset") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count > 1) {
                throw error::InvalidArgument("LLMRunner.reset: Usage: reset(targetPos?)");
            }

            auto lock = self->tryLockUnique("LLMRunner.reset");
            if (count == 0 || args[0].isUndefined()) {
                (*self->runner_).reset();
            } else {
                auto targetPos = static_cast<int64_t>(conversions::asType<uint64_t>(rt, "LLMRunner.reset", args[0]));
                setRunnerPos(self->runner_.get(), !self->modalities_.empty(), targetPos);
            }

            return jsi::Value::undefined();
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "reset"), 1, error::guarded(fnBody));
    }

    if (nameStr == "dispose") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime & /*rt*/, const jsi::Value & /*thisVal*/, const jsi::Value * /*args*/, size_t count) -> jsi::Value {
            if (count != 0) {
                throw error::InvalidArgument("dispose: Usage: dispose()");
            }

            // Signal stop before locking so any in-progress generate() exits
            // quickly; we then block on the lock until it returns and clear
            // the runner, which frees the model. Idempotent: a second
            // dispose() finds a null runner_ and is a no-op.
            if (self->runner_) {
                self->runner_->stop();
            }

            std::unique_lock<std::mutex> lock(self->mutex_);
            self->runner_ = nullptr;

            return jsi::Value::undefined();
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "dispose"), 0, error::guarded(fnBody));
    }

    return jsi::Value::undefined();
}

std::vector<jsi::PropNameID> LLMRunnerHostObject::getPropertyNames(jsi::Runtime &rt) {
    std::vector<jsi::PropNameID> properties;
    properties.push_back(jsi::PropNameID::forAscii(rt, "modelPath"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "tokenizerPath"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "modalities"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "prefill"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "generate"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "stop"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "getKVCacheState"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "reset"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "dispose"));
    return properties;
}

void install_createLLMRunner(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "createLLMRunner";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count < 2 || count > 3) {
            throw error::InvalidArgument("createLLMRunner: Usage: createLLMRunner(modelPath, tokenizerPath, modalities?)");
        }

        auto modelPath = conversions::asType<std::string>(rt, "createLLMRunner: modelPath", args[0]);
        auto tokenizerPath = conversions::asType<std::string>(rt, "createLLMRunner: tokenizerPath", args[1]);

        std::vector<std::string> modalities;
        if (count > 2 && !args[2].isNull() && !args[2].isUndefined()) {
            modalities = conversions::asVector<std::string>(rt, "createLLMRunner: modalities", args[2]);
        }

        auto runnerInstance = std::make_shared<LLMRunnerHostObject>(modelPath, tokenizerPath, std::move(modalities));
        return jsi::Object::createFromHostObject(rt, runnerInstance);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 2, error::guarded(fnBody)));
}
} // namespace rnexecutorch::extensions::llm
