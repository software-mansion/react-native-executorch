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
else
  enable_opencv     = true
  enable_phonemizer = true
  enable_xnnpack    = true
  enable_coreml     = true
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

  pthreadpool_binaries_path = File.expand_path('$(PODS_TARGET_SRCROOT)/third-party/ios/libs/pthreadpool', __dir__)
  cpuinfo_binaries_path     = File.expand_path('$(PODS_TARGET_SRCROOT)/third-party/ios/libs/cpuinfo', __dir__)
  phonemis_binaries_path    = File.expand_path('$(PODS_TARGET_SRCROOT)/third-party/ios/libs/phonemis', __dir__)

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

  s.source_files = [
    "ios/**/*.{m,mm,h}",
    "common/**/*.{cpp,c,h,hpp}",
  ]

  exclude_files = [
    "common/rnexecutorch/tests/**/*.{cpp}",
    "common/rnexecutorch/jsi/*.{h,hpp}",
  ]
  exclude_files += opencv_source_files     unless enable_opencv
  exclude_files += phonemizer_source_files unless enable_phonemizer
  s.exclude_files = exclude_files

  # --- Preprocessor flags ---
  extra_compiler_flags = []
  extra_compiler_flags << "-DRNE_ENABLE_OPENCV"     if enable_opencv
  extra_compiler_flags << "-DRNE_ENABLE_PHONEMIZER" if enable_phonemizer
  extra_compiler_flags << "-DRNE_ENABLE_XNNPACK"    if enable_xnnpack
  extra_compiler_flags << "-DRNE_ENABLE_COREML"     if enable_coreml

  # --- Link flags ---
  physical_ldflags = [
    '$(inherited)',
    "\"#{pthreadpool_binaries_path}/physical-arm64-release/libpthreadpool.a\"",
    "\"#{cpuinfo_binaries_path}/libcpuinfo.a\"",
  ]
  simulator_ldflags = [
    '$(inherited)',
    "\"#{pthreadpool_binaries_path}/simulator-arm64-debug/libpthreadpool.a\"",
    "\"#{cpuinfo_binaries_path}/libcpuinfo.a\"",
  ]

  if enable_phonemizer
    physical_ldflags  << "\"#{phonemis_binaries_path}/physical-arm64-release/libphonemis.a\""
    simulator_ldflags << "\"#{phonemis_binaries_path}/simulator-arm64-debug/libphonemis.a\""
  end

  xnnpack_xcframework_path = File.expand_path('$(PODS_TARGET_SRCROOT)/third-party/ios/XnnpackBackend.xcframework', __dir__)
  coreml_xcframework_path  = File.expand_path('$(PODS_TARGET_SRCROOT)/third-party/ios/CoreMLBackend.xcframework', __dir__)

  if enable_xnnpack
    physical_ldflags  << "-force_load \"#{xnnpack_xcframework_path}/ios-arm64/libXnnpackBackend.a\""
    simulator_ldflags << "-force_load \"#{xnnpack_xcframework_path}/ios-arm64-simulator/libXnnpackBackend.a\""
  end

  if enable_coreml
    physical_ldflags  << "-force_load \"#{coreml_xcframework_path}/ios-arm64/libCoreMLBackend.a\""
    simulator_ldflags << "-force_load \"#{coreml_xcframework_path}/ios-arm64-simulator/libCoreMLBackend.a\""
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

  s.pod_target_xcconfig = {
    "USE_HEADERMAP" => "YES",
    "HEADER_SEARCH_PATHS" =>
      '"$(PODS_TARGET_SRCROOT)/ios" '+
      '"$(PODS_TARGET_SRCROOT)/third-party/include/executorch/extension/llm/tokenizers/include" '+
      '"$(PODS_TARGET_SRCROOT)/third-party/include" '+
      '"$(PODS_TARGET_SRCROOT)/third-party/include/cpuinfo" '+
      '"$(PODS_TARGET_SRCROOT)/third-party/include/pthreadpool" '+
      '"$(PODS_TARGET_SRCROOT)/common" ',
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    "OTHER_CPLUSPLUSFLAGS" => extra_compiler_flags.join(' '),
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64',
  }

  libs = ["z"]
  libs << "sqlite3" if enable_coreml
  s.libraries = libs

  system_frameworks = ["Accelerate"]
  system_frameworks << "CoreML" if enable_coreml
  s.frameworks = system_frameworks

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
