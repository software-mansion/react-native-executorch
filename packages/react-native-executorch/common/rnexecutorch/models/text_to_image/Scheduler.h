#pragma once

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <ReactCommon/CallInvoker.h>
#include <string>
#include <vector>
#include <memory>
#include <stdexcept>
#include <map>
#include <cmath>

namespace rnexecutorch {
namespace models::text_to_image {

using namespace facebook;
// using executorch::aten::Tensor;
// using executorch::extension::TensorPtr;

class Scheduler {
public:
  explicit Scheduler(std::string source,
                    std::shared_ptr<react::CallInvoker> callInvoker);
  void setTimesteps(int numInferenceSteps);
  std::vector<float> step(const std::vector<float> & sample, const std::vector<float> & noise, int timestep);

  std::vector<int> timesteps;

private:
  float betaStart;
  float betaEnd;
  int numTrainTimesteps;
  int stepsOffset;

  std::vector<float> betas;
  std::vector<float> alphas;
  std::vector<float> alphasCumprod;
  std::vector<float> curSample;
  std::vector<std::vector<float>> ets;
  float finalAlphaCumprod{1.0f};
  float initNoiseSigma{1.0f};

  int counter{0};
  int numInferenceSteps{-1};
  std::vector<int> _timesteps;

  std::vector<float> getPrevSample(const std::vector<float> & sample, const std::vector<float> noise, int timestep, int prevTimestep);
};
} // namespace models::text_to_image

REGISTER_CONSTRUCTOR(models::text_to_image::Scheduler, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
