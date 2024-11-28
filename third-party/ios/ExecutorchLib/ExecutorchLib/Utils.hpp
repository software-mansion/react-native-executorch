#ifndef Utils_hpp
#define Utils_hpp

#ifdef __OBJC__
#import <Foundation/Foundation.h>
#endif

#include <vector>
#include <string>
#include <cstdint>
#include <memory>
#include <variant>
#include <executorch/runtime/core/error.h>

void convertNSArrayToInt32Array(NSArray *inputArray, int32_t **outputArray, NSUInteger *size);
std::vector<int> convertNSArrayToIntVector(NSArray *inputArray);
NSArray* arrayToNSArray(const void* array, ssize_t numel);
void* typedArrayFromNSArrayWithTypeIndicator(NSArray *inputArray, NSNumber* inputType);

#endif /* Utils_hpp */
