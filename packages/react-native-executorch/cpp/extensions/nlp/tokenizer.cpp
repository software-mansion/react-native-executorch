#include "tokenizer.h"

#include <cstdint>
#include <format>
#include <stdexcept>
#include <utility>

#include <pytorch/tokenizers/error.h>

#include "core/conversions.h"

namespace rnexecutorch::extensions::nlp::tokenizer {
namespace jsi = facebook::jsi;
namespace conversions = rnexecutorch::core::conversions;

namespace {
// Number of BOS/EOS tokens to add on top of what the tokenizer.json defines.
// Keeping these at 0 means encoding follows the tokenizer's own post_processor
// (i.e. special tokens are added exactly as configured in tokenizer.json).
constexpr uint64_t kNumAddedBosTokens = 0;
constexpr uint64_t kNumAddedEosTokens = 0;

// tokenizers::Error is its own enum (not executorch::runtime::Error), and the
// tokenizers library ships no to_string for it, so map it to a readable name.
std::string toString(tokenizers::Error error) {
    switch (error) {
    case tokenizers::Error::Ok:
        return "Ok";
    case tokenizers::Error::Internal:
        return "Internal";
    case tokenizers::Error::Uninitialized:
        return "Uninitialized";
    case tokenizers::Error::OutOfRange:
        return "OutOfRange";
    case tokenizers::Error::LoadFailure:
        return "LoadFailure";
    case tokenizers::Error::EncodeFailure:
        return "EncodeFailure";
    case tokenizers::Error::Base64DecodeFailure:
        return "Base64DecodeFailure";
    case tokenizers::Error::ParseFailure:
        return "ParseFailure";
    case tokenizers::Error::DecodeFailure:
        return "DecodeFailure";
    case tokenizers::Error::RegexFailure:
        return "RegexFailure";
    }
    return "Unknown(" + std::to_string(static_cast<int32_t>(error)) + ")";
}
} // namespace

TokenizerHostObject::TokenizerHostObject(std::string tokenizerPath)
    : tokenizerPath_(std::move(tokenizerPath)),
      tokenizer_(std::make_unique<tokenizers::HFTokenizer>()) {
    auto error = tokenizer_->load(tokenizerPath_);
    if (error != tokenizers::Error::Ok) {
        throw std::runtime_error("Failed to load tokenizer from '" + tokenizerPath_ +
                                 "': " + toString(error));
    }
}

jsi::Value TokenizerHostObject::get(jsi::Runtime &rt, const jsi::PropNameID &name) {
    auto nameStr = name.utf8(rt);

    if (nameStr == "path") {
        return jsi::String::createFromUtf8(rt, tokenizerPath_);
    }

    if (nameStr == "encode") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count != 1) {
                throw jsi::JSError(rt, "encode: Usage: encode(text)");
            }

            if (!args[0].isString()) {
                throw jsi::JSError(rt, "encode: Expected arg0 to be a string");
            }

            std::unique_lock<std::mutex> lock(self->mutex_, std::try_to_lock);
            if (!lock.owns_lock()) {
                throw jsi::JSError(rt, "encode: Tokenizer is currently in use");
            }

            if (!self->tokenizer_) {
                throw jsi::JSError(rt, "encode: Tokenizer has been disposed");
            }

            auto text = conversions::asType<std::string>(rt, "encode: text", args[0]);
            auto result = self->tokenizer_->encode(text, kNumAddedBosTokens, kNumAddedEosTokens);
            if (!result.ok()) {
                throw jsi::JSError(rt, std::format("encode: Failed to encode input: {}", toString(result.error())));
            }

            return conversions::toJsiArray(rt, result.get());
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "encode"), 1, fnBody);
    }

    if (nameStr == "decode") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count < 1 || count > 2) {
                throw jsi::JSError(rt, "decode: Usage: decode(tokens, skipSpecialTokens?)");
            }

            // skipSpecialTokens is optional and defaults to true.
            bool skipSpecialTokens = true;
            if (count == 2 && !args[1].isUndefined()) {
                skipSpecialTokens = conversions::asType<bool>(rt, "decode: skipSpecialTokens", args[1]);
            }

            std::unique_lock<std::mutex> lock(self->mutex_, std::try_to_lock);
            if (!lock.owns_lock()) {
                throw jsi::JSError(rt, "decode: Tokenizer is currently in use");
            }

            if (!self->tokenizer_) {
                throw jsi::JSError(rt, "decode: Tokenizer has been disposed");
            }

            auto tokens = conversions::asVector<uint64_t>(rt, "decode: tokens", args[0]);

            if (tokens.empty()) {
                return jsi::String::createFromUtf8(rt, "");
            }

            auto result = self->tokenizer_->decode(tokens, skipSpecialTokens);
            if (!result.ok()) {
                throw jsi::JSError(rt, std::format("decode: Failed to decode tokens: {}", toString(result.error())));
            }

            return jsi::String::createFromUtf8(rt, result.get());
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "decode"), 1, fnBody);
    }

    if (nameStr == "getVocabSize") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value * /*args*/, size_t count) -> jsi::Value {
            if (count != 0) {
                throw jsi::JSError(rt, "getVocabSize: Usage: getVocabSize()");
            }

            std::unique_lock<std::mutex> lock(self->mutex_, std::try_to_lock);
            if (!lock.owns_lock()) {
                throw jsi::JSError(rt, "getVocabSize: Tokenizer is currently in use");
            }

            if (!self->tokenizer_) {
                throw jsi::JSError(rt, "getVocabSize: Tokenizer has been disposed");
            }

            return static_cast<double>(self->tokenizer_->vocab_size());
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "getVocabSize"), 0, fnBody);
    }

    if (nameStr == "idToToken") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count != 1) {
                throw jsi::JSError(rt, "idToToken: Usage: idToToken(id)");
            }

            if (!args[0].isNumber()) {
                throw jsi::JSError(rt, "idToToken: Expected arg0 to be a number");
            }

            std::unique_lock<std::mutex> lock(self->mutex_, std::try_to_lock);
            if (!lock.owns_lock()) {
                throw jsi::JSError(rt, "idToToken: Tokenizer is currently in use");
            }

            if (!self->tokenizer_) {
                throw jsi::JSError(rt, "idToToken: Tokenizer has been disposed");
            }

            auto tokenId = conversions::asType<uint64_t>(rt, "idToToken: id", args[0]);
            auto result = self->tokenizer_->id_to_piece(tokenId);
            if (!result.ok()) {
                throw jsi::JSError(rt, std::format("idToToken: Failed to convert id to token: {}", toString(result.error())));
            }

            return jsi::String::createFromUtf8(rt, result.get());
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "idToToken"), 1, fnBody);
    }

    if (nameStr == "tokenToId") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count != 1) {
                throw jsi::JSError(rt, "tokenToId: Usage: tokenToId(token)");
            }

            std::unique_lock<std::mutex> lock(self->mutex_, std::try_to_lock);
            if (!lock.owns_lock()) {
                throw jsi::JSError(rt, "tokenToId: Tokenizer is currently in use");
            }

            if (!self->tokenizer_) {
                throw jsi::JSError(rt, "tokenToId: Tokenizer has been disposed");
            }

            auto token = conversions::asType<std::string>(rt, "tokenToId: token", args[0]);
            auto result = self->tokenizer_->piece_to_id(token);
            if (!result.ok()) {
                throw jsi::JSError(rt, std::format("tokenToId: Failed to convert token to id: {}", toString(result.error())));
            }

            return static_cast<double>(result.get());
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "tokenToId"), 1, fnBody);
    }

    if (nameStr == "dispose") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value * /*args*/, size_t count) -> jsi::Value {
            if (count != 0) {
                throw jsi::JSError(rt, "dispose: Usage: dispose()");
            }

            std::unique_lock<std::mutex> lock(self->mutex_);

            if (!self->tokenizer_) {
                throw jsi::JSError(rt, "dispose: Tokenizer has already been disposed");
            }

            self->tokenizer_.reset();

            return jsi::Value::undefined();
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "dispose"), 0, fnBody);
    }

    return jsi::Value::undefined();
}

std::vector<facebook::jsi::PropNameID> TokenizerHostObject::getPropertyNames(jsi::Runtime &rt) {
    std::vector<facebook::jsi::PropNameID> properties;
    properties.push_back(jsi::PropNameID::forAscii(rt, "path"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "encode"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "decode"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "getVocabSize"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "idToToken"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "tokenToId"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "dispose"));
    return properties;
}

void install_loadTokenizer(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "loadTokenizer";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1) {
            throw jsi::JSError(rt, "loadTokenizer: Usage: loadTokenizer(arg0)");
        }

        auto tokenizerPath = conversions::asType<std::string>(rt, "loadTokenizer: path", args[0]);
        try {
            auto tokenizerInstance = std::make_shared<TokenizerHostObject>(tokenizerPath);
            return jsi::Object::createFromHostObject(rt, tokenizerInstance);
        } catch (const std::exception &e) {
            throw jsi::JSError(rt, std::format("loadTokenizer: {}", e.what()));
        }
    };
    auto fn = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 1, fnBody);

    module.setProperty(rt, name, fn);
}
} // namespace rnexecutorch::extensions::nlp::tokenizer
