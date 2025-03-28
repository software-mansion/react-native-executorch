#import "TextEmbeddingsModel.h"
#import "TextEmbeddingsUtils.h"

@implementation TextEmbeddingsModel

- (NSArray *)preprocess:(NSString *)input {
  NSArray *input_ids = [self->tokenizer encode:input];
  NSMutableArray *attention_mask = [NSMutableArray new];
  for (int i = 0; i < [input_ids count]; i++) {
    [attention_mask addObject:@([input_ids[i] intValue] != 0 ? 1 : 0)];
  }
  return @[@[input_ids], @[attention_mask]]; // [2, 1, max_length]
}

- (NSArray *)postprocess:(NSArray *)modelOutput // [max_length * embedding_dim]
           attentionMask: (NSArray *)attentionMask // [max_length]
{
  NSArray* embeddings = [TextEmbeddingsUtils meanPooling:modelOutput attentionMask:attentionMask];
  return [TextEmbeddingsUtils normalize:embeddings];
}

- (NSArray *)runModel:(NSString *)input {
  NSArray *modelInput = [self preprocess:input];
  NSArray *modelOutput = [self forwards:modelInput];
  return [self postprocess:modelOutput[0] attentionMask:modelInput[1][0]];
}

- (NSNumber *)loadTokenizer:(NSString *)tokenizerSource {
  tokenizer = [[HuggingFaceTokenizer alloc] initWithTokenizerPath:[NSURL URLWithString:tokenizerSource].path];
  if (!tokenizer) {
    return @1;
  }
  return @0;
}

- (NSNumber *)loadModelSync:(NSString *)modelSource {
  module = [[ETModel alloc] init];
  return [self->module loadModel:[NSURL URLWithString:modelSource].path];
}

@end
