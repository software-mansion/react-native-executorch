Pod::Spec.new do |s|
  s.name           = 'BenchProbe'
  s.version        = '1.0.0'
  s.summary        = 'Process memory and host metadata probe for the benchmark harness'
  s.description    = 'Reads task_vm_info.phys_footprint and device identifiers for react-native-executorch benchmarks.'
  s.author         = 'Software Mansion'
  s.homepage       = 'https://docs.swmansion.com/react-native-executorch'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
