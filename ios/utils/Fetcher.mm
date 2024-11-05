#import <Foundation/Foundation.h>
#import "Fetcher.h"

@implementation Fetcher

+ (NSError *) buildError:(NSString *)description code: (NSInteger)code {
  NSDictionary *userInfo = @{NSLocalizedDescriptionKey: NSLocalizedString(description, nil)};
  NSError *error = [NSError errorWithDomain:FETCHER_ERROR_DOMAIN code:code userInfo:userInfo];
  return error;
}

+ (NSString *) extractFilePathFromAssetsURL: (NSURL *)resourceURL {
  NSString *fileName = nil;
  
  NSURLComponents *components = [NSURLComponents componentsWithURL:resourceURL resolvingAgainstBaseURL:NO];
  NSArray<NSURLQueryItem *> *queryItems = components.queryItems;
  
  for (NSURLQueryItem *item in queryItems) {
    if ([item.name isEqualToString:@"unstable_path"]) {
      NSString *unstablePathValue = item.value;
      
      if (unstablePathValue) {
        NSString *decodedPath = [unstablePathValue stringByRemovingPercentEncoding];
        NSArray *pathComponents = [decodedPath componentsSeparatedByString:@"?"];
        
        fileName = [[pathComponents firstObject] lastPathComponent];
      }
      break;
    }
  }
  
  return fileName ? fileName : @"";
}

+ (BOOL) isValidURL:(NSURL *) url {
  return url && url.scheme && url.host;
}

+ (BOOL) isLocalFilePath:(NSURL *) url {
  return [url.scheme isEqualToString:@"file"];
}

+ (BOOL) hasValidExtension:(NSString *)fileName resourceType:(ResourceType)resourceType{
  switch (resourceType) {
    case ResourceType::TOKENIZER:
      return [fileName hasSuffix:@".bin"];
    case ResourceType::MODEL:
      return [fileName hasSuffix:@".pte"];
    default:
      return NO;
  }
}

+(BOOL) fileExistsAtPath:(NSString *)filePath  {
  NSFileManager *fileManager = [NSFileManager defaultManager];
  return [fileManager fileExistsAtPath:filePath];
}

+ (NSURL *) createDirectoryInDocuments:(NSFileManager *)fileManager{
  NSArray<NSURL *> *documentsDirectoryURLs = [fileManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask];
  NSURL *documentsDirectoryURL = [documentsDirectoryURLs firstObject];
  NSURL *modelsDirectoryURL = [documentsDirectoryURL URLByAppendingPathComponent:@"models" isDirectory:YES];
  
  NSError *directoryError = nil;
  if (![fileManager fileExistsAtPath:modelsDirectoryURL.path]) {
    [fileManager createDirectoryAtURL:modelsDirectoryURL withIntermediateDirectories:YES attributes:nil error:&directoryError];
    if (directoryError) {
      return [NSURL URLWithString: @""];
    }
  }
  
  return modelsDirectoryURL;
}

+ (NSString *)prepareFilePathForResource:(NSURL *)resourceURL resourceType:(ResourceType)resourceType error:(NSError **)error {
  NSFileManager *fileManager = [NSFileManager defaultManager];
  
  //If fileName is equal to assets it means that the model is included in bundle
  NSString *fileName = [resourceURL lastPathComponent];
  
  // If fileName is "assets", extract the file path
  if ([fileName isEqualToString:@"assets"]) {
    fileName = [self extractFilePathFromAssetsURL:resourceURL];
  }
  
  //Check if the file extension matches type of resource
  if (![Fetcher hasValidExtension:fileName resourceType:resourceType]) {
    if (error) {
      *error = [self buildError:@"Invalid file type" code:INVALID_FILE_TYPE];
    }
    return nil;
  }
  
  //Create models directory in app's documents folder
  NSURL *modelsDirectoryURL = [self createDirectoryInDocuments:fileManager];
  if ([@"" isEqualToString: modelsDirectoryURL.path]) {
    if (error) {
      *error = [self buildError:@"Couldn't create models directory" code:WRITE_FAILED];
    }
    return nil;
  }
  
  // Construct the full file path
  NSString *filePath = [modelsDirectoryURL.path stringByAppendingPathComponent:fileName];
  
  //Check if file with extracted file name already exists in models directory if so, return path to it
  if ([fileManager fileExistsAtPath:filePath]) {
    return filePath;
  }
  
  return filePath;
}

+ (void)fetchResource:(NSURL *)resourceURL resourceType:(ResourceType)resourceType completionHandler:(void (^)(NSString *filePath, NSError *error))completionHandler {
  NSFileManager *fileManager = [NSFileManager defaultManager];
  NSError *error = nil;
  if (![self isValidURL:resourceURL]) {
    if ([self isLocalFilePath:resourceURL] && [self fileExistsAtPath:resourceURL.path]) {
      completionHandler(resourceURL.path, nil);
      return;
    }
    completionHandler(nil, [self buildError:@"The provided URL is invalid" code:INVALID_URL_CODE]);
    return;
  }
  
  NSString *filePath = [self prepareFilePathForResource:resourceURL resourceType:resourceType error:&error];
  if (error) {
    completionHandler(nil, error);
    return;
  }
  
  if ([fileManager fileExistsAtPath:filePath]) {
    completionHandler(filePath, nil);
    return;
  }
  
  NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
  NSURLSession *session = [NSURLSession sessionWithConfiguration:configuration];
  
  NSURLSessionDataTask *downloadTask = [session dataTaskWithURL:resourceURL completionHandler:^(NSData *data, NSURLResponse *response, NSError *sessionTaskError) {
    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
    NSInteger statusCode = httpResponse.statusCode;
    
    if (statusCode != STATUS_OK) {
      completionHandler(nil, [self buildError:@"Couldn't download file" code:DOWNLOAD_FAILED]);
      return;
    }
    if (sessionTaskError) {
      completionHandler(nil, sessionTaskError);
      return;
    }
    if (data) {
      NSError *writeError = nil;
      BOOL success = [data writeToFile:filePath options:NSDataWritingAtomic error:&writeError];
      if (success) {
        completionHandler(filePath, nil);
      } else {
        completionHandler(nil, [self buildError:writeError.localizedDescription code:WRITE_FAILED]);
      }
    } else {
      completionHandler(nil, [self buildError:@"No data received from server" code:NO_DATA]);
    }
  }];
  
  [downloadTask resume];
}
@end
