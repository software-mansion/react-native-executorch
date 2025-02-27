#import "ImageSegmentation.h"
#import "models/image_segmentation/ImageSegmentationModel.h"
#import "models/BaseModel.h"
#import "utils/ETError.h"
#import <ExecutorchLib/ETModel.h>
#import <React/RCTBridgeModule.h>

@implementation ImageSegmentation {
  ImageSegmentationModel *model;
}

RCT_EXPORT_MODULE()

- (void)loadModule:(NSString *)modelSource
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {

  NSLog(@"Segmentation: loadModule");
  model = [[ImageSegmentationModel alloc] init];
  [model
       loadModel:[NSURL URLWithString:modelSource]
      completion:^(BOOL success, NSNumber *errorCode) {
        if (success) {
          resolve(errorCode);
          return;
        }

        reject(@"init_module_error",
               [NSString stringWithFormat:@"%ld", (long)[errorCode longValue]],
               nil);
        return;
      }];
}

- (void)forward:(NSString *)input
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
    NSLog(@"Segmentation: forward");
//   @try {
//     cv::Mat image = [ImageProcessor readImage:input];
//     cv::Mat resultImage = [model runModel:image];

//     NSString *tempFilePath = [ImageProcessor saveToTempFile:resultImage];
//     resolve(tempFilePath);
//     return;
//   } @catch (NSException *exception) {
//     NSLog(@"An exception occurred: %@, %@", exception.name, exception.reason);
//     reject(@"forward_error",
//            [NSString stringWithFormat:@"%@", exception.reason], nil);
//     return;
//   }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeImageSegmentationSpecJSI>(params);
}

@end
