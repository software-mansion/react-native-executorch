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
  @try {
    switch (inputTypeIntValue) {
    case 0: {
      // Int8Array
      std::vector<DataPtrWithNumel<int8_t>> output =
          runForwardFromNSArray<int8_t>(input, shapes, _model);
      return arrayToNSArray<int8_t>(output);
    }
    case 1: {
      // Int32Array
      std::vector<DataPtrWithNumel<int8_t>> output =
          runForwardFromNSArray<int8_t>(input, shapes, _model);
      return arrayToNSArray<int8_t>(output);
    }
    case 2: {
      // BigInt64Array
      std::vector<DataPtrWithNumel<int8_t>> output =
          runForwardFromNSArray<int8_t>(input, shapes, _model);
      return arrayToNSArray<int8_t>(output);
    }
    case 3: {
      // Float32Array
      std::vector<DataPtrWithNumel<int8_t>> output =
          runForwardFromNSArray<int8_t>(input, shapes, _model);
      return arrayToNSArray<int8_t>(output);
    }
    case 4: {
      // Float64Array
      std::vector<DataPtrWithNumel<int8_t>> output =
          runForwardFromNSArray<int8_t>(input, shapes, _model);
      return arrayToNSArray<int8_t>(output);
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
