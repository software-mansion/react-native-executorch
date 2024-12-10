#import <string_view>
#import <Foundation/Foundation.h>

enum class ResourceType
{
  MODEL,
  TOKENIZER
};

inline constexpr unsigned int STATUS_OK = 200;

inline constexpr unsigned int INVALID_URL_CODE = 1;
inline constexpr unsigned int INVALID_FILE_TYPE = 2;
inline constexpr unsigned int DOWNLOAD_FAILED = 3;
inline constexpr unsigned int WRITE_FAILED = 4;
inline constexpr unsigned int NO_DATA = 5;

NSString *const FETCHER_ERROR_DOMAIN = @"com.swmansion.fetcher";

@interface Fetcher : NSObject

@property(nonatomic, copy) void (^onProgress)(NSNumber *);

+ (void)fetchResource:(NSURL *)resourceURL resourceType:(ResourceType)resourceType completionHandler:(void (^)(NSString *filePath, NSError *error))completionHandler;
+ (BOOL)isValidURL:(NSURL *)url;
+ (BOOL)isLocalFilePath:(NSURL *)url;
+ (BOOL)hasValidExtension:(NSString *)fileName resourceType:(ResourceType)resourceType;
+ (BOOL)fileExistsAtPath:(NSString *)filePath;
+ (NSString *)extractFilePathFromAssetsURL:(NSURL *)resourceURL;
+ (NSError *)buildError:(NSString *)description code:(NSInteger)code;
+ (NSURL *)createDirectoryInDocuments:(NSFileManager *)fileManager;
+ (NSString *)prepareFilePathForResource:(NSURL *)resourceURL resourceType:(ResourceType)resourceType error:(NSError **)error;

@end
