/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSErrorDomain const LLaMARunnerErrorDomain;

NS_SWIFT_NAME(Runner)
@interface LLaMARunner : NSObject

- (instancetype)initWithModelPath:(NSString *)filePath
                    tokenizerPath:(NSString *)tokenizerPath;
- (BOOL)isLoaded;
- (BOOL)loadWithError:(NSError **)error;
- (BOOL)generate:(NSString *)prompt
    withTokenCallback:(nullable void (^)(NSString *))callback
                error:(NSError **)error;
- (void)stop;

+ (instancetype)new NS_UNAVAILABLE;
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
