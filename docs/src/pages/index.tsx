import React from 'react';
import styles from './styles.module.css';
import Layout from '@theme/Layout';
import HomepageStartScreen from '@site/src/components/Hero/StartScreen';
import { HireUsSection } from '@swmansion/t-rex-ui';

function Home() {
  return (
    <Layout
      title={`React Native ExecuTorch`}
      description="Declarative way to run AI models in React Native on device, powered by ExecuTorch.">
      <div className={styles.container}>
        <HomepageStartScreen />
      </div>
      <div className={styles.container}>
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