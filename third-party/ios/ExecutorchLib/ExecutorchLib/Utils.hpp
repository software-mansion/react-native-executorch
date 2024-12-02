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

template <typename T> NSArray *arrayToNSArray(const void *array, ssize_t numel);

std::vector<int> NSArrayToIntVector(NSArray *inputArray);

template <typename T>
std::unique_ptr<T[]> NSArrayToTypedArray(NSArray *nsArray);

template <typename T> T getValueFromNSNumber(NSNumber *number);

template <typename T>
const T*
runForwardFromNSArray(NSArray *inputArray, ssize_t& numel, std::vector<int> shapes,
                      std::unique_ptr<executorch::extension::Module> &model);


#endif // Utils_hpp
