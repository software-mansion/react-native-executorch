#include "ETInstallerModule.h"

#include <rnexecutorch/RnExecutorchInstaller.h>

#include <jni.h>
#include <jsi/jsi.h>

namespace rnexecutorch {
JavaVM *java_machine;
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
  // Grab a function for fetching images via URL from Java
  auto fetchDataByUrl = [](std::string url) {
    // Attaching Current Thread to JVM

    JNIEnv *env = nullptr;
    int getEnvStat = java_machine->GetEnv((void **)&env, JNI_VERSION_1_6);
    if (getEnvStat == JNI_EDETACHED) {
      if (java_machine->AttachCurrentThread(&env, nullptr) != 0) {
        throw std::runtime_error("Failed to attach thread to JVM");
      }
    }
    static jclass cls = javaClassStatic().get();
    static jmethodID method = env->GetStaticMethodID(
        cls, "fetchByteDataFromUrl", "(Ljava/lang/String;)[B");

    jstring jUrl = env->NewStringUTF(url.c_str());
    jbyteArray byteData =
        (jbyteArray)env->CallStaticObjectMethod(cls, method, jUrl);

    if (env->IsSameObject(byteData, NULL)) {
      throw std::runtime_error("Error fetching data from a url");
    }

    int size = env->GetArrayLength(byteData);
    jbyte *bytes = env->GetByteArrayElements(byteData, JNI_FALSE);
    std::byte *dataBytePtr = reinterpret_cast<std::byte *>(bytes);

    return std::vector<std::byte>(dataBytePtr, dataBytePtr + size);
  };

  RnExecutorchInstaller::injectJSIBindings(jsiRuntime_, jsCallInvoker_,
                                           fetchDataByUrl);
}
} // namespace rnexecutorch

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  rnexecutorch::java_machine = vm;
  return facebook::jni::initialize(
      vm, [] { rnexecutorch::ETInstallerModule::registerNatives(); });
}