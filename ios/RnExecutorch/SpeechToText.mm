#import "SpeechToText.h"
#import "models/BaseModel.h"
#import "models/stt/WhisperDecoder.hpp"
#import "models/stt/WhisperEncoder.hpp"
#import "utils/Fetcher.h"
#import <Accelerate/Accelerate.h>
#import <ExecutorchLib/ETModel.h>
#import <React/RCTBridgeModule.h>
#import "./utils/ScalarType.h"

@implementation SpeechToText {
  WhisperEncoder *encoder;
  WhisperDecoder *decoder;
  BaseModel *preprocessor;
  NSNumber *START_TOKEN;
  NSNumber *EOS_TOKEN;
  int fftSize;
  int fftHopLength;
  int maxSeqLen;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    maxSeqLen = 512;
    fftSize = 512;
    fftHopLength = 160;
    START_TOKEN = @50257;
    EOS_TOKEN = @50256;
  }
  return self;
}

RCT_EXPORT_MODULE()

- (NSArray *)stftFromWaveform:(NSArray *)waveform {
  FFTSetup fftSetup = vDSP_create_fftsetup(log2(self->fftSize), kFFTRadix2);
  if (!fftSetup) {
    NSLog(@"Error creating FFT setup.");
  }

  // Generate Hann Window coefficients.
  // https://www.mathworks.com/help/signal/ref/hann.html
  float hann[self->fftSize];
  for (int i = 0; i < self->fftSize; i++) {
    hann[i] = 0.5 * (1 - cos(2 * M_PI * i / (self->fftSize - 1)));
  }

  NSMutableArray *stftResult = [NSMutableArray new];
  int currentIndex = 0;
  while (currentIndex + self->fftSize <= waveform.count) {
    float signal[self->fftSize];

    // Extract signal and apply the Hann window
    for (int i = 0; i < self->fftSize; i++) {
      signal[i] = [waveform[currentIndex + i] floatValue] * hann[i];
    }

    [self fft:signal fftSetup:fftSetup magnitudes:stftResult];

    currentIndex += self->fftHopLength;
  }

  vDSP_destroy_fftsetup(fftSetup);
  return stftResult;
}

- (void)fft:(float *)signal
      fftSetup:(FFTSetup)fftSetup
    magnitudes:(NSMutableArray *)magnitudes {
  const int log2n = log2(self->fftSize);
  DSPSplitComplex a;
  a.realp = (float *)malloc(self->fftSize / 2 * sizeof(float));
  a.imagp = (float *)malloc(self->fftSize / 2 * sizeof(float));

  // Perform the FFT
  vDSP_ctoz((DSPComplex *)signal, 2, &a, 1, self->fftSize / 2);
  vDSP_fft_zrip(fftSetup, &a, 1, log2n, FFT_FORWARD);

  // Zero out Nyquist component
  a.imagp[0] = 0.0f;

  const float magnitudeScale = 1.0f / self->fftSize;
  for (int i = 0; i < self->fftSize / 2; ++i) {
    double magnitude = sqrt(a.realp[i] * a.realp[i] + a.imagp[i] * a.imagp[i]) *
                       magnitudeScale;
    // FIXME: we don't need that, but if we remove this we have to get rid of
    // reversing this operation in the preprocessing part
    double magnitudeDb = 20 * log10f(magnitude);
    // Push to the result array
    [magnitudes addObject:@(magnitudeDb)];
  }

  // Cleanup
  free(a.realp);
  free(a.imagp);
}

- (void)generate:(NSArray *)waveform
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject {
  @try {
    NSArray *stft = [self stftFromWaveform:waveform];
    dispatch_async(
        dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
          NSUInteger fftFrameLength = self->fftSize / 2;
          NSMutableArray *mutablePrevTokens = [NSMutableArray arrayWithObject:self->START_TOKEN];
                
          if (!self->encoder || !self->decoder || !self->preprocessor) {
            // TODO: handle this, use an actual error code
            reject(@"model_initialization_error", nil, nil);
            return;
          }

          NSNumber *numFrames =
              [NSNumber numberWithDouble:(stft.count / fftFrameLength)];
          NSArray *mel = [self->preprocessor
                 forward:@[ stft ]
                  shapes:@[ @[
                    numFrames,
                    [NSNumber numberWithUnsignedInteger:fftFrameLength]
                  ] ]
              inputTypes:@[ ScalarType.Float ]]; // TODO: Replace this with an actual enum
          NSDate *start = [NSDate date];
          NSArray *encodingResult = [self->encoder encode:@[ mel ]];
          

          if (!encodingResult) {
            // TODO: handle this, use an actual error code
            reject(@"encoding_failed", nil, nil);
            return;
          }

          NSNumber *currentSeqLen = @0;
          while ([currentSeqLen unsignedIntegerValue] < self -> maxSeqLen) {
            NSArray *result = [self->decoder decode:mutablePrevTokens
                             encoderLastHiddenState:encodingResult];
            if (!result || result.count == 0) {
              // TODO: handle this, use an actual error code
              reject(@"decoding_failed", @"Decoder returned an empty result.",
                     nil);
              return;
            }
            NSNumber *predictedToken = result[0];
            [mutablePrevTokens addObject:predictedToken];
            [self emitOnToken:predictedToken];
            if ([predictedToken isEqualToNumber:self->EOS_TOKEN]) {
              break;
            }
            currentSeqLen = @([currentSeqLen unsignedIntegerValue] + 1);
          }
          resolve(mutablePrevTokens);
        });
  } @catch (NSException *exception) {
    // TODO: handle this, use an actual error code
    NSLog(@"Exception caught before dispatch: %@, Reason: %@", exception.name,
          exception.reason);
    reject(@"exception_before_dispatch", exception.reason, nil);
  }
}

- (void)loadModule:(NSString *)preprocessorSource
     encoderSource:(NSString *)encoderSource
     decoderSource:(NSString *)decoderSource
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {

  preprocessor = [[BaseModel alloc] init];
  encoder = [[WhisperEncoder alloc] init];
  decoder = [[WhisperDecoder alloc] init];

  // Load preprocessor first
  [self loadModuleHelper:preprocessor
      withSource:preprocessorSource
      onSuccess:^{
        // Load encoder after preprocessor
        [self loadModuleHelper:self->encoder
            withSource:encoderSource
            onSuccess:^{
              // Load decoder after encoder
              [self loadModuleHelper:self->decoder
                  withSource:decoderSource
                  onSuccess:^{
                    resolve(@(0));
                  }
                  onFailure:^(NSString *errorCode) {
                    reject(@"init_decoder_error", errorCode, nil);
                  }];
            }
            onFailure:^(NSString *errorCode) {
              reject(@"init_encoder_error", errorCode, nil);
            }];
      }
      onFailure:^(NSString *errorCode) {
        reject(@"init_preprocessor_error", errorCode, nil);
      }];
}

- (void)loadModuleHelper:(id)model
              withSource:(NSString *)source
               onSuccess:(void (^)(void))success
               onFailure:(void (^)(NSString *))failure {

  [model loadModel:[NSURL URLWithString:source]
        completion:^(BOOL isSuccess, NSNumber *errorCode) {
          if (isSuccess) {
            success();
          } else {
            failure([NSString
                stringWithFormat:@"%ld", (long)[errorCode longValue]]);
          }
        }];
}

- (void)encode:(NSArray *)input
       resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject {
  @try {
    NSArray *encodingResult = [encoder encode:input];
    resolve(encodingResult);
  } @catch (NSException *exception) {
    reject(@"forward_error",
           [NSString stringWithFormat:@"%@", exception.reason], nil);
  }
}

- (void)decode:(NSArray *)prevTokens
    encoderOutput:(NSArray *)encoderOutput
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject {
  @try {
    NSArray *token = [decoder decode:prevTokens
              encoderLastHiddenState:encoderOutput];
    resolve(token);
  } @catch (NSException *exception) {
    reject(@"forward_error",
           [NSString stringWithFormat:@"%@", exception.reason], nil);
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeSpeechToTextSpecJSI>(params);
}

@end
