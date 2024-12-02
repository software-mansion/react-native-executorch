#import "ETModel.h"
#include "Utils.hpp"
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
  ssize_t outputNumel = 0;
  @try {
    switch (inputTypeIntValue) {
    case 0: {
      // Int8Array
      const int8_t *output =
          runForwardFromNSArray<int8_t>(input, outputNumel, shapes, _model);
      return arrayToNSArray<int8_t>(output, outputNumel);
    }
    case 1: {
      // Int32Array
      const int32_t *output =
          runForwardFromNSArray<int32_t>(input, outputNumel, shapes, _model);
      return arrayToNSArray<int32_t>(output, outputNumel);
    }
    case 2: {
      // BigInt64Array
      const int64_t *output =
          runForwardFromNSArray<int64_t>(input, outputNumel, shapes, _model);
      return arrayToNSArray<int64_t>(output, outputNumel);
    }
    case 3: {
      // Float32Array
      const float *output =
          runForwardFromNSArray<float>(input, outputNumel, shapes, _model);
      return arrayToNSArray<float>(output, outputNumel);
    }
    case 4: {
      // Float64Array
      const double *output =
          runForwardFromNSArray<double>(input, outputNumel, shapes, _model);
      return arrayToNSArray<double>(output, outputNumel);
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
