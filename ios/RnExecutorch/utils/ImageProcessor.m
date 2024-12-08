#import "ImageProcessor.h"
#import <CoreGraphics/CoreGraphics.h>

@implementation ImageProcessor

+ (UIImage *)resizeImage:(UIImage *)image toSize:(CGSize)newSize {
    UIGraphicsBeginImageContextWithOptions(newSize, NO, 1.0);
    [image drawInRect:CGRectMake(0, 0, newSize.width, newSize.height)];
    UIImage *resizedImage = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    return resizedImage;
}

+ (float *)imageToFloatArray:(UIImage *)image size:(CGSize *)outSize {
    int width = outSize->width;
    int height = outSize->height;

    if (!image || width <= 0 || height <= 0) {
        return nil;
    }

    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
    unsigned char *rawData = malloc(height * width * 4);
    NSUInteger bytesPerPixel = 4;
    NSUInteger bytesPerRow = bytesPerPixel * width;
    NSUInteger bitsPerComponent = 8;

    CGContextRef context = CGBitmapContextCreate(rawData, width, height,
                                                 bitsPerComponent, bytesPerRow, colorSpace,
                                                 kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big);

    CGColorSpaceRelease(colorSpace);
    CGContextDrawImage(context, CGRectMake(0, 0, width, height), [image CGImage]);

    float *floatArray = malloc(width * height * sizeof(float) * 3);
    int pixelCount = width * height;
    for (int i = 0; i < pixelCount; i++) {
        NSUInteger byteIndex = i * bytesPerPixel;
        floatArray[i] = rawData[byteIndex] / 255.0f;                        // R
        floatArray[pixelCount + i] = rawData[byteIndex + 1] / 255.0f;       // G
        floatArray[2 * pixelCount + i] = rawData[byteIndex + 2] / 255.0f;   // B
    }
    CGContextRelease(context);
    free(rawData);

    return floatArray;
}

+ (UIImage *)imageFromFloatArray:(const float *)array size:(CGSize)size {
    int width = (int)size.width;
    int height = (int)size.height;

    if (!array || width <= 0 || height <= 0) {
        return nil;
    }

    int dataSize = width * height * 4; // Assuming RGBA
    uint8_t *rawData = (uint8_t *)malloc(dataSize);
    
    for (int i = 0; i < width * height; i++) {
        int pixelIndex = i * 4;
        int pixelCount = width * height;
        rawData[pixelIndex] = (uint8_t)(array[i] * 255);                        // R
        rawData[pixelIndex + 1] = (uint8_t)(array[pixelCount + i] * 255);       // G
        rawData[pixelIndex + 2] = (uint8_t)(array[2 * pixelCount + i] * 255);   // B
        rawData[pixelIndex + 3] = 255;                                          // A
    }

    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
    CGContextRef context = CGBitmapContextCreate(rawData, width, height, 8, width * 4, colorSpace, kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big);
    CGImageRef imageRef = CGBitmapContextCreateImage(context);
    UIImage *resultImage = [UIImage imageWithCGImage:imageRef];

    CGImageRelease(imageRef);
    CGContextRelease(context);
    CGColorSpaceRelease(colorSpace);
    free(rawData);

    return resultImage;
}

@end
