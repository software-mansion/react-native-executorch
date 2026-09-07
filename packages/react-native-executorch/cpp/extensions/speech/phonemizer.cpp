#include "phonemizer.h"

#include <format>
#include <mutex>
#include <optional>
#include <stdexcept>
#include <string>
#include <string_view>

#include "core/conversions.h"
#include "core/error.h"

#include <phonemis/utils/conversions.h>

namespace rnexecutorch::extensions::speech {

namespace jsi = facebook::jsi;
namespace conversions = rnexecutorch::core::conversions;
namespace error = rnexecutorch::core::error;
using phonemis::utils::conversions::u32_to_utf8;
using phonemis::utils::conversions::utf8_to_u32;

PhonemizerHostObject::PhonemizerHostObject(
    const std::string &lang,
    const std::optional<std::string> &taggerPath,
    const std::optional<std::string> &lexiconPath,
    const std::optional<std::string> &neuralModelPath)
    : pipeline_(std::make_unique<phonemis::Pipeline>(phonemis::Config{
          .lang = lang,
          .tagger = taggerPath ? std::make_optional(phonemis::tagger::Config{.data_filepath = taggerPath})
                               : std::nullopt,
          .phonemizer = phonemis::phonemizer::Config{
              .lang = lang,
              .lexicon_filepath = lexiconPath,
              .nn_model_filepath = neuralModelPath,
          }})) {}

std::unique_lock<std::mutex> PhonemizerHostObject::tryLockUnique(std::string_view context) {
    std::unique_lock<std::mutex> lock(mutex_, std::try_to_lock);
    if (!lock.owns_lock()) {
        throw error::ResourceBusy(std::format("{} is currently in use", context));
    }
    if (!pipeline_) {
        throw error::ResourceDisposed(std::format("{} has been disposed", context));
    }

    return lock;
}

jsi::Value PhonemizerHostObject::get(jsi::Runtime &rt,
                                     const jsi::PropNameID &name) {
    auto nameStr = name.utf8(rt);

    if (nameStr == "phonemize") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count != 1) {
                throw error::InvalidArgument("phonemize: Usage: phonemize(text)");
            }

            auto lock = self->tryLockUnique("phonemize: Phonemizer");

            auto utf8 = conversions::asType<std::string>(rt, "phonemize: text", args[0]);
            auto phonemes = (*self->pipeline_)(utf8_to_u32(utf8));

            return jsi::String::createFromUtf8(rt, u32_to_utf8(phonemes));
        };
        return jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forAscii(rt, "phonemize"), 1, error::guarded(fnBody));
    }

    if (nameStr == "dispose") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime & /*rt*/, const jsi::Value &, const jsi::Value * /*args*/, size_t count) -> jsi::Value {
            if (count != 0) {
                throw error::InvalidArgument("dispose: Usage: dispose()");
            }

            std::unique_lock<std::mutex> lock(self->mutex_);
            self->pipeline_.reset();
            return jsi::Value::undefined();
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "dispose"), 0, error::guarded(fnBody));
    }

    return jsi::Value::undefined();
}

std::vector<jsi::PropNameID> PhonemizerHostObject::getPropertyNames(
    jsi::Runtime &rt) {
    std::vector<jsi::PropNameID> props;
    props.push_back(jsi::PropNameID::forAscii(rt, "phonemize"));
    props.push_back(jsi::PropNameID::forAscii(rt, "dispose"));
    return props;
}

void install_createPhonemizer(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "createPhonemizer";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &,
                     const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1) {
            throw error::InvalidArgument("createPhonemizer: Usage: createPhonemizer(config)");
        }

        constexpr auto *ctx = "createPhonemizer: config";
        auto config = conversions::asType<jsi::Object>(rt, ctx, args[0]);

        auto lang = conversions::getRequiredProperty<std::string>(rt, ctx, config, "lang");
        auto taggerPath = conversions::getOptionalProperty<std::string>(rt, ctx, config, "taggerSource");
        auto lexiconPath = conversions::getOptionalProperty<std::string>(rt, ctx, config, "lexiconSource");
        auto neuralPath = conversions::getOptionalProperty<std::string>(rt, ctx, config, "neuralModelSource");

        try {
            auto instance = std::make_shared<PhonemizerHostObject>(lang, taggerPath, lexiconPath, neuralPath);
            return jsi::Object::createFromHostObject(rt, instance);
        } catch (const std::exception &e) {
            throw error::LoadFailed(std::format("createPhonemizer: {}", e.what()));
        }
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 1, error::guarded(fnBody)));
}

} // namespace rnexecutorch::extensions::speech
