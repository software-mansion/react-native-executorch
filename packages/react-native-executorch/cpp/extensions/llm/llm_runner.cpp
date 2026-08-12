#ifdef __clang__
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
#endif

#include "llm_runner.h"
#include "core/conversions.h"
#include "core/error.h"
#include <executorch/extension/llm/runner/irunner.h>
#include <executorch/extension/llm/runner/llm_runner_helper.h>
#include <executorch/extension/llm/runner/multimodal_input.h>
#include <executorch/extension/llm/runner/stats.h>

namespace rnexecutorch::extensions::llm {
namespace jsi = facebook::jsi;
namespace conversions = rnexecutorch::core::conversions;
namespace error = rnexecutorch::core::error;

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
} // namespace

LLMRunnerHostObject::LLMRunnerHostObject(const std::string &modelPath,
                                         const std::string &tokenizerPath)
    : modelPath_(modelPath),
      tokenizerPath_(tokenizerPath) {
    auto tokenizer = executorch::extension::llm::load_tokenizer(tokenizerPath);
    if (!tokenizer) {
        throw error::LoadFailed("LLMRunner: Failed to load runner tokenizer at path: " + tokenizerPath);
    }

    runner_ = executorch::extension::llm::create_text_llm_runner(modelPath, std::move(tokenizer));
    if (!runner_) {
        throw error::LoadFailed("LLMRunner: Failed to create text llm runner");
    }

    auto loadError = runner_->load();
    if (loadError != executorch::runtime::Error::Ok) {
        std::string errorMsg = executorch::runtime::to_string(loadError);
        throw error::LoadFailed("LLMRunner: Failed to load model: " + errorMsg, loadError);
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

    if (nameStr == "generate") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count < 1) {
                throw error::InvalidArgument("LLMRunner.generate: Usage: generate(prompt, config?, onToken?)");
            }

            std::string prompt = conversions::asType<std::string>(rt, "LLMRunner.generate: prompt", args[0]);

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
            auto error = self->runner_->generate(prompt, config, tokenCallback, statsCallback);

            if (error != executorch::runtime::Error::Ok) {
                std::string errorMsg = executorch::runtime::to_string(error);
                throw error::ExecutionFailed("LLMRunner.generate: Failed to generate: " + errorMsg, error);
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

            std::string prompt = conversions::asType<std::string>(rt, "LLMRunner.prefill: prompt", args[0]);

            // Lock held for the whole call, same as generate().
            std::unique_lock<std::mutex> lock(self->mutex_, std::try_to_lock);
            if (!lock.owns_lock()) {
                throw error::ResourceBusy("LLMRunner.prefill: Runner is already in use");
            }
            if (!self->runner_) {
                throw error::ResourceDisposed("LLMRunner.prefill: Runner has been disposed");
            }
            auto result = self->runner_->prefill({executorch::extension::llm::make_text_input(prompt)});
            if (result.error() != executorch::runtime::Error::Ok) {
                std::string errorMsg = executorch::runtime::to_string(result.error());
                throw error::ExecutionFailed("LLMRunner.prefill: Failed: " + errorMsg, result.error());
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
    properties.push_back(jsi::PropNameID::forAscii(rt, "prefill"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "generate"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "stop"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "dispose"));
    return properties;
}

void install_createLLMRunner(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "createLLMRunner";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) {
            throw error::InvalidArgument("createLLMRunner: Usage: createLLMRunner(modelPath, tokenizerPath)");
        }

        auto modelPath = conversions::asType<std::string>(rt, "createLLMRunner: modelPath", args[0]);
        auto tokenizerPath = conversions::asType<std::string>(rt, "createLLMRunner: tokenizerPath", args[1]);

        auto runnerInstance = std::make_shared<LLMRunnerHostObject>(modelPath, tokenizerPath);
        return jsi::Object::createFromHostObject(rt, runnerInstance);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 2, error::guarded(fnBody)));
}
} // namespace rnexecutorch::extensions::llm
