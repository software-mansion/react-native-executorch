#import <Foundation/Foundation.h>

@interface CTCLabelConverter : NSObject

@property(strong, nonatomic) NSMutableDictionary *dict;
@property(strong, nonatomic) NSArray *character;
@property(strong, nonatomic) NSDictionary *separatorList;
@property(strong, nonatomic) NSArray *ignoreIdx;
@property(strong, nonatomic) NSDictionary *dictList;

- (instancetype)initWithCharacters:(NSString *)characters
                     separatorList:(NSDictionary *)separatorList;
- (NSArray<NSString *> *)decodeGreedy:(NSArray<NSNumber *> *)textIndex
                               length:(NSInteger)length;

@end
