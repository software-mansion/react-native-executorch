#pragma once

#include "base_llm_runner.h"
#include "encoders/iencoder.h"
#include "multimodal_decoder_runner.h"
#include "multimodal_input.h"
#include "multimodal_prefiller.h"
#include "text_token_generator.h"
#include <map>

namespace rne_legacy::extension::llm {
// LEGACY SUPPORT: this fork was renamed out of `namespace executorch` to stop its
// symbols merging with the real prebuilt ExecuTorch at link time. These directives
// restore the unqualified lookup the code previously got from that enclosing scope.
using namespace ::executorch;
using namespace ::executorch::extension;

enum class MultimodalType { Image,
                            Audio };

class MultimodalRunner : public BaseLLMRunner {
public:
    explicit MultimodalRunner(
        std::unique_ptr<Module> module, const std::string &tokenizer_path,
        std::map<MultimodalType, std::unique_ptr<IEncoder>> encoders,
        const GenerationConfig &config = {.temperature = 0.8F, .topp = 0.9F});

    bool is_loaded() const override;
    bool is_multimodal() const override { return true; }
    int32_t get_visual_token_count() const override;

    ::executorch::runtime::Error generate_internal(
        const std::vector<MultimodalInput> &inputs,
        std::function<void(const std::string &)> token_callback) override;

protected:
    ::executorch::runtime::Error load_subcomponents() override;
    void stop_impl() override;

private:
    std::map<MultimodalType, std::unique_ptr<IEncoder>> encoders_;
    std::unique_ptr<MultimodalDecoderRunner> mm_decoder_runner_;
    std::unique_ptr<MultimodalPrefiller> mm_prefiller_;
    std::unique_ptr<TextTokenGenerator> mm_token_generator_;
};

} // namespace rne_legacy::extension::llm
