# Set up an app and provision native binaries

Use this workflow for a new React Native/Expo app, adding the library to an existing app, or repairing
an installation with missing native artifacts. Select the app's documentation release as described in
`SKILL.md`; use its requirements and commands rather than assuming fixed dependency or OS versions.

## 1. Check the app and install dependencies

Read [Getting Started](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/getting-started.md)
and [Compatibility](https://docs.swmansion.com/react-native-executorch/docs/other/compatibility.md).
Inspect the app's package manager, workspace layout, installed React Native/Expo and Worklets/Reanimated
versions, target devices and architecture. Resolve compatible peers using the installed package's
manifest and these guides. Preserve existing app configuration where it already satisfies requirements.

Install the library and its required peers with the app's package manager. Use the setup guide for Babel
configuration, deployment targets and platform tools. Expo Go cannot load the custom native libraries;
use a development build. Do not upgrade unrelated dependencies to match a copied example.

## 2. Select and download native binaries

Follow [Native Libraries](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/native-libraries.md)
for available backends, optional libraries, configuration and provisioning behavior.

- The package's postinstall downloads native artifacts separately from the npm package. Check install
  logs to confirm that the hook ran and the selected artifacts were downloaded successfully.
- The default installation provisions the available libraries. Configure a smaller selection only when
  needed. For custom models, include the backend and operators required by the export; selecting a
  named task does not make an arbitrary model compatible.
- In a monorepo, verify which manifest the installer actually reads. Check the resolved build
  configuration and artifacts rather than assuming an app-local setting was used.
- If the package manager blocked lifecycle scripts or downloads failed, follow the matching
  [installation troubleshooting guide](https://docs.swmansion.com/react-native-executorch/docs/other/troubleshooting.md#build-input-files-cannot-be-found-after-install)
  to permit the package's hook or rerun its downloader. Use the installed package's script and version;
  do not disable script policies globally or substitute binaries from a different release.
- After changing native-library selection, rerun the documented provisioning step before rebuilding.

Native binaries and model files are separate downloads. Successfully provisioning the runtime does
not mean that a model's weights and auxiliary assets are already cached.

## 3. Build and verify the native app

Follow the platform steps in Getting Started: configure Babel/worklets, install iOS pods as needed,
and build or rebuild the development app. Reset Metro after Babel changes. Changes to native peers,
binaries or backend selection require a native rebuild; reloading JavaScript is insufficient.

Confirm native initialization, then run a small inference on the intended device/backend. Report native
build success separately from actual inference. If the build fails, use its concrete native error with
[Troubleshooting](https://docs.swmansion.com/react-native-executorch/docs/other/troubleshooting.md)
before deleting caches or changing dependency versions.

## Model downloads and input paths

Use [Downloading Models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/downloading-models.md)
for cache behavior, progress units and local/remote input support of the selected API.

- Hooks manage downloads and React lifetime; imperative factories generally need resolved local assets.
- Download every required asset, including tokenizers or labels, before expecting offline inference.
- Distinguish readable filesystem paths from picker/provider URIs. Resolve or copy assets through the
  app's filesystem integration rather than blindly removing a URI scheme.
- Pre-exported model downloads can emit anonymous telemetry. Check the documented opt-out when
  requested, and distinguish download traffic from on-device inference.

## Resource lifetime

Keep inference out of render and handle readiness before invoking methods. Serialize calls sharing
scratch buffers or a session; stop or await active work before disposal. Hooks manage React cleanup.
Imperative pipelines require explicit disposal, including after partial construction failures; native
memory is not managed by JavaScript garbage collection. See [custom-models.md](custom-models.md).
