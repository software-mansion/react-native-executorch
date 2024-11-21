/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "LLaMARunner.h"

#import <ExecuTorch/ExecuTorchLog.h>
#import "runner.h"

using namespace ::torch::executor;

NSErrorDomain const LLaMARunnerErrorDomain = @"LLaMARunnerErrorDomain";
NSErrorDomain const LLaVARunnerErrorDomain = @"LLaVARunnerErrorDomain";

@interface LLaMARunner ()<ExecuTorchLogSink>
@end

@implementation LLaMARunner {
  std::unique_ptr<example::Runner> _runner;
}

- (instancetype)initWithModelPath:(NSString*)modelPath
                    tokenizerPath:(NSString*)tokenizerPath {
  self = [super init];
  if (self) {
    [ExecuTorchLog.sharedLog addSink:self];
    _runner = std::make_unique<example::Runner>(
        modelPath.UTF8String, tokenizerPath.UTF8String);
  }
  return self;
}

- (void)dealloc {
  [ExecuTorchLog.sharedLog removeSink:self];
}

- (BOOL)isloaded {
  return _runner->is_loaded();
}

- (BOOL)loadWithError:(NSError**)error {
  const auto status = _runner->load();
  if (status != Error::Ok) {
    if (error) {
      *error = [NSError errorWithDomain:LLaMARunnerErrorDomain
                                   code:(NSInteger)status
                               userInfo:nil];
    }
    return NO;
  }
  return YES;
}

- (BOOL)generate:(NSString*)prompt
    withTokenCallback:(nullable void (^)(NSString*))callback
                error:(NSError**)error {
  const auto status = _runner->generate(
      prompt.UTF8String, [callback](const std::string& token) {
        callback(@(token.c_str()));
      });
  if (status != Error::Ok) {
    if (error) {
      *error = [NSError errorWithDomain:LLaMARunnerErrorDomain
                                   code:(NSInteger)status
                               userInfo:nil];
      return NO;
    }
  }
  return YES;
}

- (void)stop {
  _runner->stop();
}

#pragma mark - ExecuTorchLogSink

- (void)logWithLevel:(ExecuTorchLogLevel)level
           timestamp:(NSTimeInterval)timestamp
            filename:(NSString*)filename
                line:(NSUInteger)line
             message:(NSString*)message {
  NSUInteger totalSeconds = (NSUInteger)timestamp;
  NSUInteger hours = (totalSeconds / 3600) % 24;
  NSUInteger minutes = (totalSeconds / 60) % 60;
  NSUInteger seconds = totalSeconds % 60;
  NSUInteger microseconds = (timestamp - totalSeconds) * 1000000;
  NSLog(
      @"%c %02lu:%02lu:%02lu.%06lu executorch:%s:%zu] %s",
      (char)level,
      hours,
      minutes,
      seconds,
      microseconds,
      filename.UTF8String,
      line,
      message.UTF8String);
}

@end
