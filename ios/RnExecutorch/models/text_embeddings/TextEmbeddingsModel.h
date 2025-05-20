#import "../BaseModel.h"
#import "ExecutorchLib/HuggingFaceTokenizer.h"

@interface TextEmbeddingsModel : BaseModel {
@protected
  HuggingFaceTokenizer *tokenizer;
}

- (void)loadTokenizer:(NSString *)tokenizerSource;
- (NSArray *)preprocess:(NSString *)input;
- (NSArray *)runModel:(NSString *)input;
- (NSArray *)postprocess:(NSArray *)input
           attentionMask:(NSArray *)attentionMask;

@end
