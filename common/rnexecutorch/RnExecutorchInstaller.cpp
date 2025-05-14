#include "RnExecutorchInstaller.h"

#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/models/image_segmentation/ImageSegmentation.h>
#include <rnexecutorch/models/style_transfer/StyleTransfer.h>

namespace rnexecutorch {

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
}
} // namespace rnexecutorch