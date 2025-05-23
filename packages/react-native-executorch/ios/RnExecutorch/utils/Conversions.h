#import "opencv2/opencv.hpp"

// Convert a matrix containing a single value per cell to a NSArray
template <typename T> NSArray *simpleMatToNSArray(const cv::Mat &mat) {
  std::size_t numPixels = mat.rows * mat.cols;
  NSMutableArray *arr = [[NSMutableArray alloc] initWithCapacity:numPixels];

  for (std::size_t x = 0; x < mat.rows; ++x) {
    for (std::size_t y = 0; y < mat.cols; ++y) {
      arr[x * mat.cols + y] = @(mat.at<T>(x, y));
    }
  }
  return arr;
}
