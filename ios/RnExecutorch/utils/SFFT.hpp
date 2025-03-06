#import <UIKit/UIKit.h>
#import <Accelerate/Accelerate.h>

@interface SFFT : NSObject

+ (NSArray *)sfftFromWaveform:(NSArray *)waveform
                      fftSize:(int)fftSize
                 fftHopLength:(int)fftHopLength;
+ (void)fft:(float *)signal
   fftSetup:(FFTSetup)fftSetup
    fftSize:(int)fftSize
 magnitudes:(NSMutableArray *)magnitudes;
@end
