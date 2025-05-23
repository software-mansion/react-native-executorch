#ifndef ScalarType_h
#define ScalarType_h

@interface ScalarType : NSObject

@property(class, nonatomic, readonly) NSNumber *Int8;
@property(class, nonatomic, readonly) NSNumber *Int32;
@property(class, nonatomic, readonly) NSNumber *Long;
@property(class, nonatomic, readonly) NSNumber *Float;
@property(class, nonatomic, readonly) NSNumber *Double;

@end

#endif /* ScalarType_h */
