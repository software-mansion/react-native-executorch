#pragma once

#include "BaseModelTests.h"
#include <atomic>
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <thread>

namespace model_tests {

template <typename T> class VisionModelTest : public ::testing::Test {
protected:
  using Traits = ModelTraits<T>;
  using ModelType = typename Traits::ModelType;
};

TYPED_TEST_SUITE_P(VisionModelTest);

TYPED_TEST_P(VisionModelTest, TwoConcurrentGeneratesDoNotCrash) {
  SETUP_TRAITS();
  auto model = Traits::createValid();
  std::atomic<int32_t> successCount{0};
  std::atomic<int32_t> exceptionCount{0};

  auto task = [&]() {
    try {
      Traits::callGenerate(model);
      successCount++;
    } catch (const rnexecutorch::RnExecutorchError &) {
      exceptionCount++;
    }
  };

  std::thread a(task);
  std::thread b(task);
  a.join();
  b.join();

  EXPECT_EQ(successCount + exceptionCount, 2);
}

TYPED_TEST_P(VisionModelTest, GenerateAndUnloadConcurrentlyDoesNotCrash) {
  SETUP_TRAITS();
  auto model = Traits::createValid();

  std::thread a([&]() {
    try {
      Traits::callGenerate(model);
    } catch (const rnexecutorch::RnExecutorchError &) {
    }
  });
  std::thread b([&]() { model.unload(); });

  a.join();
  b.join();
}

REGISTER_TYPED_TEST_SUITE_P(VisionModelTest, TwoConcurrentGeneratesDoNotCrash,
                            GenerateAndUnloadConcurrentlyDoesNotCrash);

} // namespace model_tests
