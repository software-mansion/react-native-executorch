#pragma once

#include <ReactCommon/CallInvoker.h>
#include <sstream>
#include <string>
#include <thread>
#include <tuple>
#include <type_traits>

#include <memory.h>
#include <rnexecutorch/TokenizerModule.h>
#include <rnexecutorch/host_objects/JSTensorViewOut.h>
#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/jsi/JsiHostObject.h>
#include <rnexecutorch/jsi/Promise.h>
#include <rnexecutorch/metaprogramming/FunctionHelpers.h>
#include <rnexecutorch/metaprogramming/TypeConcepts.h>
#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/models/llm/LLM.h>
#include <rnexecutorch/models/ocr/OCR.h>
#include <rnexecutorch/models/vertical_ocr/VerticalOCR.h>
#include <rnexecutorch/threads/GlobalThreadPool.h>

namespace rnexecutorch {

template <typename Model> class ModelHostObject : public JsiHostObject {
public:
  explicit ModelHostObject(const std::shared_ptr<Model> &model,
                           std::shared_ptr<react::CallInvoker> callInvoker)
      : model(model), callInvoker(callInvoker) {
    if constexpr (meta::DerivedFromOrSameAs<Model, models::BaseModel>) {
      addFunctions(
          JSI_EXPORT_FUNCTION(ModelHostObject<Model>, unload, "unload"));
    }

    if constexpr (meta::DerivedFromOrSameAs<Model, models::BaseModel>) {
      addFunctions(JSI_EXPORT_FUNCTION(ModelHostObject<Model>,
                                       promiseHostFunction<&Model::forwardJS>,
                                       "forward"));
    }

    if constexpr (meta::DerivedFromOrSameAs<Model, models::BaseModel>) {
      addFunctions(JSI_EXPORT_FUNCTION(
          ModelHostObject<Model>, promiseHostFunction<&Model::getInputShape>,
          "getInputShape"));
    }

    if constexpr (meta::HasGenerate<Model>) {
      addFunctions(JSI_EXPORT_FUNCTION(ModelHostObject<Model>,
                                       promiseHostFunction<&Model::generate>,
                                       "generate"));
    }

    if constexpr (meta::HasEncode<Model>) {
      addFunctions(JSI_EXPORT_FUNCTION(ModelHostObject<Model>,
                                       promiseHostFunction<&Model::encode>,
                                       "encode"));
    }

    if constexpr (meta::HasDecode<Model>) {
      addFunctions(JSI_EXPORT_FUNCTION(ModelHostObject<Model>,
                                       promiseHostFunction<&Model::decode>,
                                       "decode"));
    }

    if constexpr (meta::HasTranscribe<Model>) {
      addFunctions(JSI_EXPORT_FUNCTION(ModelHostObject<Model>,
                                       promiseHostFunction<&Model::transcribe>,
                                       "transcribe"));
    }

    if constexpr (meta::HasStream<Model>) {
      addFunctions(JSI_EXPORT_FUNCTION(ModelHostObject<Model>,
                                       promiseHostFunction<&Model::stream>,
                                       "stream"));
    }

    if constexpr (meta::HasStreamInsert<Model>) {
      addFunctions(JSI_EXPORT_FUNCTION(
          ModelHostObject<Model>, promiseHostFunction<&Model::streamInsert>,
          "streamInsert"));
    }

    if constexpr (meta::HasStreamStop<Model>) {
      addFunctions(JSI_EXPORT_FUNCTION(ModelHostObject<Model>,
                                       promiseHostFunction<&Model::streamStop>,
                                       "streamStop"));
    }

    if constexpr (meta::SameAs<Model, TokenizerModule>) {
      addFunctions(JSI_EXPORT_FUNCTION(ModelHostObject<Model>,
                                       promiseHostFunction<&Model::encode>,
                                       "encode"));

      addFunctions(JSI_EXPORT_FUNCTION(ModelHostObject<Model>,
                                       promiseHostFunction<&Model::decode>,
                                       "decode"));
      addFunctions(JSI_EXPORT_FUNCTION(
          ModelHostObject<Model>, promiseHostFunction<&Model::getVocabSize>,
          "getVocabSize"));
      addFunctions(JSI_EXPORT_FUNCTION(ModelHostObject<Model>,
                                       promiseHostFunction<&Model::idToToken>,
                                       "idToToken"));
      addFunctions(JSI_EXPORT_FUNCTION(ModelHostObject<Model>,
                                       promiseHostFunction<&Model::tokenToId>,
                                       "tokenToId"));
    }

    if constexpr (meta::SameAs<Model, models::llm::LLM>) {
      addFunctions(JSI_EXPORT_FUNCTION(ModelHostObject<Model>,
                                       promiseHostFunction<&Model::generate>,
                                       "generate"));

      addFunctions(JSI_EXPORT_FUNCTION(
          ModelHostObject<Model>, synchronousHostFunction<&Model::interrupt>,
          "interrupt"));

      addFunctions(JSI_EXPORT_FUNCTION(
          ModelHostObject<Model>,
          synchronousHostFunction<&Model::getGeneratedTokenCount>,
          "getGeneratedTokenCount"));

      addFunctions(
          JSI_EXPORT_FUNCTION(ModelHostObject<Model>,
                              synchronousHostFunction<&Model::setCountInterval>,
                              "setCountInterval"));

      addFunctions(JSI_EXPORT_FUNCTION(
          ModelHostObject<Model>,
          synchronousHostFunction<&Model::setTimeInterval>, "setTimeInterval"));
      addFunctions(
          JSI_EXPORT_FUNCTION(ModelHostObject<Model>, unload, "unload"));
    }

    if constexpr (meta::SameAs<Model, models::ocr::OCR>) {
      addFunctions(
          JSI_EXPORT_FUNCTION(ModelHostObject<Model>, unload, "unload"));
    }

    if constexpr (meta::SameAs<Model, models::ocr::VerticalOCR>) {
      addFunctions(
          JSI_EXPORT_FUNCTION(ModelHostObject<Model>, unload, "unload"));
    }
  }

  // A generic host function that runs synchronously, works analogously to the
  // generic promise host function.
  template <auto FnPtr> JSI_HOST_FUNCTION(synchronousHostFunction) {
    constexpr std::size_t functionArgCount = meta::getArgumentCount(FnPtr);
    if (functionArgCount != count) {
      std::stringstream ss;
      ss << "Argument count mismatch, was expecting: " << functionArgCount
         << " but got: " << count;
      const auto errorMessage = ss.str();
      throw jsi::JSError(runtime, errorMessage);
    }

    try {
      auto argsConverted = meta::createArgsTupleFromJsi(FnPtr, args, runtime);

      if constexpr (std::is_void_v<decltype(std::apply(
                        std::bind_front(FnPtr, model), argsConverted))>) {
        // For void functions, just call the function and return undefined
        std::apply(std::bind_front(FnPtr, model), std::move(argsConverted));
        return jsi::Value::undefined();
      } else {
        // For non-void functions, capture the result and convert it
        auto result =
            std::apply(std::bind_front(FnPtr, model), std::move(argsConverted));
        return jsi_conversion::getJsiValue(std::move(result), runtime);
      }
    } catch (const std::runtime_error &e) {
      // This catch should be merged with the next one
      // (std::runtime_error inherits from std::exception) HOWEVER react
      // native has broken RTTI which breaks proper exception type
      // checking. Remove when the following change is present in our
      // version:
      // https://github.com/facebook/react-native/commit/3132cc88dd46f95898a756456bebeeb6c248f20e
      throw jsi::JSError(runtime, e.what());
    } catch (const std::exception &e) {
      throw jsi::JSError(runtime, e.what());
    } catch (...) {
      throw jsi::JSError(runtime, "Unknown error in synchronous function");
    }
  }

  // A generic host function that resolves a promise with a result of a
  // function. JSI arguments are converted to the types provided in the function
  // signature, and the return value is converted back to JSI before resolving.
  template <auto FnPtr> JSI_HOST_FUNCTION(promiseHostFunction) {
    auto promise = Promise::createPromise(
        runtime, callInvoker,
        [this, count, args, &runtime](std::shared_ptr<Promise> promise) {
          constexpr std::size_t functionArgCount =
              meta::getArgumentCount(FnPtr);
          if (functionArgCount != count) {
            std::stringstream ss;
            ss << "Argument count mismatch, was expecting: " << functionArgCount
               << " but got: " << count;
            const auto errorMessage = ss.str();
            promise->reject(errorMessage);
            return;
          }

          try {
            auto argsConverted =
                meta::createArgsTupleFromJsi(FnPtr, args, runtime);

            // We need to dispatch a thread if we want the function to be
            // asynchronous. In this thread all accesses to jsi::Runtime need to
            // be done via the callInvoker.
            threads::GlobalThreadPool::detach(
                [this, promise, argsConverted = std::move(argsConverted)]() {
                  try {
                    if constexpr (std::is_void_v<decltype(std::apply(
                                      std::bind_front(FnPtr, model),
                                      argsConverted))>) {
                      // For void functions, just call the function and resolve
                      // with undefined
                      std::apply(std::bind_front(FnPtr, model),
                                 std::move(argsConverted));
                      callInvoker->invokeAsync(
                          [promise](jsi::Runtime &runtime) {
                            promise->resolve(jsi::Value::undefined());
                          });
                    } else {
                      // For non-void functions, capture the result and convert
                      // it
                      auto result = std::apply(std::bind_front(FnPtr, model),
                                               std::move(argsConverted));
                      // The result is copied. It should either be quickly
                      // copiable, or passed with a shared_ptr.
                      callInvoker->invokeAsync(
                          [promise, result](jsi::Runtime &runtime) {
                            promise->resolve(jsi_conversion::getJsiValue(
                                std::move(result), runtime));
                          });
                    }
                  } catch (const std::runtime_error &e) {
                    // This catch should be merged with the next two
                    // (std::runtime_error and jsi::JSError inherits from
                    // std::exception) HOWEVER react native has broken RTTI
                    // which breaks proper exception type checking. Remove when
                    // the following change is present in our version:
                    // https://github.com/facebook/react-native/commit/3132cc88dd46f95898a756456bebeeb6c248f20e
                    callInvoker->invokeAsync([e = std::move(e), promise]() {
                      promise->reject(e.what());
                    });
                    return;
                  } catch (const jsi::JSError &e) {
                    callInvoker->invokeAsync([e = std::move(e), promise]() {
                      promise->reject(e.what());
                    });
                    return;
                  } catch (const std::exception &e) {
                    callInvoker->invokeAsync([e = std::move(e), promise]() {
                      promise->reject(e.what());
                    });
                    return;
                  } catch (...) {
                    callInvoker->invokeAsync(
                        [promise]() { promise->reject("Unknown error"); });
                    return;
                  }
                });
          } catch (...) {
            promise->reject("Couldn't parse JS arguments in a native function");
          }
        });

    return promise;
  }

  JSI_HOST_FUNCTION(unload) {
    try {
      model->unload();
    } catch (const std::runtime_error &e) {
      // This catch should be merged with the next one
      // (std::runtime_error inherits from std::exception) HOWEVER react
      // native has broken RTTI which breaks proper exception type
      // checking. Remove when the following change is present in our
      // version:
      // https://github.com/facebook/react-native/commit/3132cc88dd46f95898a756456bebeeb6c248f20e
      throw jsi::JSError(runtime, e.what());
    } catch (const std::exception &e) {
      throw jsi::JSError(runtime, e.what());
    } catch (...) {
      throw jsi::JSError(runtime, "Unknown error while unloading a model");
    }
    return jsi::Value::undefined();
  }

private:
  std::shared_ptr<Model> model;
  std::shared_ptr<react::CallInvoker> callInvoker;
};

} // namespace rnexecutorch
