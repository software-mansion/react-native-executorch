#import <Foundation/Foundation.h>

@interface HuggingFaceTokenizer : NSObject

- (NSNumber *)loadTokenizer:(NSString *)jsonPath;
- (NSArray<NSNumber *> *)encode:(NSString *)text;
- (NSString *)decode:(NSArray<NSNumber *> *)tokenIds;
- (NSUInteger)getVocabSize;
- (NSString *)idToToken:(NSInteger)tokenId;
- (NSInteger)tokenToId:(NSString *)token;

@end
