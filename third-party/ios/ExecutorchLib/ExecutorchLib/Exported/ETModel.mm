#import "ETModel.h"
#include "Utils.hpp"
#include <InputType.h>
#include <executorch/extension/module/module.h>
#include <executorch/extension/tensor/tensor.h>
#include <executorch/runtime/core/error.h>
#include <executorch/runtime/core/result.h>
#include <string>

using namespace ::executorch::extension;
using namespace ::torch::executor;

@implementation ETModel {
  std::unique_ptr<Module> _model;
}

- (NSNumber *)loadModel:(NSString *)filePath {
  _model = std::make_unique<Module>(filePath.UTF8String);
  Error err = _model->load();
  return @((int)err);
}

- (NSNumber *)loadMethod:(NSString *)methodName {
  Error err = _model->load_method([methodName UTF8String]);
  return @((int)err);
}

- (NSNumber *)loadForward {
  Error err = _model->load_forward();
  return @((int)err);
}

- (NSArray *)forward:(NSArray *)input
               shape:(NSArray *)shape
           inputType:(NSNumber *)inputType {
  int inputTypeIntValue = [inputType intValue];
  std::vector<int> shapes = NSArrayToIntVector(shape);
  @try {
    switch (inputTypeIntValue) {
    case InputTypeInt8: {
      std::vector<std::span<const int8_t>> output =
          runForwardFromNSArray<int8_t>(input, shapes, _model);
      return arrayToNSArray<int8_t>(output);
    }
    case InputTypeInt32: {
      std::vector<std::span<const int32_t>> output =
          runForwardFromNSArray<int32_t>(input, shapes, _model);
      return arrayToNSArray<int32_t>(output);
    }
    case InputTypeInt64: {
      std::vector<std::span<const int64_t>> output =
          runForwardFromNSArray<int64_t>(input, shapes, _model);
      return arrayToNSArray<int64_t>(output);
    }
    case InputTypeFloat32: {
      std::vector<std::span<const float>> output =
          runForwardFromNSArray<float>(input, shapes, _model);
      return arrayToNSArray<float>(output);
    }
    case InputTypeFloat64: {
      std::vector<std::span<const double>> output =
          runForwardFromNSArray<double>(input, shapes, _model);
      return arrayToNSArray<double>(output);
    }
    }
  } @catch (NSException *exception) {
    NSInteger originalCode = [exception.reason integerValue];
    @throw [NSException
        exceptionWithName:@"forward_error"
                   reason:[NSString stringWithFormat:@"%ld", (long)originalCode]
                 userInfo:nil];
  }
  // throwing an RN-ET exception
  @
  throw [NSException exceptionWithName:@"forward_error"
                                reason:[NSString stringWithFormat:@"%d",
                                                                  0x65] // 101
                              userInfo:nil];
}
@end
