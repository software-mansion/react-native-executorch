<div align="right">
  <h1 align="left" style="display:inline-block">React Native ExecuTorch 
    <!-- Insignia de Discord -->
    <a href="https://discord.gg/ZGqqY55qkP">
      <img src="https://img.shields.io/badge/Discord-Únete%20a%20Nosotros-00008B?logo=discord&logoColor=white&style=for-the-badge" alt="Únete a nuestra comunidad en Discord">
    </a>
  </h1>
</div>

![Banner de Software Mansion](https://github.com/user-attachments/assets/fa2c4735-e75c-4cc1-970d-88905d95e3a4)

<p align="center">
  <a href="../README.md">English</a>
  <a href="README_es.md">Español</a>
  <a href="README_fr.md">Français</a>
  <a href="README_cn.md">简体中文</a>
  <a href="README_pt.md">Português</a>
  <a href="README_in.md">हिंदी</a>
</p>

**React Native ExecuTorch** ofrece una forma declarativa de ejecutar modelos de IA en el dispositivo utilizando React Native, impulsado por **ExecuTorch** :rocket:. Proporciona soporte listo para usar para una amplia gama de LLMs, modelos de visión por computadora y más. Visita nuestra página en [HuggingFace](https://huggingface.co/software-mansion) para explorar estos modelos.

**ExecuTorch**, desarrollado por Meta, es un marco innovador que permite la ejecución de modelos de IA en dispositivos como teléfonos móviles o microcontroladores.

React Native ExecuTorch conecta React Native con las capacidades nativas de la plataforma, permitiendo a los desarrolladores ejecutar modelos locales de IA en dispositivos móviles de manera eficiente. Esto puede lograrse sin necesidad de una gran experiencia en programación nativa o aprendizaje automático.

[![Versión en npm](https://img.shields.io/npm/v/react-native-executorch?color=00008B)](https://www.npmjs.com/package/react-native-executorch)
[![CI](https://github.com/software-mansion/react-native-executorch/actions/workflows/ci.yml/badge.svg)](https://github.com/software-mansion/react-native-executorch/actions/workflows/ci.yml)

**Tabla de contenidos:**

- [:yin_yang: Versiones compatibles](#yin_yang-versiones-compatibles)
- [:books: Documentación](#books-documentación)
- [:earth_africa: Ejemplo del mundo real](#earth_africa-ejemplo-del-mundo-real)
- [:llama: Inicio rápido - Ejecutar Llama](#llama-inicio-rápido---ejecutar-llama)
- [:calling: Aplicaciones de demostración](#calling-aplicaciones-de-demostración)
- [:robot: Modelos listos para usar](#robot-modelos-listos-para-usar)
- [:balance_scale: Licencia](#balance_scale-licencia)
- [:soon: ¿Qué sigue?](#soon-qué-sigue)

## :yin_yang: Versiones compatibles

Las versiones mínimas compatibles son: 
* iOS 17.0  
* Android 13  
* React Native 0.76  

> [!IMPORTANT]  
> React Native ExecuTorch solo admite la [nueva arquitectura de React Native](https://reactnative.dev/architecture/landing-page).

## :books: Documentación

Consulta cómo nuestra biblioteca puede ayudarte a crear funciones de IA en React Native visitando nuestra documentación:  
https://docs.swmansion.com/react-native-executorch

## :earth_africa: Ejemplo del mundo real

React Native ExecuTorch impulsa [Private Mind](https://github.com/software-mansion-labs/private-mind), una aplicación móvil de IA centrada en la privacidad disponible en [App Store](https://apps.apple.com/gb/app/private-mind/id6746713439) y [Google Play](https://play.google.com/store/apps/details?id=com.swmansion.privatemind).

<img width="2720" height="1085" alt="Promoción de Private Mind" src="https://github.com/user-attachments/assets/b12296fe-19ac-48fc-9726-da9242700346" />

## :llama: **Inicio rápido - Ejecutar Llama**

**¡Comienza con la generación de texto impulsada por IA en 3 sencillos pasos!**

### :one: **Instalación**

```bash
# Instalar el paquete
yarn add react-native-executorch
# Dependiendo de la plataforma, elige iOS o Android
yarn expo run:< ios | android >
```

### :two: Configuración e inicialización

Agrega esto a tu archivo de componente:

```tsx
import {
  useLLM,
  LLAMA3_2_1B,
  Message
} from 'react-native-executorch';

function MyComponent() {
  // Inicializa el modelo 🚀
  const llm = useLLM({ model: LLAMA3_2_1B });
  // ... resto de tu componente
}
```

### :three: ¡Ejecuta el modelo!
```tsx
const handleGenerate = async () => {
  const chat: Message[] = [
    { role: 'system', content: 'Eres un asistente útil' },
    { role: 'user', content: '¿Cuál es el significado de la vida?' }
  ];

  // Generación de chat
  await llm.generate(chat);
  console.log('Llama dice:', llm.response);
};
```

## :calling: Aplicaciones de demostración

Actualmente alojamos algunos ejemplos de [aplicaciones](https://github.com/software-mansion/react-native-executorch/tree/main/apps) que muestran casos de uso de nuestra biblioteca:

- `llm` - Aplicación de chat que muestra el uso de LLMs
- `speech-to-text` - Modelo Whisper listo para tareas de transcripción
- `computer-vision` - Tareas relacionadas con visión por computadora
- `text-embeddings` - Cálculo de representaciones de texto para búsqueda semántica

Si deseas ejecutar una aplicación de demostración, navega al directorio del proyecto e instala las dependencias con:

```bash
yarn
```

Luego, dependiendo de la plataforma, elige iOS o Android:

```bash
yarn expo run:< ios | android >
```

> [!WARNING]
> Ejecutar LLMs requiere una cantidad significativa de RAM. Si experimentas cierres inesperados de la aplicación, intenta aumentar la cantidad de RAM asignada al emulador.

## :robot: Modelos listos para usar

Nuestra biblioteca incluye varios modelos de IA listos para usar; la lista completa está disponible en la documentación. Si te interesa ejecutar tu propio modelo de IA, primero debes exportarlo al formato `.pte`. Las instrucciones para hacerlo están disponibles en la [API de Python](https://docs.pytorch.org/executorch/stable/using-executorch-export.html) y en el [README de optimum-executorch]((https://github.com/huggingface/optimum-executorch?tab=readme-ov-file#option-2-export-and-load-separately)).

## :balance_scale: Licencia

Esta biblioteca está licenciada bajo [La Licencia MIT](./LICENSE).

## :soon: ¿Qué sigue?

Para conocer nuestros próximos planes y desarrollos, visita nuestros [hitos](https://github.com/software-mansion/react-native-executorch/milestones).

## React Native ExecuTorch es creado por Software Mansion

Desde 2012, [Software Mansion](https://swmansion.com) es una agencia de software con experiencia en el desarrollo de aplicaciones web y móviles. Somos colaboradores principales de React Native y expertos en resolver todo tipo de problemas relacionados con esta tecnología. Podemos ayudarte a construir tu próximo producto soñado – [Contrátanos](https://swmansion.com/contact/projects?utm_source=react-native-executorch&utm_medium=readme).

[![swm](https://logo.swmansion.com/logo?color=white&variant=desktop&width=150&tag=react-native-executorch-github 'Software Mansion')](https://swmansion.com)