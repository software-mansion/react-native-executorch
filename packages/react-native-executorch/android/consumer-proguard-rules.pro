# Ported from ExecuTorch's official Android consumer rules:
# https://github.com/pytorch/executorch/blob/904c667007aed15e9a3bb8278aa271b479450c85/extension/android/executorch_android/consumer-proguard-rules.pro

# ExecuTorch Android AAR — Consumer ProGuard/R8 Rules
#
# These rules are automatically applied to any app that depends on the
# ExecuTorch AAR. They prevent R8/ProGuard from stripping classes and
# methods that are called from native (JNI) code.

# Keep ExecuTorch classes and members annotated with @DoNotStrip.
# Scoped to org.pytorch.executorch to avoid affecting unrelated libraries.
-keep @com.facebook.jni.annotations.DoNotStrip class org.pytorch.executorch.** { *; }
-keepclassmembers class org.pytorch.executorch.** {
    @com.facebook.jni.annotations.DoNotStrip *;
}

# Keep all native methods across ExecuTorch packages.
# Use -keepclasseswithmembers (not -keepclasseswithmembernames) to prevent
# both shrinking and obfuscation of JNI entry points.
-keepclasseswithmembers class org.pytorch.executorch.** {
    native <methods>;
}

# Keep HybridData fields (accessed by fbjni via reflection).
-keepclassmembers class org.pytorch.executorch.** {
    com.facebook.jni.HybridData *;
}

# Keep ExecutorchRuntimeException and its factory/subclasses.
# These are instantiated from JNI via jni_helper.cpp.
-keep class org.pytorch.executorch.ExecutorchRuntimeException { *; }
-keep class org.pytorch.executorch.ExecutorchRuntimeException$* { *; }

# Keep EValue (fields and type codes accessed from native code).
-keep class org.pytorch.executorch.EValue { *; }

# Keep Tensor and its inner classes. The Tensor class has methods and fields
# accessed from JNI (dtypeJniCode, shape, getRawDataBuffer, nativeNewTensor).
-keep class org.pytorch.executorch.Tensor { *; }
-keep class org.pytorch.executorch.Tensor$* { *; }

# Keep LlmCallback interface methods (invoked from native code).
-keep interface org.pytorch.executorch.extension.llm.LlmCallback { *; }

# Keep AsrCallback interface methods (invoked from native code).
-keep interface org.pytorch.executorch.extension.asr.AsrCallback { *; }

# --- react-native-executorch rules (not from upstream) ---

# RNE's own JNI entry point, resolved by literal descriptor from C++.
-keep class com.swmansion.rnexecutorch.ETInstaller { *; }
