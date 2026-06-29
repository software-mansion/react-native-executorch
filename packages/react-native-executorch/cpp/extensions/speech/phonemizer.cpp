#include "phonemizer.h"
#include <phonemis/utils/conversions.h>

namespace mylib::extensions::speech {

namespace jsi = facebook::jsi;
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
            if (count < 1 || !args[0].isString()) {
                throw jsi::JSError(rt, "Phonemizer.phonemize: Usage: phonemize(text)");
            }

            std::string utf8 = args[0].asString(rt).utf8(rt);
            auto utf32 = utf8_to_u32(utf8);
            auto phonemes = (*self->pipeline_)(utf32);
            auto result = u32_to_utf8(phonemes);

            return jsi::String::createFromUtf8(rt, result);
        };
        return jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forAscii(rt, "phonemize"), 1, fnBody);
    }

    if (nameStr == "dispose") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value &,
                             const jsi::Value * /*args*/,
                             size_t count) -> jsi::Value {
            if (count != 0) {
                throw jsi::JSError(rt, "dispose: Usage: dispose()");
            }
            self->pipeline_.reset();
            return jsi::Value::undefined();
        };
        return jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forAscii(rt, "dispose"), 0, fnBody);
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
    auto name = "createPhonemizer";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &,
                     const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 4) {
            throw jsi::JSError(rt, "createPhonemizer: Usage: createPhonemizer(lang, "
                                   "taggerPath, lexiconPath, neuralPath)");
        }
        if (!args[0].isString() || !args[1].isString() ||
            !args[2].isString() || !args[3].isString()) {
            throw jsi::JSError(rt, "createPhonemizer: Expected arguments to be strings");
        }

        auto lang = args[0].asString(rt).utf8(rt);
        auto taggerPath = args[1].asString(rt).utf8(rt);
        auto lexiconPath = args[2].asString(rt).utf8(rt);
        auto neuralPath = args[3].asString(rt).utf8(rt);

        try {
            auto instance = std::make_shared<PhonemizerHostObject>(
                lang, taggerPath, lexiconPath, neuralPath);
            return jsi::Object::createFromHostObject(rt, instance);
        } catch (const std::exception &e) {
            throw jsi::JSError(rt, std::string("createPhonemizer: ") + e.what());
        }
    };

    module.setProperty(rt, name,
                       jsi::Function::createFromHostFunction(
                           rt, jsi::PropNameID::forAscii(rt, name), 4, fnBody));
}

} // namespace mylib::extensions::speech
