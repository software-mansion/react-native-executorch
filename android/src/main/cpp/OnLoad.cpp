#include <ETInstallerModule.h>

#include <fbjni/fbjni.h>

using namespace rnexecutorch;

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(
      vm, [] { ETInstallerModule::registerNatives(); });
}