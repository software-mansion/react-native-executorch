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
  // If possible, models should not use the runtime to keep JSI internals away
  // from logic, however, sometimes this would incur too big of a penalty
  // (unnecessary copies). This is in BaseModel so that we can generalize JSI
  // loader method installation.
  facebook::jsi::Runtime *runtime;
};
} // namespace rnexecutorch