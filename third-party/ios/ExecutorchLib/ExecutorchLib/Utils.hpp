#ifndef Utils_hpp
#define Utils_hpp

#import "InputType.h"
#include <cstdint>
#include <executorch/extension/module/module.h>
#include <executorch/extension/tensor/tensor.h>
#include <memory>
#include <span>
#include <string>
#include <vector>

#ifdef __OBJC__
#import <Foundation/Foundation.h>
#endif

using namespace ::executorch::extension;
using namespace ::torch::executor;

template <typename T> T getValueFromNSNumber(NSNumber *number) {
  if constexpr (std::is_same<T, int8_t>::value) {
    return static_cast<T>([number charValue]); // `charValue` for 8-bit integers
  } else if constexpr (std::is_same<T, int32_t>::value) {
    return static_cast<T>([number intValue]); // `intValue` for 32-bit integers
  } else if constexpr (std::is_same<T, long>::value ||
                       std::is_same<T, long long>::value) {
    return static_cast<T>(
        [number longLongValue]); // Use `longLongValue` for 64-bit integers
  } else if constexpr (std::is_same<T, float>::value) {
    return static_cast<T>([number floatValue]);
  } else if constexpr (std::is_same<T, double>::value) {
    return static_cast<T>([number doubleValue]);
  } else {
    static_assert(std::is_same<T, void>::value,
                  "Unsupported type for getValueFromNSNumber");
  }
}

template <typename T>
std::unique_ptr<T[]> NSArrayToTypedArray(NSArray *nsArray) {
  size_t arraySize = [nsArray count];

  std::unique_ptr<T[]> typedArray(new T[arraySize]);

  for (NSUInteger i = 0; i < arraySize; ++i) {
    NSNumber *number = [nsArray objectAtIndex:i];
    if ([number isKindOfClass:[NSNumber class]]) {
      typedArray[i] = getValueFromNSNumber<T>(number);
    } else {
      typedArray[i] = T();
    }
  }
  return typedArray;
}

std::function<void(void *)> getDeleterForInputType(InputType inputType) {
  switch (inputType) {
  case InputType::InputTypeInt8:
    return [](void *ptr) { delete[] static_cast<int8_t *>(ptr); };
  case InputType::InputTypeInt32:
    return [](void *ptr) { delete[] static_cast<int32_t *>(ptr); };
  case InputType::InputTypeInt64:
    return [](void *ptr) { delete[] static_cast<int64_t *>(ptr); };
  case InputType::InputTypeFloat32:
    return [](void *ptr) { delete[] static_cast<float *>(ptr); };
  case InputType::InputTypeFloat64:
    return [](void *ptr) { delete[] static_cast<double *>(ptr); };
  }
}

ScalarType inputTypeToScalarType(InputType inputType) {
  switch (inputType) {
  case InputType::InputTypeInt8:
    return ScalarType::Char;
  case InputType::InputTypeInt32:
    return ScalarType::Int;
  case InputType::InputTypeInt64:
    return ScalarType::Long;
  case InputType::InputTypeFloat32:
    return ScalarType::Float;
  case InputType::InputTypeFloat64:
    return ScalarType::Double;
  default:
    throw std::invalid_argument("Unknown InputType");
  }
}

TensorPtr NSArrayToTensorPtr(NSArray *nsArray, std::vector<int> shape,
                 InputType inputType) {
  void *voidPointer = (__bridge void *)nsArray;
  std::function<void(void *)> deleter = getDeleterForInputType(inputType);
  ScalarType inputScalarType = inputTypeToScalarType(inputType);
  auto tensor = make_tensor_ptr(
      shape,
      voidPointer,
      inputScalarType,
      TensorShapeDynamism::DYNAMIC_BOUND,
      deleter);
  return tensor;
}

template <typename T>
NSArray *arrayToNSArray(const void *array, ssize_t numel) {
  const T *typedArray = static_cast<const T *>(array);
  NSMutableArray *nsArray = [NSMutableArray arrayWithCapacity:numel];

  for (int i = 0; i < numel; ++i) {
    [nsArray addObject:@(typedArray[i])];
  }

  return [nsArray copy];
}

template <typename T>
NSArray *arrayToNSArray(const std::vector<std::span<const T>> &dataPtrVec) {
  NSMutableArray *nsArray = [NSMutableArray array];
  for (const auto &span : dataPtrVec) {
    NSMutableArray *innerArray = [NSMutableArray arrayWithCapacity:span.size()];
    for (auto x : span) {
      [innerArray addObject:@(x)];
    }
    [nsArray addObject:[innerArray copy]];
  }
  return [nsArray copy];
}

std::vector<int> NSArrayToIntVector(NSArray *inputArray) {
  std::vector<int> output;
  for (NSUInteger i = 0; i < [inputArray count]; ++i) {
    NSNumber *number = [inputArray objectAtIndex:i];
    if (number) {
      output.push_back([number intValue]);
    } else {
      output.push_back(0);
    }
  }
  return output;
}

template <typename T>
std::vector<std::span<const T>>
runForwardFromNSArray(NSArray *inputArray, std::vector<int> shapes,
                      std::unique_ptr<Module> &model) {
  std::unique_ptr<T[]> inputPtr = NSArrayToTypedArray<T>(inputArray);

  TensorPtr inputTensor = from_blob(inputPtr.get(), shapes);
  Result result = model->forward(inputTensor);

  if (result.ok()) {
    std::vector<std::span<const T>> outputVec;

    for (const auto &currentResult : *result) {
      Tensor currentTensor = currentResult.toTensor();
      std::span<const T> currentSpan(currentTensor.const_data_ptr<T>(),
                                     currentTensor.numel());
      outputVec.push_back(std::move(currentSpan));
    }
    return outputVec;
  }

  @throw [NSException
      exceptionWithName:@"forward_error"
                 reason:[NSString stringWithFormat:@"%d", (int)result.error()]
               userInfo:nil];
}

#endif // Utils_hpp
