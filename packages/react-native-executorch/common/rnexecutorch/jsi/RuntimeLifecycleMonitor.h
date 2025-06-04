#pragma once
// Adapted from https://github.com/software-mansion/react-native-audio-api

#include <jsi/jsi.h>
#include <memory>
#include <unordered_map>
#include <unordered_set>
#include <utility>

namespace rnexecutorch {

using namespace facebook;

/**
 * Listener interface that allows for getting notified when a jsi::Runtime
 * instance is destroyed.
 */
struct RuntimeLifecycleListener {
  virtual ~RuntimeLifecycleListener() = default;
  virtual void onRuntimeDestroyed(jsi::Runtime *) = 0;
};

/**
 * This class provides an API via static methods for registering and
 * unregistering runtime lifecycle listeners. The listeners can be used to
 * cleanup any data that references a given jsi::Runtime instance before it gets
 * destroyed.
 */
struct RuntimeLifecycleMonitor {
  static void addListener(jsi::Runtime &rt, RuntimeLifecycleListener *listener);
  static void removeListener(jsi::Runtime &rt,
                             RuntimeLifecycleListener *listener);
};

} // namespace rnexecutorch