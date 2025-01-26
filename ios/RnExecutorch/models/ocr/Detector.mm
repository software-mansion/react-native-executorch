#import "Detector.h"
#import "../../utils/ImageProcessor.h"
#import "utils/DetectorUtils.h"
#import "utils/OCRUtils.h"

/*
 The model used as detector is based on CRAFT (Character Region Awareness for Text Detection) paper.
 https://arxiv.org/pdf/1904.01941
 */

@implementation Detector {
  cv::Size originalSize;
  cv::Size modelSize;
}

- (cv::Size)getModelImageSize{
  if(!modelSize.empty()) {
    return modelSize;
  }
  
  NSArray * inputShape = [module getInputShape: @0];
  NSNumber *widthNumber = inputShape.lastObject;
  NSNumber *heightNumber = inputShape[inputShape.count - 2];
  
  int height = [heightNumber intValue];
  int width = [widthNumber intValue];
  modelSize = cv::Size(height, width);
  
  return cv::Size(height, width);
}

- (NSArray *)preprocess:(cv::Mat &)input {
  /*
   Detector as an input accepts tensor with a shape of [1, 3, 1280, 1280].
   Due to big influence of resize to quality of recognition the image preserves original
   aspect ratio and the missing parts are filled with padding.
   */
  self->originalSize = cv::Size(input.cols, input.rows);
  
  cv::Size modelImageSize = [self getModelImageSize];
  cv::Mat resizedImage;
  resizedImage = [OCRUtils resizeWithPadding:input desiredWidth:modelImageSize.width desiredHeight:modelImageSize.height];
  
  NSArray *modelInput = [ImageProcessor matToNSArray: resizedImage mean:mean variance:variance];
  return modelInput;
}

- (NSArray *)postprocess:(NSArray *)output {
  /*
   The output of the model consists of two matrices:
   1. ScoreText(Score map) - The probability of a region containing character
   2. ScoreLink(Affinity map) - The probability of a region being a part of a text line
   Both matrices are 640x640
   
   The result of this step is a list of bounding boxes that contain text.
   */
  NSArray *predictions = [output objectAtIndex:0];
  
  NSDictionary *splittedData = [DetectorUtils splitInterleavedNSArray:predictions];
  NSArray *scoreText = splittedData[@"ScoreText"];
  NSArray *scoreLink = splittedData[@"ScoreLink"];
  
  cv::Mat scoreTextCV;
  cv::Mat scoreLinkCV;
  cv::Size modelImageSize = [self getModelImageSize];
  
  scoreTextCV = [ImageProcessor arrayToMatGray:scoreText width:modelImageSize.width / 2 height:modelImageSize.height / 2];
  scoreLinkCV = [ImageProcessor arrayToMatGray:scoreLink width:modelImageSize.width / 2 height:modelImageSize.height / 2];
  
  NSArray* horizontalList = [DetectorUtils getDetBoxes:scoreTextCV linkMap:scoreLinkCV textThreshold:textThreshold linkThreshold:linkThreshold lowText:lowText];
  horizontalList = [DetectorUtils restoreBboxRatio:horizontalList];
  horizontalList = [DetectorUtils groupTextBox:horizontalList ycenterThs:yCenterThs heightThs:heightThs widthThs:widthThs addMargin:addMargin];
  
  NSMutableArray *boxesToKeep = [NSMutableArray array];
  
  for (NSArray *box in horizontalList) {
    if (MAX([box[1] intValue] - [box[0] intValue], [box[3] intValue] - [box[2] intValue]) >= minSize) {
      [boxesToKeep addObject:box];
    }
  }
  
  return boxesToKeep;
}

- (NSArray *)runModel:(cv::Mat &)input {
  NSArray *modelInput = [self preprocess:input];
  NSArray *modelResult = [self forward:modelInput];
  NSArray *result = [self postprocess:modelResult];
  
  return result;
}

@end
