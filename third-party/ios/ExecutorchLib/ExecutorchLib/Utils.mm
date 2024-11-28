#include "Utils.hpp"
#include <Foundation/Foundation.h>
#include <functional>
#include <executorch/extension/tensor/tensor.h>

using namespace ::executorch::extension;

template <typename T> T getValueFromNumber(NSNumber *number) {
  if (std::is_same<T, int>::value) {
    return [number intValue];
  } else if (std::is_same<T, float>::value) {
    return [number floatValue];
  } else if (std::is_same<T, double>::value) {
    return [number doubleValue];
  } else if (std::is_same<T, long>::value) {
    return [number longValue];
  } else if (std::is_same<T, bool>::value) {
    return [number boolValue];
  }
  static_assert(false, "Unsupported type for NSNumber conversion");
}

template <typename T> T *NSArrayToTypedArray(NSArray *nsArray) {
  size_t arraySize = [nsArray count];

  T *typedArray = new T[arraySize];

  for (NSUInteger i = 0; i < arraySize; ++i) {
    NSNumber *number = [nsArray objectAtIndex:i];
    if ([number isKindOfClass:[NSNumber class]]) {
      typedArray[i] = getValueFromNumber<T>(number);
    } else {
      // Handle nil or incompatible object type in NSArray
      typedArray[i] = T(); // Create a default-constructed object of type T
    }
  }
  return typedArray;
}

void* typedArrayFromNSArrayWithTypeIndicator(NSArray *inputArray, NSNumber *inputType) {
    int inputTypeValue = [inputType intValue];
    switch (inputTypeValue) {
    case 1:
        return NSArrayToTypedArray<int8_t>(inputArray);
    case 2:
        return NSArrayToTypedArray<int32_t>(inputArray);
    case 3:
        return NSArrayToTypedArray<int64_t>(inputArray);
    case 4:
        return NSArrayToTypedArray<float>(inputArray);
    case 5:
        return NSArrayToTypedArray<double>(inputArray);
    default:
        throw std::runtime_error("Unsupported type");
    }
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

NSArray *arrayToNSArray(const void *array, ssize_t numel) {
  const float *floatArray = static_cast<const float *>(array);
  NSMutableArray *nsArray = [NSMutableArray arrayWithCapacity:numel];

  for (int i = 0; i < numel; ++i) {
    [nsArray addObject:@(floatArray[i])];
  }
  return [nsArray copy];
}
