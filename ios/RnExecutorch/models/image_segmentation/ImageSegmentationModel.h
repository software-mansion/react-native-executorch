#import "../BaseModel.h"
#import "opencv2/opencv.hpp"

@interface ImageSegmentationModel : BaseModel
- (cv::Size)getModelImageSize;
- (NSDictionary *)runModel:(cv::Mat &)input;

@end

template <typename T>
NSArray* matToNSArray(const cv::Mat& mat) {
    std::size_t numPixels = mat.rows * mat.cols;
    NSMutableArray *arr = [[NSMutableArray alloc] initWithCapacity:numPixels];

    for (std::size_t x = 0; x < mat.rows; ++x) {
        for (std::size_t y = 0; y < mat.cols; ++y) {
            arr[x * mat.cols + y] = @(mat.at<T>(x, y));
        }
    }
    return arr;
}