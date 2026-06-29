#include "tokenizer.h"

#include <phonemis/utils/conversions.h>
#include <unordered_map>

#include "core/tensor.h"

namespace mylib::extensions::speech::kokoro {

namespace jsi = facebook::jsi;
using Token = int64_t;
using TensorHostObject = rnexecutorch::core::tensor::TensorHostObject;

// Kokoro's tokenization vocab
constexpr Token kPadToken = 0;
const std::unordered_map<char32_t, Token> kVocab = {
    {U';', 1}, {U':', 2}, {U',', 3}, {U'.', 4}, {U'!', 5}, {U'?', 6}, {U'—', 9}, {U'…', 10}, {U'"', 11}, {U'(', 12}, {U')', 13}, {U'“', 14}, {U'”', 15}, {U' ', 16}, {U'\u0303', 17}, {U'ʣ', 18}, {U'ʥ', 19}, {U'ʦ', 20}, {U'ʨ', 21}, {U'ᵝ', 22}, {U'\uAB67', 23}, {U'A', 24}, {U'I', 25}, {U'O', 31}, {U'Q', 33}, {U'S', 35}, {U'T', 36}, {U'W', 39}, {U'Y', 41}, {U'ᵊ', 42}, {U'a', 43}, {U'b', 44}, {U'c', 45}, {U'd', 46}, {U'e', 47}, {U'f', 48}, {U'h', 50}, {U'i', 51}, {U'j', 52}, {U'k', 53}, {U'l', 54}, {U'm', 55}, {U'n', 56}, {U'o', 57}, {U'p', 58}, {U'q', 59}, {U'r', 60}, {U's', 61}, {U't', 62}, {U'u', 63}, {U'v', 64}, {U'w', 65}, {U'x', 66}, {U'y', 67}, {U'z', 68}, {U'ɑ', 69}, {U'ɐ', 70}, {U'ɒ', 71}, {U'æ', 72}, {U'β', 75}, {U'ɔ', 76}, {U'ɕ', 77}, {U'ç', 78}, {U'ɖ', 80}, {U'ð', 81}, {U'ʤ', 82}, {U'ə', 83}, {U'ɚ', 85}, {U'ɛ', 86}, {U'ɜ', 87}, {U'ɟ', 90}, {U'ɡ', 92}, {U'ɥ', 99}, {U'ɨ', 101}, {U'ɪ', 102}, {U'ʝ', 103}, {U'ɯ', 110}, {U'ɰ', 111}, {U'ŋ', 112}, {U'ɳ', 113}, {U'ɲ', 114}, {U'ɴ', 115}, {U'ø', 116}, {U'ɸ', 118}, {U'θ', 119}, {U'œ', 120}, {U'ɹ', 123}, {U'ɾ', 125}, {U'ɻ', 126}, {U'ʁ', 128}, {U'ɽ', 129}, {U'ʂ', 130}, {U'ʃ', 131}, {U'ʈ', 132}, {U'ʧ', 133}, {U'ʊ', 135}, {U'ʋ', 136}, {U'ʌ', 138}, {U'ɣ', 139}, {U'ɤ', 140}, {U'χ', 142}, {U'ʎ', 143}, {U'ʒ', 147}, {U'ʔ', 148}, {U'ˈ', 156}, {U'ˌ', 157}, {U'ː', 158}, {U'ʰ', 162}, {U'ʲ', 164}, {U'↓', 169}, {U'→', 171}, {U'↗', 172}, {U'↘', 173}, {U'ᵻ', 177}};

void install_tokenize(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "tokenize";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &,
                     const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) {
            throw jsi::JSError(rt, "tokenize: Usage: tokenize(phonemes, outputTensor)");
        }
        if (!args[0].isString()) {
            throw jsi::JSError(rt, "tokenize: Expected a string as first argument");
        }
        if (!args[1].isObject() ||
            !args[1].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "tokenize: Expected a Tensor as second argument");
        }

        auto phonemes_utf8 = args[0].asString(rt).utf8(rt);
        auto output = args[1].asObject(rt).getHostObject<TensorHostObject>(rt);
        if (output->dtype_ != rnexecutorch::core::DType::int64) {
            throw jsi::JSError(rt, "tokenize: output tensor must be int64");
        }

        // Needs to be converted back to u32, as JSI operates on utf8 strings.
        auto phonemes = phonemis::utils::conversions::utf8_to_u32(phonemes_utf8);

        size_t totalLen = phonemes.size() + 2;
        if (output->numel_ < totalLen) {
            throw jsi::JSError(rt,
                               "tokenize: output tensor too small, need at least " +
                                   std::to_string(totalLen) + " elements");
        }

        std::unique_lock<std::shared_mutex> lock(output->mutex_, std::try_to_lock);
        if (!lock.owns_lock()) {
            throw jsi::JSError(rt, "tokenize: output tensor is currently in use");
        }

        auto *tokens = reinterpret_cast<Token *>(output->data_);

        tokens[0] = kPadToken;
        size_t idx = 1;
        for (char32_t phone : phonemes) {
            auto it = kVocab.find(phone);
            if (it != kVocab.end()) {
                tokens[idx++] = it->second;
            }
        }
        tokens[idx] = kPadToken;

        return jsi::Value::undefined();
    };

    module.setProperty(
        rt, name,
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forAscii(rt, name), 2, fnBody));
}

} // namespace mylib::extensions::speech::kokoro
