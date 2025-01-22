#import "OCRUtils.h"

@implementation OCRUtils

+ (cv::Mat)resizeWithPadding:(cv::Mat)img desiredWidth:(int)desiredWidth desiredHeight:(int)desiredHeight {
  const int height = img.rows;
  const int width = img.cols;
  const float heightRatio = (float)desiredHeight / height;
  const float widthRatio = (float)desiredWidth / width;
  const float resizeRatio = MIN(heightRatio, widthRatio);
  
  const int newWidth = width * resizeRatio;
  const int newHeight = height * resizeRatio;
  
  cv::Mat resizedImg;
  cv::resize(img, resizedImg, cv::Size(newWidth, newHeight), 0, 0, cv::INTER_AREA);
  
  // Estimating the background color by sampling from the corners of the image
  const int cornerPatchSize = MAX(1, MIN(height, width) / 30);
  std::vector<cv::Mat> corners = {
    img(cv::Rect(0, 0, cornerPatchSize, cornerPatchSize)),
    img(cv::Rect(width - cornerPatchSize, 0, cornerPatchSize, cornerPatchSize)),
    img(cv::Rect(0, height - cornerPatchSize, cornerPatchSize, cornerPatchSize)),
    img(cv::Rect(width - cornerPatchSize, height - cornerPatchSize, cornerPatchSize, cornerPatchSize))
  };
  
  cv::Scalar backgroundScalar = cv::mean(corners[0]);
  for (int i = 1; i < corners.size(); i++) {
    backgroundScalar += cv::mean(corners[i]);
  }
  backgroundScalar /= (double)corners.size();
  
  backgroundScalar[0] = cvFloor(backgroundScalar[0]);
  backgroundScalar[1] = cvFloor(backgroundScalar[1]);
  backgroundScalar[2] = cvFloor(backgroundScalar[2]);
  
  const int deltaW = desiredWidth - newWidth;
  const int deltaH = desiredHeight - newHeight;
  const int top = deltaH / 2;
  const int bottom = deltaH - top;
  const int left = deltaW / 2;
  const int right = deltaW - left;
  
  cv::Mat centeredImg;
  cv::copyMakeBorder(resizedImg, centeredImg, top, bottom, left, right, cv::BORDER_CONSTANT, backgroundScalar);
  
  return centeredImg;
}

+ (CGFloat)calculateRatioWithWidth:(int)width height:(int)height {
  CGFloat ratio = (CGFloat)width / (CGFloat)height;
  if (ratio < 1.0) {
    ratio = 1.0 / ratio;
  }
  return ratio;
}

+ (cv::Mat)computeRatioAndResize:(cv::Mat)img width:(int)width height:(int)height modelHeight:(int)modelHeight {
  CGFloat ratio = (CGFloat)width / (CGFloat)height;
  if (ratio < 1.0) {
    ratio = [self calculateRatioWithWidth:width height:height];
    cv::resize(img, img, cv::Size(modelHeight, (int)(modelHeight * ratio)), 0, 0, cv::INTER_LANCZOS4);
  } else {
    cv::resize(img, img, cv::Size((int)(modelHeight * ratio), modelHeight), 0, 0, cv::INTER_LANCZOS4);
  }
  return img;
}

+ (cv::Mat)getCroppedImage:(int)x_max x_min:(int)x_min y_max:(int)y_max y_min:(int)y_min image:(cv::Mat)image modelHeight:(int)modelHeight {
  cv::Rect region(x_min, y_min, x_max - x_min, y_max - y_min);
  cv::Mat crop_img = image(region);
  
  int width = x_max - x_min;
  int height = y_max - y_min;
  
  CGFloat ratio = [OCRUtils calculateRatioWithWidth:width height:height];
  int new_width = (int)(modelHeight * ratio);
  
  if (new_width == 0) {
    return crop_img;  // Return nil if calculated new_width is zero to avoid further processing
  }
  
  crop_img = [OCRUtils computeRatioAndResize:crop_img width:width height:height modelHeight:modelHeight];
  
  return crop_img;
}

+ (cv::Mat)adjustContrastGrey:(cv::Mat)img target:(double)target {
  double contrast = 0.0;
  int high = 0;
  int low = 255;
  
  // Calculate existing contrast, high, and low
  for (int i = 0; i < img.rows; ++i) {
    for (int j = 0; j < img.cols; ++j) {
      uchar pixel = img.at<uchar>(i, j);
      high = MAX(high, pixel);
      low = MIN(low, pixel);
    }
  }
  contrast = (high - low) / 255.0;
  
  // Adjust contrast if below the target
  if (contrast < target) {
    double ratio = 200.0 / MAX(10, high - low);
    img.convertTo(img, CV_32F); // Convert to float for scaling operations
    img = ((img - low + 25) * ratio);
    
    // Clipping values to ensure they remain within valid range
    cv::threshold(img, img, 255, 255, cv::THRESH_TRUNC); // Cap values at 255
    cv::threshold(img, img, 0, 0, cv::THRESH_TOZERO); // Ensure no negative values
    
    img.convertTo(img, CV_8U); // Convert back to 8-bit pixel values
  }
  
  return img;
}

+ (cv::Mat)normalizeForRecognizer:(cv::Mat)image adjustContrast:(double)adjustContrast {
  if (adjustContrast > 0) {
    image = [OCRUtils adjustContrastGrey:image target:adjustContrast];  // Make sure this method exists and works as expected
  }
  
  int desiredWidth = 128;
  if (image.cols >= 512) {
    desiredWidth = 512;
  } else if (image.cols >= 256) {
    desiredWidth = 256;
  }
  
  image = [OCRUtils resizeWithPadding:image desiredWidth:desiredWidth desiredHeight:64];
  
  // Normalization: (image / 255.0 - 0.5) * 2.0
  image.convertTo(image, CV_32F, 1.0 / 255.0);  // Scale pixel values to [0,1]
  image = (image - 0.5) * 2.0;  // Shift to [-1,1]
  
  return image;
}

@end
