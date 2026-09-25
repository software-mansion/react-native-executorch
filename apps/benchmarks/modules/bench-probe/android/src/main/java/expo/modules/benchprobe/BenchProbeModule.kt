package expo.modules.benchprobe

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import android.os.Debug
import android.os.PowerManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BenchProbeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BenchProbe")

    // Synchronous by design: the sampler polls this from the JS thread while
    // inference runs on the worklet thread, and a promise hop per sample would
    // add more jitter than the read itself costs.
    //
    // Total PSS walks /proc/self/smaps, so it is the expensive one (single-digit
    // milliseconds). It is also the only counter that sees the pages a
    // memory-mapped .pte actually has resident, which is most of a model's
    // footprint — hence the sampler's default 100 ms interval rather than
    // something tighter.
    Function("memoryFootprintBytes") {
      val info = Debug.MemoryInfo()
      Debug.getMemoryInfo(info)
      info.totalPss.toDouble() * 1024.0
    }

    Function("nativeHeapBytes") {
      Debug.getNativeHeapAllocatedSize().toDouble()
    }

    // Thermal state decides whether two runs are comparable at all. Running a
    // suite immediately after another one made every raw-execute metric 9% to
    // 51% slower (median 22%) with no code change, purely because the phone had
    // not cooled down. Without this the harness reports that as a regression.
    //
    // `getCurrentThermalStatus` needs API 29; below that the battery
    // temperature is the only signal available.
    Function("thermalState") {
      val powerManager =
        appContext.reactContext?.getSystemService(Context.POWER_SERVICE) as? PowerManager
      val status =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && powerManager != null) {
          powerManager.currentThermalStatus
        } else {
          -1
        }

      // Sticky broadcast, so this returns immediately without registering.
      val battery = appContext.reactContext?.registerReceiver(
        null,
        IntentFilter(Intent.ACTION_BATTERY_CHANGED)
      )
      val tenthsOfCelsius = battery?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, -1) ?: -1

      mapOf(
        "status" to status,
        "statusName" to when (status) {
          0 -> "none"
          1 -> "light"
          2 -> "moderate"
          3 -> "severe"
          4 -> "critical"
          5 -> "emergency"
          6 -> "shutdown"
          else -> "unknown"
        },
        "batteryTemperatureC" to if (tenthsOfCelsius > 0) tenthsOfCelsius / 10.0 else -1.0
      )
    }

    Function("deviceInfo") {
      val activityManager =
        appContext.reactContext?.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
      val memoryInfo = ActivityManager.MemoryInfo().also { activityManager?.getMemoryInfo(it) }

      mapOf(
        "model" to Build.MODEL,
        "osVersion" to Build.VERSION.RELEASE,
        "soc" to if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) Build.SOC_MODEL else "",
        // Emulator images report a generic/google build fingerprint; the ABI
        // check alone would miss an arm64 emulator on an Apple Silicon host.
        "isEmulator" to (Build.FINGERPRINT.startsWith("generic") ||
          Build.FINGERPRINT.contains("vbox") ||
          Build.FINGERPRINT.contains("emulator") ||
          Build.MODEL.contains("Emulator") ||
          Build.MODEL.contains("Android SDK built for")),
        "cpuCores" to Runtime.getRuntime().availableProcessors(),
        "totalMemoryBytes" to memoryInfo.totalMem.toDouble()
      )
    }
  }
}
