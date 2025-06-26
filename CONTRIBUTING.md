Thank you for your interest in contributing to react-native-executorch!

# Ways to contribute

There are several ways you can contribute to react-native-executorch

- Submit issues related to bugs or desired new features.
- Fix outstanding issues with the existing code.
- Export new models to ET format
- Contribute to examples or to the documentation

## Submitting a bug-related issue or feature request

Please try to follow those guidelines when creating issues or feature requests. This makes it easier for us to help you with problems or properly consider your suggestions.
For more general questions and discussions please visit our Discord server.

## Found a bug?

Before reporting the issue please check if a similar issue was previously reported, this can be either here or on our Discord server. This will make it much faster for you and us to help you. We prefer you to create issues here on github rather than on Discord as it makes it easier for others to find them later on and makes it easier to include proper context to the problem. When submitting your issue please select a `🐛 Bug` issue template and fill in the required information, this speeds up our responses significantly.

## Feature request

Have an idea or is there a feature you would like to see added? Feel free to create a PR from a fork 😉. Alternatively if you don't have time for that just create a `🚀 Feature request` issue and fill in the necessary information.
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
If you found some inconsistencies in our documentation or just something is missing just open a PR with suggested changes (remember to add changes to previous docs versions too).

# Creating a Pull Request

Before writing any code reach out to us to make sure no one is currently working on it, you can always open an issue first.

1. Fork the [repository](https://github.com/software-mansion/react-native-executorch) by clicking on the **[Fork](https://github.com/software-mansion/react-native-executorch/fork)** button on the repository's page. This creates a copy of the code under your GitHub use account.

2. Clone your fork to your local disc, and add the base repository as a remote:

```
git clone git@github.com:<your Github handle>/react-native-executorch.git
cd react-native-executorch
git remote add upstream https://github.com/software-mansion/react-native-executorch.git
```

3. Create you develop branch

```
git checkout -b a-descriptive-name-for-my-changes
```

🚨 Do not work on the main branch!

4. Follow installation steps in the [README.md](./README.md)

5. Develop your code.
   To keep your fork up to date run

```
git fetch upstream
git rebase upstream/main
```

After you are done writing the code push it to the remote

```
git push -u origin a-descriptive-name-for-my-changes
```

6. Test your changes.
   Make sure to test on both Android and IOS. Devices are best, but naturally testing on simulator would be just fine. You can use example apps in the `apps` directory for your testing purposes.

7. Open a pull request
   For details on how to open a pull request from a fork please visit [github's documentation](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork)
