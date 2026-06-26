require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

# Read the build config written by the postinstall script (scripts/download-libs.js).
# Falls back to all features enabled if the file doesn't exist (e.g. a fresh
# checkout where the native libs were provisioned manually).
rne_build_config_path = File.join(__dir__, "rne-build-config.json")
if File.exist?(rne_build_config_path)
  rne_build_config = JSON.parse(File.read(rne_build_config_path))
  enable_opencv   = rne_build_config["enableOpencv"]   != false
  enable_phonemis = rne_build_config["enablePhonemis"] != false
  enable_xnnpack  = rne_build_config["enableXnnpack"]  != false
  enable_coreml   = rne_build_config["enableCoreml"]   != false
  enable_mlx      = rne_build_config["enableMlx"]      != false
else
  enable_opencv   = true
  enable_phonemis = true
  enable_xnnpack  = true
  enable_coreml   = true
  enable_mlx      = true
end

Pod::Spec.new do |s|
  s.name         = "react-native-executorch"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  # ExecuTorch (and the MLX backend) require iOS 17.
  s.platforms    = { :ios => '17.0' }
  s.source       = { :git => "https://github.com/software-mansion/react-native-executorch.git", :tag => "#{s.version}" }

  # libthreadpool_*.a ships pthreadpool (incl. the v2 API libXnnpackBackend
  # depends on) plus cpuinfo in one archive. We link it directly here because
  # ExecutorchLib.framework keeps those symbols local-only (not exported), so
  # split-out backend xcframeworks can't resolve them through the framework.
  # Use the literal Xcode build variable so it is expanded at build time (matching
  # the HEADER_SEARCH_PATHS below). Do NOT wrap in File.expand_path: that resolves
  # `$(PODS_TARGET_SRCROOT)` as a literal directory relative to __dir__, baking a
  # malformed `<dir>/$(PODS_TARGET_SRCROOT)/...` path into the linker flags.
  executorch_binaries_path = '$(PODS_TARGET_SRCROOT)/third-party/ios/libs/executorch'

  # --- Sources ---
  # OpenCV-dependent sources live under the cv extension. When more tasks land
  # that need opencv (e.g. the multimodal-LLM vision encoder under nlp), add
  # their paths to this list so they are excluded together when opencv is off.
  opencv_source_files = [
    "cpp/extensions/cv/**/*.{cpp,c,h,hpp}",
  ]

  s.source_files = [
    "ios/**/*.{h,m,mm}",
    "cpp/**/*.{cpp,c,h,hpp}",
  ]

  exclude_files = []
  exclude_files += opencv_source_files unless enable_opencv
  s.exclude_files = exclude_files

  # --- Preprocessor flags ---
  # phonemis is wired for forward-compat (the TTS task is not yet ported to the
  # rewrite, so no source compiles against it today).
  extra_compiler_flags = []
  extra_compiler_flags << "-DRNE_ENABLE_OPENCV"   if enable_opencv
  extra_compiler_flags << "-DRNE_ENABLE_PHONEMIS" if enable_phonemis
  extra_compiler_flags << "-DRNE_ENABLE_XNNPACK"  if enable_xnnpack
  extra_compiler_flags << "-DRNE_ENABLE_COREML"   if enable_coreml
  extra_compiler_flags << "-DRNE_ENABLE_MLX"      if enable_mlx

  # --- Link flags ---
  physical_ldflags = [
    '$(inherited)',
    "\"#{executorch_binaries_path}/libthreadpool_ios.a\"",
  ]
  simulator_ldflags = [
    '$(inherited)',
    "\"#{executorch_binaries_path}/libthreadpool_simulator.a\"",
  ]

  xnnpack_xcframework_path = '$(PODS_TARGET_SRCROOT)/third-party/ios/XnnpackBackend.xcframework'
  coreml_xcframework_path  = '$(PODS_TARGET_SRCROOT)/third-party/ios/CoreMLBackend.xcframework'
  mlx_xcframework_path     = '$(PODS_TARGET_SRCROOT)/third-party/ios/MLXBackend.xcframework'

  if enable_xnnpack
    physical_ldflags  << "-force_load \"#{xnnpack_xcframework_path}/ios-arm64/libXnnpackBackend.a\""
    simulator_ldflags << "-force_load \"#{xnnpack_xcframework_path}/ios-arm64-simulator/libXnnpackBackend.a\""
  end

  if enable_coreml
    physical_ldflags  << "-force_load \"#{coreml_xcframework_path}/ios-arm64/libCoreMLBackend.a\""
    simulator_ldflags << "-force_load \"#{coreml_xcframework_path}/ios-arm64-simulator/libCoreMLBackend.a\""
  end

  # MLX backend uses Metal APIs (`MTLTensorDomain`, `MTLIOErrorDomain`) that ship
  # in iPhoneOS.sdk but NOT iPhoneSimulator.sdk, and the iOS simulator can't drive
  # MLX-on-Metal anyway. MLX ships the device slice only — link it on device only.
  if enable_mlx
    physical_ldflags << "-force_load \"#{mlx_xcframework_path}/ios-arm64/libMLXBackend.a\""
  end

  s.user_target_xcconfig = {
    "OTHER_LDFLAGS[sdk=iphoneos*]"        => physical_ldflags.join(' '),
    "OTHER_LDFLAGS[sdk=iphonesimulator*]" => simulator_ldflags.join(' '),
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64',
  }

  s.pod_target_xcconfig = {
    "USE_HEADERMAP" => "YES",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    "OTHER_CPLUSPLUSFLAGS" => extra_compiler_flags.join(' '),
    "GCC_PREPROCESSOR_DEFINITIONS" => [
      "$(inherited)",
      "C10_USING_CUSTOM_GENERATED_MACROS=1",
      "EXECUTORCH_ENABLE_EXECUTION_PROFILING=1",
    ].join(' '),
    "HEADER_SEARCH_PATHS" => [
      "\"$(PODS_TARGET_SRCROOT)/cpp\"",
      "\"$(PODS_TARGET_SRCROOT)/third-party/include\"",
      "\"$(PODS_TARGET_SRCROOT)/third-party/include/cpuinfo\"",
      "\"$(PODS_TARGET_SRCROOT)/third-party/include/pthreadpool\"",
      "\"$(PODS_TARGET_SRCROOT)/third-party/include/executorch/extension/llm/tokenizers/include\"",
      "\"$(PODS_TARGET_SRCROOT)/third-party/include/executorch/extension/llm/tokenizers/third-party/json/include\"",
      "\"$(PODS_TARGET_SRCROOT)/third-party/include/executorch/extension/llm/tokenizers/third-party/re2\"",
      "\"$(PODS_TARGET_SRCROOT)/third-party/include/executorch/extension/llm/tokenizers/third-party/abseil-cpp\"",
    ].join(' '),
    "WARNING_CFLAGS" => "-Wno-documentation",
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64',
  }

  libs = ["z"]
  libs << "sqlite3" if enable_coreml
  s.libraries = libs

  system_frameworks = ["Accelerate"]
  system_frameworks << "CoreML" if enable_coreml
  # MLX needs Metal at runtime; the GPU kernels in mlx.metallib are compiled
  # against the Metal toolchain.
  system_frameworks += ["Metal", "MetalKit", "MetalPerformanceShaders"] if enable_mlx
  s.frameworks = system_frameworks

  # MLX runtime resolves its compiled GPU kernels via dladdr on a function symbol
  # from libMLXBackend.a, then loads `mlx.metallib` from the same directory as
  # that symbol's host binary. Because libMLXBackend.a is force-loaded into the
  # app's main executable, the metallib has to land in the app bundle's main
  # resource path. `s.ios.resource` achieves that via CocoaPods' resource copy.
  s.ios.resource = "third-party/ios/libs/executorch/mlx.metallib" if enable_mlx

  # Backend xcframeworks are linked via force_load in OTHER_LDFLAGS (needed to
  # preserve __attribute__((constructor)) backend registrations). Only
  # ExecutorchLib goes in vendored_frameworks to avoid duplicate symbol errors.
  s.ios.vendored_frameworks = ["third-party/ios/ExecutorchLib.xcframework"]

  # iOS OpenCV is provided by the opencv-rne CocoaPod (not a downloaded tarball).
  s.dependency "opencv-rne", "~> 4.11.0" if enable_opencv

  install_modules_dependencies(s)
end
