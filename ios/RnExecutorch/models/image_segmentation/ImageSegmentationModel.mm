#import "ImageSegmentationModel.h"
#import "../../utils/Conversions.h"
#import "../../utils/ImageProcessor.h"
#import "../../utils/Numerical.h"
#import "Constants.h"
#import <unordered_set>

@interface ImageSegmentationModel ()
- (NSArray *)preprocess:(cv::Mat &)input;
- (NSDictionary *)postprocess:(NSArray *)output
                returnClasses:(NSArray *)classesOfInterest
                       resize:(BOOL)resize;
@end

@implementation ImageSegmentationModel {
  cv::Size originalSize;
}

- (cv::Size)getModelImageSize {
  NSArray *inputShape = [module getInputShape:@0];
  NSNumber *widthNumber = inputShape.lastObject;
  NSNumber *heightNumber = inputShape[inputShape.count - 2];

  int height = [heightNumber intValue];
  int width = [widthNumber intValue];

  return cv::Size(height, width);
}

- (NSArray *)preprocess:(cv::Mat &)input {
  originalSize = cv::Size(input.cols, input.rows);

  cv::Size modelImageSize = [self getModelImageSize];
  cv::Mat output;
  cv::resize(input, output, modelImageSize);

  NSArray *modelInput = [ImageProcessor matToNSArray:output];
  return modelInput;
}

std::vector<cv::Mat> extractResults(NSArray *result, std::size_t numLabels,
                                    cv::Size modelImageSize,
                                    cv::Size originalSize, BOOL resize) {
  std::size_t numModelPixels = modelImageSize.height * modelImageSize.width;

  std::vector<cv::Mat> resizedLabelScores(numLabels);
  for (std::size_t label = 0; label < numLabels; ++label) {
    cv::Mat labelMat = cv::Mat(modelImageSize, CV_64F);

    for (std::size_t pixel = 0; pixel < numModelPixels; ++pixel) {
      int row = pixel / modelImageSize.width;
      int col = pixel % modelImageSize.width;
      labelMat.at<double>(row, col) =
          [result[label * numModelPixels + pixel] doubleValue];
    }

    if (resize) {
      cv::resize(labelMat, resizedLabelScores[label], originalSize);
    } else {
      resizedLabelScores[label] = std::move(labelMat);
    }
  }
  return resizedLabelScores;
}

void adjustScoresPerPixel(std::vector<cv::Mat> &labelScores, cv::Mat &argMax,
                          cv::Size outputSize, std::size_t numLabels) {
  std::size_t numOutputPixels = outputSize.height * outputSize.width;
  for (std::size_t pixel = 0; pixel < numOutputPixels; ++pixel) {
    int row = pixel / outputSize.width;
    int col = pixel % outputSize.width;
    std::vector<double> scores;
    scores.reserve(numLabels);
    for (const auto &mat : labelScores) {
      scores.push_back(mat.at<double>(row, col));
    }

    std::vector<double> adjustedScores = softmax(scores);

    for (std::size_t label = 0; label < numLabels; ++label) {
      labelScores[label].at<double>(row, col) = adjustedScores[label];
    }

    auto maxIt = std::max_element(scores.begin(), scores.end());
    argMax.at<int>(row, col) = std::distance(scores.begin(), maxIt);
  }
}

- (NSDictionary *)postprocess:(NSArray *)output
                returnClasses:(NSArray *)classesOfInterest
                       resize:(BOOL)resize {
  cv::Size modelImageSize = [self getModelImageSize];

  std::size_t numLabels = deeplabv3_resnet50_labels.size();

  NSAssert((std::size_t)output.count ==
               numLabels * modelImageSize.height * modelImageSize.width,
           @"Model generated unexpected output size.");

  // For each label extract it's matrix,
  // and rescale it to the original size if `resize`
  std::vector<cv::Mat> resizedLabelScores =
      extractResults(output, numLabels, modelImageSize, originalSize, resize);

  cv::Size outputSize = resize ? originalSize : modelImageSize;
  cv::Mat argMax = cv::Mat(outputSize, CV_32S);

  // For each pixel apply softmax across all the labels and calculate the argMax
  adjustScoresPerPixel(resizedLabelScores, argMax, outputSize, numLabels);

  std::unordered_set<std::string> labelSet;

  for (id label in classesOfInterest) {
    labelSet.insert(std::string([label UTF8String]));
  }

  NSMutableDictionary *result = [NSMutableDictionary dictionary];

  // Convert to NSArray and populate the final dictionary
  for (std::size_t label = 0; label < numLabels; ++label) {
    if (labelSet.contains(deeplabv3_resnet50_labels[label])) {
      NSString *labelString = @(deeplabv3_resnet50_labels[label].c_str());
      NSArray *arr = simpleMatToNSArray<double>(resizedLabelScores[label]);
      result[labelString] = arr;
    }
  }

  result[@"ARGMAX"] = simpleMatToNSArray<int>(argMax);

  return result;
}

- (NSDictionary *)runModel:(cv::Mat &)input
             returnClasses:(NSArray *)classesOfInterest
                    resize:(BOOL)resize {
  NSArray *modelInput = [self preprocess:input];
  NSArray *result = [self forward:@[ modelInput ]];

  NSDictionary *output = [self postprocess:result[0]
                             returnClasses:classesOfInterest
                                    resize:resize];

  return output;
}

@end
