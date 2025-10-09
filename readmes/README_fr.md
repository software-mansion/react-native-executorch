<div align="right">
  <h1 align="left" style="display:inline-block">React Native ExecuTorch 
    <!-- Discord Badge -->
    <a href="https://discord.gg/ZGqqY55qkP">
      <img src="https://img.shields.io/badge/Discord-Rejoignez%20Nous-00008B?logo=discord&logoColor=white&style=for-the-badge" alt="Rejoignez notre communauté Discord">
    </a>
  </h1>
</div>

![Bannière Software Mansion](https://github.com/user-attachments/assets/fa2c4735-e75c-4cc1-970d-88905d95e3a4)

<p align="center">
  <a href="../README.md">English</a>
  <a href="README_es.md">Español</a>
  <a href="README_fr.md">Français</a>
  <a href="README_cn.md">简体中文</a>
  <a href="README_pt.md">Português</a>
  <a href="README_in.md">हिंदी</a>
</p>

**React Native ExecuTorch** offre une manière déclarative de faire tourner des modèles AI sur des appareils utilisant React Native, propulsé par **ExecuTorch** :rocket:. Il propose un support natif pour une large gamme de LLM, de modèles de vision par ordinateur, et plus encore. Visitez notre page [HuggingFace](https://huggingface.co/software-mansion) pour explorer ces modèles.

**ExecuTorch**, développé par Meta, est un cadre innovant permettant l'exécution de modèles AI sur des appareils comme les téléphones mobiles ou les microcontrôleurs.

React Native ExecuTorch comble le fossé entre React Native et les capacités natives de la plateforme, permettant aux développeurs de faire tourner efficacement des modèles AI locaux sur des appareils mobiles. Cela peut être réalisé sans besoin d'une expertise approfondie en programmation native ou en apprentissage machine.

[![version npm](https://img.shields.io/npm/v/react-native-executorch?color=00008B)](https://www.npmjs.com/package/react-native-executorch)
[![CI](https://github.com/software-mansion/react-native-executorch/actions/workflows/ci.yml/badge.svg)](https://github.com/software-mansion/react-native-executorch/actions/workflows/ci.yml)

**Table des matières :**

- [:yin_yang: Versions supportées](#yin_yang-versions-support%C3%A9es)
- [:books: Documentation](#books-documentation)
- [:earth_africa: Exemple du monde réel](#earth_africa-exemple-du-monde-r%C3%A9el)
- [:llama: Démarrage rapide - Exécution de Llama](#llama-d%C3%A9marrage-rapide---ex%C3%A9cution-de-llama)
- [:calling: Applications de démonstration](#calling-applications-de-d%C3%A9monstration)
- [:robot: Modèles prêts à l'emploi](#robot-mod%C3%A8les-pr%C3%AAts-%C3%A0-l'emploi)
- [:balance_scale: Licence](#balance_scale-licence)
- [:soon: Quelle est la suite ?](#soon-quelle-est-la-suite)

## :yin_yang: Versions supportées

Les versions minimales supportées sont : 
* iOS 17.0
* Android 13
* React Native 0.76

> [!IMPORTANT]  
> React Native Executorch ne supporte que la [nouvelle architecture React Native](https://reactnative.dev/architecture/landing-page).

## :books: Documentation

Découvrez comment notre bibliothèque peut vous aider à construire vos fonctionnalités AI avec React Native en visitant notre documentation :  
https://docs.swmansion.com/react-native-executorch

## :earth_africa: Exemple du monde réel

React Native ExecuTorch alimente [Private Mind](https://github.com/software-mansion-labs/private-mind), une appli AI mobile axée sur la confidentialité, disponible sur [App Store](https://apps.apple.com/gb/app/private-mind/id6746713439) et [Google Play](https://play.google.com/store/apps/details?id=com.swmansion.privatemind).

<img width="2720" height="1085" alt="Promo Private Mind" src="https://github.com/user-attachments/assets/b12296fe-19ac-48fc-9726-da9242700346" />

## :llama: **Démarrage rapide - Exécution de Llama**

**Commencez avec la génération de texte AI en 3 étapes faciles !**

### :one: **Installation**

```bash
# Installez le package
yarn add react-native-executorch
# Selon la plateforme, choisissez soit iOS soit Android
yarn expo run:< ios | android >
```

### :two: **Configuration et Initialisation**

Ajoutez ceci à votre fichier de composant :

```tsx
import {
  useLLM,
  LLAMA3_2_1B,
  Message
} from 'react-native-executorch';

function MyComponent() {
  // Initialisez le modèle 🚀
  const llm = useLLM({ model: LLAMA3_2_1B });
  // ... reste de votre composant
}
```

### :three: **Exécutez le modèle !**

```tsx
const handleGenerate = async () => {
  const chat: Message[] = [
    { role: 'system', content: "You are a helpful assistant" },
    { role: 'user', content: 'What is the meaning of life?' }
  ];

  // Complétion de chat
  await llm.generate(chat);
  console.log('Llama dit :', llm.response);
};
```

## :calling: Applications de démonstration

Nous hébergeons actuellement quelques applications [exemples](https://github.com/software-mansion/react-native-executorch/tree/main/apps) démontrant des cas d'utilisation de notre bibliothèque :

- `llm` - Application de chat montrant l'utilisation de LLM
- `speech-to-text` - Modèle Whisper prêt pour les tâches de transcription
- `computer-vision` - Tâches liées à la vision par ordinateur
- `text-embeddings` - Calcul de représentations textuelles pour la recherche sémantique

Si vous souhaitez exécuter une application de démonstration, accédez à son répertoire de projet et installez les dépendances avec :

```bash
yarn
```

Ensuite, selon la plateforme, choisissez soit iOS soit Android :

```bash
yarn expo run:< ios | android >
```

> [!WARNING]  
> L'exécution des LLM nécessite une quantité importante de RAM. Si vous rencontrez des plantages inattendus de l'application, essayez d'augmenter la quantité de RAM allouée à l'émulateur.

## :robot: Modèles prêts à l'emploi

Notre bibliothèque contient un certain nombre de modèles AI prêts à l'emploi ; une liste complète est disponible dans la documentation. Si vous êtes intéressé à exécuter votre propre modèle AI, vous devez d'abord l'exporter au format `.pte`. Les instructions sur la façon de faire cela sont disponibles dans [l'API Python](https://docs.pytorch.org/executorch/stable/using-executorch-export.html) et le [README optimum-executorch](https://github.com/huggingface/optimum-executorch?tab=readme-ov-file#option-2-export-and-load-separately).

## :balance_scale: Licence

Cette bibliothèque est sous licence [MIT](./LICENSE).

## :soon: Quelle est la suite ?

Pour en savoir plus sur nos futures plans et développements, veuillez consulter nos [jalons](https://github.com/software-mansion/react-native-executorch/milestones).

## React Native ExecuTorch est créé par Software Mansion

Depuis 2012, [Software Mansion](https://swmansion.com) est une agence de développement avec de l'expérience dans la création d'applications web et mobiles. Nous sommes Contributeurs React Native Core et experts dans la gestion de tous types de problèmes React Native. Nous pouvons vous aider à créer votre prochain produit rêvé – [Engagez-nous](https://swmansion.com/contact/projects?utm_source=react-native-executorch&utm_medium=readme).

[![swm](https://logo.swmansion.com/logo?color=white&variant=desktop&width=150&tag=react-native-executorch-github 'Software Mansion')](https://swmansion.com)