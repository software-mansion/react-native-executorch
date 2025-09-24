// GlobalThreadPool.h
#pragma once

#include <executorch/extension/threadpool/cpuinfo_utils.h>
#include <memory>
#include <mutex>
#include <optional>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/threads/HighPerformanceThreadPool.h>

namespace rnexecutorch::threads {

class GlobalThreadPool {
public:
  GlobalThreadPool() = delete;
  GlobalThreadPool(const GlobalThreadPool &) = delete;
  GlobalThreadPool &operator=(const GlobalThreadPool &) = delete;
  GlobalThreadPool(GlobalThreadPool &&) = delete;
  GlobalThreadPool &operator=(GlobalThreadPool &&) = delete;

  static HighPerformanceThreadPool &get() {
    if (!instance) {
      initialize();
    }
    return *instance;
  }

  static void initialize(std::optional<uint32_t> numThreads = std::nullopt,
                         ThreadConfig config = {}) {
    std::call_once(initFlag, [&numThreads, config]() {
      if (!numThreads) {
        numThreads =
            ::executorch::extension::cpuinfo::get_num_performant_cores();
      }

      log(rnexecutorch::LOG_LEVEL::Info, "Initializing global thread pool with",
          numThreads, "threads");
      instance = std::make_unique<HighPerformanceThreadPool>(numThreads.value(),
                                                             config);
    });
  }

  // Convenience methods that mirror std::thread interface
  template <typename Func, typename... Args>
  static auto async(Func &&func, Args &&...args) {
    return get().submit(std::forward<Func>(func), std::forward<Args>(args)...);
  }

  template <typename Func, typename... Args>
  static auto async_high_priority(Func &&func, Args &&...args) {
    return get().submitWithPriority(Priority::HIGH, std::forward<Func>(func),
                                    std::forward<Args>(args)...);
  }

  // Fire and forget (like std::thread{}.detach())
  template <typename Func, typename... Args>
  static void detach(Func &&func, Args &&...args) {
    get().submitDetached(std::forward<Func>(func), std::forward<Args>(args)...);
  }

  // Execute and wait (like std::thread{}.join())
  template <typename Func, typename... Args>
  static auto execute(Func &&func, Args &&...args) {
    return get().execute(std::forward<Func>(func), std::forward<Args>(args)...);
  }

  static void shutdown() {
    if (instance) {
      instance->shutdown();
      instance.reset();
    }
  }

private:
  inline static std::unique_ptr<HighPerformanceThreadPool> instance;
  inline static std::once_flag initFlag;
};

} // namespace rnexecutorch::threads
