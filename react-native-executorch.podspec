require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'

Pod::Spec.new do |s|
  s.name         = "react-native-executorch"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/NorbertKlockiewicz/react-native-executorch.git", :tag => "#{s.version}" }

  # s.frameworks = ['Accelerate', 'CoreML']
  # s.ios.vendored_frameworks = "ios/LLaMARunner.xcframework"
  # s.libraries = "sqlite3"
  s.source_files = "ios/**/*.{h,m,mm}"

  install_modules_dependencies(s)
end