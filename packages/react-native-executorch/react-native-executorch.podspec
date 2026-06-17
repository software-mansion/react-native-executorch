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

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}", "cpp/**/*.{hpp,cpp,c,h}"
  s.private_header_files = "ios/**/*.h"

  s.ios.vendored_frameworks = "third-party/ios/Frameworks/ExecutorchLib.xcframework"
  s.frameworks = "CoreML", "Metal", "MetalPerformanceShaders", "Accelerate"
  s.library = "sqlite3"

  s.pod_target_xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",

    "GCC_PREPROCESSOR_DEFINITIONS" => [
      "$(inherited)",
      "C10_USING_CUSTOM_GENERATED_MACROS=1",
      "EXECUTORCH_ENABLE_EXECUTION_PROFILING=1",
    ].join(' '),

    "HEADER_SEARCH_PATHS" => [
      "\"$(PODS_TARGET_SRCROOT)/cpp\"",
      "\"$(PODS_TARGET_SRCROOT)/third-party/include\"",
    ].join(' '),
    
    "WARNING_CFLAGS" => "-Wno-documentation"
  }

  install_modules_dependencies(s)
end

