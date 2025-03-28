#import "TextEmbeddingsUtils.h"

@implementation TextEmbeddingsUtils

+ (NSArray *)meanPooling:(NSArray *)modelOutput
           attentionMask:(NSArray *)attentionMask {
  NSInteger modelOutputLength = [modelOutput count];
  NSInteger attentionMaskLength = [attentionMask count];
  NSInteger embeddingDim = modelOutputLength / attentionMaskLength;
  
  NSMutableArray *result = [NSMutableArray arrayWithCapacity:embeddingDim];
  
  double sumMask = 0.0;
  for (NSNumber *maskValue in attentionMask) {
    sumMask += [maskValue intValue];
  }
  sumMask = fmax(sumMask, 1e-9);
  
  for (NSInteger i = 0; i < embeddingDim; i++) {
    double sum = 0;
    for (NSInteger j = 0; j < attentionMaskLength; j++) {
      sum += [modelOutput[j * embeddingDim + i] doubleValue] * [attentionMask[j] intValue];
    }
    [result addObject:@(sum / sumMask)];
  }
  
  return result;
}

+ (NSArray *)normalize:(NSArray *)embeddings {
  NSInteger embeddingDim = [embeddings count];
  double sum = 0.0;
  
  for (NSNumber *value in embeddings) {
    sum += [value doubleValue] * [value doubleValue];
  }
  sum = fmax(sqrt(sum), 1e-9);
  
  NSMutableArray *normalizedResult = [NSMutableArray arrayWithCapacity:embeddingDim];
  for (NSNumber *value in embeddings) {
    [normalizedResult addObject:@([value doubleValue] / sum)];
  }
  
  return normalizedResult;
}

@end
