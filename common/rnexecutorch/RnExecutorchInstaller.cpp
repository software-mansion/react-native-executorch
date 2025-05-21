#include "RnExecutorchInstaller.h"

#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/models/style_transfer/StyleTransfer.h>

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
}
} // namespace rnexecutorch