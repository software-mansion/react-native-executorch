#include "RnExecutorchInstaller.h"

#include <rnexecutorch/TokenizerModule.h>
#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/models/classification/Classification.h>
#include <rnexecutorch/models/embeddings/image/ImageEmbeddings.h>
#include <rnexecutorch/models/embeddings/text/TextEmbeddings.h>
#include <rnexecutorch/models/image_segmentation/ImageSegmentation.h>
#include <rnexecutorch/models/llm/LLM.h>
#include <rnexecutorch/models/object_detection/ObjectDetection.h>
#include <rnexecutorch/models/ocr/OCR.h>
#include <rnexecutorch/models/speech_to_text/SpeechToText.h>
#include <rnexecutorch/models/style_transfer/StyleTransfer.h>
#include <rnexecutorch/models/vertical_ocr/VerticalOCR.h>
#include <rnexecutorch/threads/GlobalThreadPool.h>
#include <rnexecutorch/threads/utils/ThreadUtils.h>

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
      RnExecutorchInstaller::loadModel<models::style_transfer::StyleTransfer>(
          jsiRuntime, jsCallInvoker, "loadStyleTransfer"));

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadImageSegmentation",
      RnExecutorchInstaller::loadModel<
          models::image_segmentation::ImageSegmentation>(
          jsiRuntime, jsCallInvoker, "loadImageSegmentation"));

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadClassification",
      RnExecutorchInstaller::loadModel<models::classification::Classification>(
          jsiRuntime, jsCallInvoker, "loadClassification"));

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadObjectDetection",
      RnExecutorchInstaller::loadModel<
          models::object_detection::ObjectDetection>(jsiRuntime, jsCallInvoker,
                                                     "loadObjectDetection"));

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadExecutorchModule",
      RnExecutorchInstaller::loadModel<models::BaseModel>(
          jsiRuntime, jsCallInvoker, "loadExecutorchModule"));

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadTokenizerModule",
      RnExecutorchInstaller::loadModel<TokenizerModule>(
          jsiRuntime, jsCallInvoker, "loadTokenizerModule"));

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadImageEmbeddings",
      RnExecutorchInstaller::loadModel<models::embeddings::ImageEmbeddings>(
          jsiRuntime, jsCallInvoker, "loadImageEmbeddings"));

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadTextEmbeddings",
      RnExecutorchInstaller::loadModel<models::embeddings::TextEmbeddings>(
          jsiRuntime, jsCallInvoker, "loadTextEmbeddings"));

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadLLM",
      RnExecutorchInstaller::loadModel<models::llm::LLM>(
          jsiRuntime, jsCallInvoker, "loadLLM"));

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadOCR",
      RnExecutorchInstaller::loadModel<models::ocr::OCR>(
          jsiRuntime, jsCallInvoker, "loadOCR"));
  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadVerticalOCR",
      RnExecutorchInstaller::loadModel<models::ocr::VerticalOCR>(
          jsiRuntime, jsCallInvoker, "loadVerticalOCR"));

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadSpeechToText",
      RnExecutorchInstaller::loadModel<models::speech_to_text::SpeechToText>(
          jsiRuntime, jsCallInvoker, "loadSpeechToText"));

  threads::utils::unsafeSetupThreadPool();
  threads::GlobalThreadPool::initialize();
}

} // namespace rnexecutorch
