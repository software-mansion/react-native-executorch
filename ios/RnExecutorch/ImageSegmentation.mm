#import "ImageSegmentation.h"
#import "ImageProcessor.h"
#import "models/image_segmentation/ImageSegmentationModel.h"

@implementation ImageSegmentation {
  ImageSegmentationModel *model;
}

RCT_EXPORT_MODULE()

- (void)loadModule:(NSString *)modelSource
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {

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
    classesOfInterest:(NSArray *)classesOfInterest
               resize:(BOOL)resize
              resolve:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject {

  @try {
    cv::Mat image = [ImageProcessor readImage:input];
    NSDictionary *result = [model runModel:image
                             returnClasses:classesOfInterest
                                    resize:resize];

    resolve(result);
    return;
  } @catch (NSException *exception) {
    NSLog(@"An exception occurred: %@, %@", exception.name, exception.reason);
    reject(@"forward_error",
           [NSString stringWithFormat:@"%@", exception.reason], nil);
    return;
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeImageSegmentationSpecJSI>(
      params);
}

@end
