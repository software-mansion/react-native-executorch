#include <rnexecutorch/TokenizerModule.h>
#include <rnexecutorch/models/BaseModel.h>
#include <span>

namespace rnexecutorch {
class TextEmbeddings : public BaseModel {
public:
  TextEmbeddings(const std::string &modelSource,
                 const std::string &tokenizerSource,
                 std::shared_ptr<react::CallInvoker> callInvoker);
  std::shared_ptr<OwningArrayBuffer> generate(const std::string input,
                                              bool useMeanPooling);

private:
  std::vector<std::vector<int32_t>> inputShapes;
  std::pair<std::vector<int64_t>, std::vector<int64_t>>
  preprocess(const std::string &input);
  std::shared_ptr<OwningArrayBuffer>
  postprocess(std::span<float> modelOutput,
              std::span<const int64_t> attentionMask, bool useMeanPooling);
  std::unique_ptr<TokenizerModule> tokenizer;
};
}; // namespace rnexecutorch
