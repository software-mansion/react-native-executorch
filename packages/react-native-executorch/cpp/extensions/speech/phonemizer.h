#pragma once

#include <jsi/jsi.h>
#include <memory>
#include <optional>
#include <string>

#include <phonemis/base/pipeline.h>

namespace rnexecutorch::extensions::speech {

class PhonemizerHostObject : public facebook::jsi::HostObject,
                             public std::enable_shared_from_this<PhonemizerHostObject> {
public:
    explicit PhonemizerHostObject(const std::string &lang,
                                  const std::optional<std::string> &taggerPath,
                                  const std::optional<std::string> &lexiconPath,
                                  const std::optional<std::string> &neuralModelPath);

    facebook::jsi::Value get(facebook::jsi::Runtime &rt, const facebook::jsi::PropNameID &name) override;
    std::vector<facebook::jsi::PropNameID> getPropertyNames(facebook::jsi::Runtime &rt) override;

private:
    std::unique_ptr<phonemis::Pipeline> pipeline_;
};

void install_createPhonemizer(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);

} // namespace rnexecutorch::extensions::speech
