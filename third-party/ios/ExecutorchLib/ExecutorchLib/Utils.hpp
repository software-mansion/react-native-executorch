#ifndef Utils_hpp
#define Utils_hpp

#include <cstdint>
#include <executorch/extension/module/module.h>
#include <executorch/extension/tensor/tensor.h>
#include <memory>
#include <string>
#include <vector>

#ifdef __OBJC__
#import <Foundation/Foundation.h>
#endif

template <typename T> struct DataPtrWithNumel {
  const T *dataPtr;
  ssize_t numel;
};

template <typename T> NSArray *arrayToNSArray(const void *array, ssize_t numel);
template <typename T>
NSArray *arrayToNSArray(const std::vector<DataPtrWithNumel<T>> &dataPtrVec);

std::vector<int> NSArrayToIntVector(NSArray *inputArray);

template <typename T>
std::unique_ptr<T[]> NSArrayToTypedArray(NSArray *nsArray);

template <typename T> T getValueFromNSNumber(NSNumber *number);

template <typename T>
std::vector<DataPtrWithNumel<T>>
runForwardFromNSArray(NSArray *inputArray, std::vector<int> shapes,
                      std::unique_ptr<executorch::extension::Module> &model);

#endif // Utils_hpp
