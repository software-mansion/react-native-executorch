@interface TextEmbeddingsUtils : NSObject

+ (NSArray *)meanPooling:(NSArray *)modelOutput
           attentionMask:(NSArray *)attentionMask;

+ (NSArray *)normalize:(NSArray *)embeddings;

@end
