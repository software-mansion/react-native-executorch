  //
//  ETModle.mm
//  ExecutorchLib
//
//  Created by NorbertKlockiewicz on 21/11/2024.
//
#import "ETModel.h"
#import "model.h"

@implementation ETModel {
  std::unique_ptr<Model> _model;
}

-(instancetype)loadModel:(NSString *)filePath {
  _model = std::make_unique<Model>(filePath.UTF8String);
  
  return self;
}

-(void)forward{
  _model->forward();
  return;
}

@end
