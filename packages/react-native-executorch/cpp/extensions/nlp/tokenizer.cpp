#include "tokenizer.h"

#include <cstdint>
#include <format>
#include <stdexcept>
#include <utility>

#include "core/conversions.h"

#include <pytorch/tokenizers/error.h>

#include "core/error.h"
namespace {
namespace error = rnexecutorch::core::error;
using rnexecutorch::core::error::CodedError;
using rnexecutorch::core::error::ErrorCode;
} // namespace

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

template <typename T>
T unwrap(jsi::Runtime & /*rt*/, const std::string &ctx, tokenizers::Result<T> result) {
    if (!result.ok()) {
        throw CodedError(ErrorCode::TokenizerError, std::format("{}: {}", ctx, toString(result.error())));
    }
    return std::move(result.get());
}
} // namespace

TokenizerHostObject::TokenizerHostObject(std::string tokenizerPath)
    : tokenizerPath_(std::move(tokenizerPath)),
      tokenizer_(std::make_unique<tokenizers::HFTokenizer>()) {
    auto error = tokenizer_->load(tokenizerPath_);
    if (error != tokenizers::Error::Ok) {
        throw CodedError(ErrorCode::TokenizerError, std::format("Failed to load tokenizer from '{}': {}",
                                                                tokenizerPath_, toString(error)));
    }
}

std::unique_lock<std::mutex> TokenizerHostObject::tryLockUnique(jsi::Runtime & /*rt*/,
                                                                std::string_view context) {
    std::unique_lock<std::mutex> lock(mutex_, std::try_to_lock);
    if (!lock.owns_lock()) {
        throw CodedError(ErrorCode::ResourceBusy, std::format("{} is currently in use", context));
    }
    if (!tokenizer_) {
        throw CodedError(ErrorCode::ResourceDisposed, std::format("{} has been disposed", context));
    }
    return lock;
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
                throw CodedError(ErrorCode::InvalidArgument, "encode: Usage: encode(text)");
            }

            auto lock = self->tryLockUnique(rt, "encode: Tokenizer");

            auto text = conversions::asType<std::string>(rt, "encode: text", args[0]);
            auto tokens = unwrap(rt, "encode: Failed to encode input",
                                 self->tokenizer_->encode(text, kNumAddedBosTokens, kNumAddedEosTokens));

            // Token ids are non-negative and well below 2^31, so int32 is lossless.
            return conversions::toJsiTypedArray(rt, std::vector<int32_t>(tokens.begin(), tokens.end()));
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "encode"), 1, error::guarded(fnBody));
    }

    if (nameStr == "decode") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count < 1 || count > 2) {
                throw CodedError(ErrorCode::InvalidArgument, "decode: Usage: decode(tokens, skipSpecialTokens?)");
            }

            // skipSpecialTokens is optional and defaults to true.
            bool skipSpecialTokens = true;
            if (count == 2 && !args[1].isUndefined()) {
                skipSpecialTokens = conversions::asType<bool>(rt, "decode: skipSpecialTokens", args[1]);
            }

            auto lock = self->tryLockUnique(rt, "decode: Tokenizer");

            auto ids = conversions::fromJsiTypedArray<int32_t>(rt, "decode: tokens", args[0]);
            std::vector<uint64_t> tokens(ids.begin(), ids.end());

            if (tokens.empty()) {
                return jsi::String::createFromUtf8(rt, "");
            }

            auto text = unwrap(rt, "decode: Failed to decode tokens",
                               self->tokenizer_->decode(tokens, skipSpecialTokens));

            return jsi::String::createFromUtf8(rt, text);
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "decode"), 1, error::guarded(fnBody));
    }

    if (nameStr == "getVocabSize") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value * /*args*/, size_t count) -> jsi::Value {
            if (count != 0) {
                throw CodedError(ErrorCode::InvalidArgument, "getVocabSize: Usage: getVocabSize()");
            }

            auto lock = self->tryLockUnique(rt, "getVocabSize: Tokenizer");

            return static_cast<double>(self->tokenizer_->vocab_size());
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "getVocabSize"), 0, error::guarded(fnBody));
    }

    if (nameStr == "idToToken") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count != 1) {
                throw CodedError(ErrorCode::InvalidArgument, "idToToken: Usage: idToToken(id)");
            }

            auto lock = self->tryLockUnique(rt, "idToToken: Tokenizer");

            auto tokenId = conversions::asType<uint64_t>(rt, "idToToken: id", args[0]);
            auto token = unwrap(rt, "idToToken: Failed to convert id to token",
                                self->tokenizer_->id_to_piece(tokenId));

            return jsi::String::createFromUtf8(rt, token);
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "idToToken"), 1, error::guarded(fnBody));
    }

    if (nameStr == "tokenToId") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count != 1) {
                throw CodedError(ErrorCode::InvalidArgument, "tokenToId: Usage: tokenToId(token)");
            }

            auto lock = self->tryLockUnique(rt, "tokenToId: Tokenizer");

            auto token = conversions::asType<std::string>(rt, "tokenToId: token", args[0]);
            auto tokenId = unwrap(rt, "tokenToId: Failed to convert token to id",
                                  self->tokenizer_->piece_to_id(token));

            return static_cast<double>(tokenId);
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "tokenToId"), 1, error::guarded(fnBody));
    }

    if (nameStr == "dispose") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime & /*rt*/, const jsi::Value & /*thisVal*/, const jsi::Value * /*args*/, size_t count) -> jsi::Value {
            if (count != 0) {
                throw CodedError(ErrorCode::InvalidArgument, "dispose: Usage: dispose()");
            }

            std::unique_lock<std::mutex> lock(self->mutex_);

            if (!self->tokenizer_) {
                throw CodedError(ErrorCode::ResourceDisposed, "dispose: Tokenizer has already been disposed");
            }

            self->tokenizer_.reset();

            return jsi::Value::undefined();
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "dispose"), 0, error::guarded(fnBody));
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
            throw CodedError(ErrorCode::InvalidArgument, "loadTokenizer: Usage: loadTokenizer(path)");
        }

        auto tokenizerPath = conversions::asType<std::string>(rt, "loadTokenizer: path", args[0]);
        try {
            auto tokenizerInstance = std::make_shared<TokenizerHostObject>(tokenizerPath);
            return jsi::Object::createFromHostObject(rt, tokenizerInstance);
        } catch (const std::exception &e) {
            throw CodedError(ErrorCode::TokenizerError, std::format("loadTokenizer: {}", e.what()));
        }
    };
    auto fn = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 1, error::guarded(fnBody));

    module.setProperty(rt, name, fn);
}
} // namespace rnexecutorch::extensions::nlp::tokenizer
