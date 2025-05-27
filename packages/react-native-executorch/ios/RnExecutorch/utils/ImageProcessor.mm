#import "ImageProcessor.h"
#import "ETError.h"

@implementation ImageProcessor

+ (NSArray *)matToNSArray:(const cv::Mat &)mat {
  return [ImageProcessor matToNSArray:mat
                                 mean:cv::Scalar(0.0, 0.0, 0.0)
                             variance:cv::Scalar(1.0, 1.0, 1.0)];
}

+ (NSArray *)matToNSArray:(const cv::Mat &)mat
                     mean:(cv::Scalar)mean
                 variance:(cv::Scalar)variance {
  int pixelCount = mat.cols * mat.rows;
  NSMutableArray *floatArray =
      [[NSMutableArray alloc] initWithCapacity:pixelCount * 3];
  for (NSUInteger k = 0; k < pixelCount * 3; k++) {
    [floatArray addObject:@0.0];
  }

  for (int i = 0; i < pixelCount; i++) {
    int row = i / mat.cols;
    int col = i % mat.cols;
    cv::Vec3b pixel = mat.at<cv::Vec3b>(row, col);
    floatArray[0 * pixelCount + i] =
        @((pixel[0] - mean[0] * 255.0) / (variance[0] * 255.0));
    floatArray[1 * pixelCount + i] =
        @((pixel[1] - mean[1] * 255.0) / (variance[1] * 255.0));
    floatArray[2 * pixelCount + i] =
        @((pixel[2] - mean[2] * 255.0) / (variance[2] * 255.0));
  }

  return floatArray;
}

+ (NSArray *)matToNSArrayGray:(const cv::Mat &)mat {
  NSMutableArray *pixelArray =
      [[NSMutableArray alloc] initWithCapacity:mat.cols * mat.rows];

  for (int row = 0; row < mat.rows; row++) {
    for (int col = 0; col < mat.cols; col++) {
      float pixelValue = mat.at<float>(row, col);
      [pixelArray addObject:@(pixelValue)];
    }
  }

  return pixelArray;
}

+ (cv::Mat)arrayToMat:(NSArray *)array width:(int)width height:(int)height {
  cv::Mat mat(height, width, CV_8UC3);

  int pixelCount = width * height;
  for (int i = 0; i < pixelCount; i++) {
    int row = i / width;
    int col = i % width;
    float r = 0, g = 0, b = 0;

    r = [[array objectAtIndex:0 * pixelCount + i] floatValue];
    g = [[array objectAtIndex:1 * pixelCount + i] floatValue];
    b = [[array objectAtIndex:2 * pixelCount + i] floatValue];

    cv::Vec3b color((uchar)(b * 255), (uchar)(g * 255), (uchar)(r * 255));
    mat.at<cv::Vec3b>(row, col) = color;
  }

  return mat;
}

+ (cv::Mat)arrayToMatGray:(NSArray *)array width:(int)width height:(int)height {
  cv::Mat mat(height, width, CV_32F);

  int pixelCount = width * height;
  for (int i = 0; i < pixelCount; i++) {
    int row = i / width;
    int col = i % width;
    float value = [array[i] floatValue];
    mat.at<float>(row, col) = value;
  }

  return mat;
}

+ (NSString *)saveToTempFile:(const cv::Mat &)image {
  NSString *uniqueID = [[NSUUID UUID] UUIDString];
  NSString *filename =
      [NSString stringWithFormat:@"rn_executorch_%@.png", uniqueID];
  NSString *outputPath =
      [NSTemporaryDirectory() stringByAppendingPathComponent:filename];

  std::string filePath = [outputPath UTF8String];
  if (!cv::imwrite(filePath, image)) {
    @throw [NSException
        exceptionWithName:@"ImageSaveException"
                   reason:[NSString
                              stringWithFormat:@"%ld", (long)FileWriteFailed]
                 userInfo:nil];
  }

  return [NSString stringWithFormat:@"file://%@", outputPath];
}

+ (cv::Mat)readImage:(NSString *)source {
  NSURL *url = [NSURL URLWithString:source];

  cv::Mat inputImage;
  if ([[url scheme] isEqualToString:@"data"]) {
    // base64
    NSArray *parts = [source componentsSeparatedByString:@","];
    if ([parts count] < 2) {
      @throw [NSException
          exceptionWithName:@"readImage_error"
                     reason:[NSString
                                stringWithFormat:@"%ld", (long)InvalidArgument]
                   userInfo:nil];
    }
    NSString *encodedString = parts[1];
    NSData *data = [[NSData alloc]
        initWithBase64EncodedString:encodedString
                            options:
                                NSDataBase64DecodingIgnoreUnknownCharacters];
    cv::Mat encodedData(1, [data length], CV_8UC1, (void *)data.bytes);
    inputImage = cv::imdecode(encodedData, cv::IMREAD_COLOR);
  } else if ([[url scheme] isEqualToString:@"file"]) {
    // local file
    inputImage = cv::imread([[url path] UTF8String], cv::IMREAD_COLOR);
  } else {
    // external file
    NSData *data = [NSData dataWithContentsOfURL:url];
    inputImage =
        cv::imdecode(cv::Mat(1, [data length], CV_8UC1, (void *)data.bytes),
                     cv::IMREAD_COLOR);
  }

  if (inputImage.empty()) {
    @throw [NSException
        exceptionWithName:@"readImage_error"
                   reason:[NSString
                              stringWithFormat:@"%ld", (long)InvalidArgument]
                 userInfo:nil];
  }

  return inputImage;
}

@end
