require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-executorch-webrtc"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["repository"]["url"]
  s.license      = package["license"]
  s.authors      = "Software Mansion"

  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => package["repository"]["url"], :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm}"

  # react-native-executorch exposes rnexecutorch/* headers via its header_dir.
  # However, executorch SDK headers and internal headers don't propagate to
  # dependent pods, so we need to add them here.
  rne_path = '${PODS_ROOT}/../../node_modules/react-native-executorch'

  s.pod_target_xcconfig = {
    "USE_HEADERMAP" => "YES",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    "HEADER_SEARCH_PATHS" => "\"#{rne_path}/third-party/include\" \"#{rne_path}/common\""
  }

  s.dependency "React-Core"
  s.dependency "react-native-executorch"
  s.dependency "opencv-rne", "~> 4.11.0"
  s.dependency 'FishjamReactNativeWebrtc'

  install_modules_dependencies(s)
end
