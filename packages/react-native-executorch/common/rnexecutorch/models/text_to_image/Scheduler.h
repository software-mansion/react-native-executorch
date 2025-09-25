#pragma once

#include <memory>
#include <vector>

#include <ReactCommon/CallInvoker.h>

namespace rnexecutorch::models::text_to_image {

using namespace facebook;

class Scheduler final {
public:
  explicit Scheduler(float betaStart, float betaEnd, int32_t numTrainTimesteps,
                     int32_t stepsOfset,
                     std::shared_ptr<react::CallInvoker> callInvoker);
  void setTimesteps(size_t numInferenceSteps);
  std::vector<float> step(const std::vector<float> &sample,
                          const std::vector<float> &noise, int32_t timestep);

  std::vector<int32_t> timesteps;

private:
  int32_t numTrainTimesteps;
  int32_t stepsOffset;

  std::vector<float> betas;
  std::vector<float> alphas;
  std::vector<float> alphasCumprod;
  std::vector<float> tempFirstSample;
  std::vector<std::vector<float>> ets;
  float finalAlphaCumprod{1.0f};

  size_t numInferenceSteps{0};

  std::vector<float> getPrevSample(const std::vector<float> &sample,
                                   const std::vector<float> &noise,
                                   int32_t timestep,
                                   int32_t prevTimestep) const;
};
} // namespace rnexecutorch::models::text_to_image
