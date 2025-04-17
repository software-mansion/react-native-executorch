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

  s.ios.vendored_frameworks = "ios/ExecutorchLib.xcframework"
  s.source_files = "ios/**/*.{h,m,mm}"

  s.dependency "opencv-rne", "~> 0.1.0"

  install_modules_dependencies(s)
end