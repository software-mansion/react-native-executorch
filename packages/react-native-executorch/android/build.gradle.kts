import groovy.json.JsonSlurper

plugins {
    id("com.android.library")
    // Kept on the classpath but not applied here: AGP 9 ships built-in Kotlin
    // support and registers the `kotlin` extension itself, so applying the
    // Kotlin plugin on top fails with "Cannot add extension with name
    // 'kotlin'". Applied conditionally below instead.
    id("org.jetbrains.kotlin.android") apply false
    id("com.facebook.react")
}

if (project.extensions.findByName("kotlin") == null) {
    apply(plugin = "org.jetbrains.kotlin.android")
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
 * The prebuilt ExecuTorch runtime is not in the npm tarball - `package.json`
 * excludes it and `scripts/download-libs.js` fetches it from the matching
 * GitHub release in a postinstall hook. When a package manager skips that hook
 * the install still looks clean and the failure surfaces much later, out of
 * CMake, blamed on a missing library rather than on the install. Fail here with
 * the fix instead.
 */
fun requireNativeArtifacts() {
    val libsDir = file("../third-party/android/libs/executorch")
    val present = libsDir.listFiles()
        ?.filter { it.isDirectory && it.resolve("libexecutorch.so").exists() }
        .orEmpty()
    if (present.isNotEmpty()) return

    throw GradleException(
        """
        react-native-executorch is missing its native artifacts:

          ${libsDir.absolutePath}

        They are downloaded by this package's postinstall hook, which your
        package manager did not run. pnpm 10 and later block dependency build
        scripts by default ("Ignored build scripts"), and so do
        `--ignore-scripts` and `npm ci --ignore-scripts`. Re-run the hook:

          pnpm approve-builds react-native-executorch   # pnpm
          npm rebuild react-native-executorch           # npm
          node node_modules/react-native-executorch/scripts/download-libs.js

        If you provision the libraries yourself, put them under
        third-party/android/libs/executorch/<abi>/ before building.
        """.trimIndent()
    )
}

requireNativeArtifacts()

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
        consumerProguardFiles("consumer-proguard-rules.pro")

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

    // No `kotlinOptions` block: its type-safe accessor is generated only when
    // the Kotlin plugin is applied from the `plugins` block, which it no longer
    // always is. Both AGP 8 and AGP 9 take the Kotlin jvmTarget from
    // `compileOptions` above; verified to emit Java 17 bytecode on AGP 8.13.2
    // and AGP 9.4.0.
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
