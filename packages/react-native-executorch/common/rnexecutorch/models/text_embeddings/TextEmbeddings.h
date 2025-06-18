#include <rnexecutorch/TokenizerModule.h>
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch {
class TextEmbeddings : public BaseModel {
public:
  TextEmbeddings(const std::string &modelSource,
                 const std::string &tokenizerSource,
                 std::shared_ptr<react::CallInvoker> callInvoker);
  std::shared_ptr<OwningArrayBuffer> generate(const std::string &input,
                                              bool useMeanPooling = true);

private:
  std::pair<std::vector<int32_t>, std::vector<int32_t>>
  TextEmbeddings::preprocess(const std::string &input);
  std::unique_ptr<TokenizerModule> tokenizer;
};
}; // namespace rnexecutorch
