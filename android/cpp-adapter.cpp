#include <jni.h>
#include "react-native-executorch.h"

extern "C"
JNIEXPORT jdouble JNICALL
Java_com_swmansion_rnexecutorch_RnExecutorchModule_nativeMultiply(JNIEnv *env, jobject thiz, jdouble a, jdouble b) {
    return RnExecutorch2::multiply(a, b);
}
