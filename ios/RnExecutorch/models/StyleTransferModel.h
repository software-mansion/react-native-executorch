// StyleTransfer.h
#import <UIKit/UIKit.h>
#import "ImageProcessor.h"
#include "Model.h"
// StyleTransfer class definition
class StyleTransferModel : public Model<UIImage*, UIImage*> {
protected:
    // Methods for preprocessing and postprocessing images
    virtual UIImage* preprocess(const UIImage* input);
    virtual UIImage* postprocess(const UIImage* input);

    // Helper methods to convert between NSArray and float arrays
    NSArray* floatArrayToNSArray(const float* floatArray, size_t length);
    float* NSArrayToFloatArray(NSArray<NSNumber*>* array, size_t* outLength);

public:
    // Method to run the model on an input image
    virtual UIImage* runModel(const UIImage* input);
};
