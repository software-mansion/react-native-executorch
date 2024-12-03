// Model.h
#pragma once

#import <Foundation/Foundation.h>
#import "../utils/Fetcher.h"
#import <ExecutorchLib/ETModel.h>

// Forward declaration of the ETModel class
@class ETModel;

// Template class Model definition
template <typename Input, typename Output>
class Model {
protected:
    ETModel *module;

    // Method to perform forward pass on the model, handles exceptions
    NSArray* forward(NSArray* input, NSArray* shape, double inputType) {
        @try {
            NSArray *result = [module forward:input shape:shape inputType:@(inputType)];
            return result;
        } @catch (NSException *exception) {
            // TODO: Implement throw error
            return @[@10, @10, @10];
        }
    }

public:
    // Constructor and Destructor
    Model() : module(nullptr) {}

    virtual ~Model() {
        if (module) {
            // Cleanup code if needed
            module = nullptr;
        }
    }

    // Load the model from a given source
    void loadModel(NSString *modelSource) {
        module = [[ETModel alloc] init];
        [Fetcher fetchResource:[NSURL URLWithString:modelSource]
                  resourceType:ResourceType::MODEL
             completionHandler:^(NSString *filePath, NSError *error) {
            if (error) {
                // TODO: Implement throw error
                return;
            }
            NSNumber *result = [module loadModel:filePath];
            if ([result isEqualToNumber:@(0)]) {
                // Handle successful load
                return;
            } else {
                NSError *loadError = [NSError
                                      errorWithDomain:@"ETModuleErrorDomain"
                                      code:[result intValue]
                                      userInfo:@{
                                          NSLocalizedDescriptionKey : [NSString stringWithFormat:@"%ld", (long)[result longValue]]
                                      }];
                // TODO: Implement throw error
                return;
            }
        }];
    }

    // Pure virtual function to run the model, to be implemented by subclasses
    virtual Output runModel(const Input& input) = 0;

    // Virtual methods for derived classes to implement
    virtual Input preprocess(const Input& input) = 0;
    virtual Output postprocess(const Output& input) = 0;
};
