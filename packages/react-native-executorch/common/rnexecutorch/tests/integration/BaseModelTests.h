#pragma once

#include "gtest/gtest.h"
#include <rnexecutorch/Error.h>

namespace facebook::react {
class CallInvoker;
}

namespace rnexecutorch {
std::shared_ptr<facebook::react::CallInvoker> createMockCallInvoker();
}

namespace model_tests {

inline auto getMockInvoker() { return rnexecutorch::createMockCallInvoker(); }

/// Helper macro to access Traits in typed tests
#define SETUP_TRAITS() using Traits = typename TestFixture::Traits

/// Trait struct that each model must specialize
/// This defines how to construct and test each model type
template <typename T> struct ModelTraits;

/// Example of what a specialization looks like:
///
/// template<>
/// struct ModelTraits<Classification> {
///   using ModelType = Classification;
///
///   // Create valid model instance
///   static ModelType createValid() {
///     return ModelType("valid_model.pte", nullptr);
///   }
///
///   // Create invalid model instance (should throw in constructor)
///   static ModelType createInvalid() {
///     return ModelType("nonexistent.pte", nullptr);
///   }
///
///   // Call the model's generate/forward function with valid input
///   // Used to test that generate throws after unload
///  static void callGenerate(ModelType& model) {
///     (void)model.generate("valid_input.jpg");
///   }
/// };
// Typed test fixture for common model tests
template <typename T> class CommonModelTest : public ::testing::Test {
protected:
  using Traits = ModelTraits<T>;
  using ModelType = typename Traits::ModelType;
};

// Define the test suite
TYPED_TEST_SUITE_P(CommonModelTest);

// Constructor tests
TYPED_TEST_P(CommonModelTest, InvalidPathThrows) {
  SETUP_TRAITS();
  EXPECT_THROW(Traits::createInvalid(), rnexecutorch::RnExecutorchError);
}

TYPED_TEST_P(CommonModelTest, ValidPathDoesntThrow) {
  SETUP_TRAITS();
  EXPECT_NO_THROW(Traits::createValid());
}

// Memory tests
TYPED_TEST_P(CommonModelTest, GetMemoryLowerBoundValue) {
  SETUP_TRAITS();
  auto model = Traits::createValid();
  EXPECT_GT(model.getMemoryLowerBound(), 0u);
}

TYPED_TEST_P(CommonModelTest, GetMemoryLowerBoundConsistent) {
  SETUP_TRAITS();
  auto model = Traits::createValid();
  auto bound1 = model.getMemoryLowerBound();
  auto bound2 = model.getMemoryLowerBound();
  EXPECT_EQ(bound1, bound2);
}

// Unload tests
TYPED_TEST_P(CommonModelTest, UnloadDoesntThrow) {
  SETUP_TRAITS();
  auto model = Traits::createValid();
  EXPECT_NO_THROW(model.unload());
}

TYPED_TEST_P(CommonModelTest, MultipleUnloadsSafe) {
  SETUP_TRAITS();
  auto model = Traits::createValid();
  EXPECT_NO_THROW(model.unload());
  EXPECT_NO_THROW(model.unload());
  EXPECT_NO_THROW(model.unload());
}

TYPED_TEST_P(CommonModelTest, GenerateAfterUnloadThrows) {
  SETUP_TRAITS();
  auto model = Traits::createValid();
  model.unload();
  EXPECT_THROW(Traits::callGenerate(model), rnexecutorch::RnExecutorchError);
}

TYPED_TEST_P(CommonModelTest, MultipleGeneratesWork) {
  SETUP_TRAITS();
  auto model = Traits::createValid();
  EXPECT_NO_THROW(Traits::callGenerate(model));
  EXPECT_NO_THROW(Traits::callGenerate(model));
  EXPECT_NO_THROW(Traits::callGenerate(model));
}

// Register all tests in the suite

// TODO: Investigate why TextToImage fails on MultipleGeneratesWork in the
// emulator environment
REGISTER_TYPED_TEST_SUITE_P(CommonModelTest, InvalidPathThrows,
                            ValidPathDoesntThrow, GetMemoryLowerBoundValue,
                            GetMemoryLowerBoundConsistent, UnloadDoesntThrow,
                            MultipleUnloadsSafe, GenerateAfterUnloadThrows,
                            MultipleGeneratesWork);

} // namespace model_tests
