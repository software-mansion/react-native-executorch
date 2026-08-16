import ExpoModulesCore
import UIKit

public class BenchProbeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("BenchProbe")

    // Synchronous by design: the sampler polls this from the JS thread while
    // inference runs on the worklet thread, and a promise hop per sample would
    // add more jitter than the read itself costs.
    Function("memoryFootprintBytes") { () -> Double in
      var info = task_vm_info_data_t()
      var count = mach_msg_type_number_t(
        MemoryLayout<task_vm_info_data_t>.size / MemoryLayout<natural_t>.size)

      let result = withUnsafeMutablePointer(to: &info) { pointer in
        pointer.withMemoryRebound(to: integer_t.self, capacity: Int(count)) { rebound in
          task_info(mach_task_self_, task_flavor_t(TASK_VM_INFO), rebound, &count)
        }
      }

      // phys_footprint is what jetsam measures an app against, so it is the
      // number that decides whether a model fits on a device.
      return result == KERN_SUCCESS ? Double(info.phys_footprint) : -1
    }

    // No public API exposes the malloc-zone total separately from the footprint
    // on iOS, so the two agree here. Android is where they diverge.
    Function("nativeHeapBytes") { () -> Double in
      var info = mach_task_basic_info()
      var count = mach_msg_type_number_t(
        MemoryLayout<mach_task_basic_info>.size / MemoryLayout<natural_t>.size)

      let result = withUnsafeMutablePointer(to: &info) { pointer in
        pointer.withMemoryRebound(to: integer_t.self, capacity: Int(count)) { rebound in
          task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), rebound, &count)
        }
      }

      return result == KERN_SUCCESS ? Double(info.resident_size) : -1
    }

    Function("deviceInfo") { () -> [String: Any] in
      var systemInfo = utsname()
      uname(&systemInfo)
      let identifier = withUnsafePointer(to: &systemInfo.machine) { pointer in
        pointer.withMemoryRebound(to: CChar.self, capacity: 1) { String(cString: $0) }
      }

      // On a simulator `utsname.machine` is the host Mac's architecture, so the
      // real device identity comes from the environment instead.
      let simulatorModel = ProcessInfo.processInfo.environment["SIMULATOR_MODEL_IDENTIFIER"]

      return [
        "model": simulatorModel ?? identifier,
        "osVersion": UIDevice.current.systemVersion,
        "soc": identifier,
        "isEmulator": simulatorModel != nil,
        "cpuCores": ProcessInfo.processInfo.processorCount,
        "totalMemoryBytes": Double(ProcessInfo.processInfo.physicalMemory),
      ]
    }
  }
}
