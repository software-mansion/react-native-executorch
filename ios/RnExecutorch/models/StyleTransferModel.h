#import <UIKit/UIKit.h>
#import "BaseModel.h"

@interface StyleTransferModel : BaseModel

- (UIImage *)runModel:(UIImage *)input;

@end
