#import "VerticalDetector.h"
#import "../../utils/ImageProcessor.h"
#import "utils/Constants.h"
#import "utils/DetectorUtils.h"
#import "utils/OCRUtils.h"

/*
 The model used as detector is based on CRAFT (Character Region Awareness for
 Text Detection) paper. https://arxiv.org/pdf/1904.01941
 */

@implementation VerticalDetector {
  cv::Size originalSize;
  cv::Size modelSize;
  BOOL detectSingleCharacters;
}

- (instancetype)initWithDetectSingleCharacters:(BOOL)detectSingleCharacters {
  self = [super init];
  if (self) {
    self->detectSingleCharacters = detectSingleCharacters;
  }
  return self;
}

- (cv::Size)getModelImageSize {
  if (!modelSize.empty()) {
    return modelSize;
  }

  NSArray *inputShape = [module getInputShape:@0];
  NSNumber *widthNumber = inputShape[inputShape.count - 2];
  NSNumber *heightNumber = inputShape.lastObject;

  const int height = [heightNumber intValue];
  const int width = [widthNumber intValue];
  modelSize = cv::Size(height, width);

  return cv::Size(height, width);
}

- (NSArray *)preprocess:(cv::Mat &)input {
  /*
   Detector as an input accepts tensor with a shape of [1, 3, 800, 800].
   Due to big influence of resize to quality of recognition the image preserves
   original aspect ratio and the missing parts are filled with padding.
   */
  self->originalSize = cv::Size(input.cols, input.rows);
  cv::Size modelImageSize = [self getModelImageSize];
  cv::Mat resizedImage;
  resizedImage = [OCRUtils resizeWithPadding:input
                                desiredWidth:modelImageSize.width
                               desiredHeight:modelImageSize.height];
  NSArray *modelInput = [ImageProcessor matToNSArray:resizedImage
                                                mean:mean
                                            variance:variance];
  return modelInput;
}

- (NSArray *)postprocess:(NSArray *)output {
  /*
   The output of the model consists of two matrices (heat maps):
   1. ScoreText(Score map) - The probability of a region containing character
   2. ScoreAffinity(Affinity map) - affinity between characters, used to to
   group each character into a single instance (sequence) Both matrices are
   400x400

   The result of this step is a list of bounding boxes that contain text.
   */
  NSArray *predictions = [output objectAtIndex:0];

  cv::Size modelImageSize = [self getModelImageSize];
  cv::Mat scoreTextCV, scoreAffinityCV;
  /*
   The output of the model is a matrix in size of input image containing two
   matrices representing heatmap. Those two matrices are in the size of half of
   the input  image, that's why the width and height is divided by 2.
   */
  [DetectorUtils interleavedArrayToMats:predictions
                             outputMat1:scoreTextCV
                             outputMat2:scoreAffinityCV
                               withSize:cv::Size(modelImageSize.width / 2,
                                                 modelImageSize.height / 2)];
  CGFloat txtThreshold =
      (self->detectSingleCharacters) ? textThreshold : textThresholdVertical;

  NSArray *bBoxesList = [DetectorUtils
      getDetBoxesFromTextMapVertical:scoreTextCV
                         affinityMap:scoreAffinityCV
                  usingTextThreshold:txtThreshold
                       linkThreshold:linkThreshold
               independentCharacters:self->detectSingleCharacters];
  bBoxesList = [DetectorUtils restoreBboxRatio:bBoxesList
                             usingRestoreRatio:restoreRatioVertical];

  if (self->detectSingleCharacters) {
    return bBoxesList;
  }

  bBoxesList = [DetectorUtils groupTextBoxes:bBoxesList
                             centerThreshold:centerThreshold
                           distanceThreshold:distanceThreshold
                             heightThreshold:heightThreshold
                            minSideThreshold:minSideThreshold
                            maxSideThreshold:maxSideThreshold
                                    maxWidth:maxWidth];

  return bBoxesList;
}

- (NSArray *)runModel:(cv::Mat &)input {
  NSArray *modelInput = [self preprocess:input];
  NSArray *modelResult = [self forward:@[ modelInput ]];
  NSArray *result = [self postprocess:modelResult];
  return result;
}

@end
