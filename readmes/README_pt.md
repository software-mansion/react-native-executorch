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
  <a href="https://discord.gg/ZGqqY55qkP"><img src="https://img.shields.io/badge/Discord-Juntem--se%20a%20nós-00008B?logo=discord&logoColor=white&style=for-the-badge" alt="Join our Discord community"></a>
  <a href="https://docs.swmansion.com/react-native-executorch/"><img src="https://img.shields.io/badge/Documentação-00008B?logo=googledocs&logoColor=white&style=for-the-badge" alt="Documentation"></a>
  <a href="https://swmansion.com/contact">
    <img src="https://img.shields.io/badge/Contrate--nos-00008B?logo=react&logoColor=white&color=darkgreen&style=for-the-badge" alt="Hire Us">
  </a>
</div>

<p align="center">
  <a href="../README.md"><img src="https://img.shields.io/badge/EN-00008B?logo=&logoColor=white&color=00008B&style=for-the-badge" alt="README"></a>
  <a href="README_es.md"><img src="https://img.shields.io/badge/ES-00008B?logo=&logoColor=white&color=00008B&style=for-the-badge" alt="README ES"></a>
  <a href="README_fr.md"><img src="https://img.shields.io/badge/FR-00008B?logo=&logoColor=white&color=00008B&style=for-the-badge" alt="README FR"></a>
  <a href="README_cn.md"><img src="https://img.shields.io/badge/CN-00008B?logo=&logoColor=white&color=00008B&style=for-the-badge" alt="README CN"></a>
  <a href="README_pt.md"><img src="https://img.shields.io/badge/PT-00008B?logo=&logoColor=white&color=00008B&style=for-the-badge" alt="README PT"></a>
  <a href="README_in.md"><img src="https://img.shields.io/badge/IN-00008B?logo=&logoColor=white&color=00008B&style=for-the-badge" alt="README IN"></a>
</p>

**React Native ExecuTorch** fornece uma maneira declarativa de executar modelos de IA no dispositivo usando React Native, impulsionado pelo **ExecuTorch** :rocket:. Oferece suporte pronto para uso para uma ampla gama de LLMs, modelos de visão computacional e mais. Visite nossa página no [HuggingFace](https://huggingface.co/software-mansion) para explorar esses modelos.

[**ExecuTorch**](https://executorch.ai), desenvolvido pela Meta, é uma estrutura inovadora que permite a execução de modelos de IA em dispositivos, como telefones móveis ou microcontroladores.

React Native ExecuTorch faz a ponte entre React Native e as capacidades das plataformas nativas, permitindo que desenvolvedores executem modelos de IA localmente em dispositivos móveis de maneira eficiente. Isso pode ser alcançado sem a necessidade de extenso conhecimento em programação nativa ou aprendizado de máquina.

[![Versão npm](https://img.shields.io/npm/v/react-native-executorch?color=00008B)](https://www.npmjs.com/package/react-native-executorch)
[![npm nightly](https://img.shields.io/npm/v/react-native-executorch/executorch-nightly?label=nightly&color=00008B)](https://www.npmjs.com/package/react-native-executorch)
[![CI](https://github.com/software-mansion/react-native-executorch/actions/workflows/ci.yml/badge.svg)](https://github.com/software-mansion/react-native-executorch/actions/workflows/ci.yml)

<details>
<summary><strong>Índice</strong></summary>

- [Versões Suportadas](#vers%C3%B5es-suportadas)
- [Exemplo do Mundo Real](#exemplo-do-mundo-real)
- [Guia Rápido - Executando Llama](#guia-r%C3%A1pido---executando-llama)
- [Apps de Demonstração](#apps-de-demonstra%C3%A7%C3%A3o)
- [Modelos Prontos para Uso](#modelos-prontos-para-uso)
- [Documentação](#documenta%C3%A7%C3%A3o)
- [Licença](#licen%C3%A7a)
- [O que vem a seguir?](#o-que-vem-a-seguir)

</details>

## Versões Suportadas

As versões mínimas suportadas são:

- iOS 17.0
- Android 13
- React Native 0.81

> [!IMPORTANT]
> React Native ExecuTorch suporta apenas a [Nova Arquitetura do React Native](https://reactnative.dev/architecture/landing-page).

## Exemplo do Mundo Real

React Native ExecuTorch está impulsionando o [Private Mind](https://privatemind.swmansion.com/), um aplicativo de IA móvel com foco na privacidade, disponível na [App Store](https://apps.apple.com/gb/app/private-mind/id6746713439) e [Google Play](https://play.google.com/store/apps/details?id=com.swmansion.privatemind).

<img width="2720" height="1085" alt="Promoção do Private Mind" src="https://github.com/user-attachments/assets/b12296fe-19ac-48fc-9726-da9242700346" />

## Guia Rápido - Executando Llama

**Comece com geração de texto com IA em 3 passos simples!**

### :one: Instalação

```bash
# Instale o pacote
yarn add react-native-executorch

# Se você usa expo, adicione estes pacotes para busca de recursos:
yarn add @react-native-executorch/expo-resource-fetcher
yarn add expo-file-system expo-asset

# Se você usa projeto React Native básico, use estes pacotes:
yarn add @react-native-executorch/bare-resource-fetcher
yarn add @dr.pogodin/react-native-fs @kesha-antonov/react-native-background-downloader

# Dependendo da plataforma, escolha iOS ou Android
yarn < ios | android >
```

### :two: Configuração e Inicialização

Adicione isso ao seu arquivo de componente:

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
  // Inicialize o modelo 🚀
  const llm = useLLM({ model: LLAMA3_2_1B });
  // ... restante do seu componente
}
```

### :three: Execute o modelo!

```tsx
const handleGenerate = async () => {
  const chat: Message[] = [
    { role: 'system', content: 'Você é um assistente prestativo' },
    { role: 'user', content: 'Qual é o significado da vida?' },
  ];

  // Conclusão de chat
  await llm.generate(chat);
  console.log('Llama diz:', llm.response);
};
```

## Apps de Demonstração

Atualmente, hospedamos alguns [apps](https://github.com/software-mansion/react-native-executorch/tree/main/apps) de exemplo demonstrando casos de uso de nossa biblioteca:

- `llm` - Aplicativo de chat demonstrando o uso de LLMs
- `speech` - Implementações de tarefas de fala para texto e texto para fala
- `computer-vision` - Tarefas relacionadas à visão computacional
- `text-embeddings` - Computação de representações de texto para busca semântica
- `bare_rn` - Exemplo de chat LLM para React Native puro (sem Expo)

Se deseja executar um aplicativo de demonstração, navegue até seu diretório de projeto. Em seguida, instale as dependências e execute o aplicativo com:

```bash
yarn && yarn < ios | android >
```

> [!WARNING]
> Executar LLMs requer uma quantidade significativa de RAM. Se você estiver enfrentando travamentos inesperados do aplicativo, tente aumentar a quantidade de RAM alocada para o emulador.

## Modelos Prontos para Uso

Nossa biblioteca possui vários modelos de IA prontos para uso; uma lista completa está disponível na documentação. Se você está interessado em executar seu próprio modelo de IA, primeiro precisa exportá-lo para o formato `.pte`. Instruções sobre como fazer isso estão disponíveis na [API Python](https://docs.pytorch.org/executorch/stable/using-executorch-export.html) e no [README do optimum-executorch](https://github.com/huggingface/optimum-executorch?tab=readme-ov-file#option-2-export-and-load-separately).

## Documentação

Confira como nossa biblioteca pode ajudar você a construir recursos de IA no React Native visitando nossa documentação:
https://docs.swmansion.com/react-native-executorch

## Licença

Esta biblioteca é licenciada sob [A Licença MIT](./LICENSE).

## O que vem a seguir?

Para saber sobre nossos planos e desenvolvimentos futuros, visite nossos [marcos](https://github.com/software-mansion/react-native-executorch/milestones).

## React Native ExecuTorch é criado pela Software Mansion

Desde 2012, a [Software Mansion](https://swmansion.com) é uma agência de software com experiência na construção de aplicativos web e móveis. Somos colaboradores principais do React Native e especialistas em lidar com todos os tipos de problemas do React Native. Podemos ajudar você a construir seu próximo produto dos sonhos – [Contrate-nos](https://swmansion.com/contact?utm_source=react-native-executorch&utm_medium=readme).

[![swm](https://logo.swmansion.com/logo?color=white&variant=desktop&width=150&tag=react-native-executorch-github 'Software Mansion')](https://swmansion.com)
