// ThreadPoolModule.cpp
#include "HighPerformanceThreadPool.h"
#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>

using namespace facebook;

class ThreadPoolModule : public jsi::HostObject {
private:
  std::unique_ptr<HighPerformanceThreadPool> threadPool;
  std::shared_ptr<react::CallInvoker> jsCallInvoker;

  // Store for managing async callbacks
  struct PendingTask {
    std::future<jsi::Value> future;
    std::shared_ptr<jsi::Function> resolve;
    std::shared_ptr<jsi::Function> reject;
  };
  std::vector<PendingTask> pendingTasks;
  std::mutex pendingTasksMutex;

public:
  ThreadPoolModule(std::shared_ptr<react::CallInvoker> callInvoker,
                   size_t numThreads = 1,
                   HighPerformanceThreadPool::ThreadConfig config = {})
      : jsCallInvoker(callInvoker) {
    threadPool =
        std::make_unique<HighPerformanceThreadPool>(numThreads, config);
  }

  jsi::Value get(jsi::Runtime &runtime, const jsi::PropNameID &name) override {
    auto propName = name.utf8(runtime);

    if (propName == "execute") {
      return jsi::Function::createFromHostFunction(
          runtime, jsi::PropNameID::forAscii(runtime, "execute"), 1,
          [this](jsi::Runtime &runtime, const jsi::Value &thisValue,
                 const jsi::Value *arguments, size_t count) -> jsi::Value {
            if (count < 1 || !arguments[0].isObject()) {
              throw jsi::JSError(runtime, "execute requires a task function");
            }

            auto taskFunc = arguments[0].asObject(runtime).asFunction(runtime);

            // Create promise
            auto promiseConstructor =
                runtime.global().getPropertyAsFunction(runtime, "Promise");

            return promiseConstructor.callAsConstructor(
                runtime,
                jsi::Function::createFromHostFunction(
                    runtime, jsi::PropNameID::forAscii(runtime, "executor"), 2,
                    [this, taskFunc = std::make_shared<jsi::Function>(std::move(
                               taskFunc))](jsi::Runtime &runtime,
                                           const jsi::Value &thisValue,
                                           const jsi::Value *arguments,
                                           size_t count) -> jsi::Value {
                      auto resolve = std::make_shared<jsi::Function>(
                          arguments[0].asObject(runtime).asFunction(runtime));
                      auto reject = std::make_shared<jsi::Function>(
                          arguments[1].asObject(runtime).asFunction(runtime));

                      // Submit task to thread pool
                      auto future = threadPool->submit([this, taskFunc]() {
                        // This runs on the high-performance thread
                        // You can call native code here

                        // For demonstration, return a value
                        return jsi::Value(42);
                      });

                      // Handle result asynchronously
                      std::thread([this, future = std::move(future), resolve,
                                   reject]() mutable {
                        try {
                          auto result = future.get();

                          jsCallInvoker->invokeAsync([resolve, result]() {
                            // Call resolve with result
                            resolve->call(*resolve, std::move(result));
                          });
                        } catch (const std::exception &e) {
                          std::string error = e.what();
                          jsCallInvoker->invokeAsync([reject, error]() {
                            reject->call(*reject, jsi::String::createFromUtf8(
                                                      *reject, error));
                          });
                        }
                      }).detach();

                      return jsi::Value::undefined();
                    }));
          });
    }

    if (propName == "executeNative") {
      return jsi::Function::createFromHostFunction(
          runtime, jsi::PropNameID::forAscii(runtime, "executeNative"), 2,
          [this](jsi::Runtime &runtime, const jsi::Value &thisValue,
                 const jsi::Value *arguments, size_t count) -> jsi::Value {
            if (count < 2) {
              throw jsi::JSError(
                  runtime, "executeNative requires functionName and args");
            }

            std::string funcName = arguments[0].asString(runtime).utf8(runtime);

            // Route to different native functions
            if (funcName == "runInference") {
              return executeInference(runtime, arguments[1]);
            } else if (funcName == "processImage") {
              return executeImageProcessing(runtime, arguments[1]);
            } else if (funcName == "heavyComputation") {
              return executeComputation(runtime, arguments[1]);
            }

            throw jsi::JSError(runtime, "Unknown native function: " + funcName);
          });
    }

    if (propName == "getStats") {
      return jsi::Function::createFromHostFunction(
          runtime, jsi::PropNameID::forAscii(runtime, "getStats"), 0,
          [this](jsi::Runtime &runtime, const jsi::Value &thisValue,
                 const jsi::Value *arguments, size_t count) -> jsi::Value {
            auto stats = threadPool->getStats();

            auto obj = jsi::Object(runtime);
            obj.setProperty(runtime, "queueSize", (int)stats.queueSize);
            obj.setProperty(runtime, "activeWorkers", (int)stats.activeWorkers);
            obj.setProperty(runtime, "totalWorkers", (int)stats.totalWorkers);
            obj.setProperty(runtime, "tasksCompleted",
                            (int)stats.tasksCompleted);
            obj.setProperty(runtime, "tasksFailed", (int)stats.tasksFailed);
            obj.setProperty(runtime, "avgWaitTimeMs", stats.avgWaitTimeMs);
            obj.setProperty(runtime, "avgExecutionTimeMs",
                            stats.avgExecutionTimeMs);

            return obj;
          });
    }

    return jsi::Value::undefined();
  }

private:
  jsi::Value executeInference(jsi::Runtime &runtime, const jsi::Value &args) {
    // Create promise for async execution
    auto promiseConstructor =
        runtime.global().getPropertyAsFunction(runtime, "Promise");

    return promiseConstructor.callAsConstructor(
        runtime,
        jsi::Function::createFromHostFunction(
            runtime, jsi::PropNameID::forAscii(runtime, "executor"), 2,
            [this, argsStr = args.asString(runtime).utf8(runtime)](
                jsi::Runtime &runtime, const jsi::Value &thisValue,
                const jsi::Value *arguments, size_t count) -> jsi::Value {
              auto resolve = std::make_shared<jsi::Function>(
                  arguments[0].asObject(runtime).asFunction(runtime));
              auto reject = std::make_shared<jsi::Function>(
                  arguments[1].asObject(runtime).asFunction(runtime));

              // Submit high-priority inference task
              auto future = threadPool->submitWithPriority(
                  HighPerformanceThreadPool::Priority::HIGH,
                  [argsStr]() -> std::string {
                    // Your ExecutorTorch inference here
                    LOGI("Running inference with: %s", argsStr.c_str());

                    // Simulate inference
                    std::this_thread::sleep_for(std::chrono::milliseconds(100));

                    return "Inference result for: " + argsStr;
                  });

              // Handle async result
              std::thread([this, future = std::move(future), resolve,
                           reject]() mutable {
                try {
                  std::string result = future.get();

                  jsCallInvoker->invokeAsync([resolve, result]() {
                    resolve->call(*resolve, jsi::String::createFromUtf8(
                                                *resolve, result));
                  });
                } catch (...) {
                  jsCallInvoker->invokeAsync([reject]() {
                    reject->call(*reject, jsi::String::createFromUtf8(
                                              *reject, "Inference failed"));
                  });
                }
              }).detach();

              return jsi::Value::undefined();
            }));
  }

  jsi::Value executeImageProcessing(jsi::Runtime &runtime,
                                    const jsi::Value &args) {
    // Similar pattern for image processing
    // ...
  }

  jsi::Value executeComputation(jsi::Runtime &runtime, const jsi::Value &args) {
    // Similar pattern for heavy computation
    // ...
  }
};

// Installation
void installThreadPoolModule(jsi::Runtime &runtime,
                             std::shared_ptr<react::CallInvoker> callInvoker) {
  // Configure thread pool for maximum performance
  HighPerformanceThreadPool::ThreadConfig config;
  config.pinToPerformanceCores = true;
  config.priority = HighPerformanceThreadPool::Priority::HIGH;
  config.namePrefix = "NativeWorker";

  auto module = std::make_shared<ThreadPoolModule>(callInvoker, 2, config);

  runtime.global().setProperty(
      runtime, "NativeThreadPool",
      jsi::Object::createFromHostObject(runtime, module));
}