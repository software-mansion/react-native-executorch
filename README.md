# React Native ExecuTorch

![Software Mansion banner](https://private-user-images.githubusercontent.com/92989966/379643383-4513b771-7fb0-4aef-9a7b-ecd8547e7c9c.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjk3NTE3OTUsIm5iZiI6MTcyOTc1MTQ5NSwicGF0aCI6Ii85Mjk4OTk2Ni8zNzk2NDMzODMtNDUxM2I3NzEtN2ZiMC00YWVmLTlhN2ItZWNkODU0N2U3YzljLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNDEwMjQlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjQxMDI0VDA2MzEzNVomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWY4YjhjOTNkMDllMDViY2FkMmE1YWMwZWNhMWM1OThkYzk5Y2ZkM2FhZGVmYzI0NDI0MjY0OGVlMGJhMmZlYjEmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.yM9o7pPHM2yS2397-CWmAR2w1EtLxtFS4BV5S_xwuNo)

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
