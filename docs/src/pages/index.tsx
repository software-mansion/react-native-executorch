import React from 'react';
import Layout from '@theme/Layout';
import styles from './styles.module.css';
import HomepageStartScreen from '@site/src/components/Hero/StartScreen';
import WaveTop from '@site/src/components/Wave/WaveTop';
import ExecuTorchIntroduction from '../components/ExecuTorchIntroduction';
import ReactNativeExecuTorchFeatures from '@site/src/components/ReactNativeExecuTorchFeatures';
import { HireUsSection } from '@swmansion/t-rex-ui';
import FooterBackground from '../components/FooterBackground';

const Home = () => {
  return (
    <Layout
      title="React Native ExecuTorch"
      description="Declarative way to run AI models in React Native on device, powered by ExecuTorch."
    >
      <div className={styles.container}>
        <HomepageStartScreen />
      </div>
      <div className={styles.linearGradient}>
        <WaveTop />
        <div className={styles.container}>
          <ExecuTorchIntroduction />
          <ReactNativeExecuTorchFeatures />
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
