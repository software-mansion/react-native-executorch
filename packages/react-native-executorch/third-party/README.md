# third-party

Native ExecuTorch binaries and headers are **not** committed to this branch.

The core package's `android/CMakeLists.txt` and `react-native-executorch.podspec`
expect ExecuTorch artifacts under this directory:

- `include/` — ExecuTorch + c10 + torch headers
- `android/jniLibs/<abi>/libexecutorch.so`, `android/libs/executorch.jar`
- `ios/Frameworks/ExecutorchLib.xcframework`

For now these can be obtained from the PoC's `third-party/` directory:
https://github.com/barhanc/rnet-poc/tree/main/third-party

These must be provisioned before an on-device native build. Wiring this into the
repo's on-demand artifact mechanism is tracked as a follow-up (see #1208). CI does
not require them — it builds and type-checks the TypeScript only.

The `common/phonemis` git submodule is retained for later use (TTS phonemizer);
run `git submodule update --init` to fetch it.
