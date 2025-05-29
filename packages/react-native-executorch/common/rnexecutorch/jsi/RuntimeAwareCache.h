#pragma once
// Adapted from https://github.com/software-mansion/react-native-audio-api

// Header in jsi/ need to be added like this. See comment in JsiHostObject.h.
#include <rnexecutorch/jsi/RuntimeLifecycleMonitor.h>

#include <jsi/jsi.h>
#include <memory>
#include <unordered_map>
#include <utility>

namespace rnexecutorch {

using namespace facebook;

/**
 * Provides a way to keep data specific to a jsi::Runtime instance that gets
 * cleaned up when that runtime is destroyed. This is necessary because JSI does
 * not allow for its associated objects to be retained past the runtime
 * lifetime. If an object (e.g. jsi::Values or jsi::Function instances) is kept
 * after the runtime is torn down, its destructor (once it is destroyed
 * eventually) will result in a crash (JSI objects keep a pointer to memory
 * managed by the runtime, accessing that portion of the memory after runtime is
 * deleted is the root cause of that crash).
 */
template <typename T>
class RuntimeAwareCache : public RuntimeLifecycleListener {
public:
  void onRuntimeDestroyed(jsi::Runtime *rt) override {
    // A runtime has been destroyed, so destroy the related cache.
    runtimeCaches_.erase(rt);
  }

  ~RuntimeAwareCache() override {
    for (auto &cache : runtimeCaches_) {
      // remove all `onRuntimeDestroyed` listeners.
      RuntimeLifecycleMonitor::removeListener(*cache.first, this);
    }
  }

  T &get(jsi::Runtime &rt) {
    if (runtimeCaches_.count(&rt) == 0) {
      // This is the first time this Runtime has been accessed.
      // We set up a `onRuntimeDestroyed` listener for it and
      // initialize the cache map.
      RuntimeLifecycleMonitor::addListener(rt, this);

      T cache;
      runtimeCaches_.emplace(&rt, std::move(cache));
    }
    return runtimeCaches_.at(&rt);
  }

private:
  std::unordered_map<jsi::Runtime *, T> runtimeCaches_;
};

} // namespace rnexecutorch