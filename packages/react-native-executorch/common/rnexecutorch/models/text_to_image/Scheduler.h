#pragma once

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <ReactCommon/CallInvoker.h>
#include <string>
#include <vector>
#include <memory>
#include <map>
#include <cmath>

// !!!
#define TensorPtr int
namespace rnexecutorch {
namespace models::text_to_image {

using namespace facebook;
// using executorch::extension::TensorPtr;

class Scheduler {
public:
  explicit Scheduler(std::string source,
                           std::shared_ptr<react::CallInvoker> callInvoker);
  void setTimesteps(int numInferenceSteps);
  void step(TensorPtr model_output, int timestep, TensorPtr sample);

  std::vector<int> timesteps;

private:
  float betaStart;
  float betaEnd;
  int numTrainTimesteps;
  int stepsOffset;

  std::vector<float> betas;
  std::vector<float> alphas;
  std::vector<float> alphasCumprod;
  float finalAlphaCumprod{1.0f};
  float initNoiseSigma{1.0f};

  int counter{0};
  TensorPtr curSample{0}; // nullptr
  std::vector<TensorPtr> ets;
  int numInferenceSteps{-1};
  std::vector<int> _timesteps;

  void getPrevSample(TensorPtr sample, int timestep, int prevTimestep, TensorPtr modelOutput);
};
} // namespace models::text_to_image

REGISTER_CONSTRUCTOR(models::text_to_image::Scheduler, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
