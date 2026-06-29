#include "voice.h"

#include <fstream>

#include "core/tensor.h"

namespace mylib::extensions::speech::kokoro {

namespace jsi = facebook::jsi;
using TensorHostObject = rnexecutorch::core::tensor::TensorHostObject;

void install_loadVoiceEmbedding(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "loadVoiceEmbedding";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &,
                     const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) {
            throw jsi::JSError(rt, "loadVoiceEmbedding: Usage: loadVoiceEmbedding(path, outputTensor)");
        }
        if (!args[0].isString()) {
            throw jsi::JSError(rt, "loadVoiceEmbedding: Expected a string (filepath) as first argument");
        }
        if (!args[1].isObject() || !args[1].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "loadVoiceEmbedding: Expected a Tensor as second argument");
        }

        auto path = args[0].asString(rt).utf8(rt);
        auto output = args[1].asObject(rt).getHostObject<TensorHostObject>(rt);

        if (output->dtype_ != rnexecutorch::core::DType::float32) {
            throw jsi::JSError(rt, "loadVoiceEmbedding: output tensor must be float32");
        }

        // Voice style vectors are fixed length.
        constexpr size_t kCols = 256;

        std::ifstream in(path, std::ios::binary);
        if (!in) {
            throw jsi::JSError(rt, "loadVoiceEmbedding: cannot open file: " + path);
        }

        in.seekg(0, std::ios::end);
        const auto fileSize = static_cast<size_t>(in.tellg());
        in.seekg(0, std::ios::beg);

        if (fileSize % sizeof(float) != 0) {
            throw jsi::JSError(rt, "loadVoiceEmbedding: file size not aligned to float");
        }

        const size_t totalElements = fileSize / sizeof(float);
        const size_t rows = totalElements / kCols;

        if (rows * kCols != totalElements) {
            throw jsi::JSError(rt, "loadVoiceEmbedding: file does not form a complete [rows x 256] matrix");
        }

        if (output->numel_ < totalElements) {
            throw jsi::JSError(rt, "loadVoiceEmbedding: output tensor too small, need at least " +
                                       std::to_string(totalElements) + " elements");
        }

        size_t outputRows = 1;
        if (output->shape_.size() == 2) {
            outputRows = static_cast<size_t>(output->shape_[0]);
        } else if (output->shape_.size() != 1) {
            throw jsi::JSError(rt, "loadVoiceEmbedding: output tensor must be 1-D or 2-D");
        }

        if (outputRows != rows) {
            throw jsi::JSError(rt, "loadVoiceEmbedding: incompatible shape, expected " +
                                       std::to_string(rows) + " rows, got " + std::to_string(outputRows));
        }

        std::unique_lock<std::shared_mutex> lock(output->mutex_, std::try_to_lock);
        if (!lock.owns_lock()) {
            throw jsi::JSError(rt, "loadVoiceEmbedding: output tensor is currently in use");
        }

        auto *dst = reinterpret_cast<float *>(output->data_);
        if (!in.read(reinterpret_cast<char *>(dst),
                     static_cast<std::streamsize>(totalElements * sizeof(float)))) {
            throw jsi::JSError(rt, "loadVoiceEmbedding: failed to read voice data");
        }

        return jsi::Value::undefined();
    };

    module.setProperty(
        rt, name,
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forAscii(rt, name), 2, fnBody));
}

} // namespace mylib::extensions::speech::kokoro
