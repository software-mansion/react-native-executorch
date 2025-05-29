#pragma once

#include <ReactCommon/CallInvokerHolder.h>
#include <fbjni/fbjni.h>
#include <react/jni/CxxModuleWrapper.h>
#include <react/jni/JMessageQueueThread.h>

#include <memory>
#include <utility>

namespace rnexecutorch {

using namespace facebook;
using namespace react;

class ETInstallerModule : public jni::HybridClass<ETInstallerModule> {
public:
  static auto constexpr kJavaDescriptor =
      "Lcom/swmansion/rnexecutorch/ETInstaller;";

  static jni::local_ref<ETInstallerModule::jhybriddata>
  initHybrid(jni::alias_ref<jhybridobject> jThis, jlong jsContext,
             jni::alias_ref<facebook::react::CallInvokerHolder::javaobject>
                 jsCallInvokerHolder);

  static void registerNatives();

  void injectJSIBindings();

private:
  friend HybridBase;

  jni::global_ref<ETInstallerModule::javaobject> javaPart_;
  jsi::Runtime *jsiRuntime_;
  std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker_;

  explicit ETInstallerModule(
      jni::alias_ref<ETInstallerModule::jhybridobject> &jThis,
      jsi::Runtime *jsiRuntime,
      const std::shared_ptr<facebook::react::CallInvoker> &jsCallInvoker);
};

} // namespace rnexecutorch