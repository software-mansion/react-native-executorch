#import "TextEmbeddingsModel.h"
#import "TextEmbeddingsUtils.h"

@implementation TextEmbeddingsModel

- (NSArray *)preprocess:(NSString *)input {
  NSArray *input_ids = [self->tokenizer encode:input];
  NSMutableArray *attention_mask = [NSMutableArray new];
  for (int i = 0; i < [input_ids count]; i++) {
    [attention_mask addObject:@((int)([input_ids[i] intValue] != 0))];
  }
  return @[ input_ids, attention_mask ]; // [2, tokens]
}

- (NSArray *)postprocess:(NSArray *)modelOutput   // [tokens * embedding_dim]
           attentionMask:(NSArray *)attentionMask // [tokens]
             meanPooling:(bool)meanPooling {
  NSArray *embeddings = modelOutput;
  if (meanPooling) {
    embeddings = [TextEmbeddingsUtils meanPooling:modelOutput
                                    attentionMask:attentionMask];

    embeddings = [TextEmbeddingsUtils normalize:embeddings];
  }
  return embeddings;
}

- (NSArray *)runModel:(NSString *)input {
  return [self runModel:input meanPooling:true];
}

- (NSArray *)runModel:(NSString *)input meanPooling:(bool)meanPooling {
  NSArray *modelInput = [self preprocess:input];

  NSMutableArray *inputTypes = [NSMutableArray arrayWithObjects:@4, @4, nil];
  NSMutableArray *shapes = [NSMutableArray new];

  NSNumber *tokenCount = @([modelInput[0] count]);
  for (__unused id _ in modelInput) {
    [shapes addObject:[NSMutableArray arrayWithObjects:@1, tokenCount, nil]];
  }

  NSArray *modelOutput = [self forward:modelInput
                                shapes:shapes
                            inputTypes:inputTypes];
  return [self postprocess:modelOutput[0]
             attentionMask:modelInput[1]
               meanPooling:meanPooling];
}

- (void)loadTokenizer:(NSString *)tokenizerSource {
  tokenizer =
      [[HuggingFaceTokenizer alloc] initWithTokenizerPath:tokenizerSource];
}

@end
