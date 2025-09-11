// The implementation of the PNDMScheduler class from the diffusers library
// https://github.com/huggingface/diffusers/blob/main/src/diffusers/schedulers/scheduling_pndm.py

#include "Scheduler.h"

namespace rnexecutorch::models::text_to_image {
using namespace facebook;

Scheduler::Scheduler(float betaStart, float betaEnd, int32_t numTrainTimesteps,
                     int32_t stepsOffset,
                     std::shared_ptr<react::CallInvoker> callInvoker)
    : betaStart(betaStart), betaEnd(betaEnd),
      numTrainTimesteps(numTrainTimesteps), stepsOffset(stepsOffset) {
  const float start = std::sqrt(betaStart);
  const float end = std::sqrt(betaEnd);
  const float step = (end - start) / (numTrainTimesteps - 1);

  float runningProduct = 1.0f;
  alphas.reserve(numTrainTimesteps);
  // alphasCumprod[t] — fraction of the signal remaining after t steps
  alphasCumprod.reserve(numTrainTimesteps);
  // betas[t] — amount of noise injected at timestep t
  betas.reserve(numTrainTimesteps);
  for (int32_t i = 0; i < numTrainTimesteps; ++i) {
    const float value = start + step * i;
    const float beta = value * value;
    betas.push_back(beta);
    
    const float alpha = 1.0f - beta;
    alphas.push_back(alpha);
    
    runningProduct *= alpha;
    alphasCumprod.push_back(runningProduct);
  }

  // finalAlphaCumprod — signal at the first training step (highest
  // signal-to-noise ratio) used as reference at the end of diffusion process
  if (!alphasCumprod.empty()) {
    finalAlphaCumprod = alphasCumprod[0];
  }
}

void Scheduler::setTimesteps(size_t numInferenceSteps) {
  this->numInferenceSteps = numInferenceSteps;
  ets.clear();

  if (numInferenceSteps < 2) {
    timesteps = {1};
    return;
  }

  timesteps.clear();
  timesteps.reserve(numInferenceSteps + 1);

  float numStepsRatio =
      static_cast<float>(numTrainTimesteps) / numInferenceSteps;
  for (size_t i = 0; i < numInferenceSteps; i++) {
    const auto timestep =
        static_cast<int32_t>(std::round(i * numStepsRatio)) + stepsOffset;
    timesteps.push_back(timestep);
  }
  // Duplicate the timestep to provide enough points for the solver
  timesteps.insert(timesteps.end() - 1, timesteps[numInferenceSteps - 2]);
  std::ranges::reverse(timesteps);
}

std::vector<float> Scheduler::step(const std::vector<float> &sample,
                                   const std::vector<float> &noise,
                                   int32_t timestep) {
  if (numInferenceSteps == 0) {
    throw std::runtime_error(
        "Number of inference steps is not set. Call `set_timesteps` first.");
  }

  size_t noiseSize = noise.size();
  std::vector<float> etsOutput(noiseSize);
  float numStepsRatio =
      static_cast<float>(numTrainTimesteps) / numInferenceSteps;
  float timestepPrev = timestep - numStepsRatio;

  if (ets.empty()) {
    ets.push_back(noise);
    etsOutput = noise;
    tempFirstSample = sample;
    return getPrevSample(sample, etsOutput, timestep, timestepPrev);
  }

  // Use the previous sample as the estimate requires at least 2 points
  if (ets.size() == 1 && !tempFirstSample.empty()) {
    for (size_t i = 0; i < noiseSize; i++) {
      etsOutput[i] = (noise[i] + ets[0][i]) / 2;
    }
    auto prevSample = getPrevSample(std::move(tempFirstSample), etsOutput,
                                    timestep + numStepsRatio, timestep);
    tempFirstSample.clear();
    return prevSample;
  }

  // Coefficients come from the linear multistep method
  // https://en.wikipedia.org/wiki/Linear_multistep_method
  ets.push_back(noise);

  if (ets.size() == 2) {
    for (size_t i = 0; i < noiseSize; i++) {
      etsOutput[i] = (ets[1][i] * 3 - ets[0][i]) / 2;
    }
  } else if (ets.size() == 3) {
    for (size_t i = 0; i < noiseSize; i++) {
      etsOutput[i] = ((ets[2][i] * 23 - ets[1][i] * 16) + ets[0][i] * 5) / 12;
    }
  } else {
    ets.assign(ets.end() - 4, ets.end());
    for (size_t i = 0; i < noiseSize; i++) {
      etsOutput[i] =
          (ets[3][i] * 55 - ets[2][i] * 59 + ets[1][i] * 37 - ets[0][i] * 9) /
          24;
    }
  }
  return getPrevSample(sample, etsOutput, timestep, timestepPrev);
}

std::vector<float> Scheduler::getPrevSample(const std::vector<float> &sample,
                                            const std::vector<float> &noise,
                                            int32_t timestep,
                                            int32_t timestepPrev) const {
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
