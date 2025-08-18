#include "RnExecutorchInstaller.h"

#include <rnexecutorch/GlobalThreadPool.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/TokenizerModule.h>
#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/models/classification/Classification.h>
#include <rnexecutorch/models/embeddings/image/ImageEmbeddings.h>
#include <rnexecutorch/models/embeddings/text/TextEmbeddings.h>
#include <rnexecutorch/models/image_segmentation/ImageSegmentation.h>
#include <rnexecutorch/models/text_to_image/TextToImage.h>
#include <rnexecutorch/models/llm/LLM.h>
#include <rnexecutorch/models/object_detection/ObjectDetection.h>
#include <rnexecutorch/models/ocr/OCR.h>
#include <rnexecutorch/models/speech_to_text/SpeechToText.h>
#include <rnexecutorch/models/style_transfer/StyleTransfer.h>
#include <rnexecutorch/models/vertical_ocr/VerticalOCR.h>

#if defined(__ANDROID__) && defined(__aarch64__)
#include <executorch/extension/threadpool/cpuinfo_utils.h>
#include <executorch/extension/threadpool/threadpool.h>
#include <rnexecutorch/Log.h>
#endif

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
      *jsiRuntime, "loadTextToImage",
      RnExecutorchInstaller::loadModel<models::text_to_image::TextToImage>(
          jsiRuntime, jsCallInvoker, "loadTextToImage"));

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadClassification",
      RnExecutorchInstaller::loadModel<models::classification::Classification>(
          jsiRuntime, jsCallInvoker, "loadClassification"));

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadObjectDetection",
      RnExecutorchInstaller::loadModel<models::object_detection::ObjectDetection>(
          jsiRuntime, jsCallInvoker, "loadObjectDetection"));

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

#if defined(__ANDROID__) && defined(__aarch64__)
  auto num_of_perf_cores =
      ::executorch::extension::cpuinfo::get_num_performant_cores();
  log(LOG_LEVEL::Info, "Detected ", num_of_perf_cores, " performant cores");
  // setting num_of_cores to floor(num_of_perf_cores / 2) + 1) because depending
  // on cpu arch as when possible we want to leave at least 2 performant cores
  // for other tasks (setting more actually results in drop of performance). For
  // older devices (i.e. samsung s22) resolves to 3 cores, and for newer ones
  // (like OnePlus 12) resolves to 4, which when benchamrked gives highest
  // throughput.
  auto num_of_cores = static_cast<uint32_t>(num_of_perf_cores / 2) + 1;
  ::executorch::extension::threadpool::get_threadpool()
      ->_unsafe_reset_threadpool(num_of_cores);
  log(LOG_LEVEL::Info, "Configuring xnnpack for ", num_of_cores, " threads");
#endif

  ThreadConfig config;
  config.pinToPerformanceCores = true;
  config.priority = Priority::HIGH;
  config.namePrefix = "NativeWorker";
  GlobalThreadPool::initialize(2, config);
}

} // namespace rnexecutorch
