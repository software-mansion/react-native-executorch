#pragma once

#include <rnexecutorch/preprocessors/WhisperPreprocessor.h>
#include <vector>

namespace rnexecutorch {
using namespace rnexecutorch::preprocessors;

class Whisper {
public:
  std::vector<int32_t> generate();

private:
  WhisperPreprocessor preprocessor;
  void preprocess();
};
} // namespace rnexecutorch