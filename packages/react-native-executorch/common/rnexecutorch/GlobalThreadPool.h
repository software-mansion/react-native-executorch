// GlobalThreadPool.h
#pragma once

#include "HighPerformanceThreadPool.h"
#include <memory>
#include <mutex>

class GlobalThreadPool {
private:
  inline static std::unique_ptr<HighPerformanceThreadPool> instance;
  inline static std::once_flag initFlag;

  GlobalThreadPool() = delete;

public:
  // Initialize the global thread pool (call once at app startup)
  static void initialize(size_t numThreads = 0, ThreadConfig config = {}) {
    std::call_once(initFlag, [&numThreads, config]() {
      // Auto-detect optimal thread count if not specified
      if (numThreads == 0) {
        numThreads = std::thread::hardware_concurrency();
        numThreads = std::min(numThreads, size_t(4)); // Cap at 4 for mobile
      }

      LOGI("Initializing global thread pool with %zu threads", numThreads);
      instance =
          std::make_unique<HighPerformanceThreadPool>(numThreads, config);
    });
  }

  // Get the global thread pool instance
  static HighPerformanceThreadPool &get() {
    if (!instance) {
      // Auto-initialize with defaults if not already initialized
      initialize();
    }
    return *instance;
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
};

// Static member definitions
// std::unique_ptr<HighPerformanceThreadPool> GlobalThreadPool::instance;
// std::once_flag GlobalThreadPool::initFlag;

// Convenience macros for even simpler usage
#define ASYNC_TASK(...) GlobalThreadPool::async(__VA_ARGS__)
#define ASYNC_HIGH(...) GlobalThreadPool::async_high_priority(__VA_ARGS__)
#define ASYNC_DETACH(...) GlobalThreadPool::detach(__VA_ARGS__)
#define ASYNC_WAIT(...) GlobalThreadPool::execute(__VA_ARGS__)