/**
 * The attributes the iOS podspec actually assigns, per build config.
 *
 * `react-native-executorch.podspec` is Ruby, and `pod install` is the only
 * thing that ever runs it. Nothing in JS CI evaluates it, so a misplaced `end`
 * type-checks, lints, spell-checks and reviews clean, then reaches users as a
 * link error in an app we never built ourselves. That is exactly what happened
 * in #1450: the `if enable_opencv` guard around the OpenCV pod selection was
 * left open until the bottom of the spec, so an app that turned OpenCV off got
 * a pod with no `HEADER_SEARCH_PATHS`, no `static_framework` and no
 * `ExecutorchLib.xcframework`.
 *
 * The config matrix is the part that rots: `rne-build-config.json` is written
 * by the postinstall hook from the consumer's `package.json` config block, and
 * our own example apps all take one row of it. Every other row only exists on
 * a user's machine.
 *
 * So this suite evaluates the real podspec under a stubbed `Pod::Spec` and
 * asserts on what it assigned. The stub records attribute names rather than
 * modelling CocoaPods: what breaks is an attribute going missing, not its
 * value being subtly wrong.
 */
import { execFileSync } from 'child_process';
import { join } from 'path';

const PACKAGE_ROOT = join(__dirname, '..', '..');

/**
 * Evaluates the podspec with `rne-build-config.json` faked to `config`, or
 * absent when `config` is `null`.
 *
 * `File.exist?` and `File.read` are intercepted for that one path instead of
 * writing the file: a developer's real config sits there, and a test suite
 * must not overwrite it. The vendored-artifact guard is satisfied the same
 * way, through `File.directory?`, so the suite runs on a checkout that never
 * downloaded the native libs (which CI is).
 */
interface PodspecEvaluation {
  assigned: string[];
  userTargetXcconfig: Record<string, string>;
}

function evaluatePodspec(config: Record<string, boolean> | null): PodspecEvaluation {
  // Ruby 2.6 syntax throughout: that is the system Ruby on macOS, and the one
  // a contributor who has never installed a newer one runs CocoaPods with.
  const harness = `
    require "json"

    $assigned = []
    $user_target_xcconfig = {}
    # nil stands for "the postinstall hook never wrote one".
    $config_json = ARGV[0] == "" ? nil : ARGV[0]

    module StubbedPaths
      CONFIG_FILE = "rne-build-config.json".freeze

      def exist?(path)
        path.to_s.end_with?(CONFIG_FILE) ? !$config_json.nil? : super
      end

      def read(path, *args)
        path.to_s.end_with?(CONFIG_FILE) ? $config_json : super
      end

      # Stands in for the artifacts the postinstall hook downloads; their
      # absence is a separate check, covered by nativeLibsConfig.test.ts.
      def directory?(path)
        path.to_s.include?("third-party/ios") ? true : super
      end
    end
    File.singleton_class.prepend(StubbedPaths)

    module Pod
      Informative = Class.new(StandardError)

      class Spec
        def self.new
          spec = allocate
          yield spec
          spec
        end

        # Attribute writers arrive here as :name=. The platform proxies
        # (s.ios.vendored_frameworks = ...) return self, so the chained
        # assignment is recorded under its own name too.
        def method_missing(name, *args)
          attr_name = name.to_s.sub(/=$/, "")
          $assigned << attr_name
          if attr_name == "user_target_xcconfig" && args.first.is_a?(Hash)
            $user_target_xcconfig = args.first
          end
          self
        end

        def respond_to_missing?(*)
          true
        end

        def ios
          self
        end
      end
    end

    # Provided by react_native_pods.rb, a CocoaPods-time dependency.
    def install_modules_dependencies(spec); end

    Dir.chdir(${JSON.stringify(PACKAGE_ROOT)}) do
      eval(File.read("react-native-executorch.podspec"), TOPLEVEL_BINDING, "podspec")
    end
    puts JSON.dump({ assigned: $assigned.uniq, userTargetXcconfig: $user_target_xcconfig })
  `;

  let output: string;
  try {
    output = execFileSync('ruby', ['-e', harness, config === null ? '' : JSON.stringify(config)], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const details = error instanceof Error ? (error as { stderr?: string }).stderr : undefined;
    throw new Error(
      `evaluating the podspec with ${JSON.stringify(config)} failed.\n` +
        `A Ruby error here is a real podspec defect: this is what \`pod install\` runs.\n` +
        `${details ?? String(error)}`
    );
  }
  return JSON.parse(output.trim()) as PodspecEvaluation;
}

function assignedAttributes(config: Record<string, boolean> | null): string[] {
  return evaluatePodspec(config).assigned;
}

/**
 * Attributes that decide whether the pod compiles and links at all, so none of
 * them may depend on a feature flag. `pod_target_xcconfig` carries every
 * `HEADER_SEARCH_PATHS` entry, and `vendored_frameworks` carries ExecuTorch
 * itself.
 */
const UNCONDITIONAL_ATTRIBUTES = [
  'source_files',
  'public_header_files',
  'pod_target_xcconfig',
  'user_target_xcconfig',
  'static_framework',
  'vendored_frameworks',
  'libraries',
  'frameworks',
];

/**
 * One row per independently toggleable native library, plus the two shapes a
 * default install takes. `enableOpencv: false` is the row #1450 broke, and
 * `null` is the branch where it left `rne_build_config` unassigned, so reading
 * `opencvPod` from it raised `NoMethodError` for nil.
 */
const CONFIGS: Record<string, Record<string, boolean> | null> = {
  'no config file (manual provisioning)': null,
  'empty config (every feature on)': {},
  'opencv off': { enableOpencv: false },
  'phonemis off': { enablePhonemis: false },
  'xnnpack off': { enableXnnpack: false },
  'coreml off': { enableCoreml: false },
  'mlx off': { enableMlx: false },
  'every optional library off': {
    enableOpencv: false,
    enablePhonemis: false,
    enableXnnpack: false,
    enableCoreml: false,
    enableMlx: false,
  },
};

describe('podspec attributes', () => {
  describe.each(Object.entries(CONFIGS))('with %s', (_label, config) => {
    it('evaluates and assigns every attribute the build depends on', () => {
      const assigned = assignedAttributes(config);
      const missing = UNCONDITIONAL_ATTRIBUTES.filter((name) => !assigned.includes(name));

      // A name here means the attribute sits inside a conditional it does not
      // belong in. The pod still installs; the app fails to compile or link.
      expect(missing).toEqual([]);
    });
  });

  describe('user_target_xcconfig linker flags', () => {
    it('routes SDK-conditional flags through RNE_OTHER_LDFLAGS and plain OTHER_LDFLAGS to avoid CocoaPods merge conflicts (#1503)', () => {
      const { userTargetXcconfig } = evaluatePodspec({});

      // Singular keys with conditional SDKs conflict across pods in CocoaPods (issue #1503).
      // They must never be set directly on OTHER_LDFLAGS[...].
      expect(userTargetXcconfig['OTHER_LDFLAGS[sdk=iphoneos*]']).toBeUndefined();
      expect(userTargetXcconfig['OTHER_LDFLAGS[sdk=iphonesimulator*]']).toBeUndefined();

      // Plain OTHER_LDFLAGS is a plural setting merged across pods.
      expect(userTargetXcconfig.OTHER_LDFLAGS).toBe('$(inherited) $(RNE_OTHER_LDFLAGS)');

      // SDK-specific flags are assigned to the pod-scoped variable:
      expect(userTargetXcconfig['RNE_OTHER_LDFLAGS[sdk=iphoneos*]']).toBeDefined();
      expect(userTargetXcconfig['RNE_OTHER_LDFLAGS[sdk=iphonesimulator*]']).toBeDefined();
      expect(userTargetXcconfig['RNE_OTHER_LDFLAGS[sdk=iphoneos*]']).toContain(
        'libthreadpool_ios.a'
      );
      expect(userTargetXcconfig['RNE_OTHER_LDFLAGS[sdk=iphonesimulator*]']).toContain(
        'libthreadpool_simulator.a'
      );
      expect(userTargetXcconfig['RNE_OTHER_LDFLAGS[sdk=iphoneos*]']).toContain(
        'libXnnpackBackend.a'
      );
      expect(userTargetXcconfig['RNE_OTHER_LDFLAGS[sdk=iphonesimulator*]']).toContain(
        'libXnnpackBackend.a'
      );
      expect(userTargetXcconfig['RNE_OTHER_LDFLAGS[sdk=iphoneos*]']).toContain(
        'libCoreMLBackend.a'
      );
      expect(userTargetXcconfig['RNE_OTHER_LDFLAGS[sdk=iphonesimulator*]']).toContain(
        'libCoreMLBackend.a'
      );
      expect(userTargetXcconfig['RNE_OTHER_LDFLAGS[sdk=iphoneos*]']).toContain('libMLXBackend.a');
      // Simulator does not link MLX:
      expect(userTargetXcconfig['RNE_OTHER_LDFLAGS[sdk=iphonesimulator*]']).not.toContain(
        'libMLXBackend.a'
      );
    });

    it('omits disabled backends from RNE_OTHER_LDFLAGS', () => {
      const { userTargetXcconfig } = evaluatePodspec({
        enableXnnpack: false,
        enableCoreml: false,
        enableMlx: false,
      });

      expect(userTargetXcconfig['RNE_OTHER_LDFLAGS[sdk=iphoneos*]']).not.toContain(
        'libXnnpackBackend.a'
      );
      expect(userTargetXcconfig['RNE_OTHER_LDFLAGS[sdk=iphonesimulator*]']).not.toContain(
        'libXnnpackBackend.a'
      );
      expect(userTargetXcconfig['RNE_OTHER_LDFLAGS[sdk=iphoneos*]']).not.toContain(
        'libCoreMLBackend.a'
      );
      expect(userTargetXcconfig['RNE_OTHER_LDFLAGS[sdk=iphonesimulator*]']).not.toContain(
        'libCoreMLBackend.a'
      );
      expect(userTargetXcconfig['RNE_OTHER_LDFLAGS[sdk=iphoneos*]']).not.toContain(
        'libMLXBackend.a'
      );
    });
  });
});
