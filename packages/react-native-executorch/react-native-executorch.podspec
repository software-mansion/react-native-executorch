require "fileutils"
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

# The native artifacts are not in the npm tarball - `package.json` excludes
# them and `scripts/download-libs.js` fetches them from the matching GitHub
# release in a postinstall hook. When a package manager skips that hook the
# install still looks clean, and so does `pod install`: CocoaPods never checks
# that a vendored framework exists. The build then fails minutes later with
#
#   error: Build input files cannot be found:
#   '.../XnnpackBackend.xcframework/ios-arm64-simulator/libXnnpackBackend.a'
#
# which names neither the cause nor the fix. Fail here instead, while the user
# is still looking at the install that caused it.
required_artifacts = { "ExecutorchLib.xcframework" => true }
required_artifacts["XnnpackBackend.xcframework"] = enable_xnnpack
required_artifacts["CoreMLBackend.xcframework"]  = enable_coreml
required_artifacts["MLXBackend.xcframework"]     = enable_mlx

missing = required_artifacts
  .select { |_, required| required }
  .keys
  .map    { |name| File.join(__dir__, "third-party/ios", name) }
  .reject { |path| File.directory?(path) }

unless missing.empty?
  # Pod::Informative renders as a plain `[!]` message rather than a backtrace.
  raise(defined?(Pod::Informative) ? Pod::Informative : StandardError, <<~MESSAGE)
    react-native-executorch is missing its native artifacts:

    #{missing.map { |path| "  #{path}" }.join("\n")}

    They are downloaded by this package's postinstall hook, which your package
    manager did not run. pnpm 10 and later block dependency build scripts by
    default ("Ignored build scripts"), and so do `--ignore-scripts` and
    `npm ci --ignore-scripts`. Re-run the hook, then `pod install` again:

      pnpm approve-builds react-native-executorch   # pnpm
      npm rebuild react-native-executorch           # npm
      node node_modules/react-native-executorch/scripts/download-libs.js

    If you provision the libraries yourself, put them under
    third-party/ios/ before installing pods.
  MESSAGE
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
  # These paths feed `-force_load` entries in OTHER_LDFLAGS, which are applied at
  # the CONSUMING app target's link step. `$(PODS_TARGET_SRCROOT)` is a pod-scoped
  # build variable — undefined in the app target — so it would expand to empty and
  # produce `/third-party/ios/.../lib*.a` (build-input-not-found). Bake the absolute
  # path at podspec-eval time via __dir__ instead. (HEADER_SEARCH_PATHS below stay
  # on $(PODS_TARGET_SRCROOT): those are the pod's own compile settings, where it
  # resolves correctly.)
  executorch_binaries_path = "#{__dir__}/third-party/ios/libs/executorch"

  # --- Sources ---
  # OpenCV-dependent sources live under the cv extension. When more tasks land
  # that need opencv (e.g. the multimodal-LLM vision encoder under nlp), add
  # their paths to this list so they are excluded together when opencv is off.
  opencv_source_files = [
    "cpp/extensions/cv/**/*.{cpp,c,h,hpp}",
  ]

  # phonemis is built from in-tree source (third-party/common/phonemis submodule);
  # its runner entrypoint is excluded so only the library sources compile.
  phonemis_source_files = [
    "cpp/extensions/speech/phonemizer.{cpp,h}",
    "third-party/common/phonemis/src/**/*.{cpp,hpp,h}",
  ]

  source_files = [
    "ios/**/*.{h,m,mm}",
    "cpp/**/*.{cpp,c,h,hpp}",
  ]
  # ==============================================================================
  # LEGACY SUPPORT: include legacy sources (Remove when react-native-executorch/legacy is dropped)
  # ==============================================================================
  source_files += [
    "legacy/ios/**/*.{h,m,mm}",
    "legacy/cpp/**/*.{cpp,c,h,hpp}",
  ]
  # ==============================================================================
  source_files += phonemis_source_files if enable_phonemis
  s.source_files = source_files

  # cpp/tests holds the host GoogleTest suites, built by cpp/tests/CMakeLists.txt
  # and never by the app: `cpp/**` above sweeps them in, and the pod carries no
  # googletest headers, so an app build fails on <gmock/gmock.h>.
  exclude_files = [
    "third-party/common/phonemis/src/phonemis/main.cpp",
    "cpp/tests/**/*",
  ]
  # ==============================================================================
  # LEGACY SUPPORT: exclude legacy tests and preserve jsi headers
  # (Remove when react-native-executorch/legacy is dropped)
  # ==============================================================================
  exclude_files += [
    "legacy/cpp/rnexecutorch/tests/**/*",
    "legacy/cpp/rnexecutorch/jsi/*.{h,hpp}",
  ]
  s.preserve_paths = "legacy/cpp/rnexecutorch/jsi/*.{h,hpp}"
  # ==============================================================================
  exclude_files += opencv_source_files unless enable_opencv
  exclude_files += phonemis_source_files unless enable_phonemis
  s.exclude_files = exclude_files

  # --- Public headers ---
  # `use_frameworks!` - set directly for Firebase, or through
  # expo-build-properties' `useFrameworks: "static"` - makes CocoaPods build
  # this pod as a framework, and Xcode's Headers build phase copies every
  # *public* header into one flat `Headers/` directory. With no
  # `public_header_files` every header in `source_files` is public, and the
  # tree has 21 basenames that occur more than once (`Types.h` in eleven task
  # directories, `constants.h` in thirteen phonemis ones), so the build fails
  # at planning with `Multiple commands produce .../Headers/Types.h` before a
  # single file compiles. See discussion #203.
  #
  # Only the Objective-C entry points have to be visible to the app. The C++
  # headers are reached through the HEADER_SEARCH_PATHS below, so narrowing the
  # public set costs nothing, and `__tests__/api/podspecPublicHeaders.test.ts`
  # keeps it collision-free.
  public_header_files = [
    "ios/**/*.h",
  ]
  # ==============================================================================
  # LEGACY SUPPORT: include the legacy entry point
  # (Remove when react-native-executorch/legacy is dropped)
  # ==============================================================================
  public_header_files += [
    "legacy/ios/**/*.h",
  ]
  # ==============================================================================
  s.public_header_files = public_header_files

  # --- Preprocessor flags ---
  extra_compiler_flags = []
  extra_compiler_flags << "-DRNE_ENABLE_OPENCV"   if enable_opencv
  # ET_ON lets phonemis detect the available ExecuTorch build (NeuralPhonemizer).
  extra_compiler_flags += ["-DRNE_ENABLE_PHONEMIS", "-DET_ON"] if enable_phonemis
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

  xnnpack_xcframework_path = "#{__dir__}/third-party/ios/XnnpackBackend.xcframework"
  coreml_xcframework_path  = "#{__dir__}/third-party/ios/CoreMLBackend.xcframework"
  mlx_xcframework_path     = "#{__dir__}/third-party/ios/MLXBackend.xcframework"

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

  # iOS OpenCV is provided by a CocoaPod (not a downloaded tarball), normally
  # our own opencv-rne.
  #
  # An app can already carry OpenCV through another library, and CocoaPods
  # refuses to install two vendored frameworks with the same name:
  #
  #   [!] The 'Pods-YourApp' target has frameworks with conflicting names:
  #   opencv2.xcframework
  #
  # react-native-fast-opencv is the one this happens with, and wanting both is
  # reasonable: our inference API with their image transformations. So when it
  # is installed alongside us we depend on the pod it vendors instead of our
  # own, which leaves exactly one opencv2 in the project. We only use
  # `opencv2/core.hpp` and `opencv2/imgproc.hpp`, so any OpenCV 4.x build
  # serves. Set "opencvPod" in the package.json config block to override the
  # choice in either direction.
  external_opencv = false
  if enable_opencv
    detected_opencv_pod =
      if Dir.exist?(File.join(__dir__, "..", "react-native-fast-opencv"))
        "FastOpenCV-iOS"
      else
        "opencv-rne"
      end
    opencv_pod = rne_build_config["opencvPod"] || detected_opencv_pod

    if opencv_pod == "opencv-rne"
      s.dependency "opencv-rne", "~> 4.11.0"
    else
      Pod::UI.puts "[react-native-executorch] using #{opencv_pod} for OpenCV " \
                   "instead of opencv-rne, so the project holds one opencv2" if defined?(Pod::UI)
      s.dependency opencv_pod
      external_opencv = true
    end

  # Our own OpenCV headers ship under third-party/include and are newer than
  # what another OpenCV pod vendors: react-native-fast-opencv carries 4.9, and
  # compiling against ours while linking against theirs fails at link time on
  # any signature that moved since (cvtColor gained an AlgorithmHint parameter
  # in 4.10). Whoever provides the binary has to provide the headers, so with
  # an external OpenCV the include root becomes a mirror of ours with opencv2
  # left out, and `#include <opencv2/...>` resolves through their framework.
  mirror_without_opencv = lambda do
    source = File.join(__dir__, "third-party/include")
    mirror = File.join(__dir__, "third-party/include-external-opencv")
    FileUtils.rm_rf(mirror)
    FileUtils.mkdir_p(mirror)
    Dir.children(source).each do |entry|
      next if entry == "opencv2"
      FileUtils.ln_s(File.join(source, entry), File.join(mirror, entry))
    end
    "third-party/include-external-opencv"
  end

  third_party_include =
    external_opencv ? mirror_without_opencv.call : "third-party/include"

  s.pod_target_xcconfig = {
    "USE_HEADERMAP" => "YES",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    "OTHER_CPLUSPLUSFLAGS" => extra_compiler_flags.join(' '),
    "GCC_PREPROCESSOR_DEFINITIONS" => [
      "$(inherited)",
      "EXECUTORCH_ENABLE_EXECUTION_PROFILING=1",
    ].join(' '),
    "HEADER_SEARCH_PATHS" => [
      "\"$(PODS_TARGET_SRCROOT)/cpp\"",
      # ==============================================================================
      # LEGACY SUPPORT: legacy header search path (Remove when react-native-executorch/legacy is dropped)
      # ==============================================================================
      "\"$(PODS_TARGET_SRCROOT)/legacy/cpp\"",
      # ==============================================================================
      "\"$(PODS_TARGET_SRCROOT)/#{third_party_include}\"",
      "\"$(PODS_TARGET_SRCROOT)/third-party/include/cpuinfo\"",
      "\"$(PODS_TARGET_SRCROOT)/third-party/include/pthreadpool\"",
      "\"$(PODS_TARGET_SRCROOT)/third-party/include/executorch/extension/llm/tokenizers/include\"",
      "\"$(PODS_TARGET_SRCROOT)/third-party/include/executorch/extension/llm/tokenizers/third-party/json/include\"",
      "\"$(PODS_TARGET_SRCROOT)/third-party/include/executorch/extension/llm/tokenizers/third-party/re2\"",
      "\"$(PODS_TARGET_SRCROOT)/third-party/include/executorch/extension/llm/tokenizers/third-party/abseil-cpp\"",
      "\"$(PODS_TARGET_SRCROOT)/third-party/common/phonemis/src\"",
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

  # An app that turns on `use_frameworks!` without naming a linkage gets the
  # default, dynamic - which is what Firebase's own setup instructions show.
  # CocoaPods then refuses to install at all, because a dynamic framework may
  # not carry statically linked binaries and opencv-rne vendors one:
  #
  #   [!] The 'Pods-YourApp' target has transitive dependencies that include
  #   statically linked binaries: (.../opencv-rne/opencv2.xcframework)
  #
  # Declaring the pod a static framework resolves that without the app having
  # to spell out `:linkage => :static`, and is inert when the pod is built as a
  # static library, which is what happens with no `use_frameworks!` at all.
  s.static_framework = true

  # Backend xcframeworks are linked via force_load in OTHER_LDFLAGS (needed to
  # preserve __attribute__((constructor)) backend registrations). Only
  # ExecutorchLib goes in vendored_frameworks to avoid duplicate symbol errors.
  s.ios.vendored_frameworks = ["third-party/ios/ExecutorchLib.xcframework"]

  end

  install_modules_dependencies(s)
end
