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
  <a href="https://discord.gg/ZGqqY55qkP"><img src="https://img.shields.io/badge/Discord-Rejoignez%20nous-00008B?logo=discord&logoColor=white&style=for-the-badge" alt="Join our Discord community"></a>
  <a href="https://docs.swmansion.com/react-native-executorch/"><img src="https://img.shields.io/badge/Documentation-00008B?logo=googledocs&logoColor=white&style=for-the-badge" alt="Documentation"></a>
  <a href="https://swmansion.com/contact">
    <img src="https://img.shields.io/badge/Engagez--nous-00008B?logo=react&logoColor=white&color=darkgreen&style=for-the-badge" alt="Hire Us">
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

**React Native ExecuTorch** offre une manière déclarative de faire tourner des modèles AI sur des appareils utilisant React Native, propulsé par **ExecuTorch** :rocket:. Il propose un support natif pour une large gamme de LLM, de modèles de vision par ordinateur, et plus encore. Visitez notre page [HuggingFace](https://huggingface.co/software-mansion) pour explorer ces modèles.

[**ExecuTorch**](https://executorch.ai), développé par Meta, est un cadre innovant permettant l'exécution de modèles AI sur des appareils comme les téléphones mobiles ou les microcontrôleurs.

React Native ExecuTorch comble le fossé entre React Native et les capacités natives de la plateforme, permettant aux développeurs de faire tourner efficacement des modèles AI locaux sur des appareils mobiles. Cela peut être réalisé sans besoin d'une expertise approfondie en programmation native ou en apprentissage machine.

[![version npm](https://img.shields.io/npm/v/react-native-executorch?color=00008B)](https://www.npmjs.com/package/react-native-executorch)
[![npm nightly](https://img.shields.io/npm/v/react-native-executorch/executorch-nightly?label=nightly&color=00008B)](https://www.npmjs.com/package/react-native-executorch)
[![CI](https://github.com/software-mansion/react-native-executorch/actions/workflows/ci.yml/badge.svg)](https://github.com/software-mansion/react-native-executorch/actions/workflows/ci.yml)

<details>
<summary><strong>Table des matières</strong></summary>

- [Versions supportées](#versions-support%C3%A9es)
- [Exemple du monde réel](#exemple-du-monde-r%C3%A9el)
- [Démarrage rapide - Exécution de Llama](#d%C3%A9marrage-rapide---ex%C3%A9cution-de-llama)
- [Applications de démonstration](#applications-de-d%C3%A9monstration)
- [Modèles prêts à l'emploi](#mod%C3%A8les-pr%C3%AAts-%C3%A0-lemploi)
- [Documentation](#documentation)
- [Licence](#licence)
- [Quelle est la suite ?](#quelle-est-la-suite-)

</details>

## Versions supportées

Les versions minimales supportées sont :

- iOS 17.0
- Android 13
- React Native 0.81

> [!IMPORTANT]
> React Native ExecuTorch ne supporte que la [nouvelle architecture React Native](https://reactnative.dev/architecture/landing-page).

## Exemple du monde réel

React Native ExecuTorch alimente [Private Mind](https://privatemind.swmansion.com/), une appli AI mobile axée sur la confidentialité, disponible sur [App Store](https://apps.apple.com/gb/app/private-mind/id6746713439) et [Google Play](https://play.google.com/store/apps/details?id=com.swmansion.privatemind).

<img width="2720" height="1085" alt="Promo Private Mind" src="https://github.com/user-attachments/assets/b12296fe-19ac-48fc-9726-da9242700346" />

## Démarrage rapide - Exécution de Llama

**Commencez avec la génération de texte AI en 3 étapes faciles !**

### :one: Installation

```bash
# Installez le package
yarn add react-native-executorch

# Si vous utilisez expo, veuillez ajouter ces packages pour la récupération de ressources :
yarn add @react-native-executorch/expo-resource-fetcher
yarn add expo-file-system expo-asset

# Si vous utilisez un projet React Native brut, utilisez ces packages :
yarn add @react-native-executorch/bare-resource-fetcher
yarn add @dr.pogodin/react-native-fs @kesha-antonov/react-native-background-downloader

# Selon la plateforme, choisissez soit iOS soit Android
yarn < ios | android >
```

### :two: Configuration et Initialisation

Ajoutez ceci à votre fichier de composant :

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
  // Initialisez le modèle 🚀
  const llm = useLLM({ model: LLAMA3_2_1B });
  // ... reste de votre composant
}
```

### :three: Exécutez le modèle !

```tsx
const handleGenerate = async () => {
  const chat: Message[] = [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'What is the meaning of life?' },
  ];

  // Complétion de chat
  await llm.generate(chat);
  console.log('Llama dit :', llm.response);
};
```

## Applications de démonstration

Nous hébergeons actuellement quelques applications [exemples](https://github.com/software-mansion/react-native-executorch/tree/main/apps) démontrant des cas d'utilisation de notre bibliothèque :

- `llm` - Application de chat montrant l'utilisation de LLM
- `speech` - Implémentations de tâches de parole en texte et de texte en parole
- `computer-vision` - Tâches liées à la vision par ordinateur
- `text-embeddings` - Calcul de représentations textuelles pour la recherche sémantique
- `bare_rn` - Exemple de chat LLM pour React Native sans Expo

Si vous souhaitez exécuter une application de démonstration, accédez à son répertoire de projet. Puis installez les dépendances et lancez l'application avec :

```bash
yarn && yarn < ios | android >
```

> [!WARNING]
> L'exécution des LLM nécessite une quantité importante de RAM. Si vous rencontrez des plantages inattendus de l'application, essayez d'augmenter la quantité de RAM allouée à l'émulateur.

## Modèles prêts à l'emploi

Notre bibliothèque contient un certain nombre de modèles AI prêts à l'emploi ; une liste complète est disponible dans la documentation. Si vous êtes intéressé à exécuter votre propre modèle AI, vous devez d'abord l'exporter au format `.pte`. Les instructions sur la façon de faire cela sont disponibles dans [l'API Python](https://docs.pytorch.org/executorch/stable/using-executorch-export.html) et le [README optimum-executorch](https://github.com/huggingface/optimum-executorch?tab=readme-ov-file#option-2-export-and-load-separately).

## Documentation

Découvrez comment notre bibliothèque peut vous aider à construire vos fonctionnalités AI avec React Native en visitant notre documentation :
https://docs.swmansion.com/react-native-executorch

## Licence

Cette bibliothèque est sous licence [MIT](./LICENSE).

## Quelle est la suite ?

Pour en savoir plus sur nos futures plans et développements, veuillez consulter nos [jalons](https://github.com/software-mansion/react-native-executorch/milestones).

## React Native ExecuTorch est créé par Software Mansion

Depuis 2012, [Software Mansion](https://swmansion.com) est une agence de développement avec de l'expérience dans la création d'applications web et mobiles. Nous sommes Contributeurs React Native Core et experts dans la gestion de tous types de problèmes React Native. Nous pouvons vous aider à créer votre prochain produit rêvé – [Engagez-nous](https://swmansion.com/contact?utm_source=react-native-executorch&utm_medium=readme).

[![swm](https://logo.swmansion.com/logo?color=white&variant=desktop&width=150&tag=react-native-executorch-github 'Software Mansion')](https://swmansion.com)
