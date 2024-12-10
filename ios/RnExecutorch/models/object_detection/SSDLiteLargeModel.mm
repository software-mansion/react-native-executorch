#import "SSDLiteLarge.h"
#import "ImageProcessor.h"

@implementation SSDLiteLarge

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
  CGSize targetSize = CGSizeMake(320, 320);
  return [ImageProcessor resizeImage:input toSize:targetSize];
}

- (UIImage *)postprocess:(UIImage *)input {
  // Assume any necessary format conversions or adjustments
  return input;
}

- (void) runModel:(UIImage *)input {
  CGSize inputSize = CGSize({320, 320});
  UIImage *preprocessedImage = [self preprocess:input];
  
  float *preprocessedImageData = [ImageProcessor imageToFloatArray:preprocessedImage size:&inputSize];
  NSArray *modelInput = [self floatArrayToNSArray:preprocessedImageData length:1228800];
  
  NSError* forwardError = nil;
  NSArray *result = [self forward:modelInput shape:@[@1, @3, @320, @320] inputType:@3 error:&forwardError];
  
  float* outputData = [self NSArrayToFloatArray:result outLength:1228800];
  
  free(preprocessedImageData);
  free(outputData);
//  return [self postprocess:outputImage];
}

@end
