#import "BaseModel.h"
#import "ExecutorchLib/HuggingFaceTokenizer.h"

@interface TextEmbeddingsModel : BaseModel {
@protected
  HuggingFaceTokenizer *tokenizer;
}

- (NSNumber *)loadModelSync:(NSString *)modelSource;
- (NSNumber *)loadTokenizer:(NSString *)tokenizerSource;
- (NSArray *)preprocess:(NSString *)input;
- (NSArray *)runModel:(NSString *)input;
- (NSArray *)postprocess:(NSArray *)input attentionMask:(NSArray *) attentionMask;

@end
