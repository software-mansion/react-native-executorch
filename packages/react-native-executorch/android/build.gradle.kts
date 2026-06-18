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

android {
    namespace = "com.swmansion.rnexecutorch"
    compileSdk = (getExtOrDefault("compileSdkVersion", 34) as Number).toInt()

    defaultConfig {
        minSdk = (getExtOrDefault("minSdkVersion", 21) as Number).toInt()
        targetSdk = (getExtOrDefault("targetSdkVersion", 34) as Number).toInt()

        externalNativeBuild {
            cmake {
                cppFlags("-fexceptions", "-frtti", "-std=c++20", "-Wall")
                arguments("-DANDROID_STL=c++_shared")
                
                // CRITICAL: Only include ABIs you actually have binaries for
                // Since you only have arm64-v8a in third-party, we pin it here.
                abiFilters.add("arm64-v8a")
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
            // Pointing to your centralized third-party binaries
            jniLibs.srcDirs("../third-party/android/jniLibs")
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

    // The ExecuTorch Java/Kotlin wrapper from your third-party folder
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