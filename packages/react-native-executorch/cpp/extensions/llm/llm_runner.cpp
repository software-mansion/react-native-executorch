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

#include <executorch/extension/llm/runner/llm_runner_helper.h>
#include <executorch/extension/llm/runner/multimodal_input.h>
#include <executorch/extension/llm/runner/multimodal_runner.h>
#include <executorch/extension/llm/runner/stats.h>
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
jsi::Object statsToJSI(jsi::Runtime &rt, const executorch::extension::llm::Stats &stats) {
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

std::vector<executorch::extension::llm::MultimodalInput> parseMultimodalPromptArray(
    jsi::Runtime &rt,
    const std::string &ctx,
    const jsi::Value &value,
    const std::vector<std::string> &supportedModalities) {

    auto arr = conversions::asType<jsi::Array>(rt, std::format("{}: prompt array", ctx), value);
    size_t len = arr.length(rt);

    std::vector<executorch::extension::llm::MultimodalInput> inputs;
    inputs.reserve(len);

    for (size_t i = 0; i < len; ++i) {
        auto elem = arr.getValueAtIndex(rt, i);
        if (elem.isString()) {
            inputs.emplace_back(elem.asString(rt).utf8(rt));
        } else if (elem.isObject()) {
            auto mediaObj = elem.asObject(rt);
            std::string itemCtx = std::format("{}[{}]", ctx, i);
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
        } else {
            throw error::InvalidArgument(std::format("{}: Prompt array elements must be strings or media objects", ctx));
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

    runner_ = executorch::extension::llm::create_multimodal_runner(modelPath, std::move(tokenizer));
    if (!runner_) {
        throw error::LoadFailed("LLMRunner: Failed to create llm runner");
    }

    auto loadError = runner_->load();
    if (loadError != executorch::runtime::Error::Ok) {
        std::string errorMsg = executorch::runtime::to_string(loadError);
        throw error::LoadFailed(std::format("LLMRunner: Failed to load model: {}", errorMsg), loadError);
    }
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

            // Hold the lock for the whole call so dispose() cannot free the
            // runner mid-generation (dispose blocks on this lock until we
            // return). try_to_lock: only one prefill/generate may run at a
            // time, so fail fast instead of queuing. stop() is lock-free and
            // can still interrupt us.
            std::unique_lock<std::mutex> lock(self->mutex_, std::try_to_lock);
            if (!lock.owns_lock()) {
                throw error::ResourceBusy("LLMRunner.generate: Runner is already in use");
            }
            if (!self->runner_) {
                throw error::ResourceDisposed("LLMRunner.generate: Runner has been disposed");
            }

            auto genError = executorch::runtime::Error::Ok;
            if (args[0].isString()) {
                std::string prompt = args[0].asString(rt).utf8(rt);
                genError = self->runner_->generate(prompt, config, tokenCallback, statsCallback);
            } else {
                auto inputs = parseMultimodalPromptArray(rt, "LLMRunner.generate", args[0], self->modalities_);
                genError = self->runner_->generate(inputs, config, tokenCallback, statsCallback);
            }

            if (genError != executorch::runtime::Error::Ok) {
                std::string errorMsg = executorch::runtime::to_string(genError);
                throw error::ExecutionFailed(std::format("LLMRunner.generate: Failed to generate: {}", errorMsg), genError);
            }

            return statsToJSI(rt, *finalStats);
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "generate"), 1, error::guarded(fnBody));
    }

    if (nameStr == "prefill") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count < 1) {
                throw error::InvalidArgument("LLMRunner.prefill: Usage: prefill(prompt)");
            }

            // Lock held for the whole call, same as generate().
            std::unique_lock<std::mutex> lock(self->mutex_, std::try_to_lock);
            if (!lock.owns_lock()) {
                throw error::ResourceBusy("LLMRunner.prefill: Runner is already in use");
            }
            if (!self->runner_) {
                throw error::ResourceDisposed("LLMRunner.prefill: Runner has been disposed");
            }

            auto result = args[0].isString()
                              ? self->runner_->prefill(args[0].asString(rt).utf8(rt))
                              : self->runner_->prefill(parseMultimodalPromptArray(rt, "LLMRunner.prefill", args[0], self->modalities_));

            if (result.error() != executorch::runtime::Error::Ok) {
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
