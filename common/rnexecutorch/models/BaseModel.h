#pragma once

#include <string>

#include <executorch/extension/module/module.h>
#include <jsi/jsi.h>

namespace rnexecutorch {

class BaseModel {
public:
  BaseModel(const std::string &modelSource, facebook::jsi::Runtime *runtime);
  std::vector<std::vector<int32_t>> getInputShape();

protected:
  std::unique_ptr<executorch::extension::Module> module;
  facebook::jsi::Runtime *runtime;
};

} // namespace rnexecutorch