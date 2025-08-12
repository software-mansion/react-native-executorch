#import <Foundation/Foundation.h>

@interface HuggingFaceTokenizer : NSObject

- (instancetype)initWithTokenizerPath:(NSString *)tokenizerPath;
- (NSArray<NSNumber *> *)encode:(NSString *)text;
- (NSString *)decode:(NSArray<NSNumber *> *)tokenIds;
- (NSString *)decode:(NSArray<NSNumber *> *)tokenIds
    skipSpecialTokens:(BOOL)skipSpecialTokens;
- (NSUInteger)getVocabSize;
- (NSString *)idToToken:(NSInteger)tokenId;
- (NSInteger)tokenToId:(NSString *)token;

@end
