#import "StyleTransferModel.h"
#import "../utils/ImageProcessor.h"

@implementation StyleTransferModel

- (float *) NSArrayToFloatArray:(NSArray<NSNumber *> *)array outLength:(size_t )outLength {
  if (!array || array.count == 0) {
    NSLog(@"Invalid NSArray input.");
    outLength = 0;
    return nullptr;
  }
  
  size_t length = array.count;
  float* floatArray = new float[length];
  
  for (size_t i = 0; i < length; ++i) {
    floatArray[i] = [array[i] floatValue];
  }
  
  outLength = length;
  return floatArray;
}

- (NSArray *) floatArrayToNSArray:(float*) floatArray length:(size_t)length {
  if (floatArray == nullptr || length == 0) {
    NSLog(@"Invalid input array or length.");
    return nil;
  }
  
  NSMutableArray *array = [NSMutableArray arrayWithCapacity:length];
  
  for (size_t i = 0; i < length; ++i) {
    NSNumber *number = [NSNumber numberWithFloat:floatArray[i]];
    [array addObject:number];
  }
  
  return [array copy];
}

- (UIImage *)preprocess:(UIImage *)input {
  CGSize targetSize = CGSizeMake(640, 640);
  return [ImageProcessor resizeImage:input toSize:targetSize];
}

- (UIImage *)postprocess:(UIImage *)input {
  // Assume any necessary format conversions or adjustments
  return input;
}

- (UIImage *)runModel:(UIImage *)input {
  UIImage *processedImage = [self preprocess:input];
  CGSize outputSize = {640, 640};
  float* processedImageData = [ImageProcessor imageToFloatArray:processedImage size:&outputSize];
  
  NSArray *modelInput = [self floatArrayToNSArray:processedImageData length:1228800];
  NSNumber* numInputs = [module getNumberOfInputs];
  NSLog(@"RnExecutorch: %@", [module getNumberOfInputs]);
  for (NSUInteger i = 0; i < [[module getNumberOfInputs] intValue]; i++) {
    NSNumber * index = @(i);
    NSLog(@"RnExecutorch: %@", [module getInputType:index]);
    NSArray *inputShapes = [module getInputShape:index];
    for (NSNumber *shape in inputShapes) {
      NSLog(@"RnExecutorch: %@", shape);
    }
  }
  
  NSLog(@"RnExecutorch: %@", [module getNumberOfOutputs]);
  for (NSUInteger i = 0; i < [[module getNumberOfOutputs] intValue]; i++) {
    NSNumber * index = @(i);
    
    NSLog(@"RnExecutorch: %@", [module getOutputType:index]);
    NSArray *outputShapes = [module getOutputShape:index];
    for (NSNumber *shape in outputShapes) {
      NSLog(@"RnExecutorch: %@", shape);
    }
  }
  
  
  NSError* forwardError = nil;
  NSArray *result = [self forward:modelInput shape:@[@1, @3, @640, @640] inputType:@3 error:&forwardError];
  free(processedImageData);
  float* outputData = [self NSArrayToFloatArray:result outLength:1228800];
  UIImage *outputImage = [ImageProcessor imageFromFloatArray:outputData size:processedImage.size];
  free(outputData);
  return [self postprocess:outputImage];
}

@end
