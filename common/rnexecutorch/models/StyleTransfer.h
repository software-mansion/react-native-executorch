#pragma once

#include <string>

#include <executorch/extension/module/module.h>
#include <jsi/jsi.h>

#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch {
using namespace facebook;

class StyleTransfer : public BaseModel {
public:
  StyleTransfer(const std::string &modelSource, jsi::Runtime *runtime);
  std::string forward(std::string imageSource);
};
} // namespace rnexecutorch
