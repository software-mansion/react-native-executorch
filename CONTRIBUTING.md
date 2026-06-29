Thank you for your interest in contributing to react-native-executorch!

# Ways to contribute

There are several ways you can contribute to react-native-executorch:

- Submit issues related to bugs or desired new features.
- Fix outstanding issues with the existing code.
- Export new models to ET format.
- Contribute to examples or to the documentation.

## Submitting a bug-related issue or feature request

Please try to follow those guidelines when creating issues or feature requests. This makes it easier for us to help you with problems or properly consider your suggestions.
For more general questions and discussions please visit our Discord server.

## Found a bug?

Before reporting the issue please check **if a similar issue was previously reported** (use the search bar on GitHub under Issues). This will make it much faster for you and us to help you. We prefer you to create issues here on GitHub rather than on Discord as it makes it easier for others to find them later on and makes it easier to include proper context to the problem. When submitting your issue please select a `🐛 Bug` issue template and fill in the required information, this speeds up our responses significantly.

## Feature request

Have an idea or is there a feature you would like to see added? This can be a specific model, an entire model family, a code functionality or anything else you think might be useful. Feel free to create a PR from a fork 😉. Alternatively if you don't have time for that just create a `🚀 Feature request` issue and fill in the necessary information.
The most important things to include are:

1. What is the motivation behind it? Is it something that is missing but is present in another library? Or maybe you need something more specific for your use case? Or just an idea that popped into your head?
   We'd love to hear about this!

2. Describe it - add as much detail as you can. This helps to avoid any miscommunication problems and helps us to better understand it.

3. Provide a code snippet with the example usage (optional).

4. If there is a similar feature somewhere else drop a link (optional).

## Fix outstanding issues

If you found an issue you would like to tackle and it is not assigned to anyone at the moment feel free to start working on it. Drop a comment under it so that we know it is under progress and then open a PR. For a good starting issue look for `good first issue` label.

## Export new models to ET format

Found a model you would like to use in your app but it is not currently supplied by us and got it exported and working with ExecuTorch? We would love you to create a PR on our [🤗 huggingface](https://huggingface.co/spaces/software-mansion/README/discussions?status=open&type=pull_request&sort=recently-created).

## Contributing to examples or documentation

Do you have a neat example use case and want to share it with us? You can just drop us a message on Discord server and/or open a PR to `apps` directory here.
If you found some inconsistencies in our documentation or just something is missing just open a PR with suggested changes (remember to add changes to previous docs versions too, e.g `docs/versioned_docs/version-0.3.x`, `docs/versioned_docs/version-0.4.x`).

# C++ tooling (clangd)

The core package ships a committed [clangd](https://clangd.llvm.org/) setup so the
C/C++ sources under `packages/react-native-executorch/cpp` get code intelligence and
a strict, shared set of compiler warnings:

- `packages/react-native-executorch/compile_flags.txt` — the compilation database:
  language standard, preprocessor defines, and include roots (paths are relative to
  the package, so the config is portable). ExecuTorch/torch/JSI headers are added as
  system includes so their internal warnings don't pollute diagnostics for our code.
- `packages/react-native-executorch/.clangd` — the warning policy layered on top.

For clangd to resolve the `<executorch/...>` and `<jsi/jsi.h>` includes you need the
same prerequisites as a native build:

1. `yarn install` at the repo root (provides the JSI headers under `node_modules`).
2. ExecuTorch headers provisioned under `packages/react-native-executorch/third-party/include`
   (see [third-party/README.md](./packages/react-native-executorch/third-party/README.md)).

Without them clangd still lints your own code; the third-party includes simply stay
unresolved until the headers are present.

A `pre-commit` hook (lefthook) compiles staged `cpp/` sources with this same warning set
and aborts the commit if any warning is introduced — the editor and the commit gate stay
in sync. It skips automatically when no compiler or the provisioned headers are available,
so it never blocks contributors who don't build the native code; bypass with
`git commit --no-verify`.

Editor setup: install the official **clangd** extension (e.g. `llvm-vs-code-extensions.vscode-clangd`
for VS Code) and disable the default Microsoft C/C++ IntelliSense engine so the two
don't conflict. clangd discovers `compile_flags.txt`/`.clangd` automatically from the
open file's directory. If you produce a `compile_commands.json` from a native build,
clangd will prefer it — it's gitignored and takes precedence over `compile_flags.txt`.

## clang-tidy

`packages/react-native-executorch/.clang-tidy` adds a conservative, high-signal set of
static checks (bugprone / performance / clang-analyzer) on top of the same database. The
clangd extension surfaces these inline; you can also run them from the command line:

```
yarn workspace react-native-executorch lint:cpp           # all C++ sources
CLANG_TIDY=$(brew --prefix llvm)/bin/clang-tidy yarn workspace react-native-executorch lint:cpp
```

It needs the same provisioned headers as clangd. Suppress an intentional, reviewed finding
with a commented `// NOLINTNEXTLINE(check-name)` rather than loosening the shared config.

# Creating a Pull Request

Before writing any code reach out to us to make sure no one is currently working on it, you can always open an issue first.

1. Fork the [repository](https://github.com/software-mansion/react-native-executorch) by clicking on the **[Fork](https://github.com/software-mansion/react-native-executorch/fork)** button on the repository's page. This creates a copy of the code under your GitHub use account.

2. Clone your fork to your local disc, and add the base repository as a remote:

```
git clone git@github.com:<your Github handle>/react-native-executorch.git
cd react-native-executorch
git remote add upstream https://github.com/software-mansion/react-native-executorch.git
```

3. Create your develop branch:

```
git checkout -b a-descriptive-name-for-my-changes
```

> [!CAUTION]
> Do not work on the main branch!

4. Follow installation steps in the [README.md](./README.md).

5. Develop your code.
   To keep your fork up to date run:

```
git fetch upstream
git rebase upstream/main
```

After you are done writing the code push it to the remote:

```
git push -u origin a-descriptive-name-for-my-changes
```

6. Test your changes.
   Make sure to test on both Android and IOS. Devices are best, but naturally testing on simulator would be just fine. You can use example apps in the `apps` directory for your testing purposes.

7. Open a pull request.
   For details on how to open a pull request from a fork please visit [github's documentation](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork).
