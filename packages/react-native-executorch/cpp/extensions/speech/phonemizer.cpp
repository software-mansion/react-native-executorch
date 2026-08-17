#include "phonemizer.h"

#include <format>
#include <stdexcept>
#include <string>

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
    const std::string &taggerPath,
    const std::string &lexiconPath,
    const std::string &neuralModelPath)
    : pipeline_(std::make_unique<phonemis::Pipeline>(phonemis::Config{
          .lang = lang,
          .tagger = taggerPath.empty()
                        ? std::optional<phonemis::tagger::Config>{}
                        : std::make_optional(phonemis::tagger::Config{
                              .data_filepath = taggerPath}),
          .phonemizer = phonemis::phonemizer::Config{
              .lang = lang,
              .lexicon_filepath = lexiconPath.empty()
                                      ? std::nullopt
                                      : std::make_optional(lexiconPath),
              .nn_model_filepath = neuralModelPath.empty()
                                       ? std::nullopt
                                       : std::make_optional(neuralModelPath),
          }})) {}

jsi::Value PhonemizerHostObject::get(jsi::Runtime &rt,
                                     const jsi::PropNameID &name) {
    auto nameStr = name.utf8(rt);

    if (nameStr == "phonemize") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value &,
                             const jsi::Value *args,
                             size_t count) -> jsi::Value {
            if (count != 1) {
                throw error::InvalidArgument("phonemize: Usage: phonemize(text)");
            }
            if (!self->pipeline_) {
                throw error::ResourceDisposed("phonemize: Phonemizer has been disposed");
            }

            auto utf8 = conversions::asType<std::string>(rt, "phonemize: text", args[0]);
            auto phonemes = (*self->pipeline_)(utf8_to_u32(utf8));

            return jsi::String::createFromUtf8(rt, u32_to_utf8(phonemes));
        };
        return jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forAscii(rt, "phonemize"), 1, error::guarded(fnBody));
    }

    if (nameStr == "dispose") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime & /*rt*/, const jsi::Value &,
                             const jsi::Value * /*args*/,
                             size_t count) -> jsi::Value {
            if (count != 0) {
                throw error::InvalidArgument("dispose: Usage: dispose()");
            }
            self->pipeline_.reset();
            return jsi::Value::undefined();
        };
        return jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forAscii(rt, "dispose"), 0, error::guarded(fnBody));
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
        if (count != 4) {
            throw error::InvalidArgument("createPhonemizer: Usage: createPhonemizer(lang, "
                                         "taggerPath, lexiconPath, neuralPath)");
        }

        auto lang = conversions::asType<std::string>(rt, "createPhonemizer: lang", args[0]);
        auto taggerPath = conversions::asType<std::string>(rt, "createPhonemizer: taggerPath", args[1]);
        auto lexiconPath = conversions::asType<std::string>(rt, "createPhonemizer: lexiconPath", args[2]);
        auto neuralPath = conversions::asType<std::string>(rt, "createPhonemizer: neuralPath", args[3]);

        try {
            auto instance = std::make_shared<PhonemizerHostObject>(
                lang, taggerPath, lexiconPath, neuralPath);
            return jsi::Object::createFromHostObject(rt, instance);
        } catch (const std::exception &e) {
            throw error::LoadFailed(std::format("createPhonemizer: {}", e.what()));
        }
    };

    module.setProperty(rt, name,
                       jsi::Function::createFromHostFunction(
                           rt, jsi::PropNameID::forAscii(rt, name), 4, error::guarded(fnBody)));
}

} // namespace rnexecutorch::extensions::speech
