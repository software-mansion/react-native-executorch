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
  s.source       = { :git => "https://github.com/NorbertKlockiewicz/react-native-executorch.git", :tag => "#{s.version}" }

  s.user_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "$(PODS_TARGET_SRCROOT)/third-party/include",
    "OTHER_LDFLAGS[sdk=iphoneos*][arch=*]" => [
      '$(inherited)', 
      '-framework "CoreML"', 
      '-framework "Accelerate"', 
      '-framework "Metal"', 
      '-framework "MetalPerformanceShaders"', 
      '-framework "MetalPerformanceShadersGraph"', 
      '-force_load "$(PODS_ROOT)/../../node_modules/react-native-executorch/ios/libs/libbackend_coreml-ios-release.a"', 
      '-force_load "$(PODS_ROOT)/../../node_modules/react-native-executorch/ios/libs/libbackend_mps-ios-release.a"', 
      '-force_load "$(PODS_ROOT)/../../node_modules/react-native-executorch/ios/libs/libbackend_xnnpack-ios-release.a"', 
      '-force_load "$(PODS_ROOT)/../../node_modules/react-native-executorch/ios/libs/libexecutorch-ios-release.a"', 
      '-force_load "$(PODS_ROOT)/../../node_modules/react-native-executorch/ios/libs/libkernels_custom-ios-release.a"', 
      '-force_load "$(PODS_ROOT)/../../node_modules/react-native-executorch/ios/libs/libkernels_optimized-ios-release.a"', 
      '-force_load "$(PODS_ROOT)/../../node_modules/react-native-executorch/ios/libs/libkernels_quantized-ios-release.a"'
    ].join(' '),
      
    "OTHER_LDFLAGS[sdk=iphonesimulator*][arch=*]" => [
      '$(inherited)', 
      '-framework "CoreML"', 
      '-framework "Accelerate"', 
      '-framework "Metal"', 
      '-framework "MetalPerformanceShaders"', 
      '-framework "MetalPerformanceShadersGraph"', 
      '-force_load "$(PODS_ROOT)/../../node_modules/react-native-executorch/ios/libs/libbackend_coreml-simulator-release.a"', 
      '-force_load "$(PODS_ROOT)/../../node_modules/react-native-executorch/ios/libs/libbackend_mps-simulator-release.a"', 
      '-force_load "$(PODS_ROOT)/../../node_modules/react-native-executorch/ios/libs/libbackend_xnnpack-simulator-release.a"', 
      '-force_load "$(PODS_ROOT)/../../node_modules/react-native-executorch/ios/libs/libexecutorch-simulator-release.a"', 
      '-force_load "$(PODS_ROOT)/../../node_modules/react-native-executorch/ios/libs/libkernels_custom-simulator-release.a"', 
      '-force_load "$(PODS_ROOT)/../../node_modules/react-native-executorch/ios/libs/libkernels_optimized-simulator-release.a"', 
      '-force_load "$(PODS_ROOT)/../../node_modules/react-native-executorch/ios/libs/libkernels_quantized-simulator-release.a"'
    ].join(' ')
  }

  s.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "$(PODS_TARGET_SRCROOT)/third-party/include"
  }

  s.ios.vendored_frameworks = "ios/ExecutorchLib.xcframework"
  s.source_files = "ios/**/*.{h,m,mm}", "common/**/*.{hpp,cpp,c,h}"
  
  s.dependency "opencv-rne", "~> 0.1.0"
  s.dependency "sqlite3"

  install_modules_dependencies(s)
end