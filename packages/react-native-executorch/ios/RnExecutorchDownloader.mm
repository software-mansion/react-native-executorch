#import "RnExecutorchDownloader.h"

// One session per identifier per process, and the identifier has to stay the
// same across launches for iOS to hand a finished transfer back to the app.
static NSString *const kSessionIdentifier = @"com.swmansion.rnexecutorch.downloads";

// Progress is emitted to JS, so it is throttled rather than forwarded per packet.
static const NSTimeInterval kProgressInterval = 0.25;

/// Bookkeeping for one in-flight download. Only meaningful within a single
/// process lifetime: the session outlives it, so anything needed after a
/// relaunch (the destination) is stored on the task itself instead.
@interface RnExecutorchDownload : NSObject
@property(nonatomic, copy) NSString *taskId;
@property(nonatomic, copy) NSString *destination;
@property(nonatomic, copy, nullable) void (^resolve)(NSString *path);
@property(nonatomic, copy, nullable) void (^reject)(NSString *code, NSString *message);
@property(nonatomic, weak, nullable) NSURLSessionDownloadTask *task;
@property(nonatomic, assign) NSTimeInterval lastProgressAt;
/// Set when the finished file could not be moved into place, so the completion
/// callback can fail rather than report a success that left nothing on disk.
@property(nonatomic, copy, nullable) NSString *moveError;
/// A cancel we asked for, to tell it apart from a transfer that genuinely failed.
@property(nonatomic, assign) BOOL cancelledByUs;
@end

@implementation RnExecutorchDownload
@end

@interface RnExecutorchDownloader () <NSURLSessionDownloadDelegate>
@property(nonatomic, strong) NSURLSession *session;
/// Guards `downloads`, which is touched from both JS and delegate queues.
@property(nonatomic, strong) NSLock *lock;
@property(nonatomic, strong) NSMutableDictionary<NSString *, RnExecutorchDownload *> *downloads;
/// Destinations with a cancel still in flight. `cancelByProducingResumeData:`
/// hands its data back asynchronously, so without this a download restarted
/// straight after an abort would look for resume data that had not been written
/// yet and start over from zero.
@property(nonatomic, strong) NSMutableDictionary<NSString *, dispatch_group_t> *pendingCancels;
@end

@implementation RnExecutorchDownloader

+ (RnExecutorchDownloader *)shared {
    static RnExecutorchDownloader *shared = nil;
    static dispatch_once_t once;
    dispatch_once(&once, ^{
        shared = [[RnExecutorchDownloader alloc] init];
    });
    return shared;
}

- (instancetype)init {
    if (self = [super init]) {
        _lock = [[NSLock alloc] init];
        _downloads = [NSMutableDictionary dictionary];
        _pendingCancels = [NSMutableDictionary dictionary];

        NSURLSessionConfiguration *config =
            [NSURLSessionConfiguration backgroundSessionConfigurationWithIdentifier:kSessionIdentifier];
        // Wake the app when a transfer finishes while it is not running.
        config.sessionSendsLaunchEvents = YES;
        // Background sessions are discretionary by default, which lets iOS hold a
        // transfer back for power or for wifi. Downloading a model is something
        // the user just asked for, so it should start now.
        config.discretionary = NO;
        // A stalled connection should be retried rather than waited on forever,
        // but a multi-GB body legitimately takes a long time, so only the gap
        // between packets is bounded, not the transfer as a whole.
        config.timeoutIntervalForRequest = 60;
        config.timeoutIntervalForResource = 7 * 24 * 60 * 60;
        _session = [NSURLSession sessionWithConfiguration:config delegate:self delegateQueue:nil];

        // Constructing the session is itself what re-attaches it to transfers
        // left over from a previous launch: anything that finished meanwhile is
        // delivered to the delegate now, and lands in the cache even though no
        // caller is waiting for it any more.
    }
    return self;
}

#pragma mark - Public API

- (void)startDownload:(NSString *)taskId
                  url:(NSString *)url
          destination:(NSString *)destination
              resolve:(void (^)(NSString *path))resolve
               reject:(void (^)(NSString *code, NSString *message))reject {
    NSURL *parsed = [NSURL URLWithString:url];
    if (parsed == nil) {
        reject(@"DOWNLOAD_FAILED", [NSString stringWithFormat:@"Malformed URL: %@", url]);
        return;
    }

    RnExecutorchDownload *download = [[RnExecutorchDownload alloc] init];
    download.taskId = taskId;
    download.destination = destination;
    download.resolve = resolve;
    download.reject = reject;

    [self.lock lock];
    self.downloads[taskId] = download;
    [self.lock unlock];

    // The session outlives the app's JS, so a transfer started before a reload
    // (or before the app was killed) may still be running for this very file.
    // Starting a second one would download it twice over the same connection
    // budget and race two writers onto one destination, so attach to it instead.
    [self.session getTasksWithCompletionHandler:^(NSArray<NSURLSessionDataTask *> *dataTasks,
                                                  NSArray<NSURLSessionUploadTask *> *uploadTasks,
                                                  NSArray<NSURLSessionDownloadTask *> *downloadTasks) {
        for (NSURLSessionDownloadTask *running in downloadTasks) {
            BOOL live = running.state == NSURLSessionTaskStateRunning ||
                        running.state == NSURLSessionTaskStateSuspended;
            if (live && [running.taskDescription isEqualToString:destination]) {
                download.task = running;
                [running resume];
                return;
            }
        }

        // Already on a background queue, so waiting briefly for an in-flight
        // cancel to hand back its resume data costs nothing and is what makes
        // "abort, then download again" continue instead of restart.
        [self.lock lock];
        dispatch_group_t pendingCancel = self.pendingCancels[destination];
        [self.lock unlock];
        if (pendingCancel != nil) {
            dispatch_group_wait(pendingCancel, dispatch_time(DISPATCH_TIME_NOW, 5 * NSEC_PER_SEC));
        }

        NSURLSessionDownloadTask *task = [self taskForURL:parsed destination:destination];
        // Survives being written out and read back by the system, so a task
        // adopted after a relaunch still knows where its file belongs.
        task.taskDescription = destination;
        download.task = task;
        [task resume];
    }];
}

- (void)cancelDownload:(NSString *)taskId {
    [self.lock lock];
    RnExecutorchDownload *download = self.downloads[taskId];
    [self.lock unlock];

    if (download == nil) {
        return;
    }
    download.cancelledByUs = YES;

    NSURLSessionDownloadTask *task = download.task;
    if (task == nil) {
        return;
    }
    NSString *destination = download.destination;

    dispatch_group_t finished = dispatch_group_create();
    dispatch_group_enter(finished);
    [self.lock lock];
    self.pendingCancels[destination] = finished;
    [self.lock unlock];

    [task cancelByProducingResumeData:^(NSData *_Nullable resumeData) {
        // Plain `cancel` would throw the fetched bytes away. With this, a model
        // interrupted at 98% continues from 98% rather than from zero.
        if (resumeData.length > 0) {
            [resumeData writeToFile:[RnExecutorchDownloader resumePathFor:destination] atomically:YES];
        }
        [self.lock lock];
        [self.pendingCancels removeObjectForKey:destination];
        [self.lock unlock];
        dispatch_group_leave(finished);
    }];
}

- (void)resetDownloadFor:(NSString *)destination {
    // Dropping the resume data alone would not be enough: a transfer for this
    // destination may still be running from before, and startDownload adopts a
    // running task rather than starting a second one. Without stopping it,
    // `forceDownload` would attach to the very attempt it is meant to replace.
    [self.session getTasksWithCompletionHandler:^(NSArray<NSURLSessionDataTask *> *dataTasks,
                                                  NSArray<NSURLSessionUploadTask *> *uploadTasks,
                                                  NSArray<NSURLSessionDownloadTask *> *downloadTasks) {
        for (NSURLSessionDownloadTask *running in downloadTasks) {
            if ([running.taskDescription isEqualToString:destination]) {
                [running cancel];
            }
        }
        [[NSFileManager defaultManager]
            removeItemAtPath:[RnExecutorchDownloader resumePathFor:destination]
                       error:nil];
    }];
}

#pragma mark - Tasks

+ (NSString *)resumePathFor:(NSString *)destination {
    return [destination stringByAppendingPathExtension:@"resume"];
}

/// A task continuing an earlier attempt when there is resume data to continue
/// from, otherwise a fresh one.
- (NSURLSessionDownloadTask *)taskForURL:(NSURL *)url destination:(NSString *)destination {
    NSString *resumePath = [RnExecutorchDownloader resumePathFor:destination];
    NSData *resumeData = [NSData dataWithContentsOfFile:resumePath];
    // Consumed either way: resume data is only valid for one attempt, and
    // deleting it up front means a blob the system rejects can't wedge this
    // destination into failing forever.
    [[NSFileManager defaultManager] removeItemAtPath:resumePath error:nil];

    if (resumeData.length > 0) {
        NSURLSessionDownloadTask *resumed = [self.session downloadTaskWithResumeData:resumeData];
        // Malformed resume data yields a task with no request rather than an
        // error, so fall back instead of resuming a task that goes nowhere.
        if (resumed != nil && resumed.originalRequest != nil) {
            return resumed;
        }
        [resumed cancel];
    }
    return [self.session downloadTaskWithURL:url];
}

- (RnExecutorchDownload *)downloadForTask:(NSURLSessionTask *)task {
    [self.lock lock];
    RnExecutorchDownload *match = nil;
    for (RnExecutorchDownload *download in self.downloads.allValues) {
        if (download.task == task) {
            match = download;
            break;
        }
    }
    [self.lock unlock];
    return match;
}

#pragma mark - NSURLSessionDownloadDelegate

- (void)URLSession:(NSURLSession *)session
                 downloadTask:(NSURLSessionDownloadTask *)downloadTask
                 didWriteData:(int64_t)bytesWritten
            totalBytesWritten:(int64_t)totalBytesWritten
    totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite {
    RnExecutorchDownload *download = [self downloadForTask:downloadTask];
    if (download == nil) {
        return;
    }

    NSTimeInterval now = [NSDate timeIntervalSinceReferenceDate];
    BOOL done = totalBytesExpectedToWrite > 0 && totalBytesWritten >= totalBytesExpectedToWrite;
    if (!done && now - download.lastProgressAt < kProgressInterval) {
        return;
    }
    download.lastProgressAt = now;

    RnExecutorchDownloadProgressBlock onProgress = self.onProgress;
    if (onProgress != nil) {
        // `NSURLSessionTransferSizeUnknown` is -1; report it as 0 so the receiver
        // treats the length as unknown rather than as a negative file.
        int64_t total = totalBytesExpectedToWrite > 0 ? totalBytesExpectedToWrite : 0;
        onProgress(download.taskId, totalBytesWritten, total);
    }
}

- (void)URLSession:(NSURLSession *)session
          downloadTask:(NSURLSessionDownloadTask *)downloadTask
     didResumeAtOffset:(int64_t)fileOffset
    expectedTotalBytes:(int64_t)expectedTotalBytes {
    RnExecutorchDownload *download = [self downloadForTask:downloadTask];
    RnExecutorchDownloadProgressBlock onProgress = self.onProgress;
    if (download == nil || onProgress == nil) {
        return;
    }
    // Say where the transfer is picking up from before any new bytes arrive, so
    // continuing a nearly finished download doesn't show the bar back at zero.
    onProgress(download.taskId, fileOffset, expectedTotalBytes > 0 ? expectedTotalBytes : 0);
}

- (void)URLSession:(NSURLSession *)session
                 downloadTask:(NSURLSessionDownloadTask *)downloadTask
    didFinishDownloadingToURL:(NSURL *)location {
    // The staged file is only guaranteed to exist until this method returns, so
    // the move has to happen here rather than in didCompleteWithError.
    NSString *destination = downloadTask.taskDescription;
    if (destination.length == 0) {
        return;
    }

    NSFileManager *fm = [NSFileManager defaultManager];
    NSString *folder = [destination stringByDeletingLastPathComponent];
    [fm createDirectoryAtPath:folder withIntermediateDirectories:YES attributes:nil error:nil];
    [fm removeItemAtPath:destination error:nil];

    NSError *error = nil;
    [fm moveItemAtURL:location toURL:[NSURL fileURLWithPath:destination] error:&error];

    RnExecutorchDownload *download = [self downloadForTask:downloadTask];
    if (error != nil) {
        download.moveError = error.localizedDescription;
    } else {
        // The transfer succeeded, so nothing is left to continue from.
        [[NSFileManager defaultManager]
            removeItemAtPath:[RnExecutorchDownloader resumePathFor:destination]
                       error:nil];
    }
}

- (void)URLSession:(NSURLSession *)session
                    task:(NSURLSessionTask *)task
    didCompleteWithError:(NSError *)error {
    RnExecutorchDownload *download = [self downloadForTask:task];
    if (download == nil) {
        return;
    }

    [self.lock lock];
    [self.downloads removeObjectForKey:download.taskId];
    [self.lock unlock];

    void (^resolve)(NSString *) = download.resolve;
    void (^reject)(NSString *, NSString *) = download.reject;
    download.resolve = nil;
    download.reject = nil;

    if (error != nil) {
        // A transfer that died on its own can still hand back enough state to
        // continue later, which is worth keeping for everything except a cancel
        // we asked for (that path writes its own resume data).
        NSData *resumeData = error.userInfo[NSURLSessionDownloadTaskResumeData];
        if (!download.cancelledByUs && resumeData.length > 0) {
            [resumeData writeToFile:[RnExecutorchDownloader resumePathFor:download.destination]
                         atomically:YES];
        }
        if (download.cancelledByUs || error.code == NSURLErrorCancelled) {
            reject(@"DOWNLOAD_ABORTED", @"The download was aborted.");
        } else {
            reject(@"DOWNLOAD_FAILED", error.localizedDescription);
        }
        return;
    }

    if (download.moveError != nil) {
        reject(@"DOWNLOAD_FAILED",
               [NSString stringWithFormat:@"Could not store the download: %@", download.moveError]);
        return;
    }

    resolve(download.destination);
}

@end
