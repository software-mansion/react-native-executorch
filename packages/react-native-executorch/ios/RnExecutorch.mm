#import "RnExecutorch.h"
#import "../cpp/RnExecutorch.h"
#import "RnExecutorchDownloader.h"
#import <React/RCTBridge+Private.h>
#import <jsi/jsi.h>

@implementation RnExecutorch {
    __weak RCTBridge *_bridge;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (instancetype)init {
    if (self = [super init]) {
        // The downloader runs on the session's own queue, so hop the samples onto
        // the module's event emitter from wherever they arrive.
        __weak __typeof(self) weakSelf = self;
        RnExecutorchDownloader.shared.onProgress =
            ^(NSString *taskId, int64_t written, int64_t total) {
                [weakSelf emitOnDownloadProgress:@{
                    @"taskId" : taskId,
                    @"written" : @(written),
                    @"total" : @(total),
                }];
            };
    }
    return self;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeRnExecutorchSpecJSI>(params);
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, install) {
    RCTCxxBridge *cxxBridge = (RCTCxxBridge *)self.bridge;

    if (cxxBridge == nil)
        return @NO;

    facebook::jsi::Runtime *jsiRuntime = (facebook::jsi::Runtime *)cxxBridge.runtime;

    if (jsiRuntime == nil)
        return @NO;

    rnexecutorch::install(*jsiRuntime);

    return @YES;
}

#pragma mark - Downloads

// iOS keeps a suspended app's in-process transfers from running at all, so model
// downloads go through a background NSURLSession rather than through JS.
RCT_EXPORT_METHOD(startDownload
                  : (NSString *)taskId url
                  : (NSString *)url destination
                  : (NSString *)destination resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
    [RnExecutorchDownloader.shared
        startDownload:taskId
                  url:url
          destination:destination
              resolve:^(NSString *path) {
                  resolve(path);
              }
               reject:^(NSString *code, NSString *message) {
                   reject(code, message, nil);
               }];
}

RCT_EXPORT_METHOD(cancelDownload
                  : (NSString *)taskId resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
    [RnExecutorchDownloader.shared cancelDownload:taskId];
    resolve(nil);
}

RCT_EXPORT_METHOD(resetDownload
                  : (NSString *)destination resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject) {
    [RnExecutorchDownloader.shared resetDownloadFor:destination];
    resolve(nil);
}

@end
