#include "RnExecutorch.h"
#include <jni.h>
#include <jsi/jsi.h>

extern "C" JNIEXPORT void JNICALL Java_com_swmansion_rnexecutorch_RnExecutorchModule_nativeInstall(JNIEnv *env, jclass clazz, jlong jsi) {
    facebook::jsi::Runtime *runtime = reinterpret_cast<facebook::jsi::Runtime *>(jsi);
    rnexecutorch::install(*runtime);
}
