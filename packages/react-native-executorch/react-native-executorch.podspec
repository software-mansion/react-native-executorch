require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-executorch"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/software-mansion/react-native-executorch.git", :tag => "#{s.version}" }

  et_binaries_path = File.expand_path('$(PODS_TARGET_SRCROOT)/ios/libs/executorch', __dir__)
  tokenizers_binaries_path = File.expand_path('$(PODS_TARGET_SRCROOT)/ios/libs/tokenizers-cpp', __dir__)

  s.frameworks = [
    'CoreML',
    'Accelerate',
    'Metal',
    'MetalPerformanceShaders',
    'MetalPerformanceShadersGraph'
  ]

  s.user_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "$(PODS_TARGET_SRCROOT)/third-party/include",

    "OTHER_LDFLAGS[sdk=iphoneos*]" => [
      '$(inherited)', 
      "-force_load \"#{et_binaries_path}\"/libbackend_coreml_ios.a", 
      "-force_load \"#{et_binaries_path}\"/libbackend_mps_ios.a", 
      "-force_load \"#{et_binaries_path}\"/libbackend_xnnpack_ios.a", 
      "-force_load \"#{et_binaries_path}\"/libexecutorch_ios.a", 
      "-force_load \"#{et_binaries_path}\"/libkernels_custom_ios.a", 
      "-force_load \"#{et_binaries_path}\"/libkernels_optimized_ios.a", 
      "-force_load \"#{et_binaries_path}\"/libkernels_quantized_ios.a",
      "\"#{et_binaries_path}\"/libkernels_portable_ios.a",
      "\"#{tokenizers_binaries_path}/physical-arm64-release/libtokenizers_cpp.a\"",
      "\"#{tokenizers_binaries_path}/physical-arm64-release/libsentencepiece.a\"",
      "\"#{tokenizers_binaries_path}/physical-arm64-release/libtokenizers_c.a\""
    ].join(' '),
      
    "OTHER_LDFLAGS[sdk=iphonesimulator*]" => [
      '$(inherited)', 
      "-force_load \"#{et_binaries_path}\"/libbackend_coreml_simulator.a", 
      "-force_load \"#{et_binaries_path}\"/libbackend_mps_simulator.a", 
      "-force_load \"#{et_binaries_path}\"/libbackend_xnnpack_simulator.a", 
      "-force_load \"#{et_binaries_path}\"/libexecutorch_simulator.a", 
      "-force_load \"#{et_binaries_path}\"/libkernels_custom_simulator.a", 
      "-force_load \"#{et_binaries_path}\"/libkernels_optimized_simulator.a", 
      "-force_load \"#{et_binaries_path}\"/libkernels_quantized_simulator.a",
      "\"#{et_binaries_path}\"/libkernels_portable_simulator.a",
      "\"#{tokenizers_binaries_path}/simulator-arm64-debug/libtokenizers_cpp.a\"",
      "\"#{tokenizers_binaries_path}/simulator-arm64-debug/libsentencepiece.a\"",
      "\"#{tokenizers_binaries_path}/simulator-arm64-debug/libtokenizers_c.a\""
    ].join(' '),

    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64',
  }

  s.pod_target_xcconfig = {
    "USE_HEADERMAP" => "YES",
    "HEADER_SEARCH_PATHS" => 
      '"$(PODS_TARGET_SRCROOT)/ios" '+
      '"$(PODS_TARGET_SRCROOT)/third-party/include" '+
      '"$(PODS_TARGET_SRCROOT)/common" ',
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64',
  }

  s.source_files = [
    "ios/**/*.{m,mm,h}",
    "common/**/*.{cpp,c,h,hpp}",
  ]

  s.libraries = "z"

  # Exclude file with tests to not introduce gtest dependency.
  # Do not include the headers from common/rnexecutorch/jsi/ as source files. 
  # Xcode/Cocoapods leaks them to other pods that an app also depends on, so if 
  # another pod includes a header with the same name without a path by 
  # #include "Header.h" we get a conflict. Here, headers in jsi/ collide with 
  # react-native-skia. The headers are preserved by preserve_paths and 
  # then made available by HEADER_SEARCH_PATHS.
  s.exclude_files = [
    "common/rnexecutorch/tests/*.{cpp}",
    "common/rnexecutorch/jsi/*.{h,hpp}"
  ]
  s.header_mappings_dir = "common/rnexecutorch"
  s.header_dir = "rnexecutorch"
  s.preserve_paths = "common/rnexecutorch/jsi/*.{h,hpp}"
  
  s.dependency "opencv-rne", "~> 4.11.0"
  s.dependency "sqlite3"

  install_modules_dependencies(s)
end