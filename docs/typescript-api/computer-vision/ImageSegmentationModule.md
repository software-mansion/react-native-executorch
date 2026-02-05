# ImageSegmentationModule

TypeScript API implementation of the [useImageSegmentation](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useImageSegmentation.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `ImageSegmentationModule` see: [`ImageSegmentationModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageSegmentationModule).
* For all image segmentation models available out-of-the-box in React Native ExecuTorch see: [Image Segmentation Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---image-segmentation).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import {
  ImageSegmentationModule,
  DEEPLAB_V3_RESNET50,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Creating an instance
const imageSegmentationModule = new ImageSegmentationModule();

// Loading the model
await imageSegmentationModule.load(DEEPLAB_V3_RESNET50);

// Running the model
const outputDict = await imageSegmentationModule.forward(imageUri);

```

### Methods[​](#methods "Direct link to Methods")

All methods of `ImageSegmentationModule` are explained in details here: [`ImageSegmentationModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageSegmentationModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

To initialize the module, create an instance and call the [`load`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageSegmentationModule#load) method with the following parameters:

* [`model`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageSegmentationModule#model) - Object containing:

  * [`modelSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageSegmentationModule#modelsource) - Location of the used model.

* [`onDownloadProgressCallback`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageSegmentationModule#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageSegmentationModule#forward) method on the module object. It accepts three arguments: a required image, an optional list of classes, and an optional flag whether to resize the output to the original dimensions.

* The image can be a remote URL, a local file URI, or a base64-encoded image.
* The [`classesOfInterest`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageSegmentationModule#classesofinterest) list contains classes for which to output the full results. By default the list is empty, and only the most probable classes are returned (essentially an arg max for each pixel). Look at [`DeeplabLabel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/DeeplabLabel) enum for possible classes.
* The [`resize`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageSegmentationModule#resize) flag says whether the output will be rescaled back to the size of the image you put in. The default is `false`. The model runs inference on a scaled (probably smaller) version of your image (224x224 for the `DEEPLAB_V3_RESNET50`). If you choose to resize, the output will be `number[]` of size `width * height` of your original image.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

Setting `resize` to true will make `forward` slower.

[`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageSegmentationModule#forward) returns a promise which can resolve either to an error or a dictionary containing number arrays with size depending on [`resize`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageSegmentationModule#resize):

* For the key [`DeeplabLabel.ARGMAX`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/DeeplabLabel#argmax) the array contains for each pixel an integer corresponding to the class with the highest probability.
* For every other key from [`DeeplabLabel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/DeeplabLabel), if the label was included in [`classesOfInterest`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageSegmentationModule#classesofinterest) the dictionary will contain an array of floats corresponding to the probability of this class for every pixel.

## Managing memory[​](#managing-memory "Direct link to Managing memory")

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageSegmentationModule#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageSegmentationModule#forward) after [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageSegmentationModule#delete) unless you load the module again.
