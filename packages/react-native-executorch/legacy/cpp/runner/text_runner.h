// common/runner/text_runner.h
#pragma once

#include "base_llm_runner.h"
#include "text_decoder_runner.h"
#include "text_prefiller.h"
#include "text_token_generator.h"

namespace rne_legacy::extension::llm {
// LEGACY SUPPORT: this fork was renamed out of `namespace executorch` to stop its
// symbols merging with the real prebuilt ExecuTorch at link time. These directives
// restore the unqualified lookup the code previously got from that enclosing scope.
using namespace ::executorch;
using namespace ::executorch::extension;

class TextRunner : public BaseLLMRunner {
public:
    explicit TextRunner(std::unique_ptr<::executorch::extension::Module> module,
                        const std::string &tokenizer_path,
                        const GenerationConfig &config = {.temperature = 0.8F,
                                                          .topp = 0.9F});

    bool is_loaded() const override;

    ::executorch::runtime::Error generate_internal(
        const std::vector<MultimodalInput> &inputs,
        std::function<void(const std::string &)> token_callback) override;

protected:
    ::executorch::runtime::Error load_subcomponents() override;
    void stop_impl() override;

private:
    std::unique_ptr<TextDecoderRunner> text_decoder_runner_;
    std::unique_ptr<TextPrefiller> text_prefiller_;
    std::unique_ptr<TextTokenGenerator> text_token_generator_;
};

} // namespace rne_legacy::extension::llm
