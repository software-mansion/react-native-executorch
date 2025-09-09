// The implementation of the PNDMScheduler class from the diffusers library:
// https://github.com/huggingface/diffusers/blob/main/src/diffusers/schedulers/scheduling_pndm.py

#include "Scheduler.h"

#include <executorch/extension/module/module.h>
#include <filesystem>
#include <rnexecutorch/data_processing/FileUtils.h>

namespace rnexecutorch::models::text_to_image {
using namespace facebook;

Scheduler::Scheduler(float betaStart, float betaEnd, int32_t numTrainTimesteps,
                     int32_t stepsOffset,
                     std::shared_ptr<react::CallInvoker> callInvoker)
    : betaStart(betaStart), betaEnd(betaEnd),
      numTrainTimesteps(numTrainTimesteps), stepsOffset(stepsOffset) {
  betas.reserve(numTrainTimesteps);
  const float start = std::sqrt(betaStart);
  const float end = std::sqrt(betaEnd);
  const float step = (end - start) / (numTrainTimesteps - 1);

  for (int32_t i = 0; i < numTrainTimesteps; i++) {
    const float value = start + step * i;
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
}

void Scheduler::setTimesteps(
    size_t numInferenceSteps) { // TODO reset timesteps if called again
  this->numInferenceSteps = numInferenceSteps;

  float stepRatio = static_cast<float>(numTrainTimesteps) / numInferenceSteps;
  for (size_t i = 0; i < numInferenceSteps; i++) {
    const auto timestep =
        static_cast<int32_t>(std::round(i * stepRatio)) + stepsOffset;
    _timesteps.push_back(timestep);
  }

  if (_timesteps.size() < 2) { // TODO use numInfSteps
    timesteps = {1};
    return;
  } else {
    timesteps.insert(timesteps.end(), _timesteps.begin(), _timesteps.end() - 1);
    timesteps.push_back(_timesteps[_timesteps.size() - 2]);
    timesteps.push_back(_timesteps[_timesteps.size() - 1]);
  }
  std::ranges::reverse(timesteps);
}

std::vector<float> Scheduler::step(const std::vector<float> &sample,
                                   const std::vector<float> &noise,
                                   int32_t timestep) {
  if (!numInferenceSteps) {
    throw "Number of inference steps is not set. Call `set_timesteps` first.";
  }

  float numStepsRatio =
      static_cast<float>(numTrainTimesteps) / numInferenceSteps;
  float timestepPrev = timestep - numStepsRatio;
  if (counter != 1) {
    if (ets.size() > 3) {
      ets = std::vector<std::vector<float>>(ets.end() - 3, ets.end());
    }
    ets.push_back(noise);
  } else {
    timestepPrev = timestep;
    timestep += numStepsRatio;
  }

  size_t noiseSize = noise.size();
  std::vector<float> etsOutput(noiseSize);
  std::vector<float> sampleCopy(sample);
  if (ets.size() == 1 && counter == 0) {
    etsOutput = noise;
    curSample = sample;
  } else if (ets.size() == 1 && counter == 1) {
    for (size_t i = 0; i < noiseSize; i++) {
      etsOutput[i] = (noise[i] + ets[0][i]) / 2;
    }
    sampleCopy = std::move(curSample);
    curSample.clear();
  } else if (ets.size() == 2) {
    for (size_t i = 0; i < noiseSize; i++) {
      etsOutput[i] = (ets[1][i] * 3 - ets[0][i]) / 2;
    }
  } else if (ets.size() == 3) {
    for (size_t i = 0; i < noiseSize; i++) {
      etsOutput[i] = ((ets[2][i] * 23 - ets[1][i] * 16) + ets[0][i] * 5) / 12;
    }
  } else {
    for (size_t i = 0; i < noiseSize; i++) {
      etsOutput[i] =
          (ets[3][i] * 55 - ets[2][i] * 59 + ets[1][i] * 37 - ets[0][i] * 9) /
          24;
    }
  }

  ++counter;
  return getPrevSample(sampleCopy, etsOutput, timestep, timestepPrev);
}

std::vector<float> Scheduler::getPrevSample(const std::vector<float> &sample,
                                            const std::vector<float> noise,
                                            int32_t timestep,
                                            int32_t timestepPrev) {
  const float alpha = alphasCumprod[timestep];
  const float alphaPrev =
      timestepPrev >= 0 ? alphasCumprod[timestepPrev] : finalAlphaCumprod;
  const float beta = 1 - alpha;
  const float betaPrev = 1 - alphaPrev;

  size_t noiseSize = noise.size();
  const float noiseCoeff =
      (alphaPrev - alpha) /
      (alpha * std::sqrt(betaPrev) + std::sqrt(alpha * beta * alphaPrev));
  std::vector<float> noiseTerm(noiseSize);
  for (size_t i = 0; i < noiseSize; i++) {
    noiseTerm[i] = (noise[i] * std::sqrt(alpha) + sample[i] * std::sqrt(beta)) *
                   noiseCoeff;
  }

  const float sampleCoeff = std::sqrt(alphaPrev / alpha);
  std::vector<float> samplePrev(noiseSize);
  for (size_t i = 0; i < noiseSize; i++) {
    samplePrev[i] = sample[i] * sampleCoeff - noiseTerm[i];
  }

  return samplePrev;
}

} // namespace rnexecutorch::models::text_to_image
