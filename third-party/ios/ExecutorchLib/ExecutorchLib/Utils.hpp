#ifndef Utils_hpp
#define Utils_hpp

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
  if constexpr (std::is_same<T, char>::value) {
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

std::function<void(void *)> getDeleterForScalarType(ScalarType scalarType) {
  switch (scalarType) {
  case ScalarType::Char:
    return [](void *ptr) { delete[] static_cast<char *>(ptr); };
  case ScalarType::Int:
    return [](void *ptr) { delete[] static_cast<int32_t *>(ptr); };
  case ScalarType::Long:
    return [](void *ptr) { delete[] static_cast<long *>(ptr); };
  case ScalarType::Float:
    return [](void *ptr) { delete[] static_cast<float *>(ptr); };
  case ScalarType::Double:
    return [](void *ptr) { delete[] static_cast<double *>(ptr); };
  default:
    throw std::invalid_argument(
        "Unsupported ScalarType passed to getDeleterForScalarType!");
  }
}

ScalarType intValueToScalarType(int intValue) {
  // Check if the intValue is within the valid range of ScalarType
  if (intValue < 0 || intValue >= static_cast<int>(ScalarType::NumOptions)) {
    throw std::out_of_range("Invalid ScalarType integer value: " +
                            std::to_string(intValue));
  }
  return static_cast<ScalarType>(intValue);
}

NSNumber *scalarTypeToNSNumber(ScalarType scalarType) {
  return @(static_cast<int>(scalarType));
}

NSArray* flattenArray(NSArray *array) {
    NSMutableArray *flatArray = [NSMutableArray array];

    for (id element in array) {
        if ([element isKindOfClass:[NSArray class]]) {
            NSArray *nestedArray = flattenArray(element);
            [flatArray addObjectsFromArray:nestedArray];
        } else {
            [flatArray addObject:element];
        }
    }

    return [flatArray copy];
}

void *NSArrayToVoidArray(NSArray *nsArray, ScalarType inputScalarType,
                         size_t &outSize) {
  // This function assumes that the passed array may not be flattened,
  // that's why we flatten it here
  NSArray *flattenedArray = flattenArray(nsArray);
  outSize = [flattenedArray count];

  switch (inputScalarType) {
  case ScalarType::Char: {
    auto typedArray = NSArrayToTypedArray<char>(flattenedArray);
    return typedArray.release();
  }
  case ScalarType::Long: {
    auto typedArray = NSArrayToTypedArray<long>(flattenedArray);
    return typedArray.release();
  }

  case ScalarType::Int: {
    auto typedArray = NSArrayToTypedArray<int>(flattenedArray);
    return typedArray.release();
  }
  case ScalarType::Float: {
    auto typedArray = NSArrayToTypedArray<float>(flattenedArray);
    return typedArray.release();
  }
  case ScalarType::Double: {
    auto typedArray = NSArrayToTypedArray<double>(flattenedArray);
    return typedArray.release();
  }
  default:
    throw std::invalid_argument(
        "Unsupported ScalarType passed to NSArrayToVoidArray!");
  }
}

TensorPtr NSArrayToTensorPtr(NSArray *nsArray, std::vector<int> shape,
                             int inputType) {
  ScalarType inputScalarType = intValueToScalarType(inputType);
  size_t arraySize;
  void *data = NSArrayToVoidArray(nsArray, inputScalarType, arraySize);
  std::function<void(void *)> deleter =
      getDeleterForScalarType(inputScalarType);
  auto tensor = make_tensor_ptr(shape, data, inputScalarType, TensorShapeDynamism::DYNAMIC_UNBOUND, deleter);

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

NSArray *arrayToNsArray(const void *dataPtr, size_t numel, ScalarType scalarType) {
  switch (scalarType) {
  case ScalarType::Char: {
    NSArray *outputArray = arrayToNSArray<char>(dataPtr, numel);
    return outputArray;
  }
  case ScalarType::Long: {
    NSArray *outputArray = arrayToNSArray<long>(dataPtr, numel);
    return outputArray;
  }

  case ScalarType::Int: {
    NSArray *outputArray = arrayToNSArray<int>(dataPtr, numel);
    return outputArray;
  }
  case ScalarType::Float: {
    NSArray *outputArray = arrayToNSArray<float>(dataPtr, numel);
    return outputArray;
  }
  case ScalarType::Double: {
    NSArray *outputArray = arrayToNSArray<double>(dataPtr, numel);
    return outputArray;
  }
  default:
    throw std::invalid_argument(
        "Unsupported ScalarType passed to arrayToNSArray!");
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

#endif // Utils_hpp
