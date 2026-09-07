# Security Policy

## Reporting a vulnerability

**Please do not report security issues in public GitHub issues, pull requests
or Discord.**

Use one of these instead:

1. [**Report a vulnerability**](https://github.com/software-mansion/react-native-executorch/security/advisories/new)
   on this repository. This opens a private advisory that only the maintainers
   can see, and it is the preferred route: the fix can be developed in a
   private fork attached to the report.
2. Email **ai@swmansion.com** if you cannot use GitHub, or if you would rather
   make first contact by mail. This is the same address as in our
   [Code of Conduct](./CODE_OF_CONDUCT.md).

A useful report says which version and platform you were on, what an attacker
can achieve, and how to reproduce it. A proof of concept helps more than a
scanner name. If you are unsure whether something counts, report it anyway and
let us decide.

We will acknowledge your report and tell you whether we consider it in scope.
If we ship a fix we will credit you in the advisory unless you ask us not to.
Please give us a chance to release a fix before disclosing publicly.

## Supported versions

Fixes land on the current line. The previous line receives security fixes only.

| Line           | npm dist-tag         | Status                                  |
| -------------- | -------------------- | --------------------------------------- |
| Current minor  | `latest`             | Supported                               |
| Previous minor | `legacy`             | Security fixes only                     |
| Anything older | none                 | Unsupported, please upgrade             |
| Nightly builds | `executorch-nightly` | Not supported, do not use in production |

Deliberately written as version lines rather than numbers, so it does not go
stale on every release. `npm dist-tag ls react-native-executorch` shows what
each tag currently points at.

## Scope

In scope, because they are what users install and run:

- The published npm packages: `react-native-executorch`, its
  `react-native-executorch-bare-resource-fetcher` and
  `react-native-executorch-expo-resource-fetcher` adapters, and
  `react-native-executorch-webrtc`. This includes the C++, Kotlin, Swift and
  Objective-C sources they ship.
- The prebuilt native artifacts the package downloads on install, published as
  GitHub Releases tagged `v<version>-libs`.
- The model files we publish under
  [software-mansion on HuggingFace](https://huggingface.co/software-mansion),
  which the library downloads at runtime.

Out of scope, because nothing here reaches a user of the library:

- The demo applications under `apps/`, and the documentation site under
  `docs/`. Neither is published to npm.
- Development and CI tooling, including any advisory that only affects a
  `yarn.lock` in this repository. The published package ships neither
  `node_modules` nor a lock file, so a vulnerable transitive dependency of the
  build does not reach anyone who installs the library. Please still tell us if
  you find one that does reach the published artifacts.
- Vulnerabilities in ExecuTorch, PyTorch or other upstream projects. Report
  those to the relevant project; tell us as well if react-native-executorch
  exposes them in a way upstream would not.
- Findings that need an already compromised device, a physical attacker with
  the unlocked device, or a modified build of the library.

## A note on models

Models are downloaded at runtime from URLs in the model registry, and a model
file is executable content for the ExecuTorch runtime. If you point the library
at a model you do not control, you are trusting whoever published it. Treat a
custom model source the way you would treat any other remote code.
