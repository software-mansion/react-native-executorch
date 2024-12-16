#import "LargeFileFetcher.h"
#import "Fetcher.h"
#import <Foundation/Foundation.h>

@implementation LargeFileFetcher {
  NSURLSession *_session;
  NSURL *_fileURL;
  NSString *_fileName;
  NSString *_destination;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration backgroundSessionConfigurationWithIdentifier:@"com.swmansion.rnexecutorch"];
    _session = [NSURLSession sessionWithConfiguration:configuration delegate:self delegateQueue:nil];
  }
  return self;
}

- (void)executeCompletionWithSuccess:(NSString *)filePath {
  if (self.onFinish) {
    dispatch_async(dispatch_get_main_queue(), ^{
      self.onFinish(filePath);
    });
  }
}

- (void)executeFailureWithMessage:(NSString *)message code:(NSInteger)code {
  if (self.onFailure) {
    NSError *error = [Fetcher buildError:message code:code];
    dispatch_async(dispatch_get_main_queue(), ^{
      self.onFailure(error);
    });
  }
}

- (void)cancelUnfinishedTasks {
  [_session getTasksWithCompletionHandler:^(NSArray<NSURLSessionDataTask *> *dataTasks, NSArray<NSURLSessionUploadTask *> *uploadTasks, NSArray<NSURLSessionDownloadTask *> *downloadTasks) {
    
    for (NSURLSessionDownloadTask *downloadTask in downloadTasks) {
      [downloadTask cancel];
    }
  }];
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didWriteData:(int64_t)bytesWritten totalBytesWritten:(int64_t)totalBytesWritten totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite {
  double progress = (double)totalBytesWritten / (double)totalBytesExpectedToWrite;
  
  if(self.onProgress){
    dispatch_async(dispatch_get_main_queue(), ^{
      self.onProgress(@(progress));
    });
  }
}

- (void)sendHeadRequestToURL:(NSURL *)url {
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
  [request setHTTPMethod:@"HEAD"];
  NSURLSessionDataTask *dataTask = [_session dataTaskWithRequest:request];
  [dataTask resume];
}

- (void)startDownloadingFileFromURL:(NSURL *)url {
  //Check if file is a valid url, if not check if it's path to local file
  if (![Fetcher isValidURL:url]) {
    if([Fetcher isLocalFilePath:url] && [Fetcher fileExistsAtPath:url.path]){
      [self executeCompletionWithSuccess:url.path];
      return;
    }
    [self executeFailureWithMessage:@"The provided URL is invalid" code:INVALID_URL_CODE];
    return;
  }
  
  //Check if file with extracted file name already exists in models directory if so, return path to it
  NSError *error;
  NSString *filePath = [Fetcher prepareFilePathForResource:url resourceType:ResourceType::MODEL error:&error];
  if (error) {
    [self executeFailureWithMessage:error.localizedDescription code:error.code];
    return;
  }
  
  if([[NSFileManager defaultManager] fileExistsAtPath: filePath]){
    [self executeCompletionWithSuccess:filePath];
    return;
  }
  
  // If the url is a Software Mansion HuggingFace repo, we want to send a HEAD
  // request to the config.json file, this increments HF download counter
  // https://huggingface.co/docs/hub/models-download-stats
  NSString *huggingFaceOrgNSString = @"https://huggingface.co/software-mansion/";
  NSString *modelURLNSString = [url absoluteString];
  
  if ([modelURLNSString hasPrefix:huggingFaceOrgNSString]) {
    NSRange resolveRange = [modelURLNSString rangeOfString:@"resolve"];
    if (resolveRange.location != NSNotFound) {
      NSString *configURLNSString = [modelURLNSString substringToIndex:resolveRange.location + resolveRange.length];
      configURLNSString = [configURLNSString stringByAppendingString:@"/main/config.json"];
      NSURL *configNSURL = [NSURL URLWithString:configURLNSString];
      [self sendHeadRequestToURL:configNSURL];
    }
  }  
  
  //Cancel all running background download tasks and start new one
  _destination = filePath;
  [self cancelUnfinishedTasks];
  NSURLRequest *request = [NSURLRequest requestWithURL:url];
  NSURLSessionDownloadTask *downloadTask = [_session downloadTaskWithRequest:request];
  [downloadTask resume];
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didFinishDownloadingToURL:(NSURL *)location {
  NSFileManager *fileManager = [NSFileManager defaultManager];
  
  [fileManager removeItemAtPath:_destination error:nil];
  
  NSError *error;
  if ([fileManager moveItemAtPath:location.path toPath:_destination error:&error]) {
    [self executeCompletionWithSuccess:_destination];
    return;
  } else {
    [self executeFailureWithMessage:@"Failed to write file to disk" code:WRITE_FAILED];
    return;
  }
}

@end
