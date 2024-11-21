// Downloader.h

#import <Foundation/Foundation.h>

@interface LargeFileFetcher : NSObject <NSURLSessionDownloadDelegate>

@property (nonatomic, copy) void (^onProgress)(NSNumber *);
@property (nonatomic, copy) void (^onFinish)(NSString *);
@property (nonatomic, copy) void (^onFailure)(NSError *);

- (void)startDownloadingFileFromURL:(NSURL *)url;

@end
