#import <Foundation/Foundation.h>

@interface ScalarType : NSObject

@property (class, nonatomic, readonly) NSNumber *Int8;
@property (class, nonatomic, readonly) NSNumber *Int32;
@property (class, nonatomic, readonly) NSNumber *Long;
@property (class, nonatomic, readonly) NSNumber *Float;
@property (class, nonatomic, readonly) NSNumber *Double;

@end

@implementation ScalarType

+ (NSNumber *)Int8  { return @1; }
+ (NSNumber *)Int32 { return @3; }
+ (NSNumber *)Long  { return @4; }
+ (NSNumber *)Float { return @6; }
+ (NSNumber *)Double { return @7; }

@end
