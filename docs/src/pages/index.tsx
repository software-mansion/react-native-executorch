import React from 'react';
import Layout from '@theme/Layout';
import styles from './styles.module.css';
import HomepageStartScreen from '@site/src/components/Hero/StartScreen';
import ReactNativeExecuTorchFeatures from '@site/src/components/ReactNativeExecuTorchFeatures';
import { HireUsSection } from '@swmansion/t-rex-ui';

function Home() {
  return (
    <Layout
      title={`React Native React Native ExecuTorch`}
      description="Declarative way to run AI models in React Native on device, powered by ExecuTorch."
    >
      <div className={styles.container}>
        <HomepageStartScreen />
        <ReactNativeExecuTorchFeatures />
        <HireUsSection
          href={
            'https://swmansion.com/contact/projects?utm_source=react-native-executorch&utm_medium=docs'
          }
        />
      </div>
    </Layout>
  );
}

export default Home;
