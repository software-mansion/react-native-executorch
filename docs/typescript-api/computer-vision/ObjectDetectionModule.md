# ObjectDetectionModule

TypeScript API implementation of the [useObjectDetection](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useObjectDetection.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `ObjectDetectionModule` see: [`ObjectDetectionModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ObjectDetectionModule).
* For all object detection models available out-of-the-box in React Native ExecuTorch see: [Object Detection Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---object-detection).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import {
  ObjectDetectionModule,
  SSDLITE_320_MOBILENET_V3_LARGE,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Creating an instance
const objectDetectionModule = new ObjectDetectionModule();

// Loading the model
await objectDetectionModule.load(SSDLITE_320_MOBILENET_V3_LARGE);

// Running the model
const detections = await objectDetectionModule.forward(imageUri);

```

### Methods[​](#methods "Direct link to Methods")

All methods of `ObjectDetectionModule` are explained in details here: [`ObjectDetectionModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ObjectDetectionModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

To initialize the module, create an instance and call the [`load`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ObjectDetectionModule#load) method with the following parameters:

* [`model`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ObjectDetectionModule#model) - Object containing:

  * [`modelSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ObjectDetectionModule#modelsource) - Location of the used model.

* [`onDownloadProgressCallback`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ObjectDetectionModule#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ObjectDetectionModule#forward) method on the module object. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The method returns a promise, which can resolve either to an error or an array of [`Detection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/Detection) objects. Each object contains coordinates of the bounding box, the label of the detected object, and the confidence score.

## Managing memory[​](#managing-memory "Direct link to Managing memory")

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ObjectDetectionModule#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ObjectDetectionModule#forward) after [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ObjectDetectionModule#delete) unless you load the module again.
