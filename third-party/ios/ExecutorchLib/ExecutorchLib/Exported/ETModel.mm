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

- (NSNumber *)getNumberOfInputs {
  const auto method_meta = _model->method_meta("forward");
  if (!method_meta.ok()) {
    @throw [NSException
        exceptionWithName:@"get_number_of_inputs_error"
                   reason:[NSString stringWithFormat:@"%ld",
                                                     (long)method_meta.error()]
                 userInfo:nil];
  }

  return @(method_meta->num_inputs());
}

- (NSNumber *)getInputType:(NSNumber *)index {
  const auto method_meta = _model->method_meta("forward");
  if (!method_meta.ok()) {
    @throw [NSException
        exceptionWithName:@"get_input_type_error"
                   reason:[NSString stringWithFormat:@"%ld",
                                                     (long)method_meta.error()]
                 userInfo:nil];
  }

  const auto input_meta =
      method_meta->input_tensor_meta([index unsignedLongValue]);
  if (!input_meta.ok()) {
    @throw [NSException
        exceptionWithName:@"get_input_type_error"
                   reason:[NSString
                              stringWithFormat:@"%ld", (long)input_meta.error()]
                 userInfo:nil];
  }

  return scalarTypeToNSNumber(input_meta->scalar_type());
};

- (NSArray *)getInputShape:(NSNumber *)index {
  const auto method_meta = _model->method_meta("forward");
  if (!method_meta.ok()) {
    @throw [NSException
        exceptionWithName:@"get_input_shape_error"
                   reason:[NSString stringWithFormat:@"%ld",
                                                     (long)method_meta.error()]
                 userInfo:nil];
  }

  const auto input_meta =
      method_meta->input_tensor_meta([index unsignedLongValue]);
  if (!input_meta.ok()) {
    @throw [NSException
        exceptionWithName:@"get_input_shape_error"
                   reason:[NSString
                              stringWithFormat:@"%ld", (long)input_meta.error()]
                 userInfo:nil];
  }

  const auto shape = input_meta->sizes();
  NSMutableArray *nsShape = [[NSMutableArray alloc] init];

  for (int i = 0; i < shape.size(); i++) {
    [nsShape addObject:@(shape[i])];
  }

  return [nsShape copy];
};

- (NSNumber *)getNumberOfOutputs {
  const auto method_meta = _model->method_meta("forward");
  if (!method_meta.ok()) {
    @throw [NSException
        exceptionWithName:@"get_number_of_outputs_error"
                   reason:[NSString stringWithFormat:@"%ld",
                                                     (long)method_meta.error()]
                 userInfo:nil];
  }

  return @(method_meta->num_outputs());
}

- (NSNumber *)getOutputType:(NSNumber *)index {
  const auto method_meta = _model->method_meta("forward");
  if (!method_meta.ok()) {
    @throw [NSException
        exceptionWithName:@"get_output_type_error"
                   reason:[NSString stringWithFormat:@"%ld",
                                                     (long)method_meta.error()]
                 userInfo:nil];
  }

  const auto output_meta =
      method_meta->output_tensor_meta([index unsignedLongValue]);
  if (!output_meta.ok()) {
    @throw [NSException
        exceptionWithName:@"get_output_type_error"
                   reason:[NSString stringWithFormat:@"%ld",
                                                     (long)output_meta.error()]
                 userInfo:nil];
  }

  return scalarTypeToNSNumber(output_meta->scalar_type());
};

- (NSArray *)getOutputShape:(NSNumber *)index {
  const auto method_meta = _model->method_meta("forward");
  if (!method_meta.ok()) {
    @throw [NSException
        exceptionWithName:@"get_output_shape_error"
                   reason:[NSString stringWithFormat:@"%ld",
                                                     (long)method_meta.error()]
                 userInfo:nil];
  }

  const auto output_meta =
      method_meta->output_tensor_meta([index unsignedLongValue]);
  if (!output_meta.ok()) {
    @throw [NSException
        exceptionWithName:@"get_output_shape_error"
                   reason:[NSString stringWithFormat:@"%ld",
                                                     (long)output_meta.error()]
                 userInfo:nil];
  }

  const auto shape = output_meta->sizes();
  NSMutableArray *nsShape = [[NSMutableArray alloc] init];

  for (int i = 0; i < shape.size(); i++) {
    [nsShape addObject:@(shape[i])];
  }

  return [nsShape copy];
};

/**
 * @brief Processes inputs through the forward pass of the model.
 *
 * This method takes input tensors, their corresponding shapes, and types,
 * and performs a forward pass using _model. It supports both
 * single and multiple inputs.
 *
 * @param inputs NSArray* of inputs where each element is an NSArray
 *               representing the data for a tensor.
 * @param shapes An array of shapes corresponding to the input tensors.
 *               Each element is an NSArray of integers defining the dimensions.
 * @param inputTypes An array of NSNumber objects representing the ScalarType of
 *                   the input tensors
 *
 * @return An NSArray containing the results of the forward pass. Each element
 *         represents the output of the corresponding input.
 *
 * @throws NSException Throws an exception with name "forward_error" if
 *                     an error occurs during input processing or model
 * execution.
 *
 * @warning Ensure that the inputs, shapes, and inputTypes arrays have the
 *          same number of elements. Mismatched sizes can lead to runtime
 *          errors.
 **/
- (NSArray *)forward:(NSArray *)inputs
              shapes:(NSArray *)shapes
          inputTypes:(NSArray *)inputTypes {
  std::vector<EValue> inputTensors;
  std::vector<TensorPtr> inputTensorPtrs;
  
  for (NSUInteger i = 0; i < [inputTypes count]; i++) {
    NSArray *inputShapeNSArray = [shapes objectAtIndex:i];
    
    std::vector<int> inputShape = NSArrayToIntVector(inputShapeNSArray);
    int inputType = [[inputTypes objectAtIndex:i] intValue];
    
    NSArray *input = [inputs objectAtIndex:i];
    
    TensorPtr currentTensor = NSArrayToTensorPtr(input, inputShape, inputType);
    if (!currentTensor) {
      throw [NSException
             exceptionWithName:@"forward_error"
             reason:[NSString stringWithFormat:@"%d", Error::InvalidArgument]
             userInfo:nil];
    }
    
    inputTensors.push_back(*currentTensor);
    inputTensorPtrs.push_back(currentTensor);
  }
  
  Result result = _model->forward(inputTensors);
  
  if (!result.ok()) {
    throw [NSException
           exceptionWithName:@"forward_error"
           reason:[NSString stringWithFormat:@"%d", result.error()]
           userInfo:nil];
  }
  
  NSMutableArray *output = [NSMutableArray new];
  for (int i = 0; i < result->size(); i++) {
    auto currentResultTensor = result->at(i).toTensor();
    NSArray *currentOutput = arrayToNsArray(currentResultTensor.const_data_ptr(), currentResultTensor.numel(), currentResultTensor.scalar_type());
    [output addObject:currentOutput];
  }
  return output;
  
}

@end
