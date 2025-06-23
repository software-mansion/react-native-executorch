#include "RnExecutorchInstaller.h"

#include <rnexecutorch/TokenizerModule.h>
#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/models/classification/Classification.h>
#include <rnexecutorch/models/image_embeddings/ImageEmbeddings.h>
#include <rnexecutorch/models/image_segmentation/ImageSegmentation.h>
#include <rnexecutorch/models/object_detection/ObjectDetection.h>
#include <rnexecutorch/models/style_transfer/StyleTransfer.h>
#include <rnexecutorch/models/text_embeddings/TextEmbeddings.h>

namespace rnexecutorch {

// This function fetches data from a url address. It is implemented in
// Kotlin/ObjectiveC++ and then bound to this variable. It's done to not handle
// SSL intricacies manually, as it is done automagically in ObjC++/Kotlin.
FetchUrlFunc_t fetchUrlFunc;

void RnExecutorchInstaller::injectJSIBindings(
    jsi::Runtime *jsiRuntime, std::shared_ptr<react::CallInvoker> jsCallInvoker,
    FetchUrlFunc_t fetchDataFromUrl) {
  fetchUrlFunc = fetchDataFromUrl;

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadStyleTransfer",
      RnExecutorchInstaller::loadModel<StyleTransfer>(jsiRuntime, jsCallInvoker,
                                                      "loadStyleTransfer"));

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadImageSegmentation",
      RnExecutorchInstaller::loadModel<ImageSegmentation>(
          jsiRuntime, jsCallInvoker, "loadImageSegmentation"));

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadClassification",
      RnExecutorchInstaller::loadModel<Classification>(
          jsiRuntime, jsCallInvoker, "loadClassification"));

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadObjectDetection",
      RnExecutorchInstaller::loadModel<ObjectDetection>(
          jsiRuntime, jsCallInvoker, "loadObjectDetection"));

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadExecutorchModule",
      RnExecutorchInstaller::loadModel<BaseModel>(jsiRuntime, jsCallInvoker,
                                                  "loadExecutorchModule"));

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadTokenizerModule",
      RnExecutorchInstaller::loadModel<TokenizerModule>(
          jsiRuntime, jsCallInvoker, "loadTokenizerModule"));

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadImageEmbeddings",
      RnExecutorchInstaller::loadModel<ImageEmbeddings>(
          jsiRuntime, jsCallInvoker, "loadImageEmbeddings"));
  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadTextEmbeddings",
      RnExecutorchInstaller::loadModel<TextEmbeddings>(
          jsiRuntime, jsCallInvoker, "loadTextEmbeddings"));
}

} // namespace rnexecutorch