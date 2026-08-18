#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// Reports transferred bytes for a running download. `total` is 0 while the
/// length is still unknown.
typedef void (^RnExecutorchDownloadProgressBlock)(NSString *taskId, int64_t written, int64_t total);

/// Downloads model files through a background `NSURLSession`, so a multi-GB
/// transfer keeps running while the app is suspended instead of dying with it.
///
/// A background session is the only way iOS offers to do that, and it comes with
/// two constraints that shape this class:
///
///  * Exactly one session may exist per identifier per process, so this is a
///    singleton and the identifier is a fixed string rather than a per-request
///    UUID. A stable identifier is also what lets the system hand the session
///    back to a relaunched app.
///  * A background session only uses download tasks, which stage into their own
///    private file and hand it over whole at the end. There is no partially
///    written file to append to, so an interrupted transfer is continued through
///    NSURLSession's own resume data rather than through an HTTP Range request.
///    That data is persisted next to the destination, so it survives the app
///    being killed, not just backgrounded.
@interface RnExecutorchDownloader : NSObject

@property(class, nonatomic, readonly) RnExecutorchDownloader *shared;

/// Called on an arbitrary queue as bytes arrive.
@property(nonatomic, copy, nullable) RnExecutorchDownloadProgressBlock onProgress;

/// Starts (or continues) a download of `url` into `destination`.
/// Resolves with `destination` once the file is in place.
- (void)startDownload:(NSString *)taskId
                  url:(NSString *)url
          destination:(NSString *)destination
              resolve:(void (^)(NSString *path))resolve
               reject:(void (^)(NSString *code, NSString *message))reject;

/// Stops a running download, keeping what it already fetched so a later
/// `startDownload:` for the same destination continues from there.
- (void)cancelDownload:(NSString *)taskId;

/// Stops any transfer in flight for `destination` and drops its saved resume
/// data, so the next download of it starts from zero. Used by `forceDownload`.
- (void)resetDownloadFor:(NSString *)destination;

@end

NS_ASSUME_NONNULL_END
