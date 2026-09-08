require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

# package.json carries the npm-style "git+https://....git" form; CocoaPods wants
# a plain URL for the homepage and a bare git URL for the source.
repo_url = package["repository"]["url"].sub(/\Agit\+/, "").sub(/\.git\z/, "")

Pod::Spec.new do |s|
  s.name         = "react-native-executorch-webrtc"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = repo_url
  s.license      = package["license"]
  s.authors      = "Software Mansion"

  # Has to match react-native-executorch, which requires iOS 17 for ExecuTorch
  # and MLX. A lower floor here fails to resolve against that dependency.
  s.platforms    = { :ios => "17.0" }
  s.source       = { :git => "#{repo_url}.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm}"

  # react-native-executorch keeps its header search paths in pod_target_xcconfig,
  # which does not propagate to dependent pods, so we repeat the two we need.
  #
  # ios/ExecutorchFrameProcessor.mm includes rnexecutorch/host_objects and
  # rnexecutorch/models/semantic_segmentation. Those live under legacy/cpp: the
  # rewritten cpp/ tree carries no rnexecutorch namespace and no model classes,
  # so the frame processor is still on the legacy C++ API and has to move before
  # legacy/ is dropped. third-party/include covers the executorch headers they
  # pull in; nothing in the closure needs the cpuinfo, pthreadpool or tokenizer
  # paths the core pod also lists.
  #
  # Resolve the core package via Node from the podspec dir so it works under any
  # layout (hoisted, monorepo, or app-local node_modules).
  rne_pkg = `node --print "require.resolve('react-native-executorch/package.json', { paths: ['#{__dir__}'] })"`.strip
  rne_path = File.dirname(rne_pkg)

  s.pod_target_xcconfig = {
    "USE_HEADERMAP" => "YES",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    "HEADER_SEARCH_PATHS" => "\"#{rne_path}/legacy/cpp\" \"#{rne_path}/third-party/include\"",
    # ExecuTorch ships no simulator x86_64 slice, so the core pod drops that
    # arch. A dependent that keeps it has nothing to link against.
    "EXCLUDED_ARCHS[sdk=iphonesimulator*]" => "x86_64"
  }

  s.dependency "React-Core"
  s.dependency "react-native-executorch"
  s.dependency "opencv-rne", "~> 4.11.0"
  s.dependency "FishjamReactNativeWebrtc"

  install_modules_dependencies(s)
end
