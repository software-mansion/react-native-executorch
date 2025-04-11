#include "ETInstallerModule.h"
#include "RnExecutorchInstaller.h"

namespace rnexecutorch {

using namespace facebook::jni;

ETInstallerModule::ETInstallerModule(
    jni::alias_ref<ETInstallerModule::jhybridobject> &jThis,
    jsi::Runtime *jsiRuntime,
    const std::shared_ptr<facebook::react::CallInvoker> &jsCallInvoker)
    : javaPart_(make_global(jThis)), jsiRuntime_(jsiRuntime),
      jsCallInvoker_(jsCallInvoker) {}

jni::local_ref<ETInstallerModule::jhybriddata> ETInstallerModule::initHybrid(
    jni::alias_ref<jhybridobject> jThis, jlong jsContext,
    jni::alias_ref<facebook::react::CallInvokerHolder::javaobject>
        jsCallInvokerHolder) {
  auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();
  auto rnRuntime = reinterpret_cast<jsi::Runtime *>(jsContext);
  return makeCxxInstance(jThis, rnRuntime, jsCallInvoker);
}

void ETInstallerModule::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", ETInstallerModule::initHybrid),
      makeNativeMethod("injectJSIBindings",
                       ETInstallerModule::injectJSIBindings),
  });
}

void ETInstallerModule::injectJSIBindings() {
  RnExecutorchInstaller::injectJSIBindings(jsiRuntime_, jsCallInvoker_);
}
} // namespace rnexecutorch