import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import styles from './styles.module.css';
import HomepageStartScreen from '@site/src/components/Hero/StartScreen';
import WaveTop from '@site/src/components/Wave/WaveTop';
import ExecuTorchIntroduction from '../components/ExecuTorchIntroduction';
import ReactNativeExecuTorchFeatures from '@site/src/components/ReactNativeExecuTorchFeatures';
import { HireUsSection } from '@swmansion/t-rex-ui';
import FooterBackground from '../components/FooterBackground';
import ReactNativeExecutorchAction from '../components/ReactNativeExecutorchAction';

const Home = () => {
  return (
    <Layout
      title="React Native ExecuTorch – On-device AI & LLM toolkit for React Native"
      description="React Native ExecuTorch lets you run LLMs and AI models locally on device in React Native. Build privacy-first, fast, and offline-ready apps with ease."
    >
      <Head>
        <meta
          name="keywords"
          content="react native ai, react native llm, react native qwen, on-device ai, mobile ai, mobile machine learning, on-device inference, edge ai, llama, llm, whisper, ocr, moonshine, speech to text, qwen"
        />
      </Head>
      <div className={styles.container}>
        <HomepageStartScreen />
      </div>
      <div className={styles.linearGradient}>
        <WaveTop />
        <div className={styles.container}>
          <ExecuTorchIntroduction />
          <ReactNativeExecuTorchFeatures />
          <ReactNativeExecutorchAction />
          <div className={styles.hireUsSection}>
            <HireUsSection
              href="https://swmansion.com/contact/projects?utm_source=react-native-executorch&utm_medium=docs"
              content="React Native Core Contributors and experts in dealing with all kinds of React Native issues. Need help using React Native ExecuTorch or deploying and running AI models on your device? Let's tackle it together."
            />
          </div>
        </div>
      </div>
      <FooterBackground />
    </Layout>
  );
};

export default Home;
