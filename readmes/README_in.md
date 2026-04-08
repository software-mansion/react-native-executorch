<div align="center">
  <img src="../docs/static/img/logo-hero.svg" alt="RNE Logo" width="25%">
</div>

<div align="center">
  <h1 align="center" style="display:inline-block">React Native ExecuTorch
  </h1>
</div>

[![Ad](https://swm-delivery.com/www/images/zone-gh-react-native-executorch-1?n=1)](https://swm-delivery.com/www/delivery/ck.php?zoneid=zone-gh-react-native-executorch-1&n=1)
[![Ad](https://swm-delivery.com/www/images/zone-gh-react-native-executorch-2?n=1)](https://swm-delivery.com/www/delivery/ck.php?zoneid=zone-gh-react-native-executorch-2&n=1)
[![Ad](https://swm-delivery.com/www/images/zone-gh-react-native-executorch-3?n=1)](https://swm-delivery.com/www/delivery/ck.php?zoneid=zone-gh-react-native-executorch-3&n=1)

<div align="center">
  <a href="https://github.com/software-mansion/react-native-executorch/graphs/contributors"><img src="https://img.shields.io/github/contributors/software-mansion/react-native-executorch?style=for-the-badge&color=00008B" alt="GitHub - Contributors"></a>
  <a href="https://github.com/software-mansion/react-native-executorch/stargazers"><img src="https://img.shields.io/github/stars/software-mansion/react-native-executorch?style=for-the-badge&color=00008B" alt="GitHub - Stars"></a>
  <a href="https://discord.gg/ZGqqY55qkP"><img src="https://img.shields.io/badge/Discord-Join%20Us-00008B?logo=discord&logoColor=white&style=for-the-badge" alt="Join our Discord community"></a>
  <a href="https://docs.swmansion.com/react-native-executorch/"><img src="https://img.shields.io/badge/Documentation-00008B?logo=googledocs&logoColor=white&style=for-the-badge" alt="Documentation"></a>
  <a href="https://swmansion.com/contact">
    <img src="https://img.shields.io/badge/Hire%20Us-00008B?logo=react&logoColor=white&color=darkgreen&style=for-the-badge" alt="Hire Us">
  </a>
</div>

<p align="center">
  <a href="https://github.com/software-mansion/react-native-executorch/blob/main/README.md"><img src="https://img.shields.io/badge/EN-00008B?logo=&logoColor=white&color=00008B&style=for-the-badge" alt="README"></a>
  <a href="https://github.com/software-mansion/react-native-executorch/blob/main/readmes/README_es.md"><img src="https://img.shields.io/badge/ES-00008B?logo=&logoColor=white&color=00008B&style=for-the-badge" alt="README ES"></a>
  <a href="https://github.com/software-mansion/react-native-executorch/blob/main/readmes/README_fr.md"><img src="https://img.shields.io/badge/FR-00008B?logo=&logoColor=white&color=00008B&style=for-the-badge" alt="README FR"></a>
  <a href="https://github.com/software-mansion/react-native-executorch/blob/main/readmes/README_cn.md"><img src="https://img.shields.io/badge/CN-00008B?logo=&logoColor=white&color=00008B&style=for-the-badge" alt="README CN"></a>
  <a href="https://github.com/software-mansion/react-native-executorch/blob/main/readmes/README_pt.md"><img src="https://img.shields.io/badge/PT-00008B?logo=&logoColor=white&color=00008B&style=for-the-badge" alt="README PT"></a>
  <a href="https://github.com/software-mansion/react-native-executorch/blob/main/readmes/README_in.md"><img src="https://img.shields.io/badge/IN-00008B?logo=&logoColor=white&color=00008B&style=for-the-badge" alt="README IN"></a>
</p>

**React Native ExecuTorch** एक घोषणात्मक तरीका प्रदान करता है जिससे React Native का उपयोग करके उपकरण पर AI मॉडल्स को चलाया जा सके, जो **ExecuTorch** द्वारा संचालित है :rocket:. यह LLMs, कंप्यूटर विज़न मॉडल्स, और भी कई के लिए आउट-ऑफ़-द-बॉक्स सपोर्ट प्रदान करता है। इन मॉडलों का अन्वेषण करने के लिए हमारे [HuggingFace](https://huggingface.co/software-mansion) पेज पर जाएं।

[**ExecuTorch**](https://executorch.ai), Meta द्वारा विकसित, एक नया फ्रेमवर्क है जो मोबाइल फोनों या माइक्रोकंट्रोलर्स जैसे उपकरणों पर AI मॉडल निष्पादन की अनुमति देता है।

React Native ExecuTorch, React Native और नेटिव प्लेटफॉर्म क्षमताओं के बीच की खाई को पाटता है, जिससे डेवलपर्स मोबाइल उपकरणों पर स्थानीय AI मॉडलों को प्रभावी ढंग से चला सकते हैं। इसे नेटिव प्रोग्रामिंग या मशीन लर्निंग में व्यापक विशेषज्ञता की आवश्यकता के बिना हासिल किया जा सकता है।

[![npm version](https://img.shields.io/npm/v/react-native-executorch?color=00008B)](https://www.npmjs.com/package/react-native-executorch)
[![npm nightly](https://img.shields.io/npm/v/react-native-executorch/executorch-nightly?label=nightly&color=00008B)](https://www.npmjs.com/package/react-native-executorch)
[![CI](https://github.com/software-mansion/react-native-executorch/actions/workflows/ci.yml/badge.svg)](https://github.com/software-mansion/react-native-executorch/actions/workflows/ci.yml)

<details>
<summary><strong>विषय सूची</strong></summary>

- [समर्थित संस्करण](#समर्थित-संस्करण)
- [वास्तविक दुनिया का उदाहरण](#वास्तविक-दुनिया-का-उदाहरण)
- [त्वरित शुरुआत - ललामा चलाना](#त्वरित-शुरुआत---ललामा-चलाना)
- [डेमो ऐप्स](#डेमो-ऐप्स)
- [तैयार-निर्मित मॉडल](#तैयार-निर्मित-मॉडल)
- [दस्तावेज़](#दस्तावेज़)
- [लाइसेंस](#लाइसेंस)
- [आगे क्या?](#आगे-क्या)

</details>

## समर्थित संस्करण

न्यूनतम समर्थित संस्करण हैं:

- iOS 17.0
- Android 13
- React Native - [संगतता तालिका](https://docs.swmansion.com/react-native-executorch/docs/next/other/compatibility) देखें

> [!IMPORTANT]
> React Native ExecuTorch केवल [नई React Native आर्किटेक्चर](https://reactnative.dev/architecture/landing-page) का समर्थन करता है।

## वास्तविक दुनिया का उदाहरण

React Native ExecuTorch को [Private Mind](https://privatemind.swmansion.com/) का समर्थन प्राप्त है, जो एक गोपनीयता-पहले मोबाइल AI ऐप है जो [App Store](https://apps.apple.com/gb/app/private-mind/id6746713439) और [Google Play](https://play.google.com/store/apps/details?id=com.swmansion.privatemind) पर उपलब्ध है।

<img width="2720" height="1085" alt="Private Mind promo" src="https://github.com/user-attachments/assets/b12296fe-19ac-48fc-9726-da9242700346" />

## त्वरित शुरुआत - ललामा चलाना

**AI-समर्थित पाठ पीढ़ी के साथ आरंभ करें, केवल 3 आसान कदमों में!**

### :one: स्थापना

```bash
# पैकेज को इंस्टॉल करें
yarn add react-native-executorch

# यदि आप expo का उपयोग करते हैं, तो कृपया संसाधन प्राप्त करने के लिए ये पैकेज जोड़ें:
yarn add react-native-executorch-expo-resource-fetcher
yarn add expo-file-system expo-asset

# यदि आप bare React Native प्रोजेक्ट का उपयोग करते हैं तो इन पैकेजों का उपयोग करें:
yarn add react-native-executorch-bare-resource-fetcher
yarn add @dr.pogodin/react-native-fs @kesha-antonov/react-native-background-downloader

# प्लेटफॉर्म के अनुसार, या तो iOS या Android चुनें
yarn < ios | android >
```

### :two: सेटअप और आरंभिककरण

अपने घटक फाइल में यह जोड़ें:

```tsx
import {
  useLLM,
  LLAMA3_2_1B,
  Message,
  initExecutorch,
} from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

initExecutorch({
  resourceFetcher: ExpoResourceFetcher,
});

function MyComponent() {
  // मॉडल को प्रारंभ करें 🚀
  const llm = useLLM({ model: LLAMA3_2_1B });
  // ... आपके घटक के शेष
}
```

### :three: मॉडल चलाएं!

```tsx
const handleGenerate = async () => {
  const chat: Message[] = [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'What is the meaning of life?' },
  ];

  // चैट पूर्णता
  await llm.generate(chat);
  console.log('Llama says:', llm.response);
};
```

## डेमो ऐप्स

हम वर्तमान में कुछ उदाहरण [ऐप्स](https://github.com/software-mansion/react-native-executorch/tree/main/apps) होस्ट कर रहे हैं जो हमारी लाइब्रेरी के उपयोग के मामलों को प्रदर्शित करते हैं:

- `llm` - चैट एप्लिकेशन जो LLMs के उपयोग को दिखाता है
- `speech` - स्पीच-टू-टेक्स्ट और टेक्स्ट-टू-स्पीच कार्यों के कार्यान्वयन
- `computer-vision` - कंप्यूटर विज़न से संबंधित कार्य
- `text-embeddings` - अर्थ सेमांटिक खोज के लिए पाठ प्रस्तुतिकरण की गणना
- `bare-rn` - bare React Native (Expo के बिना) के लिए LLM चैट उदाहरण

यदि आप डेमो ऐप चलाना चाहते हैं, तो इसके प्रोजेक्ट डायरेक्टरी में नेविगेट करें। फिर निर्भरता इंस्टॉल करें और ऐप चलाएं:

```bash
yarn && yarn < ios | android >
```

> [!WARNING]
> LLMs चलाना बड़ी मात्रा में RAM की मांग करता है। यदि आप अप्रत्याशित ऐप क्रैश का सामना कर रहे हैं, तो एमुलेटर को आवंटित RAM की मात्रा बढ़ाने का प्रयास करें।

## तैयार-निर्मित मॉडल

हमारी लाइब्रेरी में कई तैयार उपयोग के लिए AI मॉडल्स हैं; पूर्ण सूची दस्तावेज़ में उपलब्ध है। यदि आप अपना AI मॉडल चलाने में रुचि रखते हैं, तो पहले आपको इसे `.pte` फॉर्मेट में निर्यात करना होगा। इसे करने के निर्देश [Python API](https://docs.pytorch.org/executorch/stable/using-executorch-export.html) और [optimum-executorch README](https://github.com/huggingface/optimum-executorch?tab=readme-ov-file#option-2-export-and-load-separately) में उपलब्ध हैं।

## दस्तावेज़

देखें कि हमारी लाइब्रेरी कैसे आपकी React Native AI विशेषताएँ बनाने में सहायता कर सकती है, हमारे डॉक्स पर जाकर:
https://docs.swmansion.com/react-native-executorch

## लाइसेंस

यह लाइब्रेरी [The MIT License](./LICENSE) के अंतर्गत लाइसेंस प्राप्त है।

## आगे क्या?

हमारी आगामी योजनाओं और विकासों के बारे में जानने के लिए, कृपया हमारे [milestones](https://github.com/software-mansion/react-native-executorch/milestones) पर जाएँ।

## React Native ExecuTorch को Software Mansion द्वारा बनाया गया है

2012 से, [Software Mansion](https://swmansion.com) वेब और मोबाइल ऐप्स बनाने का अनुभव रखने वाली एक सॉफ्टवेयर एजेंसी है। हम Core React Native योगदानकर्ता हैं और React Native से संबंधित सभी प्रकार की समस्याओं का निपटान करने के विशेषज्ञ हैं। हम आपको आपका अगला सपनों का प्रोजेक्ट बनाने में सहायता कर सकते हैं – [हमें नियुक्त करें](https://swmansion.com/contact?utm_source=react-native-executorch&utm_medium=readme)।

[![swm](https://logo.swmansion.com/logo?color=white&variant=desktop&width=150&tag=react-native-executorch-github 'Software Mansion')](https://swmansion.com)
