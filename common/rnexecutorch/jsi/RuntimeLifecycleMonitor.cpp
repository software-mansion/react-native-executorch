#include "RuntimeLifecycleMonitor.h"

namespace rnexecutorch {

static std::unordered_map<jsi::Runtime *,
                          std::unordered_set<RuntimeLifecycleListener *>>
    listeners;

struct RuntimeLifecycleMonitorObject : public jsi::HostObject {
  jsi::Runtime *rt_;
  explicit RuntimeLifecycleMonitorObject(jsi::Runtime *rt) : rt_(rt) {}
  ~RuntimeLifecycleMonitorObject() override {
    auto listenersSet = listeners.find(rt_);
    if (listenersSet != listeners.end()) {
      for (auto listener : listenersSet->second) {
        listener->onRuntimeDestroyed(rt_);
      }
      listeners.erase(listenersSet);
    }
  }
};

void RuntimeLifecycleMonitor::addListener(jsi::Runtime &rt,
                                          RuntimeLifecycleListener *listener) {
  auto listenersSet = listeners.find(&rt);
  if (listenersSet == listeners.end()) {
    // We install a global host object in the provided runtime, this way we can
    // use that host object destructor to get notified when the runtime is being
    // terminated. We use a unique name for the object as it gets saved with the
    // runtime's global object.
    rt.global().setProperty(
        rt, "__rnaudioapi_runtime_lifecycle_monitor",
        jsi::Object::createFromHostObject(
            rt, std::make_shared<RuntimeLifecycleMonitorObject>(&rt)));
    std::unordered_set<RuntimeLifecycleListener *> newSet;
    newSet.insert(listener);
    listeners.emplace(&rt, std::move(newSet));
  } else {
    listenersSet->second.insert(listener);
  }
}

void RuntimeLifecycleMonitor::removeListener(
    jsi::Runtime &rt, RuntimeLifecycleListener *listener) {
  auto listenersSet = listeners.find(&rt);
  if (listenersSet == listeners.end()) {
    // nothing to do here
  } else {
    listenersSet->second.erase(listener);
  }
}

} // namespace rnexecutorch