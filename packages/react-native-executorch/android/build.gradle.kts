import groovy.json.JsonSlurper

plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("com.facebook.react")
}

/**
 * Helper function to get variables from the root project (App level)
 * or fall back to local project properties.
 */
fun getExtOrDefault(name: String, default: Any): Any {
    return if (rootProject.ext.has(name)) {
        rootProject.ext.get(name)!!
    } else if (project.properties.containsKey(name)) {
        project.properties[name]!!
    } else {
        default
    }
}

/**
 * Reads the build config written by the postinstall script
 * (scripts/download-libs.js). Falls back to enabling everything if the file is
 * missing (e.g. native libs provisioned manually, or CI with pre-cached libs).
 */
fun rneBuildConfig(): Map<*, *> {
    val defaults = mapOf(
        "enableOpencv" to true,
        "enablePhonemis" to true,
        "enableXnnpack" to true,
        "enableVulkan" to true
    )
    val configFile = file("../rne-build-config.json")
    if (!configFile.exists()) return defaults
    return try {
        JsonSlurper().parse(configFile) as Map<*, *>
    } catch (e: Exception) {
        logger.warn("[RnExecutorch] Failed to parse rne-build-config.json: ${e.message}. Defaulting to all features enabled.")
        defaults
    }
}

val rneConfig = rneBuildConfig()
fun rneFlag(key: String): String = if (rneConfig[key] != false) "ON" else "OFF"

/**
 * ExecuTorch only supports these ABIs. Honor the app's `reactNativeArchitectures`
 * (e.g. Expo passes `-PreactNativeArchitectures=arm64-v8a` for device builds) so
 * we only build/provision the ABIs the app actually needs; default to both.
 */
fun reactNativeArchitectures(): List<String> {
    val supported = listOf("arm64-v8a", "x86_64")
    val value = rootProject.findProperty("reactNativeArchitectures") as String?
    return value?.split(",")?.map { it.trim() }?.filter { it in supported }
        ?.takeIf { it.isNotEmpty() } ?: supported
}

android {
    namespace = "com.swmansion.rnexecutorch"
    compileSdk = (getExtOrDefault("compileSdkVersion", 34) as Number).toInt()

    defaultConfig {
        minSdk = (getExtOrDefault("minSdkVersion", 21) as Number).toInt()
        targetSdk = (getExtOrDefault("targetSdkVersion", 34) as Number).toInt()

        externalNativeBuild {
            cmake {
                cppFlags("-fexceptions", "-frtti", "-std=c++20", "-Wall")
                arguments(
                    "-DANDROID_STL=c++_shared",
                    "-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON",
                    "-DRNE_ENABLE_OPENCV=${rneFlag("enableOpencv")}",
                    "-DRNE_ENABLE_PHONEMIS=${rneFlag("enablePhonemis")}",
                    "-DRNE_ENABLE_XNNPACK=${rneFlag("enableXnnpack")}",
                    "-DRNE_ENABLE_VULKAN=${rneFlag("enableVulkan")}"
                )

                abiFilters.addAll(reactNativeArchitectures())
            }
        }
    }

    externalNativeBuild {
        cmake {
            path = file("CMakeLists.txt")
        }
    }

    sourceSets {
        getByName("main") {
            // Prebuilt executorch + backend .so live under
            // third-party/android/libs/executorch/<abi>/. Pointing jniLibs here
            // makes Gradle package them (libexecutorch.so + the enabled
            // lib*_executorch_backend.so) into the APK alongside our own .so.
            jniLibs.srcDirs("../third-party/android/libs/executorch")
            // Include generated codegen if using TurboModules
            java.srcDirs("${project.buildDir}/generated/source/codegen/java")
        }
    }

    buildFeatures {
        buildConfig = true
        prefab = true // Required for modern C++ / JNI linking
    }

    packaging {
        // Prevents "Duplicate Library" errors with the React Native JSI engine
        resources.excludes.add("**/libjsi.so")
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

repositories {
    google()
    mavenCentral()
}

dependencies {
    // React Native Android Engine
    implementation("com.facebook.react:react-android")

    // The ExecuTorch Java API (ABI-independent). Downloaded (not committed) — it
    // rides in the core-android-arm64-v8a artifact, extracted by download-libs.js
    // to third-party/android/libs/executorch.jar.
    implementation(files("../third-party/android/libs/executorch.jar"))

    // Recommended for modern Kotlin Android development
    implementation("androidx.core:core-ktx:1.12.0")
}

// React Native Codegen Configuration
extensions.configure<com.facebook.react.ReactExtension>("react") {
    jsRootDir = file("../src/")
    libraryName = "RnExecutorch"
    codegenJavaPackageName = "com.swmansion.rnexecutorch"
}
