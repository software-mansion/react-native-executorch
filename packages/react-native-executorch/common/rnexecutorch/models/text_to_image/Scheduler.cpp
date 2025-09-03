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

std::vector<float> Scheduler::step(const std::vector<float> & sample, const std::vector<float> & noise, int timestep) {
  // log(LOG_LEVEL::Info, "step");
  if (numInferenceSteps < 0) {
    throw "Number of inference steps is not set. Call `set_timesteps` first.";
  }

  float timestepPrev = timestep - numTrainTimesteps / numInferenceSteps;
  if (counter != 1) {
    if (ets.size() > 3) {
      ets = std::vector<std::vector<float>>(ets.end() - 3, ets.end());
    }
    ets.push_back(noise);
  } else {
    timestepPrev = timestep;
    timestep += numTrainTimesteps / numInferenceSteps;
  }

  int noiseSize = static_cast<int>(noise.size());
  std::vector<float> etsOutput(noiseSize);
  std::vector<float> sampleCopy(sample);
  if (ets.size() == 1 && counter == 0) {
    etsOutput = noise;
    curSample = sample;
  } else if (ets.size() == 1 && counter == 1) {
    for (int i = 0; i < noiseSize; i++) {
      etsOutput[i] = (noise[i] + ets[0][i]) / 2;
    }
    std::swap(sampleCopy, curSample);
    curSample.clear();
  } else if (ets.size() == 2) {
    for (int i = 0; i < noiseSize; i++) {
      etsOutput[i] = (ets[1][i] * 3 - ets[0][i]) / 2;
    }
  } else if (ets.size() == 3) {
    for (int i = 0; i < noiseSize; i++) {
      etsOutput[i] = ((ets[2][i] * 23 - ets[1][i] * 16) + ets[0][i] * 5) / 12;
    }
  } else {
    for (int i = 0; i < noiseSize; i++) {
      etsOutput[i] = (ets[3][i] * 55 - ets[2][i] * 59 + ets[1][i] * 37 - ets[0][i] * 9) / 24;
    }
  }

  ++counter;
  return getPrevSample(sampleCopy, etsOutput, timestep, timestepPrev);
}

std::vector<float> Scheduler::getPrevSample(const std::vector<float> & sample, const std::vector<float> noise, int timestep, int timestepPrev) {
  // log(LOG_LEVEL::Info, "getPrevSample");
  float alpha = alphasCumprod[timestep];
  float alphaPrev = timestepPrev >= 0 ? alphasCumprod[timestepPrev] : finalAlphaCumprod;
  float beta = 1 - alpha;
  float betaPrev = 1 - alphaPrev;

  float alphaSqrt = std::sqrt(alpha);
  float betaSqrt = std::sqrt(beta);

  int noiseSize = static_cast<int>(noise.size());
  float noiseCoeff = (alphaPrev - alpha) / (alpha * std::sqrt(betaPrev) + std::sqrt(alpha * beta * alphaPrev));
  std::vector<float> noiseTerm(noiseSize);
  for (int i = 0; i < noiseSize; i++) {
    noiseTerm[i] = (noise[i] * alphaSqrt + sample[i] * betaSqrt) * noiseCoeff;
  }

  float sampleCoeff = std::sqrt(alphaPrev / alpha);
  std::vector<float> samplePrev(noiseSize);
  for (int i = 0; i < noiseSize; i++) {
    samplePrev[i] = sample[i] * sampleCoeff - noiseTerm[i];
  }

  return samplePrev;
}

} // namespace rnexecutorch


// executorch in: std::vector<float>
// executorch out: Result<std::vector<EValue>>
//       auto forwardResultTensor = forwardResult->at(0).toTensor();
//       auto dataPtr = forwardResultTensor.const_data_ptr();
// model out: std::shared_ptr<OwningArrayBuffer>

// component in: std::vector<EValue>[]
//    make_tensor_ptr(shape, data, ScalarType::Long)
// component out: std::vector<EValue>
// component postprocess: Result<std::vector<EValue>> -> std::vector<EValue>

// Result<std::vector<EValue>> -- (postprocess) --> OwningArrayBuffer

// OwningArrayBuffer: data, size
// Tensor: size, dim, numel, sizes, const_data_ptr