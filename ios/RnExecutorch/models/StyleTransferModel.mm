#import "StyleTransferModel.h"
#import "ImageProcessor.h"

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
  NSNumber *type = [module getInputType];
  NSArray *shape = [module getInputShape];
  
  NSArray *modelInput = [self floatArrayToNSArray:processedImageData length:1228800];
  
  NSArray *result = [self forward:modelInput shape:shape inputType:type];
  free(processedImageData);
  float* outputData = [self NSArrayToFloatArray:result outLength:1228800];
  UIImage *outputImage = [ImageProcessor imageFromFloatArray:outputData size:processedImage.size];
  free(outputData);
  return [self postprocess:outputImage];
}

@end
