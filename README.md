# React Native ExecuTorch

![Software Mansion banner](https://github.com/user-attachments/assets/fa2c4735-e75c-4cc1-970d-88905d95e3a4)

**React Native ExecuTorch** is a declarative way to run AI models in React Native on device, powered by **ExecuTorch** 🚀.

**ExecuTorch** is a novel framework created by Meta that enables running AI models on devices such as mobile phones or microcontrollers. React Native ExecuTorch bridges the gap between React Native and native platform capabilities, allowing developers to run AI models locally on mobile devices with state-of-the-art performance, without requiring deep knowledge of native code or machine learning internals.

## Readymade models 🤖

To run any AI model in ExecuTorch, you need to export it to a `.pte` format. If you're interested in experimenting with your own models, we highly encourage you to check out the [Python API](https://pypi.org/project/executorch/). If you prefer focusing on developing your React Native app, we will cover several common use cases. For more details, please refer to the documentation.

## Documentation 📚

Take a look at how our library can help build you your React Native AI features in our docs:  
https://docs.swmansion.com/react-native-executorch

## Examples 📲

We currently host a single example demonstrating a chat app built with the latest **LLaMa 3.2 1B/3B** model. If you'd like to run it, navigate to `examples/llama` from the repository root and install the dependencies with:

```bash
yarn
```

then run:

```bash
cd ios
pod install
```

And finally, if you want to run on Android:

```bash
yarn expo run:android
```

or iOS:

```bash
yarn expo run:ios
```

## License  

This library is licensed under [The MIT License](./LICENSE).

## What's next?

- Support for various common use cases such as object detection, segmentation etc.  

- A possibility to run your own ExecuTorch models

- [Join the Software Mansion Community Discord](https://discord.gg/8jpfgDqPcM) to chat about React Native ExecuTorch or other Software Mansion libraries.

## React Native ExecuTorch is created by Software Mansion

Since 2012 [Software Mansion](https://swmansion.com) is a software agency with experience in building web and mobile apps. We are Core React Native Contributors and experts in dealing with all kinds of React Native issues. We can help you build your next dream product – [Hire us](https://swmansion.com/contact/projects?utm_source=react-native-executorch&utm_medium=readme).

[![swm](https://logo.swmansion.com/logo?color=white&variant=desktop&width=150&tag=react-native-executorch-github 'Software Mansion')](https://swmansion.com)
