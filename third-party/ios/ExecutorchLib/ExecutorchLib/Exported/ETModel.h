//
//  ETModle.h
//  ExecutorchLib
//
//  Created by NorbertKlockiewicz on 21/11/2024.
//
#import <UIKit/UIKit.h>

@interface ETModel: NSObject

-(instancetype)loadModel:(NSString *)filePath;

-(void)forward;

@end
