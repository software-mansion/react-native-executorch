#import "ETModel.h"
#include "Utils.hpp"
#include "InputType.h"
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

- (NSNumber *)getNumberOfInputs {
  const auto method_meta = _model->method_meta("forward");
  if (!method_meta.ok()) {
    @throw [NSException
            exceptionWithName:@"get_number_of_inputs_error"
            reason:[NSString stringWithFormat:@"%ld", (long)method_meta.error()]
            userInfo:nil];
  }
  
  return @(method_meta->num_inputs());
}

- (NSNumber *)getInputType:(NSNumber *)index {
  const auto method_meta = _model->method_meta("forward");
  if(!method_meta.ok()){
    @throw [NSException
            exceptionWithName:@"get_input_type_error"
            reason:[NSString stringWithFormat:@"%ld", (long)method_meta.error()]
            userInfo:nil];
  }
  
  const auto input_meta = method_meta->input_tensor_meta([index unsignedLongValue]);
  if(!input_meta.ok()){
    @throw [NSException
            exceptionWithName:@"get_input_type_error"
            reason:[NSString stringWithFormat:@"%ld", (long)input_meta.error()]
            userInfo:nil];
  }
  
  return [self getTypeAsNumber:input_meta->scalar_type()];
};

- (NSArray *)getInputShape:(NSNumber *)index {
  const auto method_meta = _model->method_meta("forward");
  if(!method_meta.ok()){
    @throw [NSException
            exceptionWithName:@"get_input_shape_error"
            reason:[NSString stringWithFormat:@"%ld", (long)method_meta.error()]
            userInfo:nil];
  }
  
  const auto input_meta = method_meta->input_tensor_meta([index unsignedLongValue]);
  if(!input_meta.ok()){
    @throw [NSException
            exceptionWithName:@"get_input_shape_error"
            reason:[NSString stringWithFormat:@"%ld", (long)input_meta.error()]
            userInfo:nil];
  }
  
  const auto shape = input_meta->sizes();
  NSMutableArray *nsShape = [[NSMutableArray alloc] init];
  
  for(int i = 0; i < shape.size(); i++) {
    [nsShape addObject:@(shape[i])];
  }
  
  return [nsShape copy];
};

- (NSNumber *)getNumberOfOutputs {
  const auto method_meta = _model->method_meta("forward");
  if (!method_meta.ok()) {
    @throw [NSException
            exceptionWithName:@"get_number_of_outputs_error"
            reason:[NSString stringWithFormat:@"%ld", (long)method_meta.error()]
            userInfo:nil];
  }
  
  return @(method_meta->num_outputs());
}

- (NSNumber *)getOutputType:(NSNumber *)index {
  const auto method_meta = _model->method_meta("forward");
  if(!method_meta.ok()){
    @throw [NSException
            exceptionWithName:@"get_output_type_error"
            reason:[NSString stringWithFormat:@"%ld", (long)method_meta.error()]
            userInfo:nil];
  }
  
  const auto output_meta = method_meta->output_tensor_meta([index unsignedLongValue]);
  if(!output_meta.ok()){
    @throw [NSException
            exceptionWithName:@"get_output_type_error"
            reason:[NSString stringWithFormat:@"%ld", (long)output_meta.error()]
            userInfo:nil];
  }
  
  return [self getTypeAsNumber:output_meta->scalar_type()];
};

- (NSArray *)getOutputShape:(NSNumber *)index {
  const auto method_meta = _model->method_meta("forward");
  if(!method_meta.ok()){
    @throw [NSException
            exceptionWithName:@"get_output_shape_error"
            reason:[NSString stringWithFormat:@"%ld", (long)method_meta.error()]
            userInfo:nil];
  }
  
  const auto output_meta = method_meta->output_tensor_meta([index unsignedLongValue]);
  if(!output_meta.ok()){
    @throw [NSException
            exceptionWithName:@"get_output_shape_error"
            reason:[NSString stringWithFormat:@"%ld", (long)output_meta.error()]
            userInfo:nil];
  }
  
  const auto shape = output_meta->sizes();
  NSMutableArray *nsShape = [[NSMutableArray alloc] init];
  
  for(int i = 0; i < shape.size(); i++) {
    [nsShape addObject:@(shape[i])];
  }
  
  return [nsShape copy];
};

- (NSNumber *) getTypeAsNumber:(ScalarType)scalarType {
  switch(scalarType) {
    case ScalarType::Byte: return @(InputTypeInt8);
    case ScalarType::Int: return @(InputTypeInt32);
    case ScalarType::Long: return @(InputTypeInt64);
    case ScalarType::Float: return @(InputTypeFloat32);
    case ScalarType::Double: return @(InputTypeFloat64);
      
    default:
      return @-1;
  }
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
