#pragma once

#include <ReactCommon/CallInvoker.h>
#include <sstream>
#include <string>
#include <thread>
#include <tuple>
#include <type_traits>

#include <cerrno>
#include <memory.h>
#include <pthread.h>
#include <rnexecutorch/GlobalThreadPool.h>
#include <rnexecutorch/Log.h>
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
#include <rnexecutorch/models/speech_to_text/SpeechToText.h>
#include <rnexecutorch/models/text_to_image/TextToImage.h>
#include <rnexecutorch/models/vertical_ocr/VerticalOCR.h>

#include <sched.h>
#include <sys/syscall.h>
#include <sys/types.h> // For pid_t
#include <unistd.h>

namespace rnexecutorch {
inline void setThreadPriorityRealtime(int priority) {
  pthread_t thread = pthread_self();

  sched_param sch_params;
  sch_params.sched_priority = priority;

  if (pthread_setschedparam(thread, SCHED_FIFO, &sch_params)) {
    log(LOG_LEVEL::Error, "Failed to set thread priority: ", priority);
  } else {
    log(LOG_LEVEL::Error, "Thread priority set to: ", priority);
  }
}
inline int getThreadPriority() {
  pthread_t thread = pthread_self();
  int policy;
  sched_param param;

  if (pthread_getschedparam(thread, &policy, &param) == 0) {
    return param.sched_priority;
  } else {
    // handle error
    return -1;
  }
}
inline int getThreadAffinity() {
  pthread_t thread = pthread_self();
  pid_t tid = syscall(SYS_gettid);
  cpu_set_t mask;
  CPU_ZERO(&mask);
  sched_param param;
  int err = sched_getaffinity(tid, sizeof(mask), &mask);
  if (err == 0) {
    log(LOG_LEVEL::Error, "Thread %d CPU affinity: ", tid);
    for (int i = 0; i < CPU_SETSIZE; i++) {
      if (CPU_ISSET(i, &mask)) {
        log(LOG_LEVEL::Error, "CPU: ", i);
      }
    }
    return param.sched_priority;
  } else {
    log(LOG_LEVEL::Error, "Thread CPU affinity ERROR: ", tid, err, errno);

    // handle error
    return -1;
  }
}
inline void setCurrentThreadAffinityToCPU(int cpu_id) {
  pid_t tid = syscall(SYS_gettid);
  cpu_set_t set;
  CPU_ZERO(&set);
  CPU_SET(cpu_id, &set);

  if (sched_setaffinity(tid, sizeof(set), &set) == 0) {
    log(LOG_LEVEL::Error, "Thread %d bound to CPU %d\n", tid, cpu_id);
  } else {
    log(LOG_LEVEL::Error, "sched_setaffinity failed");
  }
}

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

    if constexpr (meta::SameAs<Model, models::speech_to_text::SpeechToText>) {
      addFunctions(JSI_EXPORT_FUNCTION(ModelHostObject<Model>,
                                       synchronousHostFunction<&Model::unload>,
                                       "unload"));

      addFunctions(JSI_EXPORT_FUNCTION(ModelHostObject<Model>,
                                       promiseHostFunction<&Model::transcribe>,
                                       "transcribe"));

      addFunctions(JSI_EXPORT_FUNCTION(ModelHostObject<Model>,
                                       promiseHostFunction<&Model::stream>,
                                       "stream"));

      addFunctions(JSI_EXPORT_FUNCTION(
          ModelHostObject<Model>, synchronousHostFunction<&Model::streamInsert>,
          "streamInsert"));

      addFunctions(JSI_EXPORT_FUNCTION(
          ModelHostObject<Model>, synchronousHostFunction<&Model::streamStop>,
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

      addFunctions(
          JSI_EXPORT_FUNCTION(ModelHostObject<Model>, unload, "unload"));
    }

    if constexpr (meta::SameAs<Model, models::text_to_image::TextToImage>) {
      addFunctions(JSI_EXPORT_FUNCTION(
          ModelHostObject<Model>, synchronousHostFunction<&Model::interrupt>,
          "interrupt"));
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
            // GlobalThreadPool::detach([]{
            //   log(LOG_LEVEL::Error, "Calling from thread pool");
            // });
            GlobalThreadPool::detach([this, promise,
                                      argsConverted =
                                          std::move(argsConverted)]() {
              // nice(-10);
              // setThreadPriorityRealtime(-10);
              // log(LOG_LEVEL::Error, "process id secondary", getpid());
              // log(LOG_LEVEL::Error, "prio2:", getThreadPriority());
              // getThreadAffinity();
              // setCurrentThreadAffinityToCPU(7);
              // getThreadAffinity();
              try {
                if constexpr (std::is_void_v<decltype(std::apply(
                                  std::bind_front(FnPtr, model),
                                  argsConverted))>) {
                  // For void functions, just call the function and resolve with
                  // undefined
                  std::apply(std::bind_front(FnPtr, model),
                             std::move(argsConverted));
                  callInvoker->invokeAsync([promise](jsi::Runtime &runtime) {
                    promise->resolve(jsi::Value::undefined());
                  });
                } else {
                  // For non-void functions, capture the result and convert it
                  auto result = std::apply(std::bind_front(FnPtr, model),
                                           std::move(argsConverted));
                  // The result is copied. It should either be quickly copiable,
                  // or passed with a shared_ptr.
                  callInvoker->invokeAsync(
                      [promise, result](jsi::Runtime &runtime) {
                        promise->resolve(jsi_conversion::getJsiValue(
                            std::move(result), runtime));
                      });
                }
              } catch (const std::runtime_error &e) {
                // This catch should be merged with the next two
                // (std::runtime_error and jsi::JSError inherits from
                // std::exception) HOWEVER react native has broken RTTI which
                // breaks proper exception type checking. Remove when the
                // following change is present in our version:
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
            // }).detach();
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
