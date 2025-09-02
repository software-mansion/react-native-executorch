#include "Scheduler.h"
#include <executorch/extension/module/module.h>
#include <filesystem>
#include <rnexecutorch/data_processing/FileUtils.h>
#include <rnexecutorch/Log.h>

namespace rnexecutorch::models::text_to_image {
using namespace facebook;

Scheduler::Scheduler(
    std::string source, std::shared_ptr<react::CallInvoker> callInvoker) {
  // Should be set based on the scheduler config
  betaStart = 0.00085;
  betaEnd = 0.012;
  numTrainTimesteps = 1000;
  stepsOffset = 1;

  betas.reserve(numTrainTimesteps);
  float start = std::sqrt(betaStart);
  float end = std::sqrt(betaEnd);
  float step = (end - start) / (numTrainTimesteps - 1);

  for (int i = 0; i < numTrainTimesteps; i++) {
    float value = start + step * i;
    betas.push_back(value * value);
  }

  alphas.reserve(numTrainTimesteps);
  for (auto beta : betas) {
    alphas.push_back(1.0 - beta);
  }

  alphasCumprod.reserve(numTrainTimesteps);
  float runningProduct = 1.0;
  for (auto alphaVal : alphas) {
    runningProduct *= alphaVal;
    alphasCumprod.push_back(runningProduct);
  }

  if (!alphasCumprod.empty()) {
    finalAlphaCumprod = alphasCumprod[0];
  }

  // _timesteps.reserve(numTrainTimesteps);
  // for (int i = numTrainTimesteps - 1; i >= 0; --i) {
  //   _timesteps.push_back(i);
  // }
}

void Scheduler::setTimesteps(int numInferenceSteps) {
  this->numInferenceSteps = numInferenceSteps;

  float stepRatio = static_cast<float>(numTrainTimesteps) / numInferenceSteps;
  for (int i = 0; i < numInferenceSteps; i++) {
    int timestep = static_cast<int>(std::round(i * stepRatio)) + stepsOffset;
    _timesteps.push_back(timestep);
  }

  if (_timesteps.size() >= 2) {
    timesteps.insert(timesteps.end(), _timesteps.begin(), _timesteps.end() - 1);
    timesteps.push_back(_timesteps[_timesteps.size() - 2]);
    timesteps.push_back(_timesteps[_timesteps.size() - 1]);
  } else {
    timesteps = {1};
  }
  std::reverse(timesteps.begin(), timesteps.end());
}

void Scheduler::step(TensorPtr model_output, int timestep, TensorPtr sample) {
  log(LOG_LEVEL::Info, "step");
}

void Scheduler::getPrevSample(TensorPtr sample, int timestep, int prevTimestep, TensorPtr modelOutput) {
  log(LOG_LEVEL::Info, "getPrevSample");
}

} // namespace rnexecutorch
