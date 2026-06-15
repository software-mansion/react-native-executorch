require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

# Read the build config written by the postinstall script.
# Falls back to all features enabled if the file doesn't exist.
rne_build_config_path = File.join(__dir__, "rne-build-config.json")
if File.exist?(rne_build_config_path)
  require "json"
  rne_build_config = JSON.parse(File.read(rne_build_config_path))
  enable_opencv     = rne_build_config["enableOpencv"]     != false
  enable_phonemizer = rne_build_config["enablePhonemizer"] != false
  enable_xnnpack    = rne_build_config["enableXnnpack"]    != false
  enable_coreml     = rne_build_config["enableCoreml"]     != false
  enable_mlx        = rne_build_config["enableMlx"]        != false
else
  enable_opencv     = true
  enable_phonemizer = true
  enable_xnnpack    = true
  enable_coreml     = true
  enable_mlx        = true
end

Pod::Spec.new do |s|
  s.name         = "react-native-executorch"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => '17.0' }
  s.source       = { :git => "https://github.com/software-mansion/react-native-executorch.git", :tag => "#{s.version}" }

  # libthreadpool_*.a ships pthreadpool (incl. the v2 API libbackend_xnnpack
  # depends on) plus cpuinfo in one archive. We link it directly here because
  # ExecutorchLib.framework keeps those symbols local-only (not exported), so
  # split-out backend xcframeworks can't resolve them through the framework.
  executorch_binaries_path  = File.expand_path('$(PODS_TARGET_SRCROOT)/third-party/ios/libs/executorch', __dir__)

  # --- Core sources (always compiled) ---
  opencv_source_dirs = [
    "common/rnexecutorch/models/classification",
    "common/rnexecutorch/models/object_detection",
    "common/rnexecutorch/models/semantic_segmentation",
    "common/rnexecutorch/models/instance_segmentation",
    "common/rnexecutorch/models/style_transfer",
    "common/rnexecutorch/models/ocr",
    "common/rnexecutorch/models/vertical_ocr",
    "common/rnexecutorch/models/embeddings/image",
    "common/rnexecutorch/models/text_to_image",
    "common/rnexecutorch/models/pose_estimation",
    "common/rnexecutorch/utils/computer_vision",
  ]
  opencv_source_files = opencv_source_dirs.map { |d| "#{d}/**/*.{cpp,c,h,hpp}" }
  opencv_source_files += [
    "common/rnexecutorch/models/VisionModel.{cpp,h}",
    "common/rnexecutorch/data_processing/ImageProcessing.{cpp,h}",
    "common/rnexecutorch/utils/FrameExtractor.{cpp,h}",
    "common/rnexecutorch/utils/FrameProcessor.{cpp,h}",
    "common/rnexecutorch/utils/FrameTransform.{cpp,h}",
  ]

  phonemizer_source_files = [
    "common/rnexecutorch/models/text_to_speech/**/*.{cpp,c,h,hpp}",
  ]

  source_files = [
    "ios/**/*.{m,mm,h}",
    "common/**/*.{cpp,c,h,hpp}",
  ]
  source_files << "third-party/common/phonemis/src/**/*.{cpp,hpp,h}" if enable_phonemizer
  s.source_files = source_files

  # Exclude file with tests to not introduce gtest dependency.
  # Do not include the headers from common/rnexecutorch/jsi/ as source files.
  # Xcode/Cocoapods leaks them to other pods that an app also depends on, so if
  # another pod includes a header with the same name without a path by
  # #include "Header.h" we get a conflict. Here, headers in jsi/ collide with
  # react-native-skia. The headers are preserved by preserve_paths and
  # then made available by HEADER_SEARCH_PATHS.
  exclude_files = [
    "common/rnexecutorch/tests/**/*",
    "common/rnexecutorch/jsi/*.{h,hpp}",
  ]
  exclude_files += opencv_source_files     unless enable_opencv
  exclude_files += phonemizer_source_files unless enable_phonemizer
  # phonemis ships a CLI runner that defines its own `main()`; exclude when compiling into the pod.
  exclude_files << "third-party/common/phonemis/src/phonemis/main.cpp" if enable_phonemizer
  s.exclude_files = exclude_files

  # --- Preprocessor flags ---
  extra_compiler_flags = []
  extra_compiler_flags << "-DRNE_ENABLE_OPENCV"     if enable_opencv
  extra_compiler_flags << "-DRNE_ENABLE_PHONEMIZER" if enable_phonemizer
  extra_compiler_flags << "-DRNE_ENABLE_XNNPACK"    if enable_xnnpack
  extra_compiler_flags << "-DRNE_ENABLE_COREML"     if enable_coreml
  extra_compiler_flags << "-DRNE_ENABLE_MLX"        if enable_mlx
  # ET_ON tells phonemis to compile the NeuralPhonemizer path against ExecuTorch.
  extra_compiler_flags << "-DET_ON=1"               if enable_phonemizer

  # --- Link flags ---
  physical_ldflags = [
    '$(inherited)',
    "\"#{executorch_binaries_path}/libthreadpool_ios.a\"",
  ]
  simulator_ldflags = [
    '$(inherited)',
    "\"#{executorch_binaries_path}/libthreadpool_simulator.a\"",
  ]

  xnnpack_xcframework_path = File.expand_path('$(PODS_TARGET_SRCROOT)/third-party/ios/XnnpackBackend.xcframework', __dir__)
  coreml_xcframework_path  = File.expand_path('$(PODS_TARGET_SRCROOT)/third-party/ios/CoreMLBackend.xcframework', __dir__)
  mlx_xcframework_path     = File.expand_path('$(PODS_TARGET_SRCROOT)/third-party/ios/MLXBackend.xcframework', __dir__)

  if enable_xnnpack
    physical_ldflags  << "-force_load \"#{xnnpack_xcframework_path}/ios-arm64/libXnnpackBackend.a\""
    simulator_ldflags << "-force_load \"#{xnnpack_xcframework_path}/ios-arm64-simulator/libXnnpackBackend.a\""
  end

  if enable_coreml
    physical_ldflags  << "-force_load \"#{coreml_xcframework_path}/ios-arm64/libCoreMLBackend.a\""
    simulator_ldflags << "-force_load \"#{coreml_xcframework_path}/ios-arm64-simulator/libCoreMLBackend.a\""
  end

  # MLX backend uses Metal APIs (`MTLTensorDomain`, `MTLIOErrorDomain`) that
  # ship in iPhoneOS.sdk but NOT iPhoneSimulator.sdk, so the simulator slice of
  # libMLXBackend.a cannot link there. Match main's behavior: only link MLX in
  # the device slice. At runtime an MLX-exported model on simulator will fail
  # to load — that's expected; iOS Simulator can't drive MLX-on-Metal anyway.
  if enable_mlx
    physical_ldflags  << "-force_load \"#{mlx_xcframework_path}/ios-arm64/libMLXBackend.a\""
  end

  s.user_target_xcconfig = {
    "HEADER_SEARCH_PATHS" =>
      '"$(PODS_TARGET_SRCROOT)/third-party/include" '+
      '"$(PODS_TARGET_SRCROOT)/third-party/include/cpuinfo" '+
      '"$(PODS_TARGET_SRCROOT)/third-party/include/pthreadpool"',
    "OTHER_LDFLAGS[sdk=iphoneos*]"       => physical_ldflags.join(' '),
    "OTHER_LDFLAGS[sdk=iphonesimulator*]" => simulator_ldflags.join(' '),
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64',
  }

  pod_header_search_paths =
    '"$(PODS_TARGET_SRCROOT)/ios" ' +
    '"$(PODS_TARGET_SRCROOT)/third-party/include/executorch/extension/llm/tokenizers/include" ' +
    '"$(PODS_TARGET_SRCROOT)/third-party/include" ' +
    '"$(PODS_TARGET_SRCROOT)/third-party/include/cpuinfo" ' +
    '"$(PODS_TARGET_SRCROOT)/third-party/include/pthreadpool" ' +
    '"$(PODS_TARGET_SRCROOT)/common" '
  pod_header_search_paths += '"$(PODS_TARGET_SRCROOT)/third-party/common/phonemis/src" ' if enable_phonemizer

  s.pod_target_xcconfig = {
    "USE_HEADERMAP" => "YES",
    "HEADER_SEARCH_PATHS" => pod_header_search_paths,
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    "OTHER_CPLUSPLUSFLAGS" => extra_compiler_flags.join(' '),
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

  # MLX runtime resolves its compiled GPU kernels via dladdr on a function
  # symbol from libMLXBackend.a, then loads `mlx.metallib` from the same
  # directory as that symbol's host binary. Because libMLXBackend.a is a
  # static archive force-loaded into the app's main executable, the metallib
  # has to land in the app bundle's main resource path. `s.ios.resource`
  # achieves that via CocoaPods' resource copy.
  s.ios.resource = "third-party/ios/libs/executorch/mlx.metallib" if enable_mlx

  # Backend xcframeworks are linked via force_load in OTHER_LDFLAGS (needed to
  # preserve __attribute__((constructor)) registrations). Only ExecutorchLib goes
  # in vendored_frameworks to avoid duplicate symbol errors.
  s.ios.vendored_frameworks = ["third-party/ios/ExecutorchLib.xcframework"]


  s.header_mappings_dir = "common/rnexecutorch"
  s.header_dir = "rnexecutorch"
  s.preserve_paths = "common/rnexecutorch/jsi/*.{h,hpp}"

  s.dependency "opencv-rne", "~> 4.11.0" if enable_opencv

  install_modules_dependencies(s)
end
