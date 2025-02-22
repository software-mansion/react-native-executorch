#import <UIKit/UIKit.h>
#import <Accelerate/Accelerate.h>

@interface SFFT : NSObject

+ (NSArray *)stftFromWaveform:(NSArray *)waveform;
+ (void)fft:(float *)signal
   fftSetup:(FFTSetup)fftSetup
 magnitudes:(NSMutableArray *)magnitudes;
@end
