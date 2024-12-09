#ifndef Utils_hpp
#define Utils_hpp

#include <cstdint>
#include <executorch/extension/module/module.h>
#include <executorch/extension/tensor/tensor.h>
#include <memory>
#include <string>
#include <vector>
#include <span>

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
  } else if constexpr (std::is_same<T, int64_t>::value) {
    return static_cast<T>(
        [number longLongValue]); // `longLongValue` for 64-bit integers
  } else if constexpr (std::is_same<T, float>::value) {
    return static_cast<T>([number floatValue]);
  } else if constexpr (std::is_same<T, double>::value) {
    return static_cast<T>([number doubleValue]);
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
        for(auto x : span) {
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
      std::span<const T> currentSpan(currentTensor.const_data_ptr<T>(), currentTensor.numel());
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
