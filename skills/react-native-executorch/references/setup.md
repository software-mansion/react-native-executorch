# Setup, downloads and lifetime

These examples target 0.11.x. Select the matching documentation as described in `SKILL.md`.

## Installation

Read the installed package's peer dependencies and the matching Getting Started/Compatibility pages.
For 0.11.x the documented baseline is New Architecture, React Native 0.83+ (or a compatible Expo SDK
with a development build), iOS 17+, and `react-native-worklets >=0.10.0 <0.14.0`. Verify Android's API
floor against the installed native build configuration: API 26 is Android 8.0, not Android 13. Backend,
ABI and hardware requirements can be stricter than the OS floor.

Use the application's package manager. A typical installation is:

```bash
npm install react-native-executorch react-native-worklets react-native-blob-util
```

Resolve peer versions with existing worklets/Reanimated dependencies. Expo's recommended bundled
worklets version may be older than this library requires; do not force an incompatible pair or blindly
accept `expo install`'s choice. Consult the release's compatibility table.

Put `react-native-worklets/plugin` last in Babel's `plugins`, using the app's existing preset. Reset
Metro after Babel changes. Expo Go cannot load these custom native libraries: create/rebuild a
development app. Bare iOS apps need the correct deployment target and pods. Rebuild the native app
after changing native dependencies or backend selection; reloading JavaScript is insufficient.

The package's postinstall provisions native binaries. If the package manager suppresses lifecycle
scripts, follow the library's documented provisioning steps for that release. Do not disable script
policies globally or assume reinstalling JS rebuilt the app.

## Choosing native libraries

The default install includes the available native libraries. An application's `react-native-executorch`
package.json block can select `features`, `backends` and `libs` to reduce them. For custom `.pte` files,
include the backend and operators actually required by the export; selecting a named feature does not
make every arbitrary custom model compatible. Follow the release's Native Libraries page.

## Downloads and input paths

- Hooks download remote assets recursively through the config, cache them persistently and resolve
  local paths. Initial setup/download needs network access; inference can run offline once assets exist.
- Imperative task factories expect local asset paths. Call `download(config)` before construction when
  the config contains URLs. `inspectModel` accepts a remote URL or local path.
- File loaders expect absolute filesystem paths, not `file://` or document-provider `content://` URIs.
  Resolve or copy picker assets using the app's filesystem integration. Do not just remove a URI scheme
  when doing so does not produce a readable path.
- Progress is 0–100 from hooks and 0–1 in the imperative downloader's `onProgress` callback.
- Pre-exported model downloads emit an anonymous event by default. `setTelemetryEnabled(false)` opts
  out. Distinguish download/telemetry traffic from on-device inference when explaining privacy.

## Lifetime

Hooks manage model cleanup on unmount/config changes. Keep execution out of render and handle methods
being undefined until ready. Do not run overlapping calls against shared scratch tensors or a chat
session; track busy state and support cancellation where provided.

Imperative `create<Task>` results own native memory. Wait for active calls to finish or stop them, then
dispose in `finally`. For custom factories, track each allocation in `createResourceScope` immediately,
dispose on construction failure and return that same disposal function. Native memory is not managed
by JavaScript GC. Read the complete custom example in `custom-models.md`.

Documentation entry points (select the installed release line before using these default-release URLs):

- [Getting Started](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/getting-started)
- [Compatibility](https://docs.swmansion.com/react-native-executorch/docs/other/compatibility)
- [Downloading Models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/downloading-models)
- [Native Libraries](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/native-libraries)
