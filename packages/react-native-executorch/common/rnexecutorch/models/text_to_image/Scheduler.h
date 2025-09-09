#pragma once

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <ReactCommon/CallInvoker.h>
#include <memory>
#include <string>
#include <vector>

namespace rnexecutorch {
namespace models::text_to_image {

using namespace facebook;

class Scheduler {
public:
  explicit Scheduler(float betaStart, float betaEnd, int32_t numTrainTimesteps,
                     int32_t stepsOfset,
                     std::shared_ptr<react::CallInvoker> callInvoker);
  void setTimesteps(size_t numInferenceSteps);
  std::vector<float> step(const std::vector<float> &sample,
                          const std::vector<float> &noise, int32_t timestep);

  std::vector<int32_t> timesteps;

private:
  float betaStart;
  float betaEnd;
  int32_t numTrainTimesteps;
  int32_t stepsOffset;

  std::vector<float> betas;
  std::vector<float> alphas;
  std::vector<float> alphasCumprod;
  std::vector<float> curSample;
  std::vector<std::vector<float>> ets;
  float finalAlphaCumprod{1.0f};
  float initNoiseSigma{1.0f};

  int32_t counter{0};
  size_t numInferenceSteps{0};

  std::vector<float> getPrevSample(const std::vector<float> &sample,
                                   const std::vector<float> noise,
                                   int32_t timestep, int32_t prevTimestep);
};
} // namespace models::text_to_image

REGISTER_CONSTRUCTOR(models::text_to_image::Scheduler, float, float, int32_t,
                     int32_t, std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
