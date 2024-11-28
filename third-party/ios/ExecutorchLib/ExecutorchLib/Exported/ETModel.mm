#import "ETModel.h"
#import "Utils.hpp"
#include <executorch/extension/module/module.h>
#include <executorch/extension/tensor/tensor.h>
#include <executorch/runtime/core/error.h>
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
  void *inputArray = typedArrayFromNSArrayWithTypeIndicator(input, inputType);
  std::vector<int> shapes = convertNSArrayToIntVector(shape);
  TensorPtr tensor_ptr = from_blob(inputArray, shapes);

  Result result = _model->forward(tensor_ptr);

  if (result.ok()) {
    const auto outputTensor = result->at(0).toTensor();
    return arrayToNSArray(outputTensor.const_data_ptr(), outputTensor.numel());
  }

  @throw [NSException
      exceptionWithName:@"forward_error"
                 reason:[NSString stringWithFormat:@"Error code: %d",
                                                   (int)result.error()]
               userInfo:nil];
}
@end
