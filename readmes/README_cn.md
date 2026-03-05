<div align="center">
  <img src="../docs/static/img/logo-hero.svg" alt="RNE Logo" width="25%">
</div>

<div align="center">
  <h1 align="center" style="display:inline-block">React Native ExecuTorch
  </h1>
</div>

<div align="center">
  <a href="https://github.com/software-mansion/react-native-executorch/graphs/contributors"><img src="https://img.shields.io/github/contributors/software-mansion/react-native-executorch?style=for-the-badge&color=00008B" alt="GitHub - Contributors"></a>
  <a href="https://github.com/software-mansion/react-native-executorch/stargazers"><img src="https://img.shields.io/github/stars/software-mansion/react-native-executorch?style=for-the-badge&color=00008B" alt="GitHub - Stars"></a>
  <a href="https://discord.gg/ZGqqY55qkP"><img src="https://img.shields.io/badge/Discord-加入我们-00008B?logo=discord&logoColor=white&style=for-the-badge" alt="Join our Discord community"></a>
  <a href="https://docs.swmansion.com/react-native-executorch/"><img src="https://img.shields.io/badge/文档-00008B?logo=googledocs&logoColor=white&style=for-the-badge" alt="Documentation"></a>
  <a href="https://swmansion.com/contact">
    <img src="https://img.shields.io/badge/聘请我们-00008B?logo=react&logoColor=white&color=darkgreen&style=for-the-badge" alt="Hire Us">
</div>

<p align="center">
  <a href="../README.md"><img src="https://img.shields.io/badge/EN-00008B?logo=&logoColor=white&color=00008B&style=for-the-badge" alt="README"></a>
  <a href="README_es.md"><img src="https://img.shields.io/badge/ES-00008B?logo=&logoColor=white&color=00008B&style=for-the-badge" alt="README ES"></a>
  <a href="README_fr.md"><img src="https://img.shields.io/badge/FR-00008B?logo=&logoColor=white&color=00008B&style=for-the-badge" alt="README FR"></a>
  <a href="README_cn.md"><img src="https://img.shields.io/badge/CN-00008B?logo=&logoColor=white&color=00008B&style=for-the-badge" alt="README CN"></a>
  <a href="README_pt.md"><img src="https://img.shields.io/badge/PT-00008B?logo=&logoColor=white&color=00008B&style=for-the-badge" alt="README PT"></a>
  <a href="README_in.md"><img src="https://img.shields.io/badge/IN-00008B?logo=&logoColor=white&color=00008B&style=for-the-badge" alt="README IN"></a>
</p>

**React Native ExecuTorch** 是一个使用 React Native 在设备上运行 AI 模型的声明式工具，得益于 **ExecuTorch** 的支持 :rocket:。它为各种 LLM、计算机视觉模型等提供了开箱即用的支持。访问我们的 [HuggingFace](https://huggingface.co/software-mansion) 页面，以探索这些模型。

**ExecuTorch** 由 Meta 开发，是一个创新的框架，允许在移动电话或微控制器等设备上执行 AI 模型。

React Native ExecuTorch 架起了 React Native 和原生平台功能之间的桥梁，使开发者无需深入的本地编程或机器学习知识即可高效地在移动设备上本地运行 AI 模型。

[![npm version](https://img.shields.io/npm/v/react-native-executorch?color=00008B)](https://www.npmjs.com/package/react-native-executorch)
[![npm nightly](https://img.shields.io/npm/v/react-native-executorch/executorch-nightly?label=nightly&color=00008B)](https://www.npmjs.com/package/react-native-executorch)
[![CI](https://github.com/software-mansion/react-native-executorch/actions/workflows/ci.yml/badge.svg)](https://github.com/software-mansion/react-native-executorch/actions/workflows/ci.yml)

<details>
<summary><strong> :blue_book: 目录 </strong></summary>

- [:yin_yang: 支持的版本](#yin_yang-supported-versions)
- [:earth_africa: 实际案例](#earth_africa-real-world-example)
- [:llama: 快速入门 - 运行 Llama](#llama-quickstart---running-llama)
- [:calling: 示例应用](#calling-demo-apps)
- [:robot: 现成模型](#robot-ready-made-models)
- [:books: 文档](#books-documentation)
- [:balance_scale: 许可证](#balance_scale-license)
- [:soon: 接下来是什么？](#soon-whats-next)

</details>

## :yin_yang: 支持的版本

最低支持版本为：

- iOS 17.0
- Android 13
- React Native 0.81

> [!IMPORTANT]
> React Native ExecuTorch 仅支持 [New React Native architecture](https://reactnative.dev/architecture/landing-page)。

## :earth_africa: 实际案例

React Native ExecuTorch 为 [Private Mind](https://privatemind.swmansion.com/) 提供了动力，这是一款以隐私优先的移动 AI 应用程序，可在 [App Store](https://apps.apple.com/gb/app/private-mind/id6746713439) 和 [Google Play](https://play.google.com/store/apps/details?id=com.swmansion.privatemind) 上获得。

<img width="2720" height="1085" alt="Private Mind promo" src="https://github.com/user-attachments/assets/b12296fe-19ac-48fc-9726-da9242700346" />

## :llama: **快速入门 - 运行 Llama**

**通过三个简单步骤，开始使用 AI 驱动的文本生成！**

### :one: **安装**

```bash
# 安装包
yarn add react-native-executorch

# 如果您使用 expo，请添加这些包用于资源获取：
yarn add @react-native-executorch/expo-resource-fetcher
yarn add expo-file-system expo-asset

# 如果您使用原生 React Native 项目，请使用这些包：
yarn add @react-native-executorch/bare-resource-fetcher
yarn add @dr.pogodin/react-native-fs @kesha-antonov/react-native-background-downloader

# 根据平台，选择 iOS 或 Android
yarn expo run:< ios | android >
```

### :two: **设置和初始化**

将此添加到您的组件文件中：

```tsx
import {
  useLLM,
  LLAMA3_2_1B,
  Message,
  initExecutorch,
} from 'react-native-executorch';
import { ExpoResourceFetcher } from '@react-native-executorch/expo-resource-fetcher';

initExecutorch({
  resourceFetcher: ExpoResourceFetcher,
});

function MyComponent() {
  // 初始化模型 🚀
  const llm = useLLM({ model: LLAMA3_2_1B });
  // ... 您组件的其余部分
}
```

### :three: **运行模型！**

```tsx
const handleGenerate = async () => {
  const chat: Message[] = [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'What is the meaning of life?' },
  ];

  // 聊天生成
  await llm.generate(chat);
  console.log('Llama says:', llm.response);
};
```

## :calling: 示例应用

我们目前托管了一些示例 [应用程序](https://github.com/software-mansion/react-native-executorch/tree/main/apps)，展示了我们库的使用案例：

- `llm` - 展现 LLM 使用的聊天应用程序
- `speech-to-text` - 准备用于转录任务的 Whisper 模型
- `computer-vision` - 计算机视觉相关任务
- `text-embeddings` - 用于语义搜索的文本表示计算

如果您想运行示例应用程序，请导航到其项目目录并安装依赖项：

```bash
yarn
```

然后，根据平台，选择 iOS 或 Android：

```bash
yarn expo run:< ios | android >
```

> [!WARNING]
> 运行 LLM 需要大量的 RAM。如果您遇到意外的应用崩溃，请尝试增加分配给模拟器的 RAM。

## :robot: 现成模型

我们的库中有许多现成可用的 AI 模型；完整列表可在文档中查看。如果您有兴趣运行自己的 AI 模型，首先需要将其导出为 `.pte` 格式。关于如何执行此操作的说明可在 [Python API](https://docs.pytorch.org/executorch/stable/using-executorch-export.html) 和 [optimum-executorch 说明](https://github.com/huggingface/optimum-executorch?tab=readme-ov-file#option-2-export-and-load-separately) 中获取。

## :books: 文档

查看我们的文档，了解我们的库如何帮助您构建 React Native AI 功能：
https://docs.swmansion.com/react-native-executorch

## :balance_scale: 许可证

此库受 [MIT 许可证](./LICENSE) 许可。

## :soon: 接下来是什么？

若要了解我们的计划和发展，敬请访问我们的 [milestones](https://github.com/software-mansion/react-native-executorch/milestones)。

## React Native ExecuTorch 是由 Software Mansion 创建的

自 2012 年以来，[Software Mansion](https://swmansion.com) 是一家拥有构建网络和移动应用经验的软件机构。我们是核心 React Native 贡献者，并且是处理各种 React Native 问题的专家。我们可以帮助您构建下一个梦想产品——[雇佣我们](https://swmansion.com/contact?utm_source=react-native-executorch&utm_medium=readme)。

[![swm](https://logo.swmansion.com/logo?color=white&variant=desktop&width=150&tag=react-native-executorch-github 'Software Mansion')](https://swmansion.com)
